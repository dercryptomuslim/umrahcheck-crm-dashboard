'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Euro,
  Calendar,
  Target,
  Brain,
  RefreshCw,
  Download,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

interface RevenueForecast {
  date: string;
  predicted_amount: number;
  confidence_lower: number;
  confidence_upper: number;
  trend_direction: 'up' | 'down' | 'stable';
}

interface ChurnPrediction {
  customer_id: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  primary_risk_factors: string[];
  recommended_actions: string[];
  predicted_ltv_remaining: number;
  time_to_churn_days: number | null;
}

interface PredictiveAnalyticsData {
  revenue_forecast?: {
    forecast_summary: {
      total_forecast: number;
      growth_rate: number;
      confidence: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      risk_factors: string[];
      opportunities: string[];
    };
    forecasts: RevenueForecast[];
    model_metrics: {
      mape: number;
      forecast_accuracy: 'high' | 'medium' | 'low';
      confidence: number;
    };
  };
  churn_predictions?: {
    predictions: ChurnPrediction[];
    summary: {
      total_customers_analyzed: number;
      at_risk_customers: number;
      high_risk_customers: number;
      total_ltv_at_risk: number;
      avg_confidence: number;
    };
    insights: {
      top_risk_factors: Array<{
        factor: string;
        impact: number;
        frequency: number;
      }>;
      retention_opportunities: Array<{
        segment: string;
        customer_count: number;
        potential_revenue: number;
        recommended_action: string;
      }>;
    };
  };
}

