import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import {
  CustomerSegmentationEngine,
  CustomerSegmentationDataSchema,
  type SegmentationAnalysis
} from '@/lib/ml/customer-segmentation';
import { ratelimit } from '@/lib/rate-limit';

// Request validation schema
const SegmentAnalysisRequestSchema = z.object({
  segment_count: z.number().min(3).max(12).default(8),
  min_segment_size: z.number().min(5).max(100).default(10),
  include_rfm: z.boolean().default(true),
  stability_analysis: z.boolean().default(false),
  analysis_period_days: z.number().min(30).max(730).default(365),
  exclude_inactive: z.boolean().default(false),
  focus_dimensions: z
    .array(
      z.enum([
        'demographic',
        'behavioral',
        'financial',
        'engagement',
        'loyalty'
      ])
    )
    .optional()
});

type SegmentAnalysisRequest = z.infer<typeof SegmentAnalysisRequestSchema>;

// Response schema
interface SegmentAnalysisResponse {
  ok: boolean;
  data?: SegmentationAnalysis;
  error?: string;
  meta?: {
    request_id: string;
    processing_time_ms: number;
    rate_limit_remaining: number;
    data_quality_score: number;
    last_updated: string;
  };
}

// Fetch customer data for segmentation
async function fetchCustomerSegmentationData(
  supabase: any,
  tenantId: string,
  options: any
) {
  try {
    let query = supabase
      .from('customers')
      .select(
        `
        id,
        tenant_id,
        age,
        gender,
        location_country,
        location_city,
        language_preference,
        total_bookings,
        total_spent,
        avg_booking_value,
        first_booking_date,
        last_booking_date,
        booking_frequency_days,
        preferred_destinations,
        preferred_package_types,
        email_open_rate,
        email_click_rate,
        website_session_count,
        avg_session_duration,
        page_views_total,
        social_media_engagement,
        payment_method_preferences,
        payment_delays_count,
        refund_requests_count,
        cancellation_rate,
        referral_count,
        review_count,
        avg_review_rating,
        loyalty_program_tier,
        loyalty_points_balance,
        support_ticket_count,
        avg_resolution_satisfaction,
        communication_preferences,
        travel_style,
        travel_frequency,
        booking_lead_time_days,
        seasonal_pattern,
        budget_sensitivity,
        account_status,
        last_activity_date,
        created_at,
        updated_at
      `
      )
      .eq('tenant_id', tenantId);

    // Apply filters
    if (options.exclude_inactive) {
      query = query.eq('account_status', 'active');
    }

    if (options.analysis_period_days < 365) {
      const cutoffDate = new Date(
        Date.now() - options.analysis_period_days * 24 * 60 * 60 * 1000
      );
      query = query.gte('last_activity_date', cutoffDate.toISOString());
    }

    const { data: customers, error } = await query.limit(5000);

    if (error) throw error;
    if (!customers || customers.length === 0) {
      throw new Error('No customer data found for segmentation analysis');
    }

    // Transform and validate data
    return customers.map((customer: any) => {
      const segmentationData = {
        customer_id: customer.id,
        tenant_id: customer.tenant_id,

        // Demographics
        age: customer.age || 35,
        gender: customer.gender || 'other',
        location_country: customer.location_country || 'Unknown',
        location_city: customer.location_city || 'Unknown',
        language_preference: customer.language_preference || 'en',

        // Behavioral data
        total_bookings: customer.total_bookings || 0,
        total_spent: customer.total_spent || 0,
        avg_booking_value: customer.avg_booking_value || 0,
        first_booking_date: customer.first_booking_date
          ? new Date(customer.first_booking_date)
          : new Date(),
        last_booking_date: customer.last_booking_date
          ? new Date(customer.last_booking_date)
          : undefined,
        booking_frequency_days: customer.booking_frequency_days || 365,
        preferred_destinations: customer.preferred_destinations || ['Mecca'],
        preferred_package_types: customer.preferred_package_types || [
          'standard'
        ],

        // Engagement data
        email_open_rate: customer.email_open_rate || 0,
        email_click_rate: customer.email_click_rate || 0,
        website_session_count: customer.website_session_count || 0,
        avg_session_duration: customer.avg_session_duration || 0,
        page_views_total: customer.page_views_total || 0,
        social_media_engagement: customer.social_media_engagement || 0,

        // Financial behavior
        payment_method_preferences: customer.payment_method_preferences || [
          'credit_card'
        ],
        payment_delays_count: customer.payment_delays_count || 0,
        refund_requests_count: customer.refund_requests_count || 0,
        cancellation_rate: customer.cancellation_rate || 0,

        // Loyalty indicators
        referral_count: customer.referral_count || 0,
        review_count: customer.review_count || 0,
        avg_review_rating: customer.avg_review_rating,
        loyalty_program_tier: customer.loyalty_program_tier || 'bronze',
        loyalty_points_balance: customer.loyalty_points_balance || 0,

        // Support interaction
        support_ticket_count: customer.support_ticket_count || 0,
        avg_resolution_satisfaction: customer.avg_resolution_satisfaction,
        communication_preferences: customer.communication_preferences || [
          'email'
        ],

        // Travel preferences
        travel_style: customer.travel_style || 'solo',
        travel_frequency: customer.travel_frequency || 'occasional',
        booking_lead_time_days: customer.booking_lead_time_days || 30,
        seasonal_pattern: customer.seasonal_pattern || ['spring'],
        budget_sensitivity: customer.budget_sensitivity || 'medium',

        // Current status
        account_status: customer.account_status || 'active',
        last_activity_date: new Date(
          customer.last_activity_date || customer.updated_at
        ),
        created_at: new Date(customer.created_at),
        updated_at: new Date(customer.updated_at)
      };

      return CustomerSegmentationDataSchema.parse(segmentationData);
    });
  } catch (error) {
    // Error logged: console.error('Error fetching customer segmentation data:', error);
    throw new Error('Failed to fetch customer data for segmentation analysis');
  }
}

