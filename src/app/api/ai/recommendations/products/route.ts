import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import {
  SmartRecommendationsEngine,
  CustomerProfileSchema,
  type ProductRecommendation
} from '@/lib/ml/recommendations-engine';
import { ratelimit } from '@/lib/rate-limit';

// Request validation schema
const ProductRecommendationsRequestSchema = z.object({
  customer_id: z.string().uuid().optional(),
  max_recommendations: z.number().min(1).max(20).default(10),
  min_confidence: z.number().min(0).max(1).default(0.3),
  include_cross_sell: z.boolean().default(true),
  include_up_sell: z.boolean().default(true),
  exclude_recent: z.boolean().default(true),
  focus_categories: z.array(z.string()).optional(),
  budget_range: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional()
    })
    .optional()
});

type ProductRecommendationsRequest = z.infer<
  typeof ProductRecommendationsRequestSchema
>;

// Response schema
interface ProductRecommendationsResponse {
  ok: boolean;
  data?: {
    recommendations: ProductRecommendation[];
    customer_segment: string;
    personalization_factors: string[];
    summary: {
      total_recommendations: number;
      high_priority_count: number;
      expected_total_revenue: number;
      avg_confidence_score: number;
      cross_sell_opportunities: number;
      up_sell_opportunities: number;
    };
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
    cache_status: 'hit' | 'miss';
  };
}

