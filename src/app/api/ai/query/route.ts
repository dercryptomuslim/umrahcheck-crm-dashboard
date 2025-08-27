import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  NLQueryRequestSchema,
  NLQueryResponseSchema
} from '@/schemas/ai-query';
import { queryParser } from '@/lib/ai/query-parser';
import { SQLQueryBuilder } from '@/lib/ai/sql-builder';
import type { QueryResult } from '@/schemas/ai-query';

// Initialize Supabase client with service key for admin queries

// Rate limiting configuration
const RATE_LIMITS = {
  queries_per_hour: 100,
  queries_per_minute: 10
};

// Helper to get user context
async function getAuthContext() {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const tenantId = user.publicMetadata.tenant_id as string;
  const role = (user.publicMetadata.role as string) || 'agent';

  if (!tenantId) {
    throw new Error('No tenant associated with user');
  }

  return {
    userId: user.id,
    tenantId,
    role,
    email: user.emailAddresses[0]?.emailAddress
  };
}

// Rate limiting check
async function checkRateLimit(
  tenantId: string,
  userId: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = new Date();
  const hourStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  );
  const minuteStart = new Date(
    now.getTime() - now.getSeconds() * 1000 - now.getMilliseconds()
  );

  // Check hourly limit
  const { count: hourlyCount } = await supabase
    .from('ai_query_history')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .gte('created_at', hourStart.toISOString());

  // Check minute limit
  const { count: minuteCount } = await supabase
    .from('ai_query_history')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .gte('created_at', minuteStart.toISOString());

  const hourlyAllowed = (hourlyCount || 0) < RATE_LIMITS.queries_per_hour;
  const minuteAllowed = (minuteCount || 0) < RATE_LIMITS.queries_per_minute;

  return {
    allowed: hourlyAllowed && minuteAllowed,
    remaining: Math.min(
      RATE_LIMITS.queries_per_hour - (hourlyCount || 0),
      RATE_LIMITS.queries_per_minute - (minuteCount || 0)
    ),
    resetAt: new Date(hourStart.getTime() + 60 * 60 * 1000)
  };
}

// Create or get conversation
async function getOrCreateConversation(
  tenantId: string,
  userId: string,
  conversationId?: string,
  query?: string
): Promise<string> {
  if (conversationId) {
    // Verify conversation exists and belongs to user
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update conversation timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return conversationId;
    }
  }

  // Create new conversation
  const title = query
    ? query.length > 50
      ? query.substring(0, 47) + '...'
      : query
    : 'Natural Language Query';

  const { data: newConversation, error } = await supabase
    .from('ai_conversations')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      title,
      context: 'nl_query'
    })
    .select('id')
    .single();

  if (error || !newConversation) {
    throw new Error('Failed to create conversation');
  }

  return newConversation.id;
}

// Execute SQL query safely
async function executeSQLQuery(
  sql: string,
  params: any[],
  tables: string[]
): Promise<{ rows: any[]; rowCount: number }> {
  try {
    // Additional security: validate that we're only accessing allowed tables
    const allowedTables = [
      'contacts',
      'bookings',
      'events',
      'contact_engagement_metrics',
      'mv_contact_engagement'
    ];

    const hasDisallowedTable = tables.some(
      (table) => !allowedTables.includes(table)
    );
    if (hasDisallowedTable) {
      throw new Error('Query accesses unauthorized tables');
    }

    const { data, error, count } = await supabase.rpc('execute_safe_query', {
      query_sql: sql,
      query_params: params
    });

    if (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }

    return {
      rows: data || [],
      rowCount: count || 0
    };
  } catch (error) {
    // Error logged: console.error('SQL execution error:', error);
    throw new Error('Failed to execute query');
  }
}

// Format results for different visualization types
function formatResults(
  rows: any[],
  visualizationType: string,
  expectedColumns: string[]
): QueryResult[] {
  if (!rows || rows.length === 0) {
    return [];
  }

  switch (visualizationType) {
    case 'metrics':
      return rows.map((row) => ({
        type: 'metric',
        data: row,
        metadata: {
          table: 'aggregated',
          columns: Object.keys(row)
        }
      }));

    case 'table':
    case 'list':
      return rows.map((row) => ({
        type: 'record',
        data: row,
        metadata: {
          table: 'contacts',
          columns: expectedColumns,
          total_count: rows.length
        }
      }));

    case 'chart':
      return [
        {
          type: 'aggregate',
          data: {
            chart_data: rows,
            chart_type: 'bar'
          },
          metadata: {
            table: 'aggregated',
            columns: expectedColumns
          }
        }
      ];

    default:
      return rows.map((row) => ({
        type: 'record',
        data: row,
        metadata: {
          table: 'unknown',
          columns: Object.keys(row)
        }
      }));
  }
}

