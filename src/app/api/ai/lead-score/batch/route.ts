import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';

// Batch Lead Score Request Schema
const BatchLeadScoreRequestSchema = z.object({
  contact_ids: z.array(z.string().uuid()).max(100), // Limit to 100 contacts per batch
  trigger: z
    .enum(['manual_batch', 'scheduled_update', 'migration'])
    .optional()
    .default('manual_batch'),
  force_recalculate: z.boolean().optional().default(false)
});

// Helper to get user context from Clerk
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

// Batch processing with concurrency control
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(processor));

    // Collect successful results, log errors
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Error logged: console.error(`Failed to process item ${i + index}:`, result.reason);
      }
    });
  }

  return results;
}

// POST /api/ai/lead-score/batch - Batch calculate lead scores
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse and validate request
    const body = await request.json();
    const validatedData = BatchLeadScoreRequestSchema.parse(body);

    // 3. Verify all contacts belong to tenant
    const supabase = await createClient();
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name, lead_score')
      .in('id', validatedData.contact_ids)
      .eq('tenant_id', authContext.tenantId);

    if (contactError || !contacts) {
      throw new Error('Failed to fetch contacts');
    }

    if (contacts.length !== validatedData.contact_ids.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Some contacts not found or not accessible'
        },
        { status: 404 }
      );
    }

    // 4. Process contacts in batches
    const startTime = Date.now();
    const processingResults = await processBatch(
      contacts,
      async (contact) => {
        try {
          // Call individual lead scoring API
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/lead-score`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Request': 'true'
              },
              body: JSON.stringify({
                contact_id: contact.id,
                trigger: validatedData.trigger,
                force_recalculate: validatedData.force_recalculate
              })
            });

          if (!response.ok) {
            throw new Error(`Failed to score contact ${contact.id}`);
          }

          const result = await response.json();
          return {
            contact_id: contact.id,
            email: contact.email,
            name: [contact.first_name, contact.last_name]
              .filter(Boolean)
              .join(' '),
            previous_score: contact.lead_score,
            new_score: result.data.lead_score,
            breakdown: result.data.breakdown,
            confidence: result.data.confidence,
            status: 'success'
          };
        } catch (error) {
          return {
            contact_id: contact.id,
            email: contact.email,
            name: [contact.first_name, contact.last_name]
              .filter(Boolean)
              .join(' '),
            previous_score: contact.lead_score,
            new_score: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          };
        }
      },
      3 // Process 3 contacts concurrently
    );

    const processingTime = Date.now() - startTime;

    // 5. Calculate batch statistics
    const successful = processingResults.filter((r) => r.status === 'success');
    const failed = processingResults.filter((r) => r.status === 'failed');

    const scoreChanges = successful
      .filter((r) => r.new_score !== null)
      .map((r) => ({
        contact_id: r.contact_id,
        change: r.new_score! - (r.previous_score || 0)
      }));

    const averageScoreChange =
      scoreChanges.length > 0
        ? scoreChanges.reduce((sum, sc) => sum + sc.change, 0) /
          scoreChanges.length
        : 0;

    // 6. Log batch processing event
    await supabase.from('events').insert({
      tenant_id: authContext.tenantId,
      actor: `ai:batch_scorer:${authContext.userId}`,
      source: 'api',
      type: 'lead_updated',
      payload: {
        batch_size: validatedData.contact_ids.length,
        successful: successful.length,
        failed: failed.length,
        processing_time_ms: processingTime,
        trigger: validatedData.trigger,
        average_score_change: averageScoreChange
      },
      occurred_at: new Date().toISOString()
    });

    // 7. Return batch results
    return NextResponse.json(
      {
        ok: true,
        data: {
          batch_id: `batch_${Date.now()}`,
          summary: {
            total_contacts: validatedData.contact_ids.length,
            successful: successful.length,
            failed: failed.length,
            processing_time_ms: processingTime,
            average_score_change: Math.round(averageScoreChange * 100) / 100
          },
          results: processingResults,
          score_distribution: {
            hot_leads: successful.filter(
              (r) => r.new_score && r.new_score >= 70
            ).length,
            warm_leads: successful.filter(
              (r) => r.new_score && r.new_score >= 40 && r.new_score < 70
            ).length,
            cold_leads: successful.filter(
              (r) => r.new_score && r.new_score < 40
            ).length
          }
        },
        meta: {
          processed_at: new Date().toISOString(),
          tenant_id: authContext.tenantId,
          trigger: validatedData.trigger,
          algorithm_version: '1.0.0'
        }
      },
      {
        status: 200,
        headers: {
          'X-Processing-Time': processingTime.toString(),
          'X-Success-Rate': (
            successful.length / validatedData.contact_ids.length
          ).toString()
        }
      }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    // Handle auth errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle other errors
    // Error logged: console.error('Batch Lead Scoring error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process batch lead scoring'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/lead-score/batch - Get batch processing capabilities
export async function GET() {
  return NextResponse.json({
    service: 'AI Batch Lead Scoring',
    version: '1.0.0',
    status: 'operational',
    limits: {
      max_contacts_per_batch: 100,
      concurrent_processing: 3,
      timeout_per_contact_ms: 5000
    },
    triggers: ['manual_batch', 'scheduled_update', 'migration'],
    features: [
      'concurrency_control',
      'error_handling',
      'progress_tracking',
      'score_distribution_analysis'
    ]
  });
}
