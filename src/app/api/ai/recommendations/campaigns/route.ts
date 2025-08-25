import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import {
  SmartRecommendationsEngine,
  CustomerProfileSchema,
  type CampaignRecommendation
} from '@/lib/ml/recommendations-engine';
import { ratelimit } from '@/lib/rate-limit';

// Request validation schema
const CampaignRecommendationsRequestSchema = z.object({
  target_segments: z.array(z.string()).optional(),
  campaign_types: z
    .array(z.enum(['email', 'sms', 'push', 'whatsapp']))
    .optional(),
  max_campaigns: z.number().min(1).max(10).default(5),
  min_confidence: z.number().min(0).max(1).default(0.4),
  include_ab_testing: z.boolean().default(true),
  urgency_filter: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  exclude_recent_campaigns: z.boolean().default(true)
});

type CampaignRecommendationsRequest = z.infer<
  typeof CampaignRecommendationsRequestSchema
>;

// Response schema
interface CampaignRecommendationsResponse {
  ok: boolean;
  data?: {
    campaigns: CampaignRecommendation[];
    target_analysis: {
      total_customers_analyzed: number;
      segments_identified: number;
      avg_engagement_score: number;
      estimated_reach: number;
    };
    performance_forecast: {
      expected_total_opens: number;
      expected_total_clicks: number;
      expected_conversions: number;
      estimated_revenue: number;
      roi_projection: number;
    };
    optimization_suggestions: string[];
    model_info: {
      algorithm: string;
      version: string;
      confidence_threshold: number;
      last_trained: string;
    };
  };
  error?: string;
  meta?: {
    request_id: string;
    processing_time_ms: number;
    rate_limit_remaining: number;
  };
}

