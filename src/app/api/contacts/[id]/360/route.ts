import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';
import type { Contact360Response } from '@/types/customer360';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

// GET /api/contacts/[id]/360
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();
    const contactId = params.id;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contactId)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        { status: 400 }
      );
    }

    // 2. Fetch contact data with parallel queries
    const [contactResult, eventsResult, bookingsResult, engagementResult] =
      await Promise.all([
        // Contact basic info
        supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('tenant_id', authContext.tenantId)
          .single(),

        // Timeline events (last 200)
        supabase
          .from('events')
          .select('*')
          .eq('contact_id', contactId)
          .eq('tenant_id', authContext.tenantId)
          .order('occurred_at', { ascending: false })
          .limit(200),

        // Bookings
        supabase
          .from('bookings')
          .select('*')
          .eq('contact_id', contactId)
          .eq('tenant_id', authContext.tenantId)
          .order('booked_at', { ascending: false }),

        // Engagement metrics from materialized view
        supabase
          .from('mv_contact_engagement')
          .select('*')
          .eq('contact_id', contactId)
          .eq('tenant_id', authContext.tenantId)
          .single()
      ]);

    // 3. Check if contact exists
    if (contactResult.error || !contactResult.data) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // 4. Build response
    const response: Contact360Response = {
      contact: contactResult.data,
      timeline: eventsResult.data || [],
      bookings: bookingsResult.data || [],
      engagement: engagementResult.data || {
        tenant_id: authContext.tenantId,
        contact_id: contactId,
        email: contactResult.data.email,
        lead_score: contactResult.data.lead_score,
        email_opens: 0,
        email_clicks: 0,
        email_replies: 0,
        web_visits: 0,
        bookings_count: 0,
        last_activity_at: null,
        first_activity_at: null,
        activity_types: 0,
        total_events: 0
      }
    };

    // 5. Log access event (async, non-blocking)
    fetch('/api/events/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true'
      },
      body: JSON.stringify({
        contact_id: contactId,
        source: 'api',
        type: 'viewed',
        payload: {
          viewer: authContext.userId,
          endpoint: 'contact_360'
        }
      })
    }).catch((err) => console.error('Failed to log access event:', err));

    // 6. Return with cache headers
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle other errors
    console.error('Contact 360 API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id]/360 - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = await getAuthContext();
    const contactId = params.id;
    const updates = await request.json();

    // Remove read-only fields
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;

    // Update contact
    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('tenant_id', authContext.tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log update event
    fetch('/api/events/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'true'
      },
      body: JSON.stringify({
        contact_id: contactId,
        source: 'api',
        type: 'lead_updated',
        payload: {
          updates,
          updater: authContext.userId
        }
      })
    }).catch((err) => console.error('Failed to log update event:', err));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact update error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}
