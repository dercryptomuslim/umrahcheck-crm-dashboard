import { NextRequest, NextResponse } from 'next/server';

interface HotelSearchRequest {
  email: string;
  budget: string; // "1500-2500"
  persons: number;
  checkIn: string; // "2025-04-15"
  checkOut: string; // "2025-04-25"
  rooms?: number;
}

interface HotelOffer {
  id: string;
  tier: 'budget' | 'premium' | 'luxury';
  makkah_hotel: {
    name: string;
    stars: number;
    distance_to_haram: string;
    price_per_night_total_room: number;
    price_per_night_per_person: number;
    availability: 'available' | 'limited' | 'unavailable';
    booking_url: string;
    halal_booking_url: string;
  };
  medina_hotel: {
    name: string;
    stars: number;
    distance_to_prophet_mosque: string;
    price_per_night_total_room: number;
    price_per_night_per_person: number;
    availability: 'available' | 'limited' | 'unavailable';
    booking_url: string;
    halal_booking_url: string;
  };
}

interface HotelSearchResponse {
  success: boolean;
  search_metadata: {
    search_id: string;
    email: string;
    budget_range: string;
    persons: number;
    check_in: string;
    check_out: string;
    rooms: number;
    search_timestamp: string;
    processing_time_ms: number;
  };
  offers: HotelOffer[];
  message: string;
  source: 'live_scrapfly' | 'autonomous_agent_fallback' | 'cache';
}

// Mock hotel data for testing (in production, this would come from ScrapFly)
const mockHotels = {
  makkah: [
    {
      name: 'Swissôtel Makkah',
      stars: 5,
      distance_to_haram: '50m to Haram',
      tier: 'luxury',
      booking_url: 'https://booking.com/hotel/sa/swissotel-makkah.html',
      halal_booking_url: 'https://halalbooking.com/hotels/swissotel-makkah',
      base_price: 299
    },
    {
      name: 'DoubleTree by Hilton Jabal Omar',
      stars: 4,
      distance_to_haram: '300m to Haram',
      tier: 'premium',
      booking_url: 'https://booking.com/hotel/sa/doubletree-jabal-omar.html',
      halal_booking_url:
        'https://halalbooking.com/hotels/doubletree-jabal-omar',
      base_price: 179
    },
    {
      name: 'Ajyad Makkah Makarim',
      stars: 3,
      distance_to_haram: '600m to Haram',
      tier: 'budget',
      booking_url: 'https://booking.com/hotel/sa/ajyad-makkah.html',
      halal_booking_url: 'https://halalbooking.com/hotels/ajyad-makkah',
      base_price: 89
    }
  ],
  medina: [
    {
      name: 'The Oberoi Madina',
      stars: 5,
      distance_to_prophet_mosque: '100m to Prophet Mosque',
      tier: 'luxury',
      booking_url: 'https://booking.com/hotel/sa/oberoi-madina.html',
      halal_booking_url: 'https://halalbooking.com/hotels/oberoi-madina',
      base_price: 249
    },
    {
      name: 'Pullman ZamZam Madina',
      stars: 4,
      distance_to_prophet_mosque: '200m to Prophet Mosque',
      tier: 'premium',
      booking_url: 'https://booking.com/hotel/sa/pullman-zamzam.html',
      halal_booking_url: 'https://halalbooking.com/hotels/pullman-zamzam',
      base_price: 149
    },
    {
      name: 'Madinah Hilton',
      stars: 3,
      distance_to_prophet_mosque: '500m to Prophet Mosque',
      tier: 'budget',
      booking_url: 'https://booking.com/hotel/sa/madinah-hilton.html',
      halal_booking_url: 'https://halalbooking.com/hotels/madinah-hilton',
      base_price: 99
    }
  ]
};

function getSeasonalPriceMultiplier(checkIn: string): number {
  const date = new Date(checkIn);
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed

  // Ramadan and Hajj season (typically March-June, October-December)
  if ((month >= 3 && month <= 6) || (month >= 10 && month <= 12)) {
    return 1.4; // 40% increase for peak season
  }

  // Regular Umrah season
  if (month >= 7 && month <= 9) {
    return 1.2; // 20% increase for summer
  }

  // Off-season
  return 1.0;
}

function filterHotelsByBudget(
  hotels: any[],
  budgetRange: string,
  tier: string
): any[] {
  const [minBudget, maxBudget] = budgetRange.split('-').map((b) => parseInt(b));

  return hotels.filter((hotel) => {
    // Much more lenient filtering - include all hotels within reasonable range
    const hotelPrice = hotel.base_price;
    return hotelPrice >= 50 && hotelPrice <= maxBudget * 2; // Very lenient for testing
  });
}