// POST /api/ai/query - Process natural language query
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let conversationId: string | undefined;
  let queryId: string | undefined;

  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse and validate request
    const body = await request.json();
    const validatedData = NLQueryRequestSchema.parse(body);

    // 3. Check rate limits
    const rateLimit = await checkRateLimit(
      authContext.tenantId,
      authContext.userId
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded. Please try again later.',
          meta: {
            rate_limit: {
              remaining: 0,
              reset_at: rateLimit.resetAt.toISOString()
            }
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.getTime().toString()
          }
        }
      );
    }

    // 4. Get or create conversation
    conversationId = await getOrCreateConversation(
      authContext.tenantId,
      authContext.userId,
      validatedData.conversation_id,
      validatedData.query

    // 5. Parse natural language query
    const classification = queryParser.parseQuery(
      validatedData.query,
      validatedData.context

    // 6. Build SQL query
    const sqlBuilder = new SQLQueryBuilder(authContext.tenantId);
    const sqlResult = sqlBuilder.buildQuery(classification);

    // 7. Validate SQL for security
    if (!sqlBuilder.validateQuery(sqlResult.sql)) {
      throw new Error('Query contains potentially unsafe operations');
    }

    // 8. Execute query
    const queryResult = await executeSQLQuery(
      sqlResult.sql,
      sqlResult.params,
      sqlResult.tables

    // 9. Format results
    const formattedResults = formatResults(
      queryResult.rows,
      sqlResult.visualization_type,
      sqlResult.expected_columns

    // 10. Generate suggestions for follow-up queries
    const suggestions =
      classification.type !== 'unknown'
        ? [
            `Zeige mir mehr Details zu diesen ${classification.type === 'leads' ? 'Leads' : 'Ergebnissen'}`,
            `Exportiere diese Daten als CSV`,
          ]
        : [];

    // 11. Save query to history
    const processingTime = Date.now() - startTime;
    const { data: historyRecord } = await supabase
      .from('ai_query_history')
      .insert({
        conversation_id: conversationId,
        tenant_id: authContext.tenantId,
        user_id: authContext.userId,
        original_query: validatedData.query,
        interpreted_query: `${classification.intent} ${classification.type}`,
        query_type: classification.type,
        sql_query: sqlResult.sql,
        result_count: queryResult.rowCount,
        processing_time_ms: processingTime,
        confidence: classification.confidence,
        status: 'completed'
      })
      .select('id')
      .single();

    queryId = historyRecord?.id;

    // 12. Build response
    const response = {
      ok: true,
      data: {
        conversation_id: conversationId,
        query_id: queryId!,
        interpreted_query: `${classification.intent} ${classification.type}`,
        query_type: classification.type,
        results: formattedResults,
        visualization_type: sqlResult.visualization_type,
        suggestions,
        total_results: queryResult.rowCount,
        execution_summary: {
          sql_query:
            classification.confidence > 0.7 ? sqlResult.sql : undefined,
          tables_accessed: sqlResult.tables,
          processing_time_ms: processingTime,
          confidence: classification.confidence
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        user_id: authContext.userId,
        tenant_id: authContext.tenantId,
        rate_limit: {
          remaining: rateLimit.remaining - 1,
          reset_at: rateLimit.resetAt.toISOString()
        }
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Processing-Time': processingTime.toString(),
        'X-Query-Confidence': classification.confidence.toString(),
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString()
      }
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Log failed query if we have IDs
    if (conversationId) {
      await supabase.from('ai_query_history').insert({
        conversation_id: conversationId,
        tenant_id: (await getAuthContext()).tenantId,
        user_id: (await getAuthContext()).userId,
        original_query: 'Query failed during processing',
        processing_time_ms: processingTime,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid request format',
          details: error.errors
        },
        { status: 400 }
    }

    // Handle auth errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
    }

    // Handle other errors
    // Error logged: console.error('Natural Language Query error:', error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Failed to process query'
      },
      { status: 500 }
  }
}

// GET /api/ai/query - Get query capabilities and examples
export async function GET() {
  const { EXAMPLE_QUERIES } = await import('@/schemas/ai-query');

  return NextResponse.json({
    service: 'Natural Language Query Interface',
    version: '1.0.0',
    status: 'operational',
    capabilities: {
      supported_languages: ['de', 'en'],
      query_types: ['leads', 'bookings', 'revenue', 'contacts', 'analytics'],
      intents: ['list', 'count', 'sum', 'compare', 'analyze'],
      visualization_types: ['table', 'chart', 'metrics', 'list']
    },
    rate_limits: RATE_LIMITS,
    examples: {
      de: EXAMPLE_QUERIES.de.slice(0, 5),
      en: EXAMPLE_QUERIES.en.slice(0, 5)
    },
    features: [
      'natural_language_parsing',
      'intent_recognition',
      'entity_extraction',
      'sql_generation',
      'conversation_history',
      'rate_limiting',
      'security_validation'
    ]
  });
}