// Fetch customer profiles for campaign targeting
async function fetchCustomerProfiles(
  supabase: any,
  tenantId: string,
  segments?: string[]
) {
  try {
    let query = supabase
      .from('customers')
      .select(
        `
        *,
        bookings (*),
        customer_interactions (*)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Filter by segments if specified
    if (segments && segments.length > 0) {
      query = query.in('customer_segment', segments);
    }

    const { data: customers, error } = await query.limit(500);

    if (error) throw error;
    if (!customers || customers.length === 0) {
      throw new Error('No customer data found');
    }

    // Transform to CustomerProfile format
    return customers.map((customer: any) => {
      const profile = {
        customer_id: customer.id,
        age: customer.age || 35,
        location: customer.location || 'Unknown',
        preferred_destinations: customer.preferred_destinations || [
          'Mecca',
          'Medina'
        ],
        booking_history:
          customer.bookings?.map((booking: any) => ({
            destination: booking.destination,
            package_type: booking.package_type || 'standard',
            price: booking.total_amount,
            booking_date: new Date(booking.created_at),
            satisfaction_score: booking.satisfaction_rating
          })) || [],
        total_spent: customer.total_spent || 0,
        avg_booking_value: customer.avg_booking_value || 0,
        booking_frequency_days: customer.booking_frequency_days || 365,
        last_booking_days_ago: customer.last_booking_days_ago || 999,
        email_preferences: {
          promotions: customer.email_preferences?.promotions ?? true,
          newsletters: customer.email_preferences?.newsletters ?? true,
          recommendations: customer.email_preferences?.recommendations ?? true
        },
        engagement_score: customer.engagement_score || 0.5,
        loyalty_tier: customer.loyalty_tier || 'bronze',
        communication_preference: customer.communication_preference || 'email',
        budget_range: customer.budget_range || 'mid-range',
        travel_style: customer.travel_style || 'solo',
        seasonal_preferences: customer.seasonal_preferences || [
          'spring',
          'autumn'
        ]
      };

      return CustomerProfileSchema.parse(profile);
    });
  } catch (error) {
    console.error('Error fetching customer profiles:', error);
    throw new Error('Failed to fetch customer profiles data');
  }
}

// Fetch available campaign templates
async function fetchAvailableCampaigns(
  supabase: any,
  tenantId: string,
  filters?: any
) {
  try {
    let query = supabase
      .from('campaign_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    // Apply filters if provided
    if (filters?.campaign_types) {
      query = query.in('type', filters.campaign_types);
    }

    if (filters?.exclude_recent_campaigns) {
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query = query.lt('last_used', recentDate.toISOString());
    }

    const { data: campaigns, error } = await query.limit(20);

    if (error) throw error;

    return (
      campaigns?.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        target_segment: campaign.target_segment,
        template: campaign.template,
        cta: campaign.call_to_action,
        ab_test_enabled: campaign.ab_test_enabled || false,
        expected_open_rate: campaign.historical_open_rate || 0.2,
        expected_click_rate: campaign.historical_click_rate || 0.03,
        conversion_rate: campaign.historical_conversion_rate || 0.05
      })) || []
    );
  } catch (error) {
    console.error('Error fetching available campaigns:', error);

    // Return default campaign templates if database query fails
    return [
      {
        id: crypto.randomUUID(),
        name: 'Seasonal Umrah Promotion',
        type: 'email',
        target_segment: 'frequent_travelers',
        template:
          'Book your spiritual journey this season with exclusive {{loyalty_tier}} member benefits.',
        cta: 'Book Now with 15% Discount',
        ab_test_enabled: true,
        expected_open_rate: 0.25,
        expected_click_rate: 0.04,
        conversion_rate: 0.06
      },
      {
        id: crypto.randomUUID(),
        name: 'Win-Back High Value Customers',
        type: 'email',
        target_segment: 'high_value_loyalists',
        template:
          'We miss you! Come back with our exclusive VIP package tailored for valued customers like you.',
        cta: 'Rediscover Your Journey',
        ab_test_enabled: true,
        expected_open_rate: 0.3,
        expected_click_rate: 0.05,
        conversion_rate: 0.08
      },
      {
        id: crypto.randomUUID(),
        name: 'Budget-Friendly Family Packages',
        type: 'email',
        target_segment: 'family_travelers',
        template:
          'Special family packages designed for meaningful spiritual experiences within your budget.',
        cta: 'Explore Family Packages',
        ab_test_enabled: false,
        expected_open_rate: 0.22,
        expected_click_rate: 0.035,
        conversion_rate: 0.055
      },
      {
        id: crypto.randomUUID(),
        name: 'Premium Experience Invitation',
        type: 'email',
        target_segment: 'luxury_seekers',
        template:
          'Indulge in our luxury Umrah experience with personalized services and premium accommodations.',
        cta: 'Experience Luxury',
        ab_test_enabled: true,
        expected_open_rate: 0.28,
        expected_click_rate: 0.06,
        conversion_rate: 0.1
      },
      {
        id: crypto.randomUUID(),
        name: 'Last-Minute Special Offers',
        type: 'sms',
        target_segment: 'budget_conscious',
        template:
          'Limited time offer: {{discount}}% off on selected Umrah packages. Book today!',
        cta: 'Book Now',
        ab_test_enabled: false,
        expected_open_rate: 0.85,
        expected_click_rate: 0.12,
        conversion_rate: 0.04
      }
    ];
  }
}

// Log campaign recommendation for analytics
async function logCampaignRecommendation(
  supabase: any,
  tenantId: string,
  recommendations: CampaignRecommendation[]
) {
  try {
    const logData = {
      tenant_id: tenantId,
      prediction_type: 'campaign_recommendations',
      input_data: {
        campaign_count: recommendations.length,
        target_segments: Array.from(
          new Set(recommendations.map((r) => r.target_segment))
        )
      },
      prediction_result: {
        recommendation_count: recommendations.length,
        avg_confidence:
          recommendations.reduce((sum, r) => sum + r.confidence_score, 0) /
          recommendations.length,
        high_urgency_count: recommendations.filter((r) =>
          ['high', 'critical'].includes(r.urgency_level)
        ).length,
        estimated_reach: recommendations.reduce(
          (sum, r) => sum + r.expected_open_rate * 1000,
          0
        ) // Estimated reach
      },
      model_version: 'campaign-recommendations-v1.0',
      model_accuracy:
        recommendations.length > 0 && recommendations[0].confidence_score > 0.6
          ? 'high'
          : 'medium',
      confidence_score:
        recommendations.reduce((sum, r) => sum + r.confidence_score, 0) /
        recommendations.length,
      processing_time_ms: 0, // Will be updated
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('ml_prediction_logs').insert(logData);

    if (error) {
      console.error('Failed to log campaign recommendation:', error);
    }
  } catch (error) {
    console.error('Error logging campaign recommendation:', error);
  }
}

/**
 * POST /api/ai/recommendations/campaigns
 * Generate personalized campaign recommendations for customer segments
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = `recommendations-campaigns-${userId}`;
    const { success, limit, reset, remaining } =
      await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded',
          meta: {
            rate_limit_reset: reset,
            rate_limit_limit: limit
          }
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const params = CampaignRecommendationsRequestSchema.parse(body);

    // Get tenant ID from headers or user context
    const tenantId = request.headers.get('x-tenant-id') || userId;

    // Initialize Supabase client
    const supabase = await createClient();

    // Fetch customer profiles for targeting
    const customerProfiles = await fetchCustomerProfiles(
      supabase,
      tenantId,
      params.target_segments
    );

    if (customerProfiles.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No customer profiles found for campaign targeting',
          meta: {
            request_id: requestId,
            processing_time_ms: Date.now() - startTime,
            rate_limit_remaining: remaining
          }
        },
        { status: 404 }
      );
    }

    // Fetch available campaign templates
    const availableCampaigns = await fetchAvailableCampaigns(
      supabase,
      tenantId,
      {
        campaign_types: params.campaign_types,
        exclude_recent_campaigns: params.exclude_recent_campaigns
      }
    );

    if (availableCampaigns.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No campaign templates available',
          meta: {
            request_id: requestId,
            processing_time_ms: Date.now() - startTime,
            rate_limit_remaining: remaining
          }
        },
        { status: 404 }
      );
    }

    // Initialize recommendations engine
    const recommendationsEngine = new SmartRecommendationsEngine();

    // Generate campaign recommendations
    const recommendations =
      await recommendationsEngine.generateCampaignRecommendations(
        customerProfiles,
        availableCampaigns,
        {
          max_campaigns: params.max_campaigns,
          min_confidence: params.min_confidence,
          target_segments: params.target_segments
        }
      );

    // Filter by urgency if specified
    let filteredRecommendations = recommendations;
    if (params.urgency_filter) {
      filteredRecommendations = recommendations.filter(
        (r) => r.urgency_level === params.urgency_filter
      );
    }

    // Calculate target analysis
    const targetAnalysis = {
      total_customers_analyzed: customerProfiles.length,
      segments_identified: Array.from(
        new Set(customerProfiles.map((p) => determineCustomerSegment(p)))
      ).length,
      avg_engagement_score:
        customerProfiles.reduce((sum, p) => sum + p.engagement_score, 0) /
        customerProfiles.length,
      estimated_reach: filteredRecommendations.reduce(
        (sum, r) => sum + r.expected_open_rate * customerProfiles.length,
        0
      )
    };

    // Calculate performance forecast
    const totalCustomers = customerProfiles.length;
    const performanceForecast = {
      expected_total_opens: filteredRecommendations.reduce(
        (sum, r) => sum + r.expected_open_rate * totalCustomers,
        0
      ),
      expected_total_clicks: filteredRecommendations.reduce(
        (sum, r) => sum + r.expected_click_rate * totalCustomers,
        0
      ),
      expected_conversions: filteredRecommendations.reduce(
        (sum, r) => sum + r.expected_conversion_rate * totalCustomers,
        0
      ),
      estimated_revenue: filteredRecommendations.reduce(
        (sum, r) => sum + r.expected_conversion_rate * totalCustomers * 1500,
        0
      ), // Avg conversion value €1500
      roi_projection: 0 // Will be calculated below
    };

    // Calculate ROI (Revenue - Cost) / Cost
    const estimatedCampaignCost =
      filteredRecommendations.length * totalCustomers * 0.1; // €0.10 per customer per campaign
    performanceForecast.roi_projection =
      estimatedCampaignCost > 0
        ? ((performanceForecast.estimated_revenue - estimatedCampaignCost) /
            estimatedCampaignCost) *
          100
        : 0;

    // Generate optimization suggestions
    const optimizationSuggestions = generateOptimizationSuggestions(
      filteredRecommendations,
      customerProfiles,
      targetAnalysis
    );

    // Log campaign recommendations for analytics
    await logCampaignRecommendation(
      supabase,
      tenantId,
      filteredRecommendations
    );

    const processingTime = Date.now() - startTime;

    const response: CampaignRecommendationsResponse = {
      ok: true,
      data: {
        campaigns: filteredRecommendations,
        target_analysis: targetAnalysis,
        performance_forecast: performanceForecast,
        optimization_suggestions: optimizationSuggestions,
        model_info: {
          algorithm: 'segment-based-campaign-matching',
          version: 'v1.0.0',
          confidence_threshold: params.min_confidence,
          last_trained: '2024-01-01T00:00:00Z'
        }
      },
      meta: {
        request_id: requestId,
        processing_time_ms: processingTime,
        rate_limit_remaining: remaining
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Campaign recommendations error:', error);

    const processingTime = Date.now() - startTime;

    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      statusCode = 400;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (
        error.message.includes('not found') ||
        error.message.includes('No customer')
      ) {
        statusCode = 404;
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      },
      { status: statusCode }
    );
  }
}

// Helper functions
function determineCustomerSegment(profile: any): string {
  if (profile.total_spent > 10000 && profile.booking_frequency_days < 90) {
    return 'high_value_frequent';
  }
  if (profile.loyalty_tier === 'platinum' || profile.loyalty_tier === 'gold') {
    return 'premium_customers';
  }
  if (profile.travel_style === 'family') {
    return 'family_travelers';
  }
  if (profile.budget_range === 'luxury') {
    return 'luxury_seekers';
  }
  if (profile.avg_booking_value < 1000) {
    return 'budget_conscious';
  }
  return 'standard_customers';
}

function generateOptimizationSuggestions(
  recommendations: CampaignRecommendation[],
  customerProfiles: any[],
  targetAnalysis: any
): string[] {
  const suggestions: string[] = [];

  // Analyze engagement patterns
  if (targetAnalysis.avg_engagement_score < 0.5) {
    suggestions.push(
      'Consider improving email subject lines and content personalization to boost engagement'
    );
  }

  // Analyze campaign timing
  const emailCampaigns = recommendations.filter(
    (r) => r.campaign_type === 'email'
  );
  if (emailCampaigns.length > 0) {
    suggestions.push(
      'Schedule email campaigns for Tuesday-Thursday, 10 AM - 2 PM for optimal open rates'
    );
  }

  // Analyze segment diversity
  const uniqueSegments = Array.from(
    new Set(recommendations.map((r) => r.target_segment))
  );
  if (uniqueSegments.length < 3) {
    suggestions.push(
      'Consider expanding campaign targeting to additional customer segments for broader reach'
    );
  }

  // Analyze A/B testing opportunities
  const abTestCampaigns = recommendations.filter((r) => r.a_b_test_variant);
  if (abTestCampaigns.length < recommendations.length * 0.5) {
    suggestions.push(
      'Implement A/B testing for more campaigns to optimize performance'
    );
  }

  // Analyze urgency distribution
  const highUrgencyCampaigns = recommendations.filter((r) =>
    ['high', 'critical'].includes(r.urgency_level)
  );
  if (highUrgencyCampaigns.length > recommendations.length * 0.7) {
    suggestions.push(
      'Balance campaign urgency levels to avoid customer fatigue'
    );
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}
