import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Lead Score Request Schema
const LeadScoreRequestSchema = z.object({
  contact_id: z.string().uuid(),
  trigger: z.enum(['new_event', 'manual_request', 'batch_update']).optional(),
  force_recalculate: z.boolean().optional().default(false)
});

// AI Lead Scoring Algorithm Configuration
const SCORING_WEIGHTS = {
  behavioral: 0.4, // Email engagement, web activity
  demographic: 0.25, // Budget, location, preferences
  temporal: 0.2, // Recency, frequency, momentum
  contextual: 0.15 // Seasonal, market trends
};

const BEHAVIORAL_FACTORS = {
  email_opens: { max_score: 25, decay_days: 30 },
  email_clicks: { max_score: 35, decay_days: 30 },
  email_replies: { max_score: 40, decay_days: 60 },
  web_visits: { max_score: 20, decay_days: 14 },
  form_submissions: { max_score: 30, decay_days: 90 }
};

const DEMOGRAPHIC_FACTORS = {
  budget_tier: {
    luxury: 30, // >5000 EUR
    premium: 20, // 2000-5000 EUR
    standard: 10, // 500-2000 EUR
    budget: 5 // <500 EUR
  },
  location_tier: {
    domestic: 25, // Germany
    europe: 20, // Europe
    international: 15 // Others
  },
  source_quality: {
    referral: 25,
    organic: 20,
    social: 15,
    paid: 10,
    unknown: 5
  }
};

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

