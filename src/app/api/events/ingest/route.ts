import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';
import { EventIngestionSchema } from '@/types/customer360';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for server-side operations
);

// Helper to get user context from Clerk
async function getAuthContext() {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get tenant_id and role from Clerk metadata
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

// POST /api/events/ingest
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = EventIngestionSchema.parse(body);

    // 3. Build event object
    const event = {
      tenant_id: authContext.tenantId,
      contact_id: validatedData.contact_id || null,
      actor:
        validatedData.actor === 'system'
          ? 'system'
          : validatedData.actor || `user:${authContext.userId}`,
      source: validatedData.source,
      type: validatedData.type,
      payload: validatedData.payload,
      dedupe_key: validatedData.dedupe_key || null,
      occurred_at: validatedData.occurred_at || new Date().toISOString()
    };

    // 4. Check for duplicate if dedupe_key provided
    if (event.dedupe_key) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('tenant_id', authContext.tenantId)
        .eq('dedupe_key', event.dedupe_key)
        .single();

      if (existing) {
        return NextResponse.json(
          {
            ok: true,
            id: existing.id,
            message: 'Event already exists (deduped)'
          },
          { status: 200 }
        );
      }
    }

    // 5. Insert event
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error('Event insertion error:', error);
      throw new Error('Failed to ingest event');
    }

    // 6. Trigger async operations (e.g., lead scoring update)
    if (validatedData.contact_id) {
      // Queue lead scoring recalculation (async)
      fetch('/api/ai/lead-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Request': 'true'
        },
        body: JSON.stringify({
          contact_id: validatedData.contact_id,
          trigger: 'new_event'
        })
      }).catch((err) => console.error('Lead scoring trigger failed:', err));
    }

    // 7. Return success response
    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        message: 'Event ingested successfully'
      },
      { status: 201 }
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
    console.error('Event ingestion error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET /api/events/ingest - Health check
export async function GET() {
  return NextResponse.json({
    service: 'Event Ingestion API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      POST: {
        description: 'Ingest a new event',
        required: ['source', 'type'],
        optional: [
          'contact_id',
          'actor',
          'payload',
          'dedupe_key',
          'occurred_at'
        ]
      }
    }
  });
}
