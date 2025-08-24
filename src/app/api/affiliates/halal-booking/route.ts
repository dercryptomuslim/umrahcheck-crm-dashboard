import { NextRequest, NextResponse } from 'next/server';

// HalalBooking Affiliate Configuration
const HALAL_BOOKING_CONFIG = {
  affiliate_id: process.env.HALALBOOKING_AFFILIATE_ID || 'umrahcheck_de',
  commission_rate: 0.05, // 5% commission rate
  base_url: 'https://halalbooking.com',
  tracking_param: 'ref',
  utm_source: 'umrahcheck',
  utm_medium: 'email',
  utm_campaign: 'hotel_deals'
};

interface HotelBookingRequest {
  hotel_name: string;
  city: 'Makkah' | 'Medina';
  check_in: string;
  check_out: string;
  adults: number;
  rooms?: number;
  campaign_id?: string;
  contact_email?: string;
}

interface AffiliateLink {
  hotel_name: string;
  city: string;
  affiliate_url: string;
  tracking_id: string;
  commission_rate: number;
  estimated_commission: number;
  base_price: number;
}

// Generate unique tracking ID for attribution
function generateTrackingId(
  contact_email?: string,
  campaign_id?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const email_hash = contact_email
    ? Buffer.from(contact_email).toString('base64').substr(0, 8)
    : 'anon';
  const campaign_suffix = campaign_id ? `_${campaign_id.substr(-8)}` : '';

  return `uc_${timestamp}_${email_hash}_${random}${campaign_suffix}`;
}

// Build HalalBooking affiliate URL with tracking
function buildAffiliateURL(
  hotel_name: string,
  city: string,
  searchParams: URLSearchParams,
  tracking_id: string
): string {
  const hotel_slug = hotel_name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  const city_path = city.toLowerCase() === 'makkah' ? 'makkah' : 'medina';

  // Build the affiliate URL with all tracking parameters
  const baseHotelUrl = `${HALAL_BOOKING_CONFIG.base_url}/hotels/${city_path}/${hotel_slug}`;

  const affiliateParams = new URLSearchParams({
    [HALAL_BOOKING_CONFIG.tracking_param]: HALAL_BOOKING_CONFIG.affiliate_id,
    utm_source: HALAL_BOOKING_CONFIG.utm_source,
    utm_medium: HALAL_BOOKING_CONFIG.utm_medium,
    utm_campaign: HALAL_BOOKING_CONFIG.utm_campaign,
    tracking_id: tracking_id,
    checkin: searchParams.get('check_in') || '',
    checkout: searchParams.get('check_out') || '',
    adults: searchParams.get('adults') || '2',
    rooms: searchParams.get('rooms') || '1'
  });

  return `${baseHotelUrl}?${affiliateParams.toString()}`;
}

