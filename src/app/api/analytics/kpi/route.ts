import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';
import { KPISchema } from '@/types/customer360';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for server-side operations

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

// GET /api/analytics/kpi
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Parse query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30'; // days
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(period));

    // 3. Execute parallel queries for KPI metrics
    const [contactsTotal, contactsNew, bookingsData, engagementData] =
      await Promise.all([
        // Total contacts
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('tenant_id', authContext.tenantId),

        // New contacts in period
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('tenant_id', authContext.tenantId)
          .gte('created_at', dateFrom.toISOString()),

        // Bookings data (total and period)
        supabase
          .from('bookings')
          .select('amount, commission, created_at, booked_at')
          .eq('tenant_id', authContext.tenantId)
          .in('status', ['confirmed', 'completed']),

        // Engagement data from materialized view
        supabase
          .from('contact_engagement_metrics')
          .select('lead_score, email_opens, email_clicks, bookings_count')
          .eq('tenant_id', authContext.tenantId)
      ]);

    // 4. Process booking data
    const bookings = bookingsData.data || [];
    const bookingsInPeriod = bookings.filter(
      (booking) => new Date(booking.booked_at || booking.created_at) >= dateFrom

    const revenueTotal = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const revenue30d = bookingsInPeriod.reduce(
      (sum, b) => sum + (b.amount || 0),
      0

    // 5. Process engagement data
    const engagement = engagementData.data || [];
    const avgLeadScore =
      engagement.length > 0
        ? engagement.reduce((sum, e) => sum + e.lead_score, 0) /
          engagement.length
        : 0;

    // Hot leads (score >= 70)
    const hotLeads = engagement.filter((e) => e.lead_score >= 70).length;

    // Conversion rate (contacts with bookings)
    const contactsWithBookings = engagement.filter(
      (e) => e.bookings_count > 0
    ).length;
    const conversionRate =
      contactsTotal.count && contactsTotal.count > 0
        ? (contactsWithBookings / contactsTotal.count) * 100
        : 0;

    // 6. Build KPI response
    const kpiData = {
      contacts_total: contactsTotal.count || 0,
      contacts_new_30d: contactsNew.count || 0,
      revenue_30d: Math.round(revenue30d),
      revenue_total: Math.round(revenueTotal),
      bookings_30d: bookingsInPeriod.length,
      bookings_total: bookings.length,
      avg_lead_score: Math.round(avgLeadScore),
      hot_leads: hotLeads,
      conversion_rate: Math.round(conversionRate * 100) / 100
    };

    // 7. Validate response
    const validatedKPI = KPISchema.parse(kpiData);

    // 8. Return with caching headers
    return NextResponse.json(
      {
        ok: true,
        data: validatedKPI,
        meta: {
          period: parseInt(period),
          generated_at: new Date().toISOString(),
          tenant_id: authContext.tenantId
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache
          'X-Analytics-Version': '1.0.0'
        }
      }
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
    }

    // Handle other errors
    // Error logged: console.error('KPI analytics error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate KPI metrics'
      },
      { status: 500 }
  }
}

// GET /api/analytics/kpi/health - Health check
export async function POST() {
  return NextResponse.json({
    service: 'KPI Analytics API',
    version: '1.0.0',
    status: 'operational',
    metrics: [
      'contacts_total',
      'contacts_new_30d',
      'revenue_30d',
      'revenue_total',
      'bookings_30d',
      'bookings_total',
      'avg_lead_score',
      'hot_leads',
      'conversion_rate'
    ]
  });
}
