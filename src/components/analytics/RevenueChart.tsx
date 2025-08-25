'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface RevenueData {
  period: string;
  revenue: number;
  bookings: number;
  commission: number;
}

interface RevenueAnalyticsData {
  daily: RevenueData[];
  weekly: RevenueData[];
  monthly: RevenueData[];
  totals: {
    revenue: number;
    bookings: number;
    commission: number;
    avg_booking_value: number;
  };
}

interface RevenueChartProps {
  className?: string;
}

export function RevenueChart({ className = '' }: RevenueChartProps) {
  const [data, setData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRevenueData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/analytics/revenue', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Umsatzdaten');
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'API Error');
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const handleRefresh = () => {
    fetchRevenueData(true);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-9 w-24' />
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <Skeleton className='h-[400px]' />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant='outline' onClick={handleRefresh} className='mt-4'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (
    dateStr: string,
    period: 'daily' | 'weekly' | 'monthly'
  ) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'daily':
        return date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit'
        });
      case 'weekly':
        return `KW ${Math.ceil(date.getDate() / 7)}`;
      case 'monthly':
        return date.toLocaleDateString('de-DE', {
          month: 'short',
          year: '2-digit'
        });
      default:
        return dateStr;
    }
  };

  const renderChart = (
    chartData: RevenueData[],
    period: 'daily' | 'weekly' | 'monthly'
  ) => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className='text-muted-foreground flex h-64 items-center justify-center'>
          <div className='text-center'>
            <BarChart3 className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p>Keine Daten verfügbar</p>
          </div>
        </div>
      );
    }

    const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

    return (
      <div className='space-y-4'>
        <div className='flex h-64 items-end justify-between gap-2'>
          {chartData.map((item, index) => {
            const height =
              maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <div
                key={index}
                className='flex flex-1 flex-col items-center gap-2'
              >
                <div className='text-muted-foreground text-xs'>
                  {formatCurrency(item.revenue)}
                </div>
                <div
                  className='bg-primary hover:bg-primary/80 w-full rounded-t transition-all duration-300'
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${formatCurrency(item.revenue)} - ${item.bookings} Buchungen`}
                />
                <div className='text-xs font-medium'>
                  {formatDate(item.period, period)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-2xl font-bold'>Umsatz Analytics</h3>
          <p className='text-muted-foreground'>
            Detaillierte Umsatzentwicklung und Trends
          </p>
        </div>
        <Button
          variant='outline'
          onClick={handleRefresh}
          disabled={refreshing}
          size='sm'
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Aktualisiert...' : 'Aktualisieren'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Gesamtumsatz</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(data.totals.revenue)}
            </div>
            <p className='text-muted-foreground text-xs'>
              Aus {data.totals.bookings} Buchungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Durchschnittlicher Buchungswert
            </CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {formatCurrency(data.totals.avg_booking_value)}
            </div>
            <p className='text-muted-foreground text-xs'>Pro Buchung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Gesamtprovisionen
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {formatCurrency(data.totals.commission)}
            </div>
            <p className='text-muted-foreground text-xs'>
              Verdiente Provisionen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Umsatzentwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='daily' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='daily'>Täglich</TabsTrigger>
              <TabsTrigger value='weekly'>Wöchentlich</TabsTrigger>
              <TabsTrigger value='monthly'>Monatlich</TabsTrigger>
            </TabsList>

            <TabsContent value='daily' className='space-y-4'>
              <div className='text-muted-foreground text-sm'>
                Umsätze der letzten 30 Tage
              </div>
              {renderChart(data.daily, 'daily')}
            </TabsContent>

            <TabsContent value='weekly' className='space-y-4'>
              <div className='text-muted-foreground text-sm'>
                Wöchentliche Umsätze der letzten 12 Wochen
              </div>
              {renderChart(data.weekly, 'weekly')}
            </TabsContent>

            <TabsContent value='monthly' className='space-y-4'>
              <div className='text-muted-foreground text-sm'>
                Monatliche Umsätze der letzten 12 Monate
              </div>
              {renderChart(data.monthly, 'monthly')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
