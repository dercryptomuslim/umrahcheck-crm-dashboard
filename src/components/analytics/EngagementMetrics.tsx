'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  MousePointer,
  Eye,
  MessageCircle,
  Globe,
  Users,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface EngagementData {
  email_metrics: {
    total_sent: number;
    total_opens: number;
    total_clicks: number;
    total_replies: number;
    open_rate: number;
    click_rate: number;
    reply_rate: number;
  };
  web_metrics: {
    total_visits: number;
    unique_visitors: number;
    avg_session_duration: number;
  };
  lead_metrics: {
    total_leads: number;
    hot_leads: number;
    qualified_leads: number;
    avg_lead_score: number;
    score_distribution: {
      high: number; // 70-100
      medium: number; // 40-69
      low: number; // 0-39
    };
  };
  activity_metrics: {
    total_events: number;
    active_contacts: number;
    top_sources: Array<{
      source: string;
      count: number;
      percentage: number;
    }>;
    top_types: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
}

interface EngagementMetricsProps {
  className?: string;
}

export function EngagementMetrics({ className = '' }: EngagementMetricsProps) {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEngagementData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/analytics/engagement', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Engagement-Daten');
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
    fetchEngagementData();
  }, []);

  const handleRefresh = () => {
    fetchEngagementData(true);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-9 w-24' />
        </div>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className='h-32' />
          ))}
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
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

  const formatPercentage = (rate: number) => {
    return `${Math.round(rate * 100) / 100}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (category: string): string => {
    switch (category) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-2xl font-bold'>Engagement Metriken</h3>
          <p className='text-muted-foreground'>
            Übersicht über Kundeninteraktion und -aktivität
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

      {/* Email Metrics Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Email Öffnungsrate
            </CardTitle>
            <Eye className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {formatPercentage(data.email_metrics.open_rate)}
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.email_metrics.total_opens.toLocaleString()} von{' '}
              {data.email_metrics.total_sent.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Click-Through-Rate
            </CardTitle>
            <MousePointer className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {formatPercentage(data.email_metrics.click_rate)}
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.email_metrics.total_clicks.toLocaleString()} Klicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Antwortrate</CardTitle>
            <MessageCircle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {formatPercentage(data.email_metrics.reply_rate)}
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.email_metrics.total_replies.toLocaleString()} Antworten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Website Besucher
            </CardTitle>
            <Globe className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.web_metrics.unique_visitors.toLocaleString()}
            </div>
            <p className='text-muted-foreground text-xs'>
              {data.web_metrics.total_visits.toLocaleString()} Besuche gesamt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Metrics & Activity */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Lead Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Lead Score Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center'>
              <div
                className={`text-3xl font-bold ${getScoreColor(data.lead_metrics.avg_lead_score)}`}
              >
                {Math.round(data.lead_metrics.avg_lead_score)}/100
              </div>
              <p className='text-muted-foreground text-sm'>
                Durchschnittlicher Lead Score
              </p>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge className={getScoreBadgeColor('high')}>
                    Heiß (70-100)
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {data.lead_metrics.score_distribution.high}
                  </span>
                  <Progress
                    value={
                      (data.lead_metrics.score_distribution.high /
                        data.lead_metrics.total_leads) *
                      100
                    }
                    className='w-20'
                  />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge className={getScoreBadgeColor('medium')}>
                    Warm (40-69)
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {data.lead_metrics.score_distribution.medium}
                  </span>
                  <Progress
                    value={
                      (data.lead_metrics.score_distribution.medium /
                        data.lead_metrics.total_leads) *
                      100
                    }
                    className='w-20'
                  />
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge className={getScoreBadgeColor('low')}>
                    Kalt (0-39)
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    {data.lead_metrics.score_distribution.low}
                  </span>
                  <Progress
                    value={
                      (data.lead_metrics.score_distribution.low /
                        data.lead_metrics.total_leads) *
                      100
                    }
                    className='w-20'
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Aktivitätsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>
                  {data.activity_metrics.total_events.toLocaleString()}
                </div>
                <p className='text-muted-foreground text-xs'>Gesamte Events</p>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {data.activity_metrics.active_contacts.toLocaleString()}
                </div>
                <p className='text-muted-foreground text-xs'>Aktive Kontakte</p>
              </div>
            </div>

            <div className='space-y-3'>
              <div>
                <h4 className='mb-2 text-sm font-medium'>Top Event-Quellen</h4>
                <div className='space-y-1'>
                  {data.activity_metrics.top_sources
                    .slice(0, 3)
                    .map((source, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between text-sm'
                      >
                        <span className='capitalize'>{source.source}</span>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{source.count}</span>
                          <span className='text-muted-foreground'>
                            ({formatPercentage(source.percentage)})
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium'>Top Event-Typen</h4>
                <div className='space-y-1'>
                  {data.activity_metrics.top_types
                    .slice(0, 3)
                    .map((type, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between text-sm'
                      >
                        <span className='capitalize'>{type.type}</span>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{type.count}</span>
                          <span className='text-muted-foreground'>
                            ({formatPercentage(type.percentage)})
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
