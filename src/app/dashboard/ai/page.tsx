'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadInsights } from '@/components/ai/LeadInsights';
import { NaturalLanguageChat } from '@/components/ai/NaturalLanguageChat';
import {
  Brain,
  Zap,
  MessageSquare,
  TrendingUp,
  Bot,
  Lightbulb,
  Activity,
  Cpu
} from 'lucide-react';

export default function AIPage() {
  return (
    <div className='container mx-auto space-y-8 p-6'>
      {/* Page Header */}
      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600'>
            <Brain className='h-8 w-8 text-white' />
          </div>
          <div>
            <h1 className='text-4xl font-bold'>AI Command Center</h1>
            <p className='text-muted-foreground text-lg'>
              Intelligent insights, predictive analytics und automatisierte
              Empfehlungen
            </p>
          </div>
        </div>

        {/* AI Status Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-purple-800'>
                Lead Scoring
              </CardTitle>
              <Bot className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-purple-900'>Aktiv</div>
              <p className='text-xs text-purple-700'>ML-basierte Bewertung</p>
            </CardContent>
          </Card>

          <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-blue-800'>
                Predictive Analytics
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-900'>Bereit</div>
              <p className='text-xs text-blue-700'>Kommt in Phase 3.3</p>
            </CardContent>
          </Card>

          <Card className='border-green-200 bg-gradient-to-br from-green-50 to-green-100'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-green-800'>
                NL Queries
              </CardTitle>
              <MessageSquare className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-900'>Aktiv</div>
              <p className='text-xs text-green-700'>
                Natural Language Interface
              </p>
            </CardContent>
          </Card>

          <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium text-orange-800'>
                Smart Recommendations
              </CardTitle>
              <Lightbulb className='h-4 w-4 text-orange-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-900'>Geplant</div>
              <p className='text-xs text-orange-700'>Phase 3.4</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Features Tabs */}
      <Tabs defaultValue='lead-insights' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger
            value='lead-insights'
            className='flex items-center gap-2'
          >
            <Zap className='h-4 w-4' />
            Lead Insights
          </TabsTrigger>
          <TabsTrigger
            value='predictions'
            className='flex items-center gap-2'
            disabled
          >
            <TrendingUp className='h-4 w-4' />
            Predictions
          </TabsTrigger>
          <TabsTrigger
            value='natural-language'
            className='flex items-center gap-2'
          >
            <MessageSquare className='h-4 w-4' />
            NL Queries
          </TabsTrigger>
          <TabsTrigger
            value='recommendations'
            className='flex items-center gap-2'
            disabled
          >
            <Lightbulb className='h-4 w-4' />
            Empfehlungen
          </TabsTrigger>
        </TabsList>

        {/* Lead Insights Tab */}
        <TabsContent value='lead-insights' className='space-y-6'>
          <LeadInsights />
        </TabsContent>

        {/* Predictions Tab - Coming Soon */}
        <TabsContent value='predictions' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className='py-12'>
              <div className='space-y-4 text-center'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
                  <Cpu className='h-8 w-8 text-blue-600' />
                </div>
                <h3 className='text-xl font-semibold'>
                  Predictive Analytics kommt in Phase 3.3
                </h3>
                <p className='text-muted-foreground mx-auto max-w-md'>
                  Vorhersagen für Revenue, Churn Rate, Lead Conversion und
                  Booking Trends basierend auf historischen Daten und Machine
                  Learning Modellen.
                </p>
                <div className='pt-4'>
                  <Button variant='outline' disabled>
                    In Entwicklung
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Natural Language Tab */}
        <TabsContent value='natural-language' className='space-y-6'>
          <NaturalLanguageChat />
        </TabsContent>

        {/* Recommendations Tab - Coming Soon */}
        <TabsContent value='recommendations' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Lightbulb className='h-5 w-5' />
                Smart Recommendations Engine
              </CardTitle>
            </CardHeader>
            <CardContent className='py-12'>
              <div className='space-y-4 text-center'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100'>
                  <Activity className='h-8 w-8 text-orange-600' />
                </div>
                <h3 className='text-xl font-semibold'>
                  Smart Recommendations kommen in Phase 3.4
                </h3>
                <p className='text-muted-foreground mx-auto max-w-md'>
                  Personalisierte Empfehlungen für optimale Kundenansprache,
                  Best Practices und automatisierte Workflows basierend auf
                  erfolgreichen Mustern.
                </p>
                <div className='pt-4'>
                  <Button variant='outline' disabled>
                    Geplant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className='text-muted-foreground border-t pt-6 text-center text-sm'>
        <p>
          🤖 AI Command Center • Phase 3.1 Implementation • Machine Learning
          Lead Scoring aktiv
        </p>
        <p className='mt-1'>
          Powered by Advanced AI Algorithms & Customer 360° Data Platform
        </p>
      </div>
    </div>
  );
}
