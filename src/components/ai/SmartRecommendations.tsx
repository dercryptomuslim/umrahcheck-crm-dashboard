'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Target,
  Zap,
  Star,
  Clock,
  DollarSign,
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';

interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_type: 'package' | 'service' | 'upgrade' | 'addon';
  destination: string;
  price: number;
  confidence_score: number;
  reasoning: string[];
  expected_conversion_rate: number;
  expected_revenue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  validity_days: number;
  personalization_factors: string[];
  cross_sell_potential: number;
  up_sell_potential: number;
}

interface CampaignRecommendation {
  campaign_id: string;
  campaign_name: string;
  campaign_type: 'email' | 'sms' | 'push' | 'whatsapp';
  target_segment: string;
  message_template: string;
  call_to_action: string;
  confidence_score: number;
  expected_open_rate: number;
  expected_click_rate: number;
  expected_conversion_rate: number;
  optimal_send_time: {
    day_of_week: number;
    hour: number;
    timezone: string;
  };
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  personalization_tokens: Record<string, string>;
  a_b_test_variant?: string;
}

interface CustomerSegment {
  segment_id: string;
  segment_name: string;
  description: string;
  customer_count: number;
  total_value: number;
  avg_customer_value: number;
  growth_rate: number;
  churn_risk: 'low' | 'medium' | 'high';
  engagement_level: 'low' | 'medium' | 'high';
  profitability: 'low' | 'medium' | 'high';
}