// Calculate estimated commission based on price and nights
function calculateEstimatedCommission(
  base_price: number,
  nights: number,
  rooms: number = 1
): number {
  const total_booking_value = base_price * nights * rooms;
  return (
    Math.round(
      total_booking_value * HALAL_BOOKING_CONFIG.commission_rate * 100
    ) / 100
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: HotelBookingRequest = await request.json();
    const {
      hotel_name,
      city,
      check_in,
      check_out,
      adults,
      rooms = 1,
      campaign_id,
      contact_email
    } = body;

    // Validation
    if (!hotel_name || !city || !check_in || !check_out || !adults) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: hotel_name, city, check_in, check_out, adults'
        },
        { status: 400 }
      );
    }

    console.log(
      `🔗 Generating HalalBooking affiliate link for: ${hotel_name} in ${city}`
    );
    console.log(
      `📅 Dates: ${check_in} to ${check_out} | ${adults} adults, ${rooms} rooms`
    );

    // Generate unique tracking ID for this booking attempt
    const tracking_id = generateTrackingId(contact_email, campaign_id);

    // Calculate nights
    const checkin_date = new Date(check_in);
    const checkout_date = new Date(check_out);
    const nights = Math.ceil(
      (checkout_date.getTime() - checkin_date.getTime()) / (1000 * 3600 * 24)
    );

    // Mock pricing (in production, this would come from HalalBooking API or our database)
    const hotel_pricing = {
      'Swissôtel Makkah': { base_price: 299, tier: 'luxury' },
      'DoubleTree by Hilton Jabal Omar': { base_price: 179, tier: 'premium' },
      'Ajyad Makkah Makarim': { base_price: 89, tier: 'budget' },
      'The Oberoi Madina': { base_price: 249, tier: 'luxury' },
      'Pullman ZamZam Madina': { base_price: 149, tier: 'premium' },
      'Madinah Hilton': { base_price: 99, tier: 'budget' }
    };

    const hotel_info = hotel_pricing[hotel_name as keyof typeof hotel_pricing];
    const base_price = hotel_info?.base_price || 150; // Default price if not found

    // Build search parameters
    const searchParams = new URLSearchParams({
      check_in: check_in,
      check_out: check_out,
      adults: adults.toString(),
      rooms: rooms.toString()
    });

    // Generate affiliate URL
    const affiliate_url = buildAffiliateURL(
      hotel_name,
      city,
      searchParams,
      tracking_id
    );

    // Calculate estimated commission
    const estimated_commission = calculateEstimatedCommission(
      base_price,
      nights,
      rooms
    );

    const affiliateLink: AffiliateLink = {
      hotel_name,
      city,
      affiliate_url,
      tracking_id,
      commission_rate: HALAL_BOOKING_CONFIG.commission_rate,
      estimated_commission,
      base_price
    };

    const processing_time = Date.now() - startTime;

    console.log(`✅ Affiliate link generated: ${tracking_id}`);
    console.log(
      `💰 Estimated commission: €${estimated_commission} (${HALAL_BOOKING_CONFIG.commission_rate * 100}%)`
    );
    console.log(`🔗 URL: ${affiliate_url.substring(0, 100)}...`);

    // In production, save tracking data to database for commission tracking
    // await saveAffiliateTracking({ tracking_id, contact_email, campaign_id, hotel_name, estimated_commission });

    return NextResponse.json({
      success: true,
      affiliate_link: affiliateLink,
      booking_details: {
        hotel_name,
        city,
        check_in,
        check_out,
        nights,
        adults,
        rooms,
        total_booking_value: base_price * nights * rooms
      },
      commission_info: {
        rate_percentage: HALAL_BOOKING_CONFIG.commission_rate * 100,
        estimated_commission: estimated_commission,
        currency: 'EUR'
      },
      tracking: {
        tracking_id,
        affiliate_id: HALAL_BOOKING_CONFIG.affiliate_id,
        attribution: {
          campaign_id: campaign_id || null,
          contact_email: contact_email || null,
          utm_source: HALAL_BOOKING_CONFIG.utm_source
        }
      },
      processing_time_ms: processing_time,
      message: `Affiliate link generated for ${hotel_name} booking`
    });
  } catch (error: any) {
    console.error('❌ HalalBooking Affiliate API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during affiliate link generation',
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET method for affiliate configuration info
export async function GET() {
  return NextResponse.json({
    message: 'UmrahCheck HalalBooking Affiliate Integration',
    endpoint: 'POST /api/affiliates/halal-booking',
    version: '1.0.0',
    affiliate_config: {
      affiliate_id: HALAL_BOOKING_CONFIG.affiliate_id,
      commission_rate: `${HALAL_BOOKING_CONFIG.commission_rate * 100}%`,
      supported_cities: ['Makkah', 'Medina'],
      tracking_enabled: true,
      utm_tracking: {
        utm_source: HALAL_BOOKING_CONFIG.utm_source,
        utm_medium: HALAL_BOOKING_CONFIG.utm_medium,
        utm_campaign: HALAL_BOOKING_CONFIG.utm_campaign
      }
    },
    revenue_model: {
      commission_per_booking: '5%',
      estimated_monthly_bookings: '50-200',
      estimated_monthly_revenue: '€500-3000'
    },
    status: 'operational'
  });
}
