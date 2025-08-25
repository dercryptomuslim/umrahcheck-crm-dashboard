import { z } from 'zod';

// Natural Language Query Request Schema
export const NLQueryRequestSchema = z.object({
  query: z.string().min(3).max(500).trim(),
  context: z
    .enum(['leads', 'bookings', 'revenue', 'contacts', 'analytics'])
    .optional(),
  conversation_id: z.string().uuid().optional(),
  language: z.enum(['de', 'en']).optional().default('de')
});

// Query Result Schema
export const QueryResultSchema = z.object({
  type: z.enum(['record', 'metric', 'count', 'aggregate']),
  data: z.record(z.any()),
  metadata: z
    .object({
      table: z.string(),
      columns: z.array(z.string()),
      total_count: z.number().optional()
    })
    .optional()
});

// Natural Language Query Response Schema
export const NLQueryResponseSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      conversation_id: z.string().uuid(),
      query_id: z.string().uuid(),
      interpreted_query: z.string(),
      query_type: z.enum([
        'leads',
        'bookings',
        'revenue',
        'contacts',
        'analytics',
        'unknown'
      ]),
      results: z.array(QueryResultSchema),
      visualization_type: z.enum(['table', 'chart', 'metrics', 'list']),
      suggestions: z.array(z.string()).optional(),
      total_results: z.number(),
      execution_summary: z.object({
        sql_query: z.string().optional(),
        tables_accessed: z.array(z.string()),
        processing_time_ms: z.number(),
        confidence: z.number().min(0).max(1)
      })
    })
    .optional(),
  error: z.string().optional(),
  meta: z
    .object({
      timestamp: z.string(),
      user_id: z.string(),
      tenant_id: z.string(),
      rate_limit: z
        .object({
          remaining: z.number(),
          reset_at: z.string()
        })
        .optional()
    })
    .optional()
});

// Conversation History Schema
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  query_count: z.number(),
  last_query: z.string().optional()
});

// Query History Item Schema
export const QueryHistoryItemSchema = z.object({
  id: z.string().uuid(),
  original_query: z.string(),
  interpreted_query: z.string().optional(),
  query_type: z.string(),
  result_count: z.number(),
  processing_time_ms: z.number(),
  confidence: z.number(),
  status: z.enum(['processing', 'completed', 'failed']),
  error_message: z.string().optional(),
  created_at: z.string()
});

// Export types
export type NLQueryRequest = z.infer<typeof NLQueryRequestSchema>;
export type NLQueryResponse = z.infer<typeof NLQueryResponseSchema>;
export type QueryResult = z.infer<typeof QueryResultSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type QueryHistoryItem = z.infer<typeof QueryHistoryItemSchema>;

// Supported Query Types with patterns
export const QUERY_PATTERNS = {
  leads: [
    /(?:zeige?|show|list|find).+(?:leads?|interessent)/i,
    /(?:wie viele|how many).+(?:leads?|kontakte)/i,
    /(?:heiße?|hot|warm|kalt|cold).+(?:leads?)/i,
    /(?:neue?|new|recent).+(?:leads?|kontakte)/i
  ],
  bookings: [
    /(?:zeige?|show|list).+(?:buchung|booking|reservierung)/i,
    /(?:wie viele|how many).+(?:buchung|booking)/i,
    /(?:umsatz|revenue|einnahmen).+(?:buchung|booking)/i,
    /(?:storniert|cancelled|refund)/i
  ],
  revenue: [
    /(?:umsatz|revenue|einnahmen|sales)/i,
    /(?:verdienst|profit|gewinn)/i,
    /(?:wie viel|how much).+(?:geld|money|euro)/i,
    /(?:monat|month|jahr|year).+(?:umsatz|revenue)/i
  ],
  contacts: [
    /(?:zeige?|show|list).+(?:kontakt|contact|kunde|customer)/i,
    /(?:wie viele|how many).+(?:kontakt|contact|kunde)/i,
    /(?:aus|from).+(?:deutschland|germany|land|country)/i,
    /(?:email|telefon|phone|adresse)/i
  ],
  analytics: [
    /(?:statistik|statistics|analyse|analysis)/i,
    /(?:dashboard|übersicht|overview)/i,
    /(?:performance|leistung)/i,
    /(?:vergleich|compare|trend)/i
  ]
} as const;

// Example queries for UI suggestions
export const EXAMPLE_QUERIES = {
  de: [
    'Zeige mir alle heißen Leads aus Deutschland der letzten Woche',
    'Wie viele Buchungen haben wir diesen Monat?',
    'Welcher Umsatz wurde in den letzten 30 Tagen generiert?',
    'Liste alle Kontakte mit Budget über 3000 EUR',
    'Zeige mir stornierte Buchungen der letzten 7 Tage',
    'Welche Leads haben in den letzten 3 Tagen Emails geöffnet?',
    'Umsatz-Vergleich zwischen diesem und letztem Monat',
    'Alle Kunden aus der Schweiz mit Premium-Hotel Präferenz'
  ],
  en: [
    'Show me all hot leads from Germany in the last week',
    'How many bookings do we have this month?',
    'What revenue was generated in the last 30 days?',
    'List all contacts with budget over 3000 EUR',
    'Show me cancelled bookings from the last 7 days',
    'Which leads opened emails in the last 3 days?',
    'Revenue comparison between this and last month',
    'All customers from Switzerland with premium hotel preference'
  ]
} as const;