interface SmartRecommendationsData {
  product_recommendations?: {
    recommendations: ProductRecommendation[];
    customer_segment: string;
    summary: {
      total_recommendations: number;
      high_priority_count: number;
      expected_total_revenue: number;
      avg_confidence_score: number;
      cross_sell_opportunities: number;
      up_sell_opportunities: number;
    };
  };
  campaign_recommendations?: {
    campaigns: CampaignRecommendation[];
    target_analysis: {
      total_customers_analyzed: number;
      segments_identified: number;
      avg_engagement_score: number;
      estimated_reach: number;
    };
    performance_forecast: {
      expected_total_opens: number;
      expected_total_clicks: number;
      expected_conversions: number;
      estimated_revenue: number;
      roi_projection: number;
    };
    optimization_suggestions: string[];
  };
  segment_analysis?: {
    analysis_date: string;
    total_customers: number;
    segments: CustomerSegment[];
    insights: {
      largest_segment: string;
      most_valuable_segment: string;
      fastest_growing_segment: string;
      highest_risk_segment: string;
      best_opportunity_segment: string;
    };
  };
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4'
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

const riskColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

const engagementColors = {
  low: 'text-red-500',
  medium: 'text-yellow-500',
  high: 'text-green-500'
};

export function SmartRecommendations() {
  const [data, setData] = useState<SmartRecommendationsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');

  const loadRecommendationData = async (
    type: 'products' | 'campaigns' | 'segments'
  ) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let requestBody = {};

      switch (type) {
        case 'products':
          endpoint = '/api/ai/recommendations/products';
          requestBody = {
            max_recommendations: 10,
            min_confidence: 0.3,
            include_cross_sell: true,
            include_up_sell: true
          };
          break;
        case 'campaigns':
          endpoint = '/api/ai/recommendations/campaigns';
          requestBody = {
            max_campaigns: 5,
            min_confidence: 0.4,
            include_ab_testing: true
          };
          break;
        case 'segments':
          endpoint = '/api/ai/recommendations/segments';
          requestBody = {
            segment_count: 6,
            min_segment_size: 10,
            include_rfm: true
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.ok) {
        setData((prevData) => ({
          ...prevData,
          [type === 'products'
            ? 'product_recommendations'
            : type === 'campaigns'
              ? 'campaign_recommendations'
              : 'segment_analysis']: result.data
        }));
      } else {
        throw new Error(result.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error(`Error loading ${type} recommendations:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      loadRecommendationData('products'),
      loadRecommendationData('campaigns'),
      loadRecommendationData('segments')
    ]);
  };

  const exportData = () => {
    const exportData = {
      export_date: new Date().toISOString(),
      ...data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-recommendations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className='h-4 w-4' />;
      case 'high':
        return <TrendingUp className='h-4 w-4' />;
      case 'medium':
        return <Clock className='h-4 w-4' />;
      default:
        return <Minus className='h-4 w-4' />;
    }
  };

  const getTrendIcon = (rate: number) => {
    if (rate > 0.1) return <ArrowUpRight className='h-4 w-4 text-green-500' />;
    if (rate < -0.1) return <ArrowDownRight className='h-4 w-4 text-red-500' />;
    return <Minus className='h-4 w-4 text-gray-500' />;
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className='h-4 w-4' />;
      case 'sms':
        return <MessageSquare className='h-4 w-4' />;
      case 'whatsapp':
        return <MessageSquare className='h-4 w-4' />;
      case 'push':
        return <Smartphone className='h-4 w-4' />;
      default:
        return <MessageSquare className='h-4 w-4' />;
    }
  };

  // Load initial data
  useEffect(() => {
    loadRecommendationData('products');
  }, []);

  return (
    <div className='space-y-6' data-testid='smart-recommendations'>
      {/* Header */}
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Smart Recommendations</h2>
          <p className='text-muted-foreground'>
            AI-powered product, campaign, and customer segment recommendations
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={refreshAllData} disabled={loading} size='sm'>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Aktualisieren
          </Button>
          <Button
            onClick={exportData}
            variant='outline'
            size='sm'
            disabled={Object.keys(data).length === 0}
          >
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-4 w-4' />
              <span>Fehler beim Laden der Empfehlungen: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='products' className='flex items-center gap-2'>
            <Zap className='h-4 w-4' />
            Products
          </TabsTrigger>
          <TabsTrigger value='campaigns' className='flex items-center gap-2'>
            <Target className='h-4 w-4' />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value='segments' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Segments
          </TabsTrigger>
        </TabsList>

        {/* Product Recommendations Tab */}
        <TabsContent value='products' className='space-y-6'>
          <Button
            onClick={() => loadRecommendationData('products')}
            disabled={loading}
            size='sm'
            className='mb-4'
          >
            {loading ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-4 w-4' />
            )}
            Load Product Recommendations
          </Button>

          {data.product_recommendations && (
            <>
              {/* Summary Cards */}
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Recommendations
                    </CardTitle>
                    <Zap className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {
                        data.product_recommendations.summary
                          .total_recommendations
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      High Priority
                    </CardTitle>
                    <AlertTriangle className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {data.product_recommendations.summary.high_priority_count}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Expected Revenue
                    </CardTitle>
                    <DollarSign className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      €
                      {Math.round(
                        data.product_recommendations.summary
                          .expected_total_revenue
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Avg Confidence
                    </CardTitle>
                    <Star className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {Math.round(
                        data.product_recommendations.summary
                          .avg_confidence_score * 100
                      )}
                      %
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Segment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Customer Segment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-4'>
                    <Badge variant='outline' className='text-sm'>
                      {data.product_recommendations.customer_segment}
                    </Badge>
                    <div className='text-muted-foreground text-sm'>
                      Cross-sell:{' '}
                      {
                        data.product_recommendations.summary
                          .cross_sell_opportunities
                      }{' '}
                      • Up-sell:{' '}
                      {
                        data.product_recommendations.summary
                          .up_sell_opportunities
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Recommendations List */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Recommended Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {data.product_recommendations.recommendations.map((rec) => (
                      <div
                        key={rec.product_id}
                        className='rounded-lg border p-4 transition-colors hover:bg-gray-50'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              <h4 className='font-medium'>
                                {rec.product_name}
                              </h4>
                              <Badge className={priorityColors[rec.priority]}>
                                {getPriorityIcon(rec.priority)}
                                <span className='ml-1'>{rec.priority}</span>
                              </Badge>
                              <Badge variant='outline'>{rec.destination}</Badge>
                            </div>

                            <div className='text-muted-foreground mb-2 flex items-center gap-4 text-sm'>
                              <span>€{rec.price.toLocaleString()}</span>
                              <span>
                                Confidence:{' '}
                                {Math.round(rec.confidence_score * 100)}%
                              </span>
                              <span>
                                Expected Revenue: €
                                {Math.round(rec.expected_revenue)}
                              </span>
                              <span>Valid: {rec.validity_days} days</span>
                            </div>

                            <div className='space-y-1 text-sm'>
                              <div className='font-medium text-gray-700'>
                                Reasoning:
                              </div>
                              <ul className='list-inside list-disc space-y-1 text-gray-600'>
                                {rec.reasoning.map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                ))}
                              </ul>
                            </div>

                            {rec.personalization_factors.length > 0 && (
                              <div className='mt-2 flex flex-wrap gap-1'>
                                {rec.personalization_factors.map(
                                  (factor, index) => (
                                    <Badge
                                      key={index}
                                      variant='secondary'
                                      className='text-xs'
                                    >
                                      {factor}
                                    </Badge>
                                  )
                                )}
                              </div>
                            )}
                          </div>

                          <div className='text-right'>
                            <div className='text-lg font-bold'>
                              {Math.round(rec.expected_conversion_rate * 100)}%
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              Conversion
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Campaign Recommendations Tab */}
        <TabsContent value='campaigns' className='space-y-6'>
          <Button
            onClick={() => loadRecommendationData('campaigns')}
            disabled={loading}
            size='sm'
            className='mb-4'
          >
            {loading ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-4 w-4' />
            )}
            Load Campaign Recommendations
          </Button>

          {data.campaign_recommendations && (
            <>
              {/* Campaign Summary Cards */}
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Recommended Campaigns
                    </CardTitle>
                    <Target className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {data.campaign_recommendations.campaigns.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Estimated Reach
                    </CardTitle>
                    <Users className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {Math.round(
                        data.campaign_recommendations.target_analysis
                          .estimated_reach
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Projected ROI
                    </CardTitle>
                    <TrendingUp className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {Math.round(
                        data.campaign_recommendations.performance_forecast
                          .roi_projection
                      )}
                      %
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Expected Revenue
                    </CardTitle>
                    <DollarSign className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      €
                      {Math.round(
                        data.campaign_recommendations.performance_forecast
                          .estimated_revenue
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Performance Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-3'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {Math.round(
                          data.campaign_recommendations.performance_forecast
                            .expected_total_opens
                        ).toLocaleString()}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        Expected Opens
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {Math.round(
                          data.campaign_recommendations.performance_forecast
                            .expected_total_clicks
                        ).toLocaleString()}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        Expected Clicks
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {Math.round(
                          data.campaign_recommendations.performance_forecast
                            .expected_conversions
                        ).toLocaleString()}
                      </div>
                      <div className='text-muted-foreground text-sm'>
                        Expected Conversions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Recommendations List */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Recommended Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {data.campaign_recommendations.campaigns.map((campaign) => (
                      <div
                        key={campaign.campaign_id}
                        className='rounded-lg border p-4 transition-colors hover:bg-gray-50'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              {getCampaignTypeIcon(campaign.campaign_type)}
                              <h4 className='font-medium'>
                                {campaign.campaign_name}
                              </h4>
                              <Badge variant='outline'>
                                {campaign.target_segment}
                              </Badge>
                              <Badge
                                className={
                                  campaign.urgency_level === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : campaign.urgency_level === 'high'
                                      ? 'bg-orange-100 text-orange-700'
                                      : campaign.urgency_level === 'medium'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                }
                              >
                                {campaign.urgency_level}
                              </Badge>
                            </div>

                            <div className='text-muted-foreground mb-2 flex items-center gap-4 text-sm'>
                              <span>
                                Open:{' '}
                                {Math.round(campaign.expected_open_rate * 100)}%
                              </span>
                              <span>
                                Click:{' '}
                                {Math.round(campaign.expected_click_rate * 100)}
                                %
                              </span>
                              <span>
                                Convert:{' '}
                                {Math.round(
                                  campaign.expected_conversion_rate * 100
                                )}
                                %
                              </span>
                              <span>
                                Confidence:{' '}
                                {Math.round(campaign.confidence_score * 100)}%
                              </span>
                            </div>

                            <div className='mb-2 text-sm text-gray-600'>
                              <strong>Message:</strong>{' '}
                              {campaign.message_template}
                            </div>

                            <div className='flex items-center justify-between'>
                              <Badge variant='secondary'>
                                {campaign.call_to_action}
                              </Badge>
                              {campaign.a_b_test_variant && (
                                <Badge variant='outline' className='text-xs'>
                                  A/B Test: {campaign.a_b_test_variant}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Suggestions */}
              {data.campaign_recommendations.optimization_suggestions.length >
                0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      Optimization Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {data.campaign_recommendations.optimization_suggestions.map(
                        (suggestion, index) => (
                          <div key={index} className='flex items-start gap-2'>
                            <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-500' />
                            <span className='text-sm'>{suggestion}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Customer Segments Tab */}
        <TabsContent value='segments' className='space-y-6'>
          <Button
            onClick={() => loadRecommendationData('segments')}
            disabled={loading}
            size='sm'
            className='mb-4'
          >
            {loading ? (
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-4 w-4' />
            )}
            Load Segment Analysis
          </Button>

          {data.segment_analysis && (
            <>
              {/* Segments Overview */}
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Customers
                    </CardTitle>
                    <Users className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {data.segment_analysis.total_customers.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Segments Created
                    </CardTitle>
                    <PieChart className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      {data.segment_analysis.segments.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Largest Segment
                    </CardTitle>
                    <BarChart3 className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div
                      className='truncate text-sm font-bold'
                      title={data.segment_analysis.insights.largest_segment}
                    >
                      {data.segment_analysis.insights.largest_segment}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Best Opportunity
                    </CardTitle>
                    <Target className='text-muted-foreground h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <div
                      className='truncate text-sm font-bold'
                      title={
                        data.segment_analysis.insights.best_opportunity_segment
                      }
                    >
                      {data.segment_analysis.insights.best_opportunity_segment}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Most Valuable
                      </span>
                      <span className='font-medium'>
                        {data.segment_analysis.insights.most_valuable_segment}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Fastest Growing
                      </span>
                      <span className='font-medium'>
                        {data.segment_analysis.insights.fastest_growing_segment}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Highest Risk
                      </span>
                      <span className='font-medium text-red-600'>
                        {data.segment_analysis.insights.highest_risk_segment}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Analysis Info</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Analysis Date
                      </span>
                      <span className='font-medium'>
                        {new Date(
                          data.segment_analysis.analysis_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-sm'>
                        Avg Segment Size
                      </span>
                      <span className='font-medium'>
                        {Math.round(
                          data.segment_analysis.total_customers /
                            data.segment_analysis.segments.length
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segments List */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {data.segment_analysis.segments.map((segment) => (
                      <div
                        key={segment.segment_id}
                        className='rounded-lg border p-4 transition-colors hover:bg-gray-50'
                      >
                        <div className='mb-3 flex items-start justify-between'>
                          <div>
                            <h4 className='font-medium'>
                              {segment.segment_name}
                            </h4>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              {segment.description}
                            </p>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-bold'>
                              {segment.customer_count}
                            </div>
                            <div className='text-muted-foreground text-xs'>
                              customers
                            </div>
                          </div>
                        </div>

                        <div className='grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4'>
                          <div>
                            <div className='text-muted-foreground'>
                              Total Value
                            </div>
                            <div className='font-medium'>
                              €
                              {Math.round(segment.total_value).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className='text-muted-foreground'>
                              Avg Customer Value
                            </div>
                            <div className='font-medium'>
                              €
                              {Math.round(
                                segment.avg_customer_value
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className='text-muted-foreground'>
                              Growth Rate
                            </div>
                            <div className='flex items-center gap-1'>
                              {getTrendIcon(segment.growth_rate)}
                              <span className='font-medium'>
                                {Math.round(segment.growth_rate * 100)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className='text-muted-foreground'>
                              Churn Risk
                            </div>
                            <div
                              className={`font-medium ${riskColors[segment.churn_risk]}`}
                            >
                              {segment.churn_risk}
                            </div>
                          </div>
                        </div>

                        <div className='mt-3 flex items-center gap-4'>
                          <Badge variant='outline'>
                            Engagement:{' '}
                            <span
                              className={
                                engagementColors[segment.engagement_level]
                              }
                            >
                              {segment.engagement_level}
                            </span>
                          </Badge>
                          <Badge variant='outline'>
                            Profitability: {segment.profitability}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