// Calculate data quality score
function calculateDataQualityScore(customers: any[]): number {
  if (customers.length === 0) return 0;

  let totalScore = 0;
  let scoringFields = 0;

  customers.forEach((customer) => {
    let customerScore = 0;
    let customerFields = 0;

    // Check completeness of key fields
    const keyFields = [
      'age',
      'total_bookings',
      'total_spent',
      'email_open_rate',
      'loyalty_program_tier',
      'travel_style',
      'preferred_destinations'
    ];

    keyFields.forEach((field) => {
      customerFields++;
      if (
        customer[field] !== null &&
        customer[field] !== undefined &&
        customer[field] !== ''
      ) {
        customerScore++;
      }
    });

    totalScore += customerScore / customerFields;
    scoringFields++;
  });

  return (totalScore / scoringFields) * 100; // Convert to percentage
}

// Log segmentation analysis
async function logSegmentationAnalysis(
  supabase: any,
  tenantId: string,
  analysis: SegmentationAnalysis
) {
  try {
    const logData = {
      tenant_id: tenantId,
      prediction_type: 'customer_segmentation',
      input_data: {
        total_customers: analysis.total_customers,
        segments_created: analysis.segments.length
      },
      prediction_result: {
        segment_count: analysis.segments.length,
        avg_segment_size:
          analysis.segments.reduce((sum, s) => sum + s.customer_count, 0) /
          analysis.segments.length,
        quality_score: analysis.quality_metrics.confidence_level,
        largest_segment: analysis.insights.largest_segment
      },
      model_version: 'customer-segmentation-v1.0',
      model_accuracy:
        analysis.quality_metrics.confidence_level > 0.7 ? 'high' : 'medium',
      confidence_score: analysis.quality_metrics.confidence_level,
      processing_time_ms: 0,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('ml_prediction_logs').insert(logData);

    if (error) {
      // Error logged: console.error('Failed to log segmentation analysis:', error);
    }
  } catch (error) {
    // Error logged: console.error('Error logging segmentation analysis:', error);
  }
}

/**
 * POST /api/ai/recommendations/segments
 * Perform comprehensive customer segmentation analysis
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
    const identifier = `recommendations-segments-${userId}`;
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
    const params = SegmentAnalysisRequestSchema.parse(body);

    // Get tenant ID from headers or user context
    const tenantId = request.headers.get('x-tenant-id') || userId;

    // Initialize Supabase client
    const supabase = await createClient();

    // Fetch customer data for segmentation
    const customerData = await fetchCustomerSegmentationData(
      supabase,
      tenantId,
      params
    );

    if (customerData.length < params.segment_count * params.min_segment_size) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient customer data. Need at least ${params.segment_count * params.min_segment_size} customers for ${params.segment_count} segments, but found ${customerData.length}`,
          meta: {
            request_id: requestId,
            processing_time_ms: Date.now() - startTime,
            rate_limit_remaining: remaining
          }
        },
        { status: 400 }
      );
    }

    // Calculate data quality score
    const dataQualityScore = calculateDataQualityScore(customerData);

    // Initialize segmentation engine
    const segmentationEngine = new CustomerSegmentationEngine();

    // Perform segmentation analysis
    const segmentationAnalysis =
      await segmentationEngine.performSegmentationAnalysis(customerData, {
        segment_count: params.segment_count,
        min_segment_size: params.min_segment_size,
        include_rfm: params.include_rfm,
        stability_analysis: params.stability_analysis
      });

    // Log segmentation analysis for analytics
    await logSegmentationAnalysis(supabase, tenantId, segmentationAnalysis);

    const processingTime = Date.now() - startTime;

    const response: SegmentAnalysisResponse = {
      ok: true,
      data: segmentationAnalysis,
      meta: {
        request_id: requestId,
        processing_time_ms: processingTime,
        rate_limit_remaining: remaining,
        data_quality_score: dataQualityScore,
        last_updated: new Date().toISOString()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    // Error logged: console.error('Segment analysis error:', error);

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
        error.message.includes('No customer data')
      ) {
        statusCode = 404;
      } else if (error.message.includes('Insufficient')) {
        statusCode = 400;
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

/**
 * GET /api/ai/recommendations/segments
 * Get cached segmentation analysis or basic segment overview
 */
export async function GET(request: NextRequest) {
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
    const identifier = `segments-get-${userId}`;
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

    // Get tenant ID from headers or user context
    const tenantId = request.headers.get('x-tenant-id') || userId;

    // Initialize Supabase client
    const supabase = await createClient();

    // Try to get cached segmentation analysis from logs
    const { data: recentAnalysis, error } = await supabase
      .from('ml_prediction_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('prediction_type', 'customer_segmentation')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      // Error logged: console.error('Error fetching cached analysis:', error);
    }

    // If we have recent analysis (within last 7 days), provide summary
    let cachedAnalysis = null;
    if (recentAnalysis && recentAnalysis.length > 0) {
      const lastAnalysis = recentAnalysis[0];
      const lastAnalysisDate = new Date(lastAnalysis.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (lastAnalysisDate > weekAgo) {
        cachedAnalysis = {
          last_analysis_date: lastAnalysisDate.toISOString(),
          segment_count: lastAnalysis.prediction_result.segment_count,
          total_customers: lastAnalysis.input_data.total_customers,
          quality_score: lastAnalysis.confidence_score,
          model_version: lastAnalysis.model_version
        };
      }
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      data: {
        cached_analysis: cachedAnalysis,
        recommendations: cachedAnalysis
          ? [
              'Analysis is up to date',
              'Consider running new analysis if customer base changed significantly'
            ]
          : [
              'Run new segmentation analysis to get current insights',
              'Recommended frequency: monthly for active businesses'
            ]
      },
      meta: {
        request_id: requestId,
        processing_time_ms: processingTime,
        rate_limit_remaining: remaining
      }
    });
  } catch (error) {
    // Error logged: console.error('Get segments error:', error);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      },
      { status: 500 }
    );
  }
}