// Fetch customer profile data
async function fetchCustomerProfile(
  supabase: any,
  tenantId: string,
  customerId?: string
) {
  try {
    let query = supabase.from('customers').select(`
        *,
        bookings (*),
        customer_interactions (*)
      `);

    if (customerId) {
      query = query.eq('id', customerId);
    } else {
      // If no specific customer, get a sample for general recommendations
      query = query.limit(1);
    }

    const { data: customers, error } = await query;

    if (error) throw error;
    if (!customers || customers.length === 0) {
      throw new Error('No customer data found');
    }

    const customer = customers[0];

    // Transform to CustomerProfile format
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

    // Validate the profile
    return CustomerProfileSchema.parse(profile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    throw new Error('Failed to fetch customer profile data');
  }
}

// Fetch available products
async function fetchAvailableProducts(
  supabase: any,
  tenantId: string,
  filters?: any
) {
  try {
    let query = supabase.from('packages').select('*').eq('status', 'active');

    // Apply filters if provided
    if (filters?.budget_range) {
      if (filters.budget_range.min) {
        query = query.gte('price', filters.budget_range.min);
      }
      if (filters.budget_range.max) {
        query = query.lte('price', filters.budget_range.max);
      }
    }

    if (filters?.focus_categories) {
      query = query.in('category', filters.focus_categories);
    }

    const { data: products, error } = await query.limit(100);

    if (error) throw error;

    return (
      products?.map((product: any) => ({
        id: product.id,
        name: product.name,
        type: product.type || 'package',
        destination: product.destination,
        price: product.price,
        package_type: product.package_type || 'standard',
        travel_style: product.travel_style || 'solo',
        price_category: product.price_category || 'mid-range',
        features: product.features || []
      })) || []
    );
  } catch (error) {
    console.error('Error fetching available products:', error);
    throw new Error('Failed to fetch available products');
  }
}

// Log prediction for analytics
async function logPrediction(
  supabase: any,
  tenantId: string,
  customerId: string,
  recommendations: ProductRecommendation[]
) {
  try {
    const logData = {
      tenant_id: tenantId,
      prediction_type: 'product_recommendations',
      input_data: { customer_id: customerId },
      prediction_result: {
        recommendation_count: recommendations.length,
        avg_confidence:
          recommendations.reduce((sum, r) => sum + r.confidence_score, 0) /
          recommendations.length,
        high_priority_count: recommendations.filter((r) =>
          ['high', 'urgent'].includes(r.priority)
        ).length
      },
      model_version: 'recommendations-engine-v1.0',
      model_accuracy:
        recommendations.length > 0 && recommendations[0].confidence_score > 0.7
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
      console.error('Failed to log prediction:', error);
    }
  } catch (error) {
    console.error('Error logging prediction:', error);
  }
}

/**
 * POST /api/ai/recommendations/products
 * Generate personalized product recommendations for a customer
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
    const identifier = `recommendations-products-${userId}`;
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
    const params = ProductRecommendationsRequestSchema.parse(body);

    // Get tenant ID from headers or user context
    const tenantId = request.headers.get('x-tenant-id') || userId;

    // Initialize Supabase client
    const supabase = await createClient();

    // Fetch customer profile
    const customerProfile = await fetchCustomerProfile(
      supabase,
      tenantId,
      params.customer_id
    );

    // Fetch available products with filters
    const availableProducts = await fetchAvailableProducts(supabase, tenantId, {
      budget_range: params.budget_range,
      focus_categories: params.focus_categories
    });

    if (availableProducts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No products available for recommendations',
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

    // Generate product recommendations
    const recommendations =
      await recommendationsEngine.generateProductRecommendations(
        customerProfile,
        availableProducts,
        {
          max_recommendations: params.max_recommendations,
          min_confidence: params.min_confidence,
          include_cross_sell: params.include_cross_sell,
          include_up_sell: params.include_up_sell,
          exclude_recent: params.exclude_recent
        }
      );

    // Determine customer segment (simplified)
    const customerSegment = determineCustomerSegment(customerProfile);

    // Calculate summary metrics
    const summary = {
      total_recommendations: recommendations.length,
      high_priority_count: recommendations.filter((r) =>
        ['high', 'urgent'].includes(r.priority)
      ).length,
      expected_total_revenue: recommendations.reduce(
        (sum, r) => sum + r.expected_revenue,
        0
      ),
      avg_confidence_score:
        recommendations.length > 0
          ? recommendations.reduce((sum, r) => sum + r.confidence_score, 0) /
            recommendations.length
          : 0,
      cross_sell_opportunities: recommendations.filter(
        (r) => r.cross_sell_potential > 0.5
      ).length,
      up_sell_opportunities: recommendations.filter(
        (r) => r.up_sell_potential > 0.5
      ).length
    };

    // Extract personalization factors
    const personalizationFactors = Array.from(
      new Set(recommendations.flatMap((r) => r.personalization_factors))
    );

    // Log prediction for analytics
    await logPrediction(
      supabase,
      tenantId,
      customerProfile.customer_id,
      recommendations
    );

    const processingTime = Date.now() - startTime;

    const response: ProductRecommendationsResponse = {
      ok: true,
      data: {
        recommendations,
        customer_segment: customerSegment,
        personalization_factors,
        summary,
        model_info: {
          algorithm: 'collaborative-filtering-content-based-hybrid',
          version: 'v1.0.0',
          confidence_threshold: params.min_confidence,
          last_trained: '2024-01-01T00:00:00Z'
        }
      },
      meta: {
        request_id: requestId,
        processing_time_ms: processingTime,
        rate_limit_remaining: remaining,
        cache_status: 'miss' // Could implement caching in the future
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Product recommendations error:', error);

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

// Helper function to determine customer segment
function determineCustomerSegment(profile: any): string {
  if (profile.total_spent > 10000 && profile.booking_frequency_days < 90) {
    return 'High-Value Frequent Travelers';
  }
  if (profile.loyalty_tier === 'platinum' || profile.loyalty_tier === 'gold') {
    return 'Premium Customers';
  }
  if (profile.travel_style === 'family') {
    return 'Family Travelers';
  }
  if (profile.budget_range === 'luxury') {
    return 'Luxury Seekers';
  }
  if (profile.avg_booking_value < 1000) {
    return 'Budget-Conscious Travelers';
  }
  return 'Standard Customers';
}