export function PredictiveAnalytics() {
  const [data, setData] = useState<PredictiveAnalyticsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    loadPredictiveData();
  }, []);

  const loadPredictiveData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load revenue forecasting
      const revenueResponse = await fetch('/api/ai/predictions/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe_days: 90,
          forecast_days: 30,
          confidence_level: 0.95,
          include_breakdown: true
        })
      });

      // Load churn predictions
      const churnResponse = await fetch('/api/ai/predictions/churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_threshold: 0.3,
          max_results: 100,
          include_insights: true,
          segment_filter: 'all'
        })
      });

      const newData: PredictiveAnalyticsData = {};

      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json();
        newData.revenue_forecast = revenueData.data;
      }

      if (churnResponse.ok) {
        const churnData = await churnResponse.json();
        newData.churn_predictions = churnData.data;
      }

      setData(newData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load predictive data'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'rgb(239, 68, 68)';
      case 'high':
        return 'rgb(245, 101, 101)';
      case 'medium':
        return 'rgb(251, 191, 36)';
      case 'low':
        return 'rgb(34, 197, 94)';
      default:
        return 'rgb(107, 114, 128)';
    }
  };

  const RISK_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280'];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Predictive Analytics</h2>
          <p className='text-muted-foreground'>
            ML-basierte Vorhersagen für Revenue & Churn
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={loadPredictiveData}
            disabled={loading}
            variant='outline'
            size='sm'
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Aktualisieren
          </Button>
          <Button variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='revenue' className='flex items-center gap-2'>
            <Euro className='h-4 w-4' />
            Revenue Forecasting
          </TabsTrigger>
          <TabsTrigger value='churn' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Churn Prediction
          </TabsTrigger>
        </TabsList>

        {/* Revenue Forecasting Tab */}
        <TabsContent value='revenue' className='space-y-6'>
          {loading && activeTab === 'revenue' ? (
            <div className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className='p-6'>
                      <div className='animate-pulse space-y-3'>
                        <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                        <div className='h-8 w-1/2 rounded bg-gray-200'></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : data.revenue_forecast ? (
            <>
              {/* Revenue Summary Cards */}
              <div className='grid gap-4 md:grid-cols-4'>
                <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Euro className='h-5 w-5 text-blue-600' />
                      <span className='text-sm font-medium text-blue-800'>
                        Forecast Total
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-blue-900'>
                      {formatCurrency(
                        data.revenue_forecast.forecast_summary.total_forecast
                      )}
                    </div>
                    <p className='mt-1 text-xs text-blue-700'>
                      Nächste 30 Tage
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`border-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-200 bg-gradient-to-br from-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-50 to-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-100`}
                >
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      {data.revenue_forecast.forecast_summary.growth_rate >=
                      0 ? (
                        <TrendingUp className='h-5 w-5 text-green-600' />
                      ) : (
                        <TrendingDown className='h-5 w-5 text-red-600' />
                      )}
                      <span
                        className={`text-sm font-medium text-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-800`}
                      >
                        Growth Rate
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold text-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-900`}
                    >
                      {data.revenue_forecast.forecast_summary.growth_rate >= 0
                        ? '+'
                        : ''}
                      {data.revenue_forecast.forecast_summary.growth_rate.toFixed(
                        1
                      )}
                      %
                    </div>
                    <p
                      className={`text-xs text-${data.revenue_forecast.forecast_summary.growth_rate >= 0 ? 'green' : 'red'}-700 mt-1`}
                    >
                      vs. letzter Monat
                    </p>
                  </CardContent>
                </Card>

                <Card className='border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Brain className='h-5 w-5 text-purple-600' />
                      <span className='text-sm font-medium text-purple-800'>
                        Confidence
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-purple-900'>
                      {Math.round(
                        data.revenue_forecast.forecast_summary.confidence * 100
                      )}
                      %
                    </div>
                    <div className='mt-2'>
                      <Progress
                        value={
                          data.revenue_forecast.forecast_summary.confidence *
                          100
                        }
                        className='h-2'
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Target className='h-5 w-5 text-orange-600' />
                      <span className='text-sm font-medium text-orange-800'>
                        Accuracy
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-orange-900'>
                      <Badge
                        variant={
                          data.revenue_forecast.model_metrics
                            .forecast_accuracy === 'high'
                            ? 'default'
                            : data.revenue_forecast.model_metrics
                                  .forecast_accuracy === 'medium'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {data.revenue_forecast.model_metrics.forecast_accuracy}
                      </Badge>
                    </div>
                    <p className='mt-1 text-xs text-orange-700'>
                      MAPE: {data.revenue_forecast.model_metrics.mape}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Revenue Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-96'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={data.revenue_forecast.forecasts}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='date' tickFormatter={formatDate} />
                        <YAxis
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            'Umsatz'
                          ]}
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Area
                          type='monotone'
                          dataKey='confidence_upper'
                          stroke='#3b82f6'
                          fill='#3b82f6'
                          fillOpacity={0.1}
                          strokeOpacity={0.3}
                        />
                        <Area
                          type='monotone'
                          dataKey='confidence_lower'
                          stroke='#3b82f6'
                          fill='#ffffff'
                          fillOpacity={1}
                        />
                        <Line
                          type='monotone'
                          dataKey='predicted_amount'
                          stroke='#3b82f6'
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors & Opportunities */}
              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-orange-500' />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {data.revenue_forecast.forecast_summary.risk_factors
                      .length > 0 ? (
                      data.revenue_forecast.forecast_summary.risk_factors.map(
                        (factor, index) => (
                          <Alert key={index} variant='destructive'>
                            <AlertDescription>{factor}</AlertDescription>
                          </Alert>
                        )
                      )
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        Keine signifikanten Risikofaktoren identifiziert
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Zap className='h-5 w-5 text-green-500' />
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {data.revenue_forecast.forecast_summary.opportunities
                      .length > 0 ? (
                      data.revenue_forecast.forecast_summary.opportunities.map(
                        (opportunity, index) => (
                          <Alert
                            key={index}
                            className='border-green-200 bg-green-50'
                          >
                            <AlertDescription className='text-green-800'>
                              {opportunity}
                            </AlertDescription>
                          </Alert>
                        )
                      )
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        Keine spezifischen Opportunities identifiziert
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <Brain className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-lg font-semibold'>
                  Keine Revenue Daten
                </h3>
                <p className='text-muted-foreground'>
                  Laden Sie die Daten, um Revenue Forecasting zu sehen
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Churn Prediction Tab */}
        <TabsContent value='churn' className='space-y-6'>
          {loading && activeTab === 'churn' ? (
            <div className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-4'>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className='p-6'>
                      <div className='animate-pulse space-y-3'>
                        <div className='h-4 w-3/4 rounded bg-gray-200'></div>
                        <div className='h-8 w-1/2 rounded bg-gray-200'></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : data.churn_predictions ? (
            <>
              {/* Churn Summary Cards */}
              <div className='grid gap-4 md:grid-cols-4'>
                <Card className='border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Users className='h-5 w-5 text-blue-600' />
                      <span className='text-sm font-medium text-blue-800'>
                        Analyzed
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-blue-900'>
                      {data.churn_predictions.summary.total_customers_analyzed.toLocaleString(
                        'de-DE'
                      )}
                    </div>
                    <p className='mt-1 text-xs text-blue-700'>Customers</p>
                  </CardContent>
                </Card>

                <Card className='border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-orange-600' />
                      <span className='text-sm font-medium text-orange-800'>
                        At Risk
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-orange-900'>
                      {data.churn_predictions.summary.at_risk_customers}
                    </div>
                    <p className='mt-1 text-xs text-orange-700'>
                      {(
                        (data.churn_predictions.summary.at_risk_customers /
                          data.churn_predictions.summary
                            .total_customers_analyzed) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </CardContent>
                </Card>

                <Card className='border-red-200 bg-gradient-to-br from-red-50 to-red-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Shield className='h-5 w-5 text-red-600' />
                      <span className='text-sm font-medium text-red-800'>
                        High Risk
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-red-900'>
                      {data.churn_predictions.summary.high_risk_customers}
                    </div>
                    <p className='mt-1 text-xs text-red-700'>Critical + High</p>
                  </CardContent>
                </Card>

                <Card className='border-green-200 bg-gradient-to-br from-green-50 to-green-100'>
                  <CardContent className='p-6'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Euro className='h-5 w-5 text-green-600' />
                      <span className='text-sm font-medium text-green-800'>
                        LTV at Risk
                      </span>
                    </div>
                    <div className='text-2xl font-bold text-green-900'>
                      {formatCurrency(
                        data.churn_predictions.summary.total_ltv_at_risk
                      )}
                    </div>
                    <p className='mt-1 text-xs text-green-700'>
                      Retention Value
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Churn Risk Distribution */}
              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Level Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='h-64'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Critical',
                                value:
                                  data.churn_predictions.predictions.filter(
                                    (p) => p.risk_level === 'critical'
                                  ).length,
                                color: '#ef4444'
                              },
                              {
                                name: 'High',
                                value:
                                  data.churn_predictions.predictions.filter(
                                    (p) => p.risk_level === 'high'
                                  ).length,
                                color: '#f59e0b'
                              },
                              {
                                name: 'Medium',
                                value:
                                  data.churn_predictions.predictions.filter(
                                    (p) => p.risk_level === 'medium'
                                  ).length,
                                color: '#10b981'
                              },
                              {
                                name: 'Low',
                                value:
                                  data.churn_predictions.predictions.filter(
                                    (p) => p.risk_level === 'low'
                                  ).length,
                                color: '#6b7280'
                              }
                            ]}
                            cx='50%'
                            cy='50%'
                            innerRadius={40}
                            outerRadius={80}
                            dataKey='value'
                          >
                            {RISK_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {data.churn_predictions.insights.top_risk_factors
                        .slice(0, 5)
                        .map((factor, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between'
                          >
                            <div className='flex-1'>
                              <p className='text-sm font-medium'>
                                {factor.factor}
                              </p>
                              <div className='mt-1 flex items-center gap-2'>
                                <Progress
                                  value={factor.impact * 100}
                                  className='h-2 flex-1'
                                />
                                <span className='text-muted-foreground text-xs'>
                                  {Math.round(factor.impact * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* High-Risk Customers Table */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-red-500' />
                    High-Risk Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='border-b'>
                          <th className='p-2 text-left'>Customer ID</th>
                          <th className='p-2 text-left'>Risk Level</th>
                          <th className='p-2 text-left'>Churn Probability</th>
                          <th className='p-2 text-left'>LTV at Risk</th>
                          <th className='p-2 text-left'>Time to Churn</th>
                          <th className='p-2 text-left'>Primary Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.churn_predictions.predictions
                          .filter(
                            (p) =>
                              p.risk_level === 'critical' ||
                              p.risk_level === 'high'
                          )
                          .slice(0, 10)
                          .map((prediction) => (
                            <tr
                              key={prediction.customer_id}
                              className='border-b hover:bg-gray-50'
                            >
                              <td className='p-2 font-mono text-xs'>
                                {prediction.customer_id.slice(0, 8)}...
                              </td>
                              <td className='p-2'>
                                <Badge
                                  variant={
                                    prediction.risk_level === 'critical'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className='text-xs'
                                >
                                  {prediction.risk_level}
                                </Badge>
                              </td>
                              <td className='p-2'>
                                <div className='flex items-center gap-2'>
                                  <Progress
                                    value={prediction.churn_probability * 100}
                                    className='h-2 w-16'
                                  />
                                  <span className='text-xs'>
                                    {Math.round(
                                      prediction.churn_probability * 100
                                    )}
                                    %
                                  </span>
                                </div>
                              </td>
                              <td className='p-2 font-medium'>
                                {formatCurrency(
                                  prediction.predicted_ltv_remaining
                                )}
                              </td>
                              <td className='p-2'>
                                {prediction.time_to_churn_days ? (
                                  <div className='flex items-center gap-1'>
                                    <Clock className='h-3 w-3' />
                                    <span className='text-xs'>
                                      {prediction.time_to_churn_days}d
                                    </span>
                                  </div>
                                ) : (
                                  <span className='text-muted-foreground text-xs'>
                                    -
                                  </span>
                                )}
                              </td>
                              <td className='p-2'>
                                <span className='text-muted-foreground text-xs'>
                                  {prediction.recommended_actions[0]?.substring(
                                    0,
                                    30
                                  )}
                                  ...
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Retention Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Target className='h-5 w-5 text-green-500' />
                    Retention Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-3'>
                    {data.churn_predictions.insights.retention_opportunities.map(
                      (opportunity, index) => (
                        <Card key={index} className='border-green-200'>
                          <CardContent className='p-4'>
                            <h4 className='mb-2 font-semibold text-green-800'>
                              {opportunity.segment}
                            </h4>
                            <div className='space-y-2 text-sm'>
                              <div className='flex justify-between'>
                                <span>Customers:</span>
                                <span className='font-medium'>
                                  {opportunity.customer_count}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span>Potential:</span>
                                <span className='font-medium'>
                                  {formatCurrency(
                                    opportunity.potential_revenue
                                  )}
                                </span>
                              </div>
                              <div className='mt-3 rounded bg-green-50 p-2 text-xs'>
                                {opportunity.recommended_action}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className='py-12 text-center'>
                <Users className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <h3 className='mb-2 text-lg font-semibold'>
                  Keine Churn Daten
                </h3>
                <p className='text-muted-foreground'>
                  Laden Sie die Daten, um Churn Predictions zu sehen
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
