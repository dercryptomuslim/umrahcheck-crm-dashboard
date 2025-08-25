'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  DollarSign,
  Calendar,
  TrendingUp,
  Target,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { KPIResponse } from '@/types/customer360';

interface KPIDashboardProps {
  period?: number; // days
  className?: string;
}

interface KPIAPIResponse {
  ok: boolean;
  data: KPIResponse;
  meta: {
    period: number;
    generated_at: string;
    tenant_id: string;
  };
}

export function KPIDashboard({
  period = 30,
  className = ''
}: KPIDashboardProps) {
  const [data, setData] = useState<KPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKPIData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/analytics/kpi?period=${period}`, {
        cache: 'no-store' // Always fetch fresh data for KPI
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der KPI-Daten');
      }

      const result: KPIAPIResponse = await response.json();

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
    fetchKPIData();
  }, [period]);

  const handleRefresh = () => {
    fetchKPIData(true);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='mt-2 h-4 w-96' />
          </div>
          <Skeleton className='h-9 w-24' />
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
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

  // Calculate growth indicators (would need historical data in real implementation)
  const contactsGrowth = data.contacts_new_30d > 0 ? '+' : '';
  const revenueGrowth = data.revenue_30d > 0 ? '+' : '';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold'>KPI Dashboard</h2>
          <p className='text-muted-foreground'>
            Überblick über die wichtigsten Kennzahlen der letzten {period} Tage
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

      {/* KPI Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Contacts */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Kontakte Gesamt
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.contacts_total.toLocaleString()}
            </div>
            {data.contacts_new_30d > 0 && (
              <p className='text-xs text-green-600'>
                {contactsGrowth}
                {data.contacts_new_30d} neue in {period}d
              </p>
            )}
          </CardContent>
        </Card>

        {/* New Contacts */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Neue Kontakte ({period}d)
            </CardTitle>
            <UserPlus className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {data.contacts_new_30d.toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>Neuregistrierungen</p>
          </CardContent>
        </Card>

        {/* Revenue Total */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Umsatz Gesamt</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              €{data.revenue_total.toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>
              Aus {data.bookings_total} Buchungen
            </p>
          </CardContent>
        </Card>

        {/* Revenue Period */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Umsatz ({period}d)
            </CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              €{data.revenue_30d.toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.bookings_30d} neue Buchungen
            </p>
          </CardContent>
        </Card>

        {/* Bookings Total */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Buchungen Gesamt
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.bookings_total.toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>
              Alle bestätigten Buchungen
            </p>
          </CardContent>
        </Card>

        {/* Average Lead Score */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Durchschnittlicher Lead Score
            </CardTitle>
            <Activity className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.avg_lead_score}/100</div>
            <p className='text-muted-foreground text-xs'>Qualität der Leads</p>
          </CardContent>
        </Card>

        {/* Hot Leads */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Heiße Leads</CardTitle>
            <Target className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <div className='text-2xl font-bold text-orange-600'>
                {data.hot_leads}
              </div>
              <Badge variant='secondary'>Score ≥70</Badge>
            </div>
            <p className='text-muted-foreground text-xs'>
              Hochqualifizierte Leads
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Konversionsrate
            </CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {data.conversion_rate}%
            </div>
            <p className='text-muted-foreground text-xs'>
              Kontakte zu Buchungen
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
