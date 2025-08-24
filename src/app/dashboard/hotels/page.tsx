'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconRefresh,
  IconBell,
  IconTrendingDown,
  IconTrendingUp,
  IconMapPin,
  IconStar,
  IconExternalLink
} from '@tabler/icons-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock live hotel data (would come from ScrapFly API)
const mockHotels = [
  {
    id: 1,
    name: 'Swissôtel Makkah',
    city: 'Makkah',
    stars: 5,
    currentPrice: 299,
    previousPrice: 349,
    priceChange: -50,
    distance: '50m to Haram',
    availability: 'available',
    lastUpdated: '5 minutes ago',
    source: 'booking.com',
    affiliateUrl: 'https://halalbooking.com/hotels/swissotel-makkah',
    tier: 'luxury'
  },
  {
    id: 2,
    name: 'DoubleTree by Hilton Jabal Omar',
    city: 'Makkah',
    stars: 4,
    currentPrice: 179,
    previousPrice: 199,
    priceChange: -20,
    distance: '300m to Haram',
    availability: 'limited',
    lastUpdated: '12 minutes ago',
    source: 'booking.com',
    affiliateUrl: 'https://halalbooking.com/hotels/doubletree-jabal-omar',
    tier: 'premium'
  },
  {
    id: 3,
    name: 'The Oberoi Madina',
    city: 'Medina',
    stars: 5,
    currentPrice: 249,
    previousPrice: 229,
    priceChange: 20,
    distance: '100m to Prophet Mosque',
    availability: 'available',
    lastUpdated: '8 minutes ago',
    source: 'booking.com',
    affiliateUrl: 'https://halalbooking.com/hotels/oberoi-madina',
    tier: 'luxury'
  },
  {
    id: 4,
    name: 'Pullman ZamZam Madina',
    city: 'Medina',
    stars: 4,
    currentPrice: 149,
    previousPrice: 169,
    priceChange: -20,
    distance: '200m to Prophet Mosque',
    availability: 'available',
    lastUpdated: '3 minutes ago',
    source: 'booking.com',
    affiliateUrl: 'https://halalbooking.com/hotels/pullman-zamzam',
    tier: 'premium'
  },
  {
    id: 5,
    name: 'Ajyad Makkah Makarim',
    city: 'Makkah',
    stars: 3,
    currentPrice: 89,
    previousPrice: 109,
    priceChange: -20,
    distance: '600m to Haram',
    availability: 'available',
    lastUpdated: '15 minutes ago',
    source: 'booking.com',
    affiliateUrl: 'https://halalbooking.com/hotels/ajyad-makkah',
    tier: 'budget'
  }
];

// Price history data for chart
const priceHistoryData = [
  { date: 'Mon', luxury: 320, premium: 190, budget: 95 },
  { date: 'Tue', luxury: 315, premium: 185, budget: 92 },
  { date: 'Wed', luxury: 310, premium: 180, budget: 90 },
  { date: 'Thu', luxury: 305, premium: 175, budget: 88 },
  { date: 'Fri', luxury: 299, premium: 179, budget: 89 },
  { date: 'Sat', luxury: 295, premium: 175, budget: 85 },
  { date: 'Sun', luxury: 290, premium: 170, budget: 82 }
];

