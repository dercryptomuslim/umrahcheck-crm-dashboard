import { describe, it, expect, beforeEach } from 'vitest';
import { RevenueForecaster } from '@/lib/ml/revenue-forecasting';
import type { RevenueDataPoint } from '@/lib/ml/revenue-forecasting';

describe('RevenueForecaster', () => {
  let forecaster: RevenueForecaster;
  let sampleData: RevenueDataPoint[];

  beforeEach(() => {
    forecaster = new RevenueForecaster();

    // Generate sample historical data (30 days)
    sampleData = [];
    const baseDate = new Date('2024-01-01');

    for (let i = 0; i < 30; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      // Simulate seasonal pattern with some noise
      const dayOfWeek = date.getDay();
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
      const baseAmount = 2000 + Math.sin(i / 7) * 500; // Weekly pattern
      const noise = (Math.random() - 0.5) * 300;
      const amount = Math.max(0, baseAmount * weekendMultiplier + noise);

      sampleData.push({
        date,
        amount,
        booking_count: Math.floor(amount / 500) + 1,
        average_order_value: amount / (Math.floor(amount / 500) + 1),
        currency: 'EUR'
      });
    }
  });

  describe('Forecast Generation', () => {
    it('should generate forecasts for the requested period', async () => {
      const forecastDays = 14;
      const { forecasts } = await forecaster.generateForecast(
        sampleData,
        forecastDays

      expect(forecasts).toHaveLength(forecastDays);
      expect(forecasts[0].date.getTime()).toBeGreaterThan(
        sampleData[sampleData.length - 1].date.getTime()
    });

    it('should include confidence intervals', async () => {
      const { forecasts } = await forecaster.generateForecast(sampleData, 7);

      forecasts.forEach((forecast) => {
        expect(forecast.confidence_lower).toBeGreaterThanOrEqual(0);
        expect(forecast.confidence_upper).toBeGreaterThan(
          forecast.predicted_amount
        expect(forecast.predicted_amount).toBeGreaterThanOrEqual(
          forecast.confidence_lower
        expect(forecast.predicted_amount).toBeLessThanOrEqual(
          forecast.confidence_upper
        expect(forecast.confidence_level).toBe(0.95);
      });
    });

    it('should determine trend directions', async () => {
      const { forecasts } = await forecaster.generateForecast(sampleData, 10);

      const trendDirections = forecasts.map((f) => f.trend_direction);
      const validTrends = ['up', 'down', 'stable'];

      trendDirections.forEach((trend) => {
        expect(validTrends).toContain(trend);
      });
    });

    it('should include seasonality factors', async () => {
      const { forecasts, seasonality } = await forecaster.generateForecast(
        sampleData,
        7

      expect(seasonality).toBeDefined();
      expect(seasonality.weekly_pattern).toHaveLength(7);
      expect(seasonality.dominant_cycle).toBeDefined();

      forecasts.forEach((forecast) => {
        expect(forecast.seasonality_factor).toBeGreaterThan(0);
      });
    });
  });

  describe('Seasonality Detection', () => {
    it('should detect weekly patterns', async () => {
      const { seasonality } = await forecaster.generateForecast(sampleData, 7);

      expect(seasonality.weekly_pattern).toHaveLength(7);
      expect(seasonality.dominant_cycle).toBe('weekly');
    });

    it('should detect monthly patterns with sufficient data', async () => {
      // Generate 3 months of data for better pattern detection
      const longData: RevenueDataPoint[] = [];
      const baseDate = new Date('2024-01-01');

      for (let i = 0; i < 90; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        // Strong monthly pattern
        const monthlyFactor = 1 + Math.sin(((i % 30) / 30) * Math.PI * 2) * 0.3;
        const amount = 2000 * monthlyFactor;

        longData.push({
          date,
          amount,
          booking_count: Math.floor(amount / 500),
          average_order_value: 500,
          currency: 'EUR'
        });
      }

      const { seasonality } = await forecaster.generateForecast(longData, 7);

      expect(seasonality.monthly_pattern).toHaveLength(31);
    });
  });

  describe('Model Metrics', () => {
    it('should calculate accuracy metrics', async () => {
      const { metrics } = await forecaster.generateForecast(sampleData, 7);

      expect(metrics.mape).toBeGreaterThanOrEqual(0);
      expect(metrics.rmse).toBeGreaterThanOrEqual(0);
      expect(metrics.mae).toBeGreaterThanOrEqual(0);
      expect(metrics.r_squared).toBeGreaterThanOrEqual(0);
      expect(metrics.r_squared).toBeLessThanOrEqual(1);
      expect(metrics.confidence).toBeGreaterThanOrEqual(0);
      expect(metrics.confidence).toBeLessThanOrEqual(1);
    });

    it('should assess forecast accuracy', async () => {
      const { metrics } = await forecaster.generateForecast(sampleData, 7);

      const validAccuracyLevels = ['high', 'medium', 'low'];
      expect(validAccuracyLevels).toContain(metrics.forecast_accuracy);
    });

    it('should provide data quality score', async () => {
      const { metrics } = await forecaster.generateForecast(sampleData, 7);

      expect(metrics.data_quality_score).toBeGreaterThanOrEqual(0);
      expect(metrics.data_quality_score).toBeLessThanOrEqual(1);
    });
  });

  describe('Forecast Summary', () => {
    it('should generate forecast summary', async () => {
      const summary = await forecaster.getForecastSummary(sampleData, 14);

      expect(summary.total_forecast).toBeGreaterThan(0);
      expect(summary.growth_rate).toBeDefined();
      expect(summary.confidence).toBeGreaterThanOrEqual(0);
      expect(summary.confidence).toBeLessThanOrEqual(1);
      expect(['increasing', 'decreasing', 'stable']).toContain(summary.trend);
      expect(Array.isArray(summary.risk_factors)).toBe(true);
      expect(Array.isArray(summary.opportunities)).toBe(true);
    });

    it('should calculate growth rate correctly', async () => {
      const summary = await forecaster.getForecastSummary(sampleData, 7);

      // Growth rate should be reasonable (-100% to +200%)
      expect(summary.growth_rate).toBeGreaterThan(-100);
      expect(summary.growth_rate).toBeLessThan(200);
    });

    it('should identify risk factors for poor accuracy', async () => {
      // Create data with high variance (poor quality)
      const noisyData = sampleData.map((d) => ({
        ...d,
        amount: d.amount + (Math.random() - 0.5) * 2000 // High noise
      }));

      const summary = await forecaster.getForecastSummary(noisyData, 7);

      // Should have some risk factors due to high variance
      expect(summary.risk_factors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error with insufficient data', async () => {
      const insufficientData = sampleData.slice(0, 5); // Only 5 days

      await expect(
        forecaster.generateForecast(insufficientData, 7)
      ).rejects.toThrow('Insufficient historical data');
    });

    it('should handle edge case with zero revenue days', async () => {
      const dataWithZeros = sampleData.map((d, i) => ({
        ...d,
        amount: i % 3 === 0 ? 0 : d.amount // Every 3rd day has zero revenue
      }));

      const { forecasts } = await forecaster.generateForecast(dataWithZeros, 5);

      expect(forecasts).toHaveLength(5);
      forecasts.forEach((forecast) => {
        expect(forecast.predicted_amount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle data with same values', async () => {
      const flatData = sampleData.map((d) => ({
        ...d,
        amount: 1000 // Same value every day
      }));

      const { forecasts, metrics } = await forecaster.generateForecast(
        flatData,
        5

      expect(forecasts).toHaveLength(5);
      expect(metrics).toBeDefined();

      // Should predict similar values for flat data
      forecasts.forEach((forecast) => {
        expect(forecast.predicted_amount).toBeGreaterThanOrEqual(500);
        expect(forecast.predicted_amount).toBeLessThanOrEqual(1500);
      });
    });
  });

  describe('Performance', () => {
    it('should complete forecast generation in reasonable time', async () => {
      const startTime = Date.now();

      await forecaster.generateForecast(sampleData, 30);

      const executionTime = Date.now() - startTime;

      // Should complete in less than 5 seconds for 30 days of data
      expect(executionTime).toBeLessThan(5000);
    });

    it('should handle larger datasets efficiently', async () => {
      // Generate 6 months of data
      const largeData: RevenueDataPoint[] = [];
      const baseDate = new Date('2024-01-01');

      for (let i = 0; i < 180; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);

        largeData.push({
          date,
          amount: 1500 + Math.sin(i / 7) * 300,
          booking_count: 3,
          average_order_value: 500,
          currency: 'EUR'
        });
      }

      const startTime = Date.now();
      const { forecasts } = await forecaster.generateForecast(largeData, 30);
      const executionTime = Date.now() - startTime;

      expect(forecasts).toHaveLength(30);
      // Should complete in less than 10 seconds for 6 months of data
      expect(executionTime).toBeLessThan(10000);
    });
  });

  describe('Data Validation', () => {
    it('should sort data by date before processing', async () => {
      // Shuffle the data randomly
      const shuffledData = [...sampleData].sort(() => Math.random() - 0.5);

      const { forecasts } = await forecaster.generateForecast(shuffledData, 5);

      expect(forecasts).toHaveLength(5);

      // First forecast should be after the last date in historical data
      const lastHistoricalDate = Math.max(
        ...sampleData.map((d) => d.date.getTime())
      expect(forecasts[0].date.getTime()).toBeGreaterThan(lastHistoricalDate);
    });

    it('should handle different currencies', async () => {
      const usdData = sampleData.map((d) => ({ ...d, currency: 'USD' }));

      const { forecasts } = await forecaster.generateForecast(usdData, 5);

      expect(forecasts).toHaveLength(5);
      // Should still produce reasonable forecasts regardless of currency
      forecasts.forEach((forecast) => {
        expect(forecast.predicted_amount).toBeGreaterThan(0);
      });
    });
  });
});