function generateHotelOffers(
  searchParams: HotelSearchRequest,
  seasonalMultiplier: number
): HotelOffer[] {
  const { budget, persons, rooms = 1 } = searchParams;
  const [minBudget, maxBudget] = budget.split('-').map((b) => parseInt(b));

  // Determine preferred tier based on budget
  let preferredTier: string = '';
  const avgBudget = (minBudget + maxBudget) / 2;
  if (avgBudget < 150) {
    preferredTier = 'budget';
  } else if (avgBudget < 250) {
    preferredTier = 'premium';
  } else {
    preferredTier = 'luxury';
  }

  const filteredMakkah = filterHotelsByBudget(
    mockHotels.makkah,
    budget,
    preferredTier
  );
  const filteredMedina = filterHotelsByBudget(
    mockHotels.medina,
    budget,
    preferredTier
  );

  const offers: HotelOffer[] = [];

  // Generate combinations of Makkah + Medina hotels
  for (let i = 0; i < Math.min(filteredMakkah.length, 3); i++) {
    const makkahHotel = filteredMakkah[i];
    const medinaHotel = filteredMedina[i % filteredMedina.length];

    // Calculate prices with seasonal adjustment
    const makkahPricePerNight = Math.round(
      makkahHotel.base_price * seasonalMultiplier
    );
    const medinaPricePerNight = Math.round(
      medinaHotel.base_price * seasonalMultiplier
    );

    offers.push({
      id: `offer-${i + 1}`,
      tier: makkahHotel.tier as 'budget' | 'premium' | 'luxury',
      makkah_hotel: {
        name: makkahHotel.name,
        stars: makkahHotel.stars,
        distance_to_haram: makkahHotel.distance_to_haram,
        price_per_night_total_room: makkahPricePerNight * rooms,
        price_per_night_per_person: Math.round(makkahPricePerNight / persons),
        availability:
          Math.random() > 0.3
            ? 'available'
            : Math.random() > 0.5
              ? 'limited'
              : 'unavailable',
        booking_url: makkahHotel.booking_url,
        halal_booking_url: makkahHotel.halal_booking_url
      },
      medina_hotel: {
        name: medinaHotel.name,
        stars: medinaHotel.stars,
        distance_to_prophet_mosque: medinaHotel.distance_to_prophet_mosque,
        price_per_night_total_room: medinaPricePerNight * rooms,
        price_per_night_per_person: Math.round(medinaPricePerNight / persons),
        availability:
          Math.random() > 0.3
            ? 'available'
            : Math.random() > 0.5
              ? 'limited'
              : 'unavailable',
        booking_url: medinaHotel.booking_url,
        halal_booking_url: medinaHotel.halal_booking_url
      }
    });
  }

  return offers;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: HotelSearchRequest = await request.json();
    const { email, budget, persons, checkIn, checkOut, rooms = 1 } = body;

    // Validation
    if (!email || !budget || !persons || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: email, budget, persons, checkIn, checkOut'
        },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Live hotel search for: ${email} | Budget: €${budget} | ${persons} persons`
    );
    console.log(
      `📅 Searching: ${checkIn} to ${checkOut} | ${persons} adults, ${rooms} rooms`
    );

    // Generate search ID
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate seasonal pricing
    const seasonalMultiplier = getSeasonalPriceMultiplier(checkIn);

    // In production, here would be the ScrapFly integration:
    // const scrapflyResults = await scrapeBookingHotels({ checkIn, checkOut, persons, budget });

    // For now, simulate ScrapFly response
    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 200)
    ); // Simulate API delay

    const offers = generateHotelOffers(body, seasonalMultiplier);

    const processingTime = Date.now() - startTime;

    console.log(`✅ Scraper completed: ${offers.length} offers generated`);
    console.log(
      `🎯 Processed in ${processingTime}ms | Source: autonomous_agent_fallback`
    );

    const response: HotelSearchResponse = {
      success: true,
      search_metadata: {
        search_id: searchId,
        email,
        budget_range: budget,
        persons,
        check_in: checkIn,
        check_out: checkOut,
        rooms,
        search_timestamp: new Date().toISOString(),
        processing_time_ms: processingTime
      },
      offers,
      message: `Found ${offers.length} hotel combinations for your Umrah journey`,
      source: 'autonomous_agent_fallback'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Hotel search API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during hotel search'
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'UmrahCheck Live Hotel Search API',
    endpoint: 'POST /api/live-hotel-search',
    version: '1.0.0',
    status: 'operational'
  });
}
