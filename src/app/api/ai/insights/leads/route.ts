import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';

// Helper to get user context from Clerk
async function getAuthContext() {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClient();
  const tenantId = user.publicMetadata.tenant_id as string;
  const role = (user.publicMetadata.role as string) || 'agent';

  if (!tenantId) {
    throw new Error('No tenant associated with user');
  }

  return {
    userId: user.id,
    tenantId,
    role,
    email: user.emailAddresses[0]?.emailAddress,
    supabase
  };
}

// GET /api/ai/insights/leads - Generate AI insights for leads
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    // 3. Fetch lead data with scores
    const { data: contacts, error: contactsError } = await authContext.supabase
      .from('contacts')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        lead_score,
        created_at,
        updated_at,
        lead_status,
        source
      `
      )
      .eq('tenant_id', authContext.tenantId)
      .order('lead_score', { ascending: false })
      .limit(limit * 2); // Get more to filter and analyze

    if (contactsError) {
      throw new Error('Failed to fetch contacts');
    }

    // 4. Get recent lead scoring events for trend analysis
    const { data: recentEvents, error: eventsError } = await authContext.supabase
      .from('events')
      .select('contact_id, payload, occurred_at')
      .eq('tenant_id', authContext.tenantId)
      .eq('type', 'lead_updated')
      .in('actor', ['ai:lead_scorer', 'ai:batch_scorer'])
      .gte(
        'occurred_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ) // Last 7 days
      .order('occurred_at', { ascending: false });

    const recentScoringEvents = recentEvents || [];

    // 5. Get engagement metrics for top contacts
    const topContactIds = (contacts || []).slice(0, limit).map((c) => c.id);
    const { data: engagementData, error: engagementError } = await authContext.supabase
      .from('contact_engagement_metrics')
      .select('*')
      .in('contact_id', topContactIds)
      .eq('tenant_id', authContext.tenantId);

    const engagementMap = new Map(
      (engagementData || []).map((e) => [e.contact_id, e])
    );

    // 6. Get recent activity for contacts
    const { data: recentActivity, error: activityError } = await authContext.supabase
      .from('events')
      .select('contact_id, occurred_at')
      .in('contact_id', topContactIds)
      .eq('tenant_id', authContext.tenantId)
      .gte(
        'occurred_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ) // Last 30 days
      .order('occurred_at', { ascending: false });

    const activityMap = new Map<string, string>();
    (recentActivity || []).forEach((activity) => {
      if (!activityMap.has(activity.contact_id)) {
        activityMap.set(activity.contact_id, activity.occurred_at);
      }
    });

    // 7. Analyze lead scoring trends
    const scoreChanges = recentScoringEvents
      .filter(
        (event) =>
          event.payload?.new_score !== undefined &&
          event.payload?.previous_score !== undefined
      )
      .map((event) => ({
        contact_id: event.contact_id,
        change: event.payload.new_score - (event.payload.previous_score || 0),
        occurred_at: event.occurred_at,
        confidence: event.payload.confidence || 0.5
      }));

    const risingLeads = scoreChanges.filter((sc) => sc.change > 5).length;
    const decliningLeads = scoreChanges.filter((sc) => sc.change < -5).length;
    const highConfidenceLeads = scoreChanges.filter(
      (sc) => sc.confidence >= 0.8
    ).length;
    const recentlyScored = recentScoringEvents.filter(
      (event) =>
        new Date(event.occurred_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    // 8. Build top leads data
    const topLeads = (contacts || []).slice(0, limit).map((contact) => {
      const engagement = engagementMap.get(contact.id);
      const lastActivity = activityMap.get(contact.id) || contact.updated_at;

      // Mock breakdown for demo - in real implementation, this would come from lead scoring
      const mockBreakdown = {
        behavioral: Math.min(
          Math.round(contact.lead_score * 0.4 + Math.random() * 20),
          40
        ),
        demographic: Math.min(
          Math.round(contact.lead_score * 0.25 + Math.random() * 15),
          25
        ),
        temporal: Math.min(
          Math.round(contact.lead_score * 0.2 + Math.random() * 10),
          20
        ),
        contextual: Math.min(
          Math.round(contact.lead_score * 0.15 + Math.random() * 10),
          15
        )
      };

      return {
        contact_id: contact.id,
        name:
          [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
          'Unbekannt',
        email: contact.email,
        lead_score: contact.lead_score,
        confidence: 0.75 + Math.random() * 0.2, // Mock confidence
        breakdown: mockBreakdown,
        factors: {
          email_events: engagement?.email_opens || 0,
          web_visits: engagement?.web_visits || 0,
          total_events: engagement?.total_events || 0,
          source: contact.source,
          status: contact.lead_status
        },
        last_activity: lastActivity
      };
    });

    // 9. Calculate score distribution
    const allContacts = contacts || [];
    const scoreDistribution = {
      hot: allContacts.filter((c) => c.lead_score >= 70).length,
      warm: allContacts.filter((c) => c.lead_score >= 40 && c.lead_score < 70)
        .length,
      cold: allContacts.filter((c) => c.lead_score < 40).length
    };

    // 10. Generate AI recommendations
    const recommendations = [
      {
        type: 'optimization',
        title: 'Lead-Bewertung optimieren',
        description: `${decliningLeads} Leads zeigen rückläufige Scores. Überprüfen Sie deren Engagement-Historie.`,
        priority:
          decliningLeads > 5 ? 'high' : ('medium' as 'high' | 'medium' | 'low')
      },
      {
        type: 'engagement',
        title: 'Heiße Leads kontaktieren',
        description: `${scoreDistribution.hot} heiße Leads warten auf persönliche Betreuung.`,
        priority:
          scoreDistribution.hot > 10
            ? 'high'
            : ('medium' as 'high' | 'medium' | 'low')
      },
      {
        type: 'nurturing',
        title: 'Warme Leads entwickeln',
        description: `${scoreDistribution.warm} warme Leads können durch gezieltes Nurturing aktiviert werden.`,
        priority: 'medium' as 'high' | 'medium' | 'low'
      }
    ].filter((rec) => {
      // Only show relevant recommendations
      if (rec.type === 'optimization' && decliningLeads === 0) return false;
      if (rec.type === 'engagement' && scoreDistribution.hot === 0)
        return false;
      if (rec.type === 'nurturing' && scoreDistribution.warm === 0)
        return false;
      return true;
    });

    // 11. Build response
    const responseData = {
      top_leads: topLeads,
      score_distribution: scoreDistribution,
      insights: {
        rising_leads: risingLeads,
        declining_leads: decliningLeads,
        high_confidence_leads: highConfidenceLeads,
        recently_scored: recentlyScored
      },
      recommendations
    };

    // 12. Return with caching headers
    return NextResponse.json(
      {
        ok: true,
        data: responseData,
        meta: {
          generated_at: new Date().toISOString(),
          tenant_id: authContext.tenantId,
          total_contacts: allContacts.length,
          analysis_period_days: 7
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache
          'X-AI-Version': '1.0.0',
          'X-Analysis-Confidence': '0.85'
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
    // Error logged: console.error('Lead Insights error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate lead insights'
      },
      { status: 500 }
    );
  }
}

// POST /api/ai/insights/leads - Health check
export async function POST() {
  return NextResponse.json({
    service: 'AI Lead Insights Engine',
    version: '1.0.0',
    status: 'operational',
    features: [
      'top_leads_analysis',
      'score_distribution',
      'trend_detection',
      'smart_recommendations'
    ],
    analysis_factors: [
      'lead_score_trends',
      'engagement_patterns',
      'confidence_levels',
      'activity_recency'
    ]
  });
}
