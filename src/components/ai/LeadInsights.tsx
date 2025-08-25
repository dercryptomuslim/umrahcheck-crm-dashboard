'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Target,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Cpu,
  Activity,
  Star,
  ChevronRight
} from 'lucide-react';

interface LeadScoreBreakdown {
  behavioral: number;
  demographic: number;
  temporal: number;
  contextual: number;
}

interface LeadInsightData {
  top_leads: Array<{
    contact_id: string;
    name: string;
    email: string;
    lead_score: number;
    confidence: number;
    breakdown: LeadScoreBreakdown;
    factors: Record<string, any>;
    last_activity: string;
  }>;
  score_distribution: {
    hot: number; // 70-100
    warm: number; // 40-69
    cold: number; // 0-39
  };
  insights: {
    rising_leads: number;
    declining_leads: number;
    high_confidence_leads: number;
    recently_scored: number;
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action_url?: string;
  }>;
}

interface LeadInsightsProps {
  className?: string;
}

export function LeadInsights({ className = '' }: LeadInsightsProps) {
  const [data, setData] = useState<LeadInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeadInsights = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/ai/insights/leads', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Lead-Insights');
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
    fetchLeadInsights();
  }, []);

  const handleRefresh = () => {
    fetchLeadInsights(true);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-9 w-24' />
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <div className='grid gap-6 md:grid-cols-2'>
          <Skeleton className='h-64' />
          <Skeleton className='h-64' />
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

  const totalLeads =
    data.score_distribution.hot +
    data.score_distribution.warm +
    data.score_distribution.cold;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100'>
            <Brain className='h-6 w-6 text-purple-600' />
          </div>
          <div>
            <h3 className='text-2xl font-bold'>AI Lead Insights</h3>
            <p className='text-muted-foreground'>
              Intelligente Analyse Ihrer Lead-Performance
            </p>
          </div>
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
          {refreshing ? 'Analysiert...' : 'Neu analysieren'}
        </Button>
      </div>

      {/* Key Insights Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Heiße Leads</CardTitle>
            <Target className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {data.score_distribution.hot}
            </div>
            <p className='text-muted-foreground text-xs'>
              Score ≥70 •{' '}
              {totalLeads > 0
                ? Math.round((data.score_distribution.hot / totalLeads) * 100)
                : 0}
              % aller Leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Steigende Leads
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {data.insights.rising_leads}
            </div>
            <p className='text-muted-foreground text-xs'>
              Positive Entwicklung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Hohe Konfidenz
            </CardTitle>
            <Cpu className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {data.insights.high_confidence_leads}
            </div>
            <p className='text-muted-foreground text-xs'>Zuverlässige Scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Kürzlich bewertet
            </CardTitle>
            <Activity className='h-4 w-4 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {data.insights.recently_scored}
            </div>
            <p className='text-muted-foreground text-xs'>Letzten 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='top-leads' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='top-leads' className='flex items-center gap-2'>
            <Star className='h-4 w-4' />
            Top Leads
          </TabsTrigger>
          <TabsTrigger value='distribution' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            Verteilung
          </TabsTrigger>
          <TabsTrigger
            value='recommendations'
            className='flex items-center gap-2'
          >
            <Zap className='h-4 w-4' />
            Empfehlungen
          </TabsTrigger>
        </TabsList>

        {/* Top Leads Tab */}
        <TabsContent value='top-leads' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Top qualifizierte Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_leads.length === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <Users className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>Keine Top-Leads verfügbar</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {data.top_leads.slice(0, 10).map((lead, index) => (
                    <div
                      key={lead.contact_id}
                      className='hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium'>
                          #{index + 1}
                        </div>
                        <div>
                          <p className='font-medium'>
                            {lead.name || 'Unbekannt'}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {lead.email}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            Letzte Aktivität:{' '}
                            {new Date(lead.last_activity).toLocaleDateString(
                              'de-DE'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <div
                            className={`text-lg font-bold ${getScoreColor(lead.lead_score).split(' ')[0]}`}
                          >
                            {lead.lead_score}/100
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {Math.round(lead.confidence * 100)}% Konfidenz
                          </div>
                        </div>

                        <div className='flex flex-col gap-1'>
                          <div
                            className='h-2 w-2 rounded-full bg-green-500'
                            title='Behavioral Score'
                          />
                          <div
                            className='h-2 w-2 rounded-full bg-blue-500'
                            title='Demographic Score'
                          />
                          <div
                            className='h-2 w-2 rounded-full bg-purple-500'
                            title='Temporal Score'
                          />
                          <div
                            className='h-2 w-2 rounded-full bg-orange-500'
                            title='Contextual Score'
                          />
                        </div>

                        <ChevronRight className='text-muted-foreground h-4 w-4' />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value='distribution' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Lead Score Verteilung</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Badge className='bg-red-500'>Heiß (70-100)</Badge>
                    <span className='text-sm font-medium'>
                      {data.score_distribution.hot} Leads
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        totalLeads > 0
                          ? (data.score_distribution.hot / totalLeads) * 100
                          : 0
                      }
                      className='w-32'
                    />
                    <span className='text-muted-foreground min-w-[3rem] text-sm'>
                      {totalLeads > 0
                        ? Math.round(
                            (data.score_distribution.hot / totalLeads) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Badge className='bg-yellow-500'>Warm (40-69)</Badge>
                    <span className='text-sm font-medium'>
                      {data.score_distribution.warm} Leads
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        totalLeads > 0
                          ? (data.score_distribution.warm / totalLeads) * 100
                          : 0
                      }
                      className='w-32'
                    />
                    <span className='text-muted-foreground min-w-[3rem] text-sm'>
                      {totalLeads > 0
                        ? Math.round(
                            (data.score_distribution.warm / totalLeads) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Badge className='bg-red-500'>Kalt (0-39)</Badge>
                    <span className='text-sm font-medium'>
                      {data.score_distribution.cold} Leads
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        totalLeads > 0
                          ? (data.score_distribution.cold / totalLeads) * 100
                          : 0
                      }
                      className='w-32'
                    />
                    <span className='text-muted-foreground min-w-[3rem] text-sm'>
                      {totalLeads > 0
                        ? Math.round(
                            (data.score_distribution.cold / totalLeads) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className='border-t pt-4'>
                <div className='grid grid-cols-3 gap-4 text-center'>
                  <div>
                    <div className='text-2xl font-bold'>{totalLeads}</div>
                    <div className='text-muted-foreground text-xs'>
                      Gesamt Leads
                    </div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-green-600'>
                      {totalLeads > 0
                        ? Math.round(
                            ((data.score_distribution.hot +
                              data.score_distribution.warm) /
                              totalLeads) *
                              100
                          )
                        : 0}
                      %
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Qualifiziert
                    </div>
                  </div>
                  <div>
                    <div className='text-2xl font-bold text-blue-600'>
                      {data.insights.high_confidence_leads}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      Hohe Konfidenz
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value='recommendations' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>AI Empfehlungen</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recommendations.length === 0 ? (
                <div className='text-muted-foreground py-8 text-center'>
                  <Zap className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>Keine Empfehlungen verfügbar</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {data.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className='flex items-start gap-4 rounded-lg border p-4'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className='flex-1'>
                        <h4 className='font-medium'>{rec.title}</h4>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {rec.description}
                        </p>
                        {rec.action_url && (
                          <Button variant='outline' size='sm' className='mt-2'>
                            Aktion ausführen
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
