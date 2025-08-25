import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

// GET /api/analytics/engagement
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Fetch all engagement data in parallel
    const [eventsData, contactsData] = await Promise.all([
      // All events for activity metrics
      supabase
        .from('events')
        .select('source, type, contact_id, occurred_at')
        .eq('tenant_id', authContext.tenantId),

      // Contacts with engagement metrics
      supabase
        .from('contact_engagement_metrics')
        .select('*')
        .eq('tenant_id', authContext.tenantId)
    ]);

    if (eventsData.error) {
      console.error('Events fetch error:', eventsData.error);
      throw new Error('Failed to fetch events data');
    }

    if (contactsData.error) {
      console.error('Contacts engagement fetch error:', contactsData.error);
      throw new Error('Failed to fetch contacts engagement data');
    }

    const events = eventsData.data || [];
    const contacts = contactsData.data || [];

    // 3. Calculate email metrics
    const emailEvents = events.filter((e) => e.source === 'email');
    const campaignSentEvents = emailEvents.filter(
      (e) => e.type === 'campaign_sent'
    );
    const emailOpens = emailEvents.filter((e) => e.type === 'opened');
    const emailClicks = emailEvents.filter((e) => e.type === 'clicked');
    const emailReplies = emailEvents.filter((e) => e.type === 'replied');

    const totalSent = campaignSentEvents.length;
    const totalOpens = emailOpens.length;
    const totalClicks = emailClicks.length;
    const totalReplies = emailReplies.length;

    const emailMetrics = {
      total_sent: totalSent,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      total_replies: totalReplies,
      open_rate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      click_rate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      reply_rate: totalSent > 0 ? (totalReplies / totalSent) * 100 : 0
    };

    // 4. Calculate web metrics
    const webEvents = events.filter((e) => e.source === 'web');
    const webVisits = webEvents.filter((e) => e.type === 'visited');
    const uniqueWebVisitors = new Set(
      webVisits.map((e) => e.contact_id).filter(Boolean)
    ).size;

    const webMetrics = {
      total_visits: webVisits.length,
      unique_visitors: uniqueWebVisitors,
      avg_session_duration: 0 // Would need session tracking for this
    };

    // 5. Calculate lead metrics
    const totalLeads = contacts.length;
    const leadScores = contacts.map((c) => c.lead_score);
    const avgLeadScore =
      leadScores.length > 0
        ? leadScores.reduce((sum, score) => sum + score, 0) / leadScores.length
        : 0;

    const scoreDistribution = {
      high: contacts.filter((c) => c.lead_score >= 70).length, // Hot leads
      medium: contacts.filter((c) => c.lead_score >= 40 && c.lead_score < 70)
        .length, // Warm leads
      low: contacts.filter((c) => c.lead_score < 40).length // Cold leads
    };

    const leadMetrics = {
      total_leads: totalLeads,
      hot_leads: scoreDistribution.high,
      qualified_leads: contacts.filter((c) => c.lead_score >= 60).length,
      avg_lead_score: avgLeadScore,
      score_distribution: scoreDistribution
    };

    // 6. Calculate activity metrics
    const totalEvents = events.length;
    const activeContacts = new Set(
      events.map((e) => e.contact_id).filter(Boolean)
    ).size;

    // Top sources
    const sourceCounts = events.reduce(
      (acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top event types
    const typeCounts = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const activityMetrics = {
      total_events: totalEvents,
      active_contacts: activeContacts,
      top_sources: topSources,
      top_types: topTypes
    };

    // 7. Build response
    const responseData = {
      email_metrics: emailMetrics,
      web_metrics: webMetrics,
      lead_metrics: leadMetrics,
      activity_metrics: activityMetrics
    };

    // 8. Return with caching headers
    return NextResponse.json(
      {
        ok: true,
        data: responseData,
        meta: {
          generated_at: new Date().toISOString(),
          tenant_id: authContext.tenantId,
          total_events: totalEvents,
          total_contacts: totalLeads
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache
          'X-Analytics-Version': '1.0.0'
        }
      }
    );
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle other errors
    console.error('Engagement analytics error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate engagement analytics'
      },
      { status: 500 }
    );
  }
}

// POST /api/analytics/engagement - Health check
export async function POST() {
  return NextResponse.json({
    service: 'Engagement Analytics API',
    version: '1.0.0',
    status: 'operational',
    metrics: [
      'email_metrics',
      'web_metrics',
      'lead_metrics',
      'activity_metrics'
    ],
    features: [
      'open_rate',
      'click_rate',
      'reply_rate',
      'lead_score_distribution',
      'top_sources',
      'top_event_types'
    ]
  });
}
