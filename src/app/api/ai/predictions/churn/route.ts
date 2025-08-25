/**
 * Churn Prediction API Route
 * Phase 3.3: Predictive Analytics
 *
 * Endpoint for ML-based customer churn risk prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ratelimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { churnPredictor } from '@/lib/ml/churn-prediction';
import type { CustomerBehavior } from '@/lib/ml/churn-prediction';
import { z } from 'zod';

// Request validation schema
const ChurnPredictionRequestSchema = z.object({
  customer_ids: z.array(z.string().uuid()).optional(),
  risk_threshold: z.number().min(0).max(1).optional().default(0.5),
  min_confidence: z.number().min(0).max(1).optional().default(0.6),
  max_results: z.number().min(1).max(1000).optional().default(100),
  prioritize_high_value: z.boolean().optional().default(true),
  include_insights: z.boolean().optional().default(true),
  segment_filter: z
    .enum(['all', 'high_value', 'at_risk', 'dormant'])
    .optional()
    .default('all')
});

type ChurnPredictionRequest = z.infer<typeof ChurnPredictionRequestSchema>;

export async function POST(request: NextRequest) {
  try {
    // Authentication and rate limiting
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting (20 requests per hour for churn prediction)
    const identifier = userId;
    const { success, limit, reset, remaining } =
      await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Rate limit exceeded. Please try again later.',
          meta: { limit, reset, remaining }
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ChurnPredictionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid request parameters',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Get tenant ID from user metadata
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json(
        { ok: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const tenantId = profile.tenant_id;

    // Fetch customer behavior data
    const startTime = Date.now();

    const customerBehaviors = await fetchCustomerBehaviorData(
      supabase,
      tenantId,
      params.customer_ids,
      params.segment_filter
    );

    if (customerBehaviors.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No customer data found for analysis',
          meta: { tenant_id: tenantId }
        },
        { status: 404 }
      );
    }

    // Generate churn predictions
    const predictions = await churnPredictor.batchPredictChurn(
      customerBehaviors,
      {
        prioritize_high_value: params.prioritize_high_value,
        min_confidence: params.min_confidence,
        max_results: params.max_results
      }
    );

    // Filter by risk threshold
    const filteredPredictions = predictions.filter(
      (p) => p.churn_probability >= params.risk_threshold
    );

    // Generate insights if requested
    let insights = null;
    if (params.include_insights) {
      insights = await churnPredictor.generateChurnInsights(customerBehaviors);
    }

    const processingTime = Date.now() - startTime;

    // Prepare response data
    const responseData = {
      predictions: filteredPredictions.map((p) => ({
        customer_id: p.customer_id,
        churn_probability: p.churn_probability,
        risk_level: p.risk_level,
        confidence: p.confidence,
        primary_risk_factors: p.primary_risk_factors,
        recommended_actions: p.recommended_actions,
        retention_score: p.retention_score,
        predicted_ltv_remaining: p.predicted_ltv_remaining,
        time_to_churn_days: p.time_to_churn_days
      })),
      summary: {
        total_customers_analyzed: customerBehaviors.length,
        at_risk_customers: filteredPredictions.length,
        high_risk_customers: filteredPredictions.filter(
          (p) => p.risk_level === 'high' || p.risk_level === 'critical'
        ).length,
        total_ltv_at_risk: filteredPredictions.reduce(
          (sum, p) => sum + p.predicted_ltv_remaining,
          0
        ),
        avg_confidence:
          filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) /
          Math.max(1, filteredPredictions.length)
      },
      insights,
      model_info: {
        version: '1.0.0',
        last_trained: new Date('2024-01-01').toISOString(), // Would be dynamic in production
        feature_count: 15,
        prediction_accuracy: 'medium', // Would be calculated from validation data
        processing_time_ms: processingTime
      },
      generated_at: new Date().toISOString()
    };

    // Log the prediction request
    await logChurnPredictionRequest(supabase, {
      tenant_id: tenantId,
      user_id: userId,
      customers_analyzed: customerBehaviors.length,
      at_risk_found: filteredPredictions.length,
      parameters: params,
      processing_time_ms: processingTime
    });

    return NextResponse.json({
      ok: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        user_id: userId,
        tenant_id: tenantId,
        rate_limit: { remaining, reset: new Date(reset).toISOString() }
      }
    });
  } catch (error) {
    console.error('Churn prediction API error:', error);

    const errorId = `churn-pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error during churn prediction',
        error_id: errorId,
        meta: { timestamp: new Date().toISOString() }
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch customer behavior data for churn analysis
 */
