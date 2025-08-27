import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!

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

// Helper to get date ranges
function getDateRanges() {
  const now = new Date();

  // Daily: Last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Weekly: Last 12 weeks
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);

  // Monthly: Last 12 months
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return {
    daily: thirtyDaysAgo,
    weekly: twelveWeeksAgo,
    monthly: twelveMonthsAgo
  };
}

// Format date to string for grouping
function formatDateForPeriod(
  date: Date,
  period: 'daily' | 'weekly' | 'monthly'
): string {
  switch (period) {
    case 'daily':
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'weekly':
      // Get Monday of the week
      const monday = new Date(date);
      const dayOfWeek = monday.getDay() || 7; // Make Sunday = 7
      monday.setDate(monday.getDate() - dayOfWeek + 1);
      return monday.toISOString().split('T')[0];
    case 'monthly':
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
    default:
      return date.toISOString().split('T')[0];
  }
}

// GET /api/analytics/revenue
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authContext = await getAuthContext();

    // 2. Get date ranges
    const dateRanges = getDateRanges();

    // 3. Fetch all bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('amount, commission, booked_at, created_at')
      .eq('tenant_id', authContext.tenantId)
      .in('status', ['confirmed', 'completed'])
      .order('booked_at', { ascending: true });

    if (error) {
      // Error logged: console.error('Revenue fetch error:', error);
      throw new Error('Failed to fetch revenue data');
    }

    // 4. Process data for each period
    const processDataForPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
      const cutoffDate = dateRanges[period];
      const filteredBookings = (bookings || []).filter(
        (booking) =>
          new Date(booking.booked_at || booking.created_at) >= cutoffDate

      // Group by period
      const grouped = filteredBookings.reduce(
        (acc, booking) => {
          const bookingDate = new Date(booking.booked_at || booking.created_at);
          const periodKey = formatDateForPeriod(bookingDate, period);

          if (!acc[periodKey]) {
            acc[periodKey] = {
              period: periodKey,
              revenue: 0,
              bookings: 0,
              commission: 0
            };
          }

          acc[periodKey].revenue += booking.amount || 0;
          acc[periodKey].commission += booking.commission || 0;
          acc[periodKey].bookings += 1;

          return acc;
        },
        {} as Record<string, any>

      // Convert to array and sort
      return Object.values(grouped).sort((a: any, b: any) =>
        a.period.localeCompare(b.period)
    };

    // 5. Generate data for all periods
    const dailyData = processDataForPeriod('daily');
    const weeklyData = processDataForPeriod('weekly');
    const monthlyData = processDataForPeriod('monthly');

    // 6. Calculate totals
    const allBookings = bookings || [];
    const totals = {
      revenue: allBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
      bookings: allBookings.length,
      commission: allBookings.reduce((sum, b) => sum + (b.commission || 0), 0),
      avg_booking_value:
        allBookings.length > 0
          ? allBookings.reduce((sum, b) => sum + (b.amount || 0), 0) /
            allBookings.length
          : 0
    };

    // 7. Build response
    const responseData = {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      totals: {
        revenue: Math.round(totals.revenue),
        bookings: totals.bookings,
        commission: Math.round(totals.commission),
        avg_booking_value: Math.round(totals.avg_booking_value)
      }
    };

    // 8. Return with caching headers
    return NextResponse.json(
      {
        ok: true,
        data: responseData,
        meta: {
          generated_at: new Date().toISOString(),
          tenant_id: authContext.tenantId,
          date_ranges: {
            daily: dateRanges.daily.toISOString(),
            weekly: dateRanges.weekly.toISOString(),
            monthly: dateRanges.monthly.toISOString()
          }
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200', // 10min cache
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
    // Error logged: console.error('Revenue analytics error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to generate revenue analytics'
      },
      { status: 500 }
  }
}

// POST /api/analytics/revenue - Health check
export async function POST() {
  return NextResponse.json({
    service: 'Revenue Analytics API',
    version: '1.0.0',
    status: 'operational',
    periods: ['daily', 'weekly', 'monthly'],
    metrics: ['revenue', 'bookings', 'commission', 'avg_booking_value']
  });
}