// AI Lead Scoring Algorithm
class AILeadScorer {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async calculateLeadScore(contactId: string): Promise<{
    total_score: number;
    breakdown: {
      behavioral: number;
      demographic: number;
      temporal: number;
      contextual: number;
    };
    factors: Record<string, any>;
    confidence: number;
  }> {
    // Fetch contact and engagement data
    const [contactData, eventsData, engagementData] = await Promise.all([
      this.getContactData(contactId),
      this.getRecentEvents(contactId),
      this.getEngagementMetrics(contactId)
    ]);

    // Calculate individual scores
    const behavioralScore = this.calculateBehavioralScore(
      eventsData,
      engagementData
    );
    const demographicScore = this.calculateDemographicScore(contactData);
    const temporalScore = this.calculateTemporalScore(eventsData);
    const contextualScore = this.calculateContextualScore(
      contactData,
      eventsData
    );

    // Calculate weighted total
    const totalScore = Math.round(
      behavioralScore * SCORING_WEIGHTS.behavioral +
        demographicScore * SCORING_WEIGHTS.demographic +
        temporalScore * SCORING_WEIGHTS.temporal +
        contextualScore * SCORING_WEIGHTS.contextual
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(
      contactData,
      eventsData,
      engagementData
    );

    return {
      total_score: Math.min(Math.max(totalScore, 0), 100),
      breakdown: {
        behavioral: Math.round(behavioralScore),
        demographic: Math.round(demographicScore),
        temporal: Math.round(temporalScore),
        contextual: Math.round(contextualScore)
      },
      factors: {
        email_engagement: eventsData.email_events.length,
        web_activity: eventsData.web_events.length,
        budget_range: contactData.budget_max || 0,
        recent_activity_days: this.getDaysSinceLastActivity(eventsData),
        total_events: eventsData.all_events.length
      },
      confidence: Math.round(confidence * 100) / 100
    };
  }

  private async getContactData(contactId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (error) throw new Error('Contact not found');
    return data;
  }

  private async getRecentEvents(contactId: string, days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('contact_id', contactId)
      .eq('tenant_id', this.tenantId)
      .gte('occurred_at', cutoffDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) throw new Error('Failed to fetch events');

    const events = data || [];
    return {
      all_events: events,
      email_events: events.filter((e) => e.source === 'email'),
      web_events: events.filter((e) => e.source === 'web'),
      recent_events: events.filter(
        (e) =>
          new Date(e.occurred_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
    };
  }

  private async getEngagementMetrics(contactId: string) {
    const { data, error } = await supabase
      .from('contact_engagement_metrics')
      .select('*')
      .eq('contact_id', contactId)
      .eq('tenant_id', this.tenantId)
      .single();

    return (
      data || {
        email_opens: 0,
        email_clicks: 0,
        email_replies: 0,
        web_visits: 0,
        total_events: 0
      }
    );
  }

  private calculateBehavioralScore(
    eventsData: any,
    engagementData: any
  ): number {
    let score = 0;

    // Email engagement scoring
    const emailOpens = Math.min(engagementData.email_opens, 20);
    const emailClicks = Math.min(engagementData.email_clicks, 15);
    const emailReplies = Math.min(engagementData.email_replies, 10);
    const webVisits = Math.min(engagementData.web_visits, 25);

    score += (emailOpens / 20) * BEHAVIORAL_FACTORS.email_opens.max_score;
    score += (emailClicks / 15) * BEHAVIORAL_FACTORS.email_clicks.max_score;
    score += (emailReplies / 10) * BEHAVIORAL_FACTORS.email_replies.max_score;
    score += (webVisits / 25) * BEHAVIORAL_FACTORS.web_visits.max_score;

    // Recent activity bonus
    if (eventsData.recent_events.length > 0) {
      score += 10; // Recent activity bonus
    }

    // Engagement consistency (regular activity)
    const activityDays = this.getActivityDays(eventsData.all_events);
    if (activityDays >= 3) {
      score += Math.min(activityDays * 2, 20);
    }

    return Math.min(score, 100);
  }

  private calculateDemographicScore(contactData: any): number {
    let score = 0;

    // Budget tier scoring
    const budget = contactData.budget_max || 0;
    if (budget >= 5000) {
      score += DEMOGRAPHIC_FACTORS.budget_tier.luxury;
    } else if (budget >= 2000) {
      score += DEMOGRAPHIC_FACTORS.budget_tier.premium;
    } else if (budget >= 500) {
      score += DEMOGRAPHIC_FACTORS.budget_tier.standard;
    } else {
      score += DEMOGRAPHIC_FACTORS.budget_tier.budget;
    }

    // Location scoring
    const country = contactData.country?.toLowerCase() || '';
    if (country === 'germany' || country === 'deutschland') {
      score += DEMOGRAPHIC_FACTORS.location_tier.domestic;
    } else if (
      ['austria', 'switzerland', 'netherlands', 'belgium', 'france'].includes(
        country
      )
    ) {
      score += DEMOGRAPHIC_FACTORS.location_tier.europe;
    } else {
      score += DEMOGRAPHIC_FACTORS.location_tier.international;
    }

    // Source quality scoring
    const source = contactData.source?.toLowerCase() || 'unknown';
    if (source.includes('referral')) {
      score += DEMOGRAPHIC_FACTORS.source_quality.referral;
    } else if (source.includes('organic') || source.includes('google')) {
      score += DEMOGRAPHIC_FACTORS.source_quality.organic;
    } else if (
      source.includes('social') ||
      source.includes('facebook') ||
      source.includes('instagram')
    ) {
      score += DEMOGRAPHIC_FACTORS.source_quality.social;
    } else if (source.includes('ads') || source.includes('paid')) {
      score += DEMOGRAPHIC_FACTORS.source_quality.paid;
    } else {
      score += DEMOGRAPHIC_FACTORS.source_quality.unknown;
    }

    // Completeness bonus
    const completenessFields = [
      contactData.first_name,
      contactData.last_name,
      contactData.phone,
      contactData.city,
      contactData.budget_min
    ].filter(Boolean).length;
    score += (completenessFields / 5) * 20;

    return Math.min(score, 100);
  }

  private calculateTemporalScore(eventsData: any): number {
    let score = 0;

    // Recency scoring
    const daysSinceLastActivity = this.getDaysSinceLastActivity(eventsData);
    if (daysSinceLastActivity <= 1) {
      score += 30; // Very recent
    } else if (daysSinceLastActivity <= 3) {
      score += 25; // Recent
    } else if (daysSinceLastActivity <= 7) {
      score += 20; // Somewhat recent
    } else if (daysSinceLastActivity <= 30) {
      score += 10; // Old
    } else {
      score += 0; // Very old
    }

    // Frequency scoring
    const eventCount = eventsData.all_events.length;
    score += Math.min(eventCount * 2, 30);

    // Momentum scoring (increasing activity)
    const recentActivity = eventsData.recent_events.length;
    const olderActivity = eventsData.all_events.length - recentActivity;
    if (recentActivity > olderActivity && recentActivity >= 2) {
      score += 20; // Positive momentum
    }

    return Math.min(score, 100);
  }

  private calculateContextualScore(contactData: any, eventsData: any): number {
    let score = 0;
    const now = new Date();
    const month = now.getMonth() + 1;

    // Seasonal scoring for Umrah
    // Peak season: October-March (Umrah season)
    if (month >= 10 || month <= 3) {
      score += 25; // Peak season
    } else if (month >= 4 && month <= 6) {
      score += 15; // Shoulder season
    } else {
      score += 10; // Off season
    }

    // Hotel tier preference bonus
    if (contactData.preferred_hotel_tier === 'luxury') {
      score += 20;
    } else if (contactData.preferred_hotel_tier === 'premium') {
      score += 15;
    } else {
      score += 10;
    }

    // Language/market bonus
    if (contactData.language === 'de' || contactData.language === 'german') {
      score += 15; // Primary market
    }

    // Recent booking behavior in events
    const hasRecentBookingActivity = eventsData.all_events.some(
      (e: any) => e.type === 'booked' || e.type === 'paid'
    );
    if (hasRecentBookingActivity) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private calculateConfidence(
    contactData: any,
    eventsData: any,
    engagementData: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Data completeness factor
    const contactFields = Object.keys(contactData).filter(
      (key) => contactData[key] !== null && contactData[key] !== ''
    ).length;
    confidence += (contactFields / 15) * 0.3; // Max +0.3 for complete profile

    // Event data richness
    const eventCount = eventsData.all_events.length;
    confidence += Math.min(eventCount / 20, 0.2); // Max +0.2 for many events

    // Engagement data reliability
    if (engagementData.total_events >= 5) {
      confidence += 0.15;
    } else if (engagementData.total_events >= 2) {
      confidence += 0.1;
    }

    // Temporal data factor
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(contactData.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreation >= 7) {
      confidence += 0.1; // More reliable after a week
    }

    return Math.min(confidence, 1.0);
  }

  private getDaysSinceLastActivity(eventsData: any): number {
    if (eventsData.all_events.length === 0) {
      return 365; // Very old if no events
    }

    const lastEvent = eventsData.all_events[0]; // Already sorted desc
    return Math.floor(
      (Date.now() - new Date(lastEvent.occurred_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  private getActivityDays(events: any[]): number {
    const uniqueDays = new Set(
      events.map((e) => new Date(e.occurred_at).toDateString())
    );
    return uniqueDays.size;
  }
}

// POST /api/ai/lead-score - Calculate lead score for contact
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse and validate request
    const body = await request.json();
    const validatedData = LeadScoreRequestSchema.parse(body);

    // 3. Initialize AI scorer
    const scorer = new AILeadScorer(authContext.tenantId);

    // 4. Calculate lead score
    const scoreResult = await scorer.calculateLeadScore(
      validatedData.contact_id
    );

    // 5. Update contact lead_score in database
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        lead_score: scoreResult.total_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.contact_id)
      .eq('tenant_id', authContext.tenantId);

    if (updateError) {
      console.error('Failed to update lead score:', updateError);
      // Continue anyway, return calculated score
    }

    // 6. Log scoring event for audit trail
    await supabase.from('events').insert({
      tenant_id: authContext.tenantId,
      contact_id: validatedData.contact_id,
      actor: `ai:lead_scorer`,
      source: 'api',
      type: 'lead_updated',
      payload: {
        previous_score: 0, // Would need to fetch previous
        new_score: scoreResult.total_score,
        trigger: validatedData.trigger,
        confidence: scoreResult.confidence
      },
      occurred_at: new Date().toISOString()
    });

    // 7. Return result
    return NextResponse.json(
      {
        ok: true,
        data: {
          contact_id: validatedData.contact_id,
          lead_score: scoreResult.total_score,
          breakdown: scoreResult.breakdown,
          factors: scoreResult.factors,
          confidence: scoreResult.confidence,
          updated_at: new Date().toISOString()
        },
        meta: {
          algorithm_version: '1.0.0',
          tenant_id: authContext.tenantId,
          trigger: validatedData.trigger
        }
      },
      {
        status: 200,
        headers: {
          'X-AI-Version': '1.0.0',
          'X-Confidence-Score': scoreResult.confidence.toString()
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
    console.error('AI Lead Scoring error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to calculate lead score'
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/lead-score - Health check and algorithm info
export async function GET() {
  return NextResponse.json({
    service: 'AI Lead Scoring Engine',
    version: '1.0.0',
    status: 'operational',
    algorithm: {
      weights: SCORING_WEIGHTS,
      factors: {
        behavioral: Object.keys(BEHAVIORAL_FACTORS),
        demographic: Object.keys(DEMOGRAPHIC_FACTORS),
        temporal: ['recency', 'frequency', 'momentum'],
        contextual: ['seasonal', 'preferences', 'market']
      }
    },
    confidence_factors: [
      'data_completeness',
      'event_richness',
      'engagement_reliability',
      'temporal_maturity'
    ]
  });
}
