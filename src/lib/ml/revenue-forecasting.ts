/**
 * ML Revenue Forecasting Model
 * Phase 3.3: Predictive Analytics
 *
 * Time series forecasting using exponential smoothing and seasonal decomposition
 * for UmrahCheck CRM revenue predictions
 */

export interface RevenueDataPoint {
  date: Date;
  amount: number;
  booking_count: number;
  average_order_value: number;
  currency: string;
}

export interface RevenueForecast {
  date: Date;
  predicted_amount: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_level: number;
  trend_direction: 'up' | 'down' | 'stable';
  seasonality_factor: number;
}

export interface ForecastingMetrics {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  r_squared: number;
  confidence: number;
  forecast_accuracy: 'high' | 'medium' | 'low';
  data_quality_score: number;
}

export interface SeasonalityPattern {
  daily_pattern: number[];
  weekly_pattern: number[];
  monthly_pattern: number[];
  yearly_pattern: number[];
  dominant_cycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export class RevenueForecaster {
  private alpha = 0.3; // Level smoothing parameter
  private beta = 0.1; // Trend smoothing parameter
  private gamma = 0.1; // Seasonality smoothing parameter
  private seasonalPeriod = 7; // Weekly seasonality by default

  /**
   * Generate revenue forecast using Holt-Winters exponential smoothing
   */
  async generateForecast(
    historicalData: RevenueDataPoint[],
    forecastDays: number = 30,
    confidenceLevel: number = 0.95
  ): Promise<{
    forecasts: RevenueForecast[];
    metrics: ForecastingMetrics;
    seasonality: SeasonalityPattern;
  }> {
    // Validate input data
    if (historicalData.length < 14) {
      throw new Error('Insufficient historical data. Need at least 14 days.');
    }

    // Sort data by date
    const sortedData = historicalData.sort(
      (a, b) => a.date.getTime() - b.date.getTime()

    // Extract revenue series
    const revenue = sortedData.map((d) => d.amount);

    // Detect seasonality patterns
    const seasonality = this.detectSeasonality(sortedData);

    // Apply Holt-Winters forecasting
    const { forecasts: rawForecasts, components } = this.holtWinters(
      revenue,
      forecastDays,
      seasonality

    // Calculate confidence intervals
    const forecasts = this.calculateConfidenceIntervals(
      rawForecasts,
      components,
      sortedData,
      confidenceLevel

    // Calculate forecasting metrics
    const metrics = await this.calculateMetrics(
      sortedData.slice(-Math.min(30, sortedData.length)),
      forecasts.slice(0, Math.min(30, forecasts.length))

    return {
      forecasts,
      metrics,
      seasonality
    };
  }

  /**
   * Detect seasonality patterns in historical data
   */
  private detectSeasonality(data: RevenueDataPoint[]): SeasonalityPattern {
    const dailyPattern = new Array(24).fill(0);
    const weeklyPattern = new Array(7).fill(0);
    const monthlyPattern = new Array(31).fill(0);
    const yearlyPattern = new Array(12).fill(0);

    // Group data by time periods
    const dailyGroups: { [key: number]: number[] } = {};
    const weeklyGroups: { [key: number]: number[] } = {};
    const monthlyGroups: { [key: number]: number[] } = {};
    const yearlyGroups: { [key: number]: number[] } = {};

    data.forEach((point) => {
      const date = new Date(point.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate() - 1;
      const month = date.getMonth();

      // Group by patterns
      if (!dailyGroups[hour]) dailyGroups[hour] = [];
      if (!weeklyGroups[dayOfWeek]) weeklyGroups[dayOfWeek] = [];
      if (!monthlyGroups[dayOfMonth]) monthlyGroups[dayOfMonth] = [];
      if (!yearlyGroups[month]) yearlyGroups[month] = [];

      dailyGroups[hour].push(point.amount);
      weeklyGroups[dayOfWeek].push(point.amount);
      monthlyGroups[dayOfMonth].push(point.amount);
      yearlyGroups[month].push(point.amount);
    });

    // Calculate average for each pattern
    Object.keys(dailyGroups).forEach((hour) => {
      const avg =
        dailyGroups[+hour].reduce((a, b) => a + b, 0) /
        dailyGroups[+hour].length;
      dailyPattern[+hour] = avg;
    });

    Object.keys(weeklyGroups).forEach((day) => {
      const avg =
        weeklyGroups[+day].reduce((a, b) => a + b, 0) /
        weeklyGroups[+day].length;
      weeklyPattern[+day] = avg;
    });

    Object.keys(monthlyGroups).forEach((day) => {
      const avg =
        monthlyGroups[+day].reduce((a, b) => a + b, 0) /
        monthlyGroups[+day].length;
      monthlyPattern[+day] = avg;
    });

    Object.keys(yearlyGroups).forEach((month) => {
      const avg =
        yearlyGroups[+month].reduce((a, b) => a + b, 0) /
        yearlyGroups[+month].length;
      yearlyPattern[+month] = avg;
    });

    // Determine dominant cycle based on variance
    const weeklyVariance = this.calculateVariance(weeklyPattern);
    const monthlyVariance = this.calculateVariance(monthlyPattern.slice(0, 30));
    const yearlyVariance = this.calculateVariance(yearlyPattern);

    let dominantCycle: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly';
    const maxVariance = Math.max(
      weeklyVariance,
      monthlyVariance,
      yearlyVariance

    if (maxVariance === yearlyVariance) dominantCycle = 'yearly';
    else if (maxVariance === monthlyVariance) dominantCycle = 'monthly';
    else dominantCycle = 'weekly';

    return {
      daily_pattern: dailyPattern,
      weekly_pattern: weeklyPattern,
      monthly_pattern: monthlyPattern,
      yearly_pattern: yearlyPattern,
      dominant_cycle: dominantCycle
    };
  }

  /**
   * Holt-Winters exponential smoothing algorithm
   */
  private holtWinters(
    data: number[],
    forecastPeriods: number,
    seasonality: SeasonalityPattern
  ): {
    forecasts: number[];
    components: {
      level: number[];
      trend: number[];
      seasonal: number[];
    };
  } {
    const n = data.length;
    const s = this.seasonalPeriod;

    // Initialize components
    const level = new Array(n);
    const trend = new Array(n);
    const seasonal = new Array(n + forecastPeriods);

    // Initialize seasonal components
    const seasonalPattern = seasonality.weekly_pattern;
    for (let i = 0; i < n + forecastPeriods; i++) {
      seasonal[i] =
        seasonalPattern[i % seasonalPattern.length] /
        (seasonalPattern.reduce((a, b) => a + b, 0) / seasonalPattern.length);
    }

    // Initialize level and trend
    level[0] = data[0];
    trend[0] = data.length > 1 ? data[1] - data[0] : 0;

    // Apply Holt-Winters equations
    for (let i = 1; i < n; i++) {
      const prevLevel = level[i - 1];
      const prevTrend = trend[i - 1];
      const prevSeasonal = seasonal[i - s] || seasonal[i % s];

      // Level equation
      level[i] =
        this.alpha * (data[i] / prevSeasonal) +
        (1 - this.alpha) * (prevLevel + prevTrend);

      // Trend equation
      trend[i] =
        this.beta * (level[i] - prevLevel) + (1 - this.beta) * prevTrend;

      // Seasonal equation (if we have enough history)
      if (i >= s) {
        seasonal[i] =
          this.gamma * (data[i] / level[i]) +
          (1 - this.gamma) * seasonal[i - s];
      }
    }

    // Generate forecasts
    const forecasts = new Array(forecastPeriods);
    for (let i = 0; i < forecastPeriods; i++) {
      const forecastLevel = level[n - 1] + (i + 1) * trend[n - 1];
      const forecastSeasonal = seasonal[n + i - s] || seasonal[(n + i) % s];
      forecasts[i] = Math.max(0, forecastLevel * forecastSeasonal);
    }

    return {
      forecasts,
      components: { level, trend, seasonal }
    };
  }

  /**
   * Calculate confidence intervals for forecasts
   */
  private calculateConfidenceIntervals(
    forecasts: number[],
    components: any,
    historicalData: RevenueDataPoint[],
    confidenceLevel: number
  ): RevenueForecast[] {
    const residuals = this.calculateResiduals(historicalData, components);
    const residualStd = Math.sqrt(this.calculateVariance(residuals));

    // Z-score for confidence level
    const zScore =
      confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.9 ? 1.645 : 2.576;

    const result: RevenueForecast[] = [];
    const baseDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 0; i < forecasts.length; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      const prediction = forecasts[i];
      const errorMargin = zScore * residualStd * Math.sqrt(i + 1); // Error grows with distance

      // Determine trend direction
      const trendDirection =
        i > 0
          ? forecasts[i] > forecasts[i - 1]
            ? 'up'
            : forecasts[i] < forecasts[i - 1]
              ? 'down'
              : 'stable'
          : 'stable';

      result.push({
        date: forecastDate,
        predicted_amount: Math.round(prediction * 100) / 100,
        confidence_lower: Math.max(
          0,
          Math.round((prediction - errorMargin) * 100) / 100
        ),
        confidence_upper: Math.round((prediction + errorMargin) * 100) / 100,
        confidence_level: confidenceLevel,
        trend_direction: trendDirection,
        seasonality_factor:
          components.seasonal[
            components.seasonal.length - forecasts.length + i
          ] || 1.0
      });
    }

    return result;
  }

  /**
   * Calculate forecasting accuracy metrics
   */
  private async calculateMetrics(
    actual: RevenueDataPoint[],
    forecasts: RevenueForecast[]
  ): Promise<ForecastingMetrics> {
    const minLength = Math.min(actual.length, forecasts.length);
    let mapeSum = 0;
    let mseSum = 0;
    let maeSum = 0;
    let actualSum = 0;
    let forecastSum = 0;
    let actualSumSq = 0;
    let forecastSumSq = 0;

    for (let i = 0; i < minLength; i++) {
      const a = actual[i].amount;
      const f = forecasts[i].predicted_amount;

      mapeSum += Math.abs((a - f) / a);
      mseSum += Math.pow(a - f, 2);
      maeSum += Math.abs(a - f);
      actualSum += a;
      forecastSum += f;
      actualSumSq += a * a;
      forecastSumSq += f * f;
    }

    const mape = (mapeSum / minLength) * 100;
    const rmse = Math.sqrt(mseSum / minLength);
    const mae = maeSum / minLength;

    // Calculate R-squared
    const actualMean = actualSum / minLength;
    const forecastMean = forecastSum / minLength;

    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < minLength; i++) {
      const a = actual[i].amount;
      const f = forecasts[i].predicted_amount;
      ssRes += Math.pow(a - f, 2);
      ssTot += Math.pow(a - actualMean, 2);
    }

    const rSquared = Math.max(0, 1 - ssRes / ssTot);

    // Determine forecast accuracy rating
    let forecastAccuracy: 'high' | 'medium' | 'low';
    if (mape < 10 && rSquared > 0.8) forecastAccuracy = 'high';
    else if (mape < 20 && rSquared > 0.6) forecastAccuracy = 'medium';
    else forecastAccuracy = 'low';

    // Data quality score (based on data consistency and completeness)
    const dataQualityScore = Math.min(1.0, minLength / 30) * (rSquared + 0.2);

    return {
      mape: Math.round(mape * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
      r_squared: Math.round(rSquared * 1000) / 1000,
      confidence: Math.max(0, Math.min(1, (100 - mape) / 100)),
      forecast_accuracy: forecastAccuracy,
      data_quality_score: Math.round(dataQualityScore * 1000) / 1000
    };
  }

  /**
   * Calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length;
    return variance;
  }

  /**
   * Calculate residuals for error analysis
   */
  private calculateResiduals(
    historical: RevenueDataPoint[],
    components: any
  ): number[] {
    const residuals: number[] = [];

    for (
      let i = 0;
      i < Math.min(historical.length, components.level.length);
      i++
    ) {
      const actual = historical[i].amount;
      const fitted = components.level[i] * (components.seasonal[i] || 1);
      residuals.push(actual - fitted);
    }

    return residuals;
  }

  /**
   * Get revenue forecast summary for dashboard
   */
  async getForecastSummary(
    historicalData: RevenueDataPoint[],
    days: number = 30
  ): Promise<{
    total_forecast: number;
    growth_rate: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    risk_factors: string[];
    opportunities: string[];
  }> {
    const { forecasts, metrics } = await this.generateForecast(
      historicalData,
      days

    const totalForecast = forecasts.reduce(
      (sum, f) => sum + f.predicted_amount,
      0
    const currentPeriodRevenue = historicalData
      .slice(-days)
      .reduce((sum, d) => sum + d.amount, 0);

    const growthRate =
      currentPeriodRevenue > 0
        ? ((totalForecast - currentPeriodRevenue) / currentPeriodRevenue) * 100
        : 0;

    // Determine overall trend
    const trendCounts = forecasts.reduce(
      (acc, f) => {
        acc[f.trend_direction]++;
        return acc;
      },
      { up: 0, down: 0, stable: 0 }

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (
      trendCounts.up > trendCounts.down &&
      trendCounts.up > trendCounts.stable
    ) {
      trend = 'increasing';
    } else if (
      trendCounts.down > trendCounts.up &&
      trendCounts.down > trendCounts.stable
    ) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    // Identify risk factors and opportunities
    const riskFactors: string[] = [];
    const opportunities: string[] = [];

    if (metrics.forecast_accuracy === 'low') {
      riskFactors.push('Low forecast accuracy - results may be unreliable');
    }
    if (growthRate < -10) {
      riskFactors.push('Significant revenue decline predicted');
    }
    if (metrics.data_quality_score < 0.7) {
      riskFactors.push('Insufficient historical data quality');
    }

    if (growthRate > 10) {
      opportunities.push('Strong revenue growth expected');
    }
    if (trend === 'increasing') {
      opportunities.push('Positive trend momentum');
    }
    if (metrics.confidence > 0.8) {
      opportunities.push('High confidence predictions - good for planning');
    }

    return {
      total_forecast: Math.round(totalForecast * 100) / 100,
      growth_rate: Math.round(growthRate * 100) / 100,
      confidence: metrics.confidence,
      trend,
      risk_factors: riskFactors,
      opportunities
    };
  }
}

// Export singleton instance
export const revenueForecaster = new RevenueForecaster();
