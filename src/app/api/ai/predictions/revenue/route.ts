/**
 * Revenue Prediction API Route
 * Phase 3.3: Predictive Analytics
 *
 * Endpoint for ML-based revenue forecasting
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ratelimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { revenueForecaster } from '@/lib/ml/revenue-forecasting';
import type { RevenueDataPoint } from '@/lib/ml/revenue-forecasting';
import { z } from 'zod';

// Request validation schema
const RevenuePredictionRequestSchema = z.object({
  timeframe_days: z.number().min(1).max(365).optional().default(30),
  forecast_days: z.number().min(1).max(90).optional().default(30),
  confidence_level: z.number().min(0.8).max(0.99).optional().default(0.95),
  include_breakdown: z.boolean().optional().default(false),
  currency: z.enum(['EUR', 'USD', 'GBP']).optional().default('EUR')
});

type RevenuePredictionRequest = z.infer<typeof RevenuePredictionRequestSchema>;

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

    // Rate limiting (30 requests per hour)
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
    const validationResult = RevenuePredictionRequestSchema.safeParse(body);

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

    // Fetch historical revenue data
    const historicalData = await fetchHistoricalRevenueData(
      supabase,
      tenantId,
      params.timeframe_days,
      params.currency
    );

    if (historicalData.length < 14) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Insufficient historical data. Need at least 14 days of booking data.',
          meta: { days_available: historicalData.length }
        },
        { status: 400 }
      );
    }

    // Generate revenue forecast
    const startTime = Date.now();

    const { forecasts, metrics, seasonality } =
      await revenueForecaster.generateForecast(
        historicalData,
        params.forecast_days,
        params.confidence_level
      );

    // Generate forecast summary
    const summary = await revenueForecaster.getForecastSummary(
      historicalData,
      params.forecast_days
    );

    const processingTime = Date.now() - startTime;

    // Prepare response data
    const responseData = {
      forecast_summary: summary,
      forecasts: forecasts.map((f) => ({
        date: f.date.toISOString(),
        predicted_amount: f.predicted_amount,
        confidence_lower: f.confidence_lower,
        confidence_upper: f.confidence_upper,
        confidence_level: f.confidence_level,
        trend_direction: f.trend_direction,
        seasonality_factor: Math.round(f.seasonality_factor * 1000) / 1000
      })),
      model_metrics: {
        ...metrics,
        forecast_period_days: params.forecast_days,
        confidence_level: params.confidence_level
      },
      seasonality_patterns: params.include_breakdown ? seasonality : undefined,
      historical_data_points: historicalData.length,
      currency: params.currency,
      generated_at: new Date().toISOString(),
      processing_time_ms: processingTime
    };

    // Log the prediction request for analytics
    await logPredictionRequest(supabase, {
      tenant_id: tenantId,
      user_id: userId,
      prediction_type: 'revenue_forecast',
      parameters: params,
      forecast_period: params.forecast_days,
      data_points_used: historicalData.length,
      model_accuracy: metrics.forecast_accuracy,
      confidence_score: metrics.confidence,
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
    console.error('Revenue prediction API error:', error);

    // Log error for monitoring
    const errorId = `rev-pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error during revenue prediction',
        error_id: errorId,
        meta: { timestamp: new Date().toISOString() }
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch historical revenue data for forecasting
 */
async function fetchHistoricalRevenueData(
  supabase: any,
  tenantId: string,
  timeframeDays: number,
  currency: string
): Promise<RevenueDataPoint[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      created_at,
      total_amount,
      currency,
      status,
      contacts!inner(tenant_id)
    `
    )
    .eq('contacts.tenant_id', tenantId)
    .eq('currency', currency)
    .neq('status', 'cancelled')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch historical data: ${error.message}`);
  }

  // Group bookings by date and aggregate
  const dailyRevenue = new Map<
    string,
    { total: number; count: number; amounts: number[] }
  >();

  data.forEach((booking: any) => {
    const date = new Date(booking.created_at).toDateString();

    if (!dailyRevenue.has(date)) {
      dailyRevenue.set(date, { total: 0, count: 0, amounts: [] });
    }

    const dayData = dailyRevenue.get(date)!;
    dayData.total += booking.total_amount;
    dayData.count += 1;
    dayData.amounts.push(booking.total_amount);
  });

  // Convert to RevenueDataPoint array
  const revenueData: RevenueDataPoint[] = [];

  for (const [dateString, data] of Array.from(dailyRevenue.entries())) {
    const averageOrderValue = data.total / data.count;

    revenueData.push({
      date: new Date(dateString),
      amount: data.total,
      booking_count: data.count,
      average_order_value: averageOrderValue,
      currency
    });
  }

  // Fill gaps with zero revenue days (important for time series analysis)
  const filledData: RevenueDataPoint[] = [];
  const startDate = new Date(cutoffDate);
  const endDate = new Date();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toDateString();
    const existingData = revenueData.find(
      (rd) => rd.date.toDateString() === dateString
    );

    if (existingData) {
      filledData.push(existingData);
    } else {
      // Add zero-revenue day
      filledData.push({
        date: new Date(d),
        amount: 0,
        booking_count: 0,
        average_order_value: 0,
        currency
      });
    }
  }

  return filledData.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Log prediction request for analytics and model improvement
 */
async function logPredictionRequest(
  supabase: any,
  logData: {
    tenant_id: string;
    user_id: string;
    prediction_type: string;
    parameters: any;
    forecast_period: number;
    data_points_used: number;
    model_accuracy: string;
    confidence_score: number;
    processing_time_ms: number;
  }
): Promise<void> {
  try {
    await supabase.from('ml_prediction_logs').insert({
      ...logData,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    // Don't fail the main request if logging fails
    console.warn('Failed to log prediction request:', error);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Method not allowed. Use POST to generate revenue predictions.'
    },
    { status: 405 }
  );
}