export default function HotelsPage() {
  const [hotels, setHotels] = useState(mockHotels);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<number[]>([]);

  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch = hotel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const refreshPrices = async () => {
    setIsRefreshing(true);
    // Simulate API call to ScrapFly
    setTimeout(() => {
      setIsRefreshing(false);
      // Update last updated time
      setHotels(hotels.map((h) => ({ ...h, lastUpdated: 'just now' })));
    }, 2000);
  };

  const togglePriceAlert = (hotelId: number) => {
    setPriceAlerts((prev) =>
      prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'luxury':
        return 'bg-purple-500';
      case 'premium':
        return 'bg-blue-500';
      case 'budget':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'text-green-600';
      case 'limited':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className='flex min-h-screen flex-col gap-6 overflow-y-auto p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Live Hotel Prices</h1>
          <p className='text-muted-foreground'>
            Real-time prices from Booking.com via ScrapFly
          </p>
        </div>
        <Button
          onClick={refreshPrices}
          disabled={isRefreshing}
          className='bg-blue-600 hover:bg-blue-700'
        >
          <IconRefresh
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Hotels Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>47</div>
            <p className='text-muted-foreground text-xs'>
              25 Makkah, 22 Medina
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Price Drops Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>12</div>
            <p className='text-muted-foreground text-xs'>
              Avg. savings €35/night
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Active Alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{priceAlerts.length}</div>
            <p className='text-muted-foreground text-xs'>
              Email notifications enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>API Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
              <span className='text-sm font-medium'>ScrapFly Active</span>
            </div>
            <p className='text-muted-foreground text-xs'>
              38,521 / 40,000 credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Price Trends</CardTitle>
          <CardDescription>Average prices by hotel tier</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={priceHistoryData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type='monotone'
                dataKey='luxury'
                stroke='#a855f7'
                strokeWidth={2}
                name='Luxury (5★)'
              />
              <Line
                type='monotone'
                dataKey='premium'
                stroke='#3b82f6'
                strokeWidth={2}
                name='Premium (4★)'
              />
              <Line
                type='monotone'
                dataKey='budget'
                stroke='#10b981'
                strokeWidth={2}
                name='Budget (3★)'
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className='flex gap-4'>
        <Input
          placeholder='Search hotels...'
          className='max-w-sm'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className='flex gap-2'>
          <Button
            variant={selectedCity === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCity('all')}
          >
            All Cities
          </Button>
          <Button
            variant={selectedCity === 'Makkah' ? 'default' : 'outline'}
            onClick={() => setSelectedCity('Makkah')}
          >
            Makkah
          </Button>
          <Button
            variant={selectedCity === 'Medina' ? 'default' : 'outline'}
            onClick={() => setSelectedCity('Medina')}
          >
            Medina
          </Button>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filteredHotels.map((hotel) => (
          <Card key={hotel.id} className='relative overflow-hidden'>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle className='text-lg'>{hotel.name}</CardTitle>
                  <div className='mt-1 flex items-center gap-2'>
                    <Badge className={getTierColor(hotel.tier)}>
                      {hotel.tier.toUpperCase()}
                    </Badge>
                    <div className='flex items-center'>
                      {[...Array(hotel.stars)].map((_, i) => (
                        <IconStar
                          key={i}
                          className='h-3 w-3 fill-current text-yellow-500'
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  size='sm'
                  variant={
                    priceAlerts.includes(hotel.id) ? 'default' : 'outline'
                  }
                  onClick={() => togglePriceAlert(hotel.id)}
                >
                  <IconBell
                    className={`h-4 w-4 ${priceAlerts.includes(hotel.id) ? 'fill-current' : ''}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-2xl font-bold'>
                        €{hotel.currentPrice}
                      </span>
                      <span className='text-muted-foreground text-sm line-through'>
                        €{hotel.previousPrice}
                      </span>
                    </div>
                    <div className='mt-1 flex items-center gap-1'>
                      {hotel.priceChange < 0 ? (
                        <>
                          <IconTrendingDown className='h-4 w-4 text-green-600' />
                          <span className='text-sm text-green-600'>
                            €{Math.abs(hotel.priceChange)} cheaper
                          </span>
                        </>
                      ) : (
                        <>
                          <IconTrendingUp className='h-4 w-4 text-red-600' />
                          <span className='text-sm text-red-600'>
                            €{hotel.priceChange} more expensive
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p
                      className={`text-sm font-medium ${getAvailabilityColor(hotel.availability)}`}
                    >
                      {hotel.availability}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {hotel.lastUpdated}
                    </p>
                  </div>
                </div>

                <div className='space-y-1 text-sm'>
                  <div className='text-muted-foreground flex items-center gap-1'>
                    <IconMapPin className='h-3 w-3' />
                    {hotel.city} • {hotel.distance}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    className='flex-1 bg-green-600 hover:bg-green-700'
                    asChild
                  >
                    <a
                      href={hotel.affiliateUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Book via HalalBooking
                      <IconExternalLink className='ml-1 h-3 w-3' />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