async function fetchCustomerBehaviorData(
  supabase: any,
  tenantId: string,
  customerIds?: string[],
  segmentFilter: string = 'all'
): Promise<CustomerBehavior[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Base query for contacts with behavioral data
  let contactQuery = supabase
    .from('contacts')
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      created_at,
      last_login_at,
      newsletter_subscribed,
      profile_completion_score,
      total_bookings:bookings(count),
      total_spent:bookings(total_amount.sum()),
      avg_booking_value:bookings(total_amount.avg()),
      recent_bookings:bookings!inner(
        id,
        created_at,
        total_amount,
        status
      ),
      email_stats:email_interactions(
        opens_count.sum(),
        clicks_count.sum(),
        sends_count.sum()
      ),
      support_tickets:support_tickets(count),
      website_visits:website_sessions(
        id,
        created_at
      )
    `
    )
    .eq('tenant_id', tenantId);

  // Apply customer ID filter if provided
  if (customerIds && customerIds.length > 0) {
    contactQuery = contactQuery.in('id', customerIds);
  }

  // Apply segment filters
  switch (segmentFilter) {
    case 'high_value':
      // Customers with high lifetime value
      contactQuery = contactQuery.gte('bookings.total_amount.sum()', 2000);
      break;
    case 'at_risk':
      // Customers who haven't booked recently but were active before
      contactQuery = contactQuery
        .lt('bookings.created_at.max()', thirtyDaysAgo.toISOString())
        .gte('bookings.count()', 1);
      break;
    case 'dormant':
      // Customers inactive for 90+ days
      contactQuery = contactQuery.or(
        `last_login_at.lt.${ninetyDaysAgo.toISOString()},last_login_at.is.null`
      );
      break;
  }

  const { data: contacts, error } = await contactQuery.limit(500); // Reasonable batch size

  if (error) {
    throw new Error(`Failed to fetch customer data: ${error.message}`);
  }

  // Transform data into CustomerBehavior format
  const behaviorData: CustomerBehavior[] = [];

  for (const contact of contacts) {
    // Calculate booking frequency
    const bookings = contact.recent_bookings || [];
    const sortedBookings = bookings.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const lastBookingDate =
      sortedBookings.length > 0 ? new Date(sortedBookings[0].created_at) : null;
    const lastBookingDaysAgo = lastBookingDate
      ? Math.floor(
          (Date.now() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    // Calculate booking frequency (average days between bookings)
    let bookingFrequencyDays = 365; // Default for new customers
    if (bookings.length > 1) {
      const intervals = [];
      for (let i = 1; i < bookings.length; i++) {
        const interval =
          new Date(bookings[i - 1].created_at).getTime() -
          new Date(bookings[i].created_at).getTime();
        intervals.push(interval / (1000 * 60 * 60 * 24));
      }
      bookingFrequencyDays =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Calculate email engagement
    const emailStats = contact.email_stats?.[0] || {
      opens_count: 0,
      clicks_count: 0,
      sends_count: 1
    };
    const emailOpenRate =
      emailStats.sends_count > 0
        ? emailStats.opens_count / emailStats.sends_count
        : 0;
    const emailClickRate =
      emailStats.sends_count > 0
        ? emailStats.clicks_count / emailStats.sends_count
        : 0;

    // Calculate website visits in last 30 days
    const recentWebsiteVisits = (contact.website_visits || []).filter(
      (visit: any) => new Date(visit.created_at) >= thirtyDaysAgo
    ).length;

    // Calculate days since last login
    const lastLoginDaysAgo = contact.last_login_at
      ? Math.floor(
          (Date.now() - new Date(contact.last_login_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 999;

    // Calculate account age
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(contact.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Count refunds and payment delays (would need additional data in production)
    const refundRequests = bookings.filter(
      (b: any) => b.status === 'refunded'
    ).length;

    const behavior: CustomerBehavior = {
      customer_id: contact.id,
      total_bookings: contact.total_bookings?.[0]?.count || 0,
      total_spent: contact.total_spent?.[0]?.sum || 0,
      avg_booking_value: contact.avg_booking_value?.[0]?.avg || 0,
      last_booking_days_ago: lastBookingDaysAgo,
      booking_frequency_days: Math.round(bookingFrequencyDays),
      email_open_rate: Math.min(1, emailOpenRate),
      email_click_rate: Math.min(1, emailClickRate),
      website_visits_last_30d: recentWebsiteVisits,
      support_tickets_count: contact.support_tickets?.[0]?.count || 0,
      refund_requests: refundRequests,
      preferred_destination_changes: 0, // Would calculate from booking history
      payment_delays: 0, // Would calculate from payment history
      mobile_app_usage: 0.5, // Would integrate with app analytics
      newsletter_subscribed: contact.newsletter_subscribed || false,
      referral_count: 0, // Would calculate from referral data
      account_age_days: accountAgeDays,
      last_login_days_ago: lastLoginDaysAgo,
      profile_completion: contact.profile_completion_score || 0.5
    };

    behaviorData.push(behavior);
  }

  return behaviorData;
}

/**
 * Log churn prediction request for analytics
 */
async function logChurnPredictionRequest(
  supabase: any,
  logData: {
    tenant_id: string;
    user_id: string;
    customers_analyzed: number;
    at_risk_found: number;
    parameters: any;
    processing_time_ms: number;
  }
): Promise<void> {
  try {
    await supabase.from('ml_prediction_logs').insert({
      ...logData,
      prediction_type: 'churn_risk',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to log churn prediction request:', error);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Method not allowed. Use POST to generate churn predictions.'
    },
    { status: 405 }
  );
}
