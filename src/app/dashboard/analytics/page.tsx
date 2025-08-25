'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPIDashboard } from '@/components/analytics/KPIDashboard';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { EngagementMetrics } from '@/components/analytics/EngagementMetrics';
import {
  BarChart3,
  DollarSign,
  Activity,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className='container mx-auto space-y-8 p-6'>
      {/* Page Header */}
      <div className='space-y-4'>
        <div>
          <h1 className='text-4xl font-bold'>Analytics Dashboard</h1>
          <p className='text-muted-foreground text-lg'>
            Comprehensive insights into your CRM performance and customer
            engagement
          </p>
        </div>

        {/* Quick Stats Preview */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <BarChart3 className='text-primary h-8 w-8' />
            <div>
              <p className='text-sm font-medium'>Übersicht</p>
              <p className='text-muted-foreground text-xs'>Alle KPIs</p>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <DollarSign className='h-8 w-8 text-green-600' />
            <div>
              <p className='text-sm font-medium'>Umsatz</p>
              <p className='text-muted-foreground text-xs'>Revenue Analytics</p>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <Activity className='h-8 w-8 text-blue-600' />
            <div>
              <p className='text-sm font-medium'>Engagement</p>
              <p className='text-muted-foreground text-xs'>
                Kunden-Interaktion
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <TrendingUp className='h-8 w-8 text-purple-600' />
            <div>
              <p className='text-sm font-medium'>Trends</p>
              <p className='text-muted-foreground text-xs'>Wachstum</p>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <Users className='h-8 w-8 text-orange-600' />
            <div>
              <p className='text-sm font-medium'>Kontakte</p>
              <p className='text-muted-foreground text-xs'>Customer Base</p>
            </div>
          </div>

          <div className='flex items-center gap-3 rounded-lg border p-4'>
            <Target className='h-8 w-8 text-red-600' />
            <div>
              <p className='text-sm font-medium'>Lead Score</p>
              <p className='text-muted-foreground text-xs'>Qualität</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue='overview' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            KPI Übersicht
          </TabsTrigger>
          <TabsTrigger value='revenue' className='flex items-center gap-2'>
            <DollarSign className='h-4 w-4' />
            Umsatz Analytics
          </TabsTrigger>
          <TabsTrigger value='engagement' className='flex items-center gap-2'>
            <Activity className='h-4 w-4' />
            Engagement
          </TabsTrigger>
        </TabsList>

        {/* KPI Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <KPIDashboard />
        </TabsContent>

        {/* Revenue Analytics Tab */}
        <TabsContent value='revenue' className='space-y-6'>
          <RevenueChart />
        </TabsContent>

        {/* Engagement Metrics Tab */}
        <TabsContent value='engagement' className='space-y-6'>
          <EngagementMetrics />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className='text-muted-foreground border-t pt-6 text-center text-sm'>
        <p>
          Analytics Dashboard • Phase 2 Implementation • Real-time
          Datenaktualisierung alle 5-10 Minuten
        </p>
        <p className='mt-1'>
          Powered by Supabase Analytics & Customer 360° Foundation
        </p>
      </div>
    </div>
  );
}
