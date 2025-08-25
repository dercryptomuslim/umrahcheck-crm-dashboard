import { describe, it, expect, beforeEach } from 'vitest';
import { ChurnPredictor } from '@/lib/ml/churn-prediction';
import type { CustomerBehavior } from '@/lib/ml/churn-prediction';

describe('ChurnPredictor', () => {
  let predictor: ChurnPredictor;
  let sampleCustomers: CustomerBehavior[];

  beforeEach(() => {
    predictor = new ChurnPredictor();

    // Generate sample customer behavior data
    sampleCustomers = [
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174001',
        total_bookings: 5,
        total_spent: 7500,
        avg_booking_value: 1500,
        last_booking_days_ago: 45,
        booking_frequency_days: 90,
        email_open_rate: 0.75,
        email_click_rate: 0.25,
        website_visits_last_30d: 8,
        support_tickets_count: 1,
        refund_requests: 0,
        preferred_destination_changes: 1,
        payment_delays: 0,
        mobile_app_usage: 0.6,
        newsletter_subscribed: true,
        referral_count: 2,
        account_age_days: 365,
        last_login_days_ago: 7,
        profile_completion: 0.9
      },
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174002',
        total_bookings: 1,
        total_spent: 800,
        avg_booking_value: 800,
        last_booking_days_ago: 180,
        booking_frequency_days: 365,
        email_open_rate: 0.1,
        email_click_rate: 0.0,
        website_visits_last_30d: 0,
        support_tickets_count: 3,
        refund_requests: 1,
        preferred_destination_changes: 0,
        payment_delays: 2,
        mobile_app_usage: 0.1,
        newsletter_subscribed: false,
        referral_count: 0,
        account_age_days: 200,
        last_login_days_ago: 90,
        profile_completion: 0.3
      },
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174003',
        total_bookings: 0,
        total_spent: 0,
        avg_booking_value: 0,
        last_booking_days_ago: 999,
        booking_frequency_days: 365,
        email_open_rate: 0.0,
        email_click_rate: 0.0,
        website_visits_last_30d: 2,
        support_tickets_count: 0,
        refund_requests: 0,
        preferred_destination_changes: 0,
        payment_delays: 0,
        mobile_app_usage: 0.0,
        newsletter_subscribed: true,
        referral_count: 0,
        account_age_days: 30,
        last_login_days_ago: 15,
        profile_completion: 0.5
      }
    ];
  });

  describe('Single Customer Churn Prediction', () => {
    it('should predict churn risk for a single customer', () => {
      const prediction = predictor.predictChurnRisk(sampleCustomers[0]);

      expect(prediction.customer_id).toBe(sampleCustomers[0].customer_id);
      expect(prediction.churn_probability).toBeGreaterThanOrEqual(0);
      expect(prediction.churn_probability).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(
        prediction.risk_level
      );
    });

    it('should identify high-risk customer correctly', () => {
      const highRiskCustomer = sampleCustomers[1]; // Customer with poor metrics
      const prediction = predictor.predictChurnRisk(highRiskCustomer);

      expect(prediction.churn_probability).toBeGreaterThan(0.5);
      expect(['high', 'critical']).toContain(prediction.risk_level);
      expect(prediction.primary_risk_factors.length).toBeGreaterThan(0);
    });

    it('should identify low-risk customer correctly', () => {
      const lowRiskCustomer = sampleCustomers[0]; // Customer with good metrics
      const prediction = predictor.predictChurnRisk(lowRiskCustomer);

      expect(prediction.churn_probability).toBeLessThan(0.7);
      expect(prediction.retention_score).toBeGreaterThan(0.3);
    });

    it('should calculate retention score as inverse of churn probability', () => {
      const prediction = predictor.predictChurnRisk(sampleCustomers[0]);

      const expectedRetentionScore = 1 - prediction.churn_probability;
      expect(
        Math.abs(prediction.retention_score - expectedRetentionScore)
      ).toBeLessThan(0.001);
    });

    it('should estimate remaining lifetime value', () => {
      const prediction = predictor.predictChurnRisk(sampleCustomers[0]);

      expect(prediction.predicted_ltv_remaining).toBeGreaterThanOrEqual(0);
      // High-value customer should have higher LTV
      expect(prediction.predicted_ltv_remaining).toBeGreaterThan(0);
    });

    it('should provide actionable recommendations', () => {
      const prediction = predictor.predictChurnRisk(sampleCustomers[1]);

      expect(Array.isArray(prediction.recommended_actions)).toBe(true);
      expect(prediction.recommended_actions.length).toBeGreaterThan(0);
      expect(prediction.recommended_actions.length).toBeLessThanOrEqual(4);
    });
  });

  describe('Risk Factor Identification', () => {
    it('should identify booking recency issues', () => {
      const oldBookingCustomer = {
        ...sampleCustomers[0],
        last_booking_days_ago: 200
      };

      const prediction = predictor.predictChurnRisk(oldBookingCustomer);

      expect(
        prediction.primary_risk_factors.some(
          (factor) => factor.includes('booking') && factor.includes('days')
        )
      ).toBe(true);
    });

    it('should identify email engagement issues', () => {
      const poorEngagementCustomer = {
        ...sampleCustomers[0],
        email_open_rate: 0.05,
        email_click_rate: 0.01
      };

      const prediction = predictor.predictChurnRisk(poorEngagementCustomer);

      expect(
        prediction.primary_risk_factors.some((factor) =>
          factor.toLowerCase().includes('email')
        )
      ).toBe(true);
    });

    it('should identify support ticket issues', () => {
      const highSupportCustomer = {
        ...sampleCustomers[0],
        support_tickets_count: 5
      };

      const prediction = predictor.predictChurnRisk(highSupportCustomer);

      expect(
        prediction.primary_risk_factors.some((factor) =>
          factor.toLowerCase().includes('support')
        )
      ).toBe(true);
    });

    it('should identify payment reliability issues', () => {
      const paymentIssuesCustomer = {
        ...sampleCustomers[0],
        payment_delays: 3
      };

      const prediction = predictor.predictChurnRisk(paymentIssuesCustomer);

      expect(
        prediction.primary_risk_factors.some((factor) =>
          factor.toLowerCase().includes('payment')
        )
      ).toBe(true);
    });
  });

  describe('Batch Churn Prediction', () => {
    it('should process multiple customers', async () => {
      const predictions = await predictor.batchPredictChurn(sampleCustomers);

      expect(predictions).toHaveLength(sampleCustomers.length);
      predictions.forEach((prediction) => {
        expect(prediction.customer_id).toBeDefined();
        expect(prediction.churn_probability).toBeGreaterThanOrEqual(0);
        expect(prediction.churn_probability).toBeLessThanOrEqual(1);
      });
    });

    it('should sort by risk level when prioritizing high value', async () => {
      const predictions = await predictor.batchPredictChurn(sampleCustomers, {
        prioritize_high_value: true
      });

      // Should be sorted by risk * value (descending)
      expect(predictions.length).toBeGreaterThan(0);

      for (let i = 1; i < predictions.length; i++) {
        const current =
          predictions[i - 1].churn_probability *
          predictions[i - 1].predicted_ltv_remaining;
        const next =
          predictions[i].churn_probability *
          predictions[i].predicted_ltv_remaining;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should filter by minimum confidence', async () => {
      const minConfidence = 0.7;
      const predictions = await predictor.batchPredictChurn(sampleCustomers, {
        min_confidence: minConfidence
      });

      predictions.forEach((prediction) => {
        expect(prediction.confidence).toBeGreaterThanOrEqual(minConfidence);
      });
    });

    it('should limit results when max_results is specified', async () => {
      const maxResults = 2;
      const predictions = await predictor.batchPredictChurn(sampleCustomers, {
        max_results: maxResults
      });

      expect(predictions.length).toBeLessThanOrEqual(maxResults);
    });
  });

  describe('Churn Insights Generation', () => {
    it('should generate comprehensive insights', async () => {
      const insights = await predictor.generateChurnInsights(sampleCustomers);

      expect(insights.total_customers).toBe(sampleCustomers.length);
      expect(insights.high_risk_count).toBeGreaterThanOrEqual(0);
      expect(insights.churn_rate_trend).toBeDefined();
      expect(Array.isArray(insights.top_risk_factors)).toBe(true);
      expect(Array.isArray(insights.retention_opportunities)).toBe(true);
    });

    it('should identify top risk factors across all customers', async () => {
      const insights = await predictor.generateChurnInsights(sampleCustomers);

      expect(insights.top_risk_factors.length).toBeGreaterThan(0);
      insights.top_risk_factors.forEach((factor) => {
        expect(factor.factor).toBeDefined();
        expect(factor.impact).toBeGreaterThanOrEqual(0);
        expect(factor.impact).toBeLessThanOrEqual(1);
        expect(factor.frequency).toBeGreaterThan(0);
      });
    });

    it('should identify retention opportunities', async () => {
      const insights = await predictor.generateChurnInsights(sampleCustomers);

      insights.retention_opportunities.forEach((opportunity) => {
        expect(opportunity.segment).toBeDefined();
        expect(opportunity.customer_count).toBeGreaterThan(0);
        expect(opportunity.potential_revenue).toBeGreaterThanOrEqual(0);
        expect(opportunity.recommended_action).toBeDefined();
      });
    });
  });

  describe('Time to Churn Estimation', () => {
    it('should estimate time to churn for high-risk customers', () => {
      const highRiskCustomer = sampleCustomers[1];
      const prediction = predictor.predictChurnRisk(highRiskCustomer);

      if (prediction.churn_probability >= 0.3) {
        expect(prediction.time_to_churn_days).toBeGreaterThan(0);
        expect(prediction.time_to_churn_days).toBeLessThan(365);
      } else {
        expect(prediction.time_to_churn_days).toBeNull();
      }
    });

    it('should return null for low-risk customers', () => {
      const lowRiskCustomer = {
        ...sampleCustomers[0],
        last_booking_days_ago: 15,
        email_open_rate: 0.9,
        email_click_rate: 0.4
      };

      const prediction = predictor.predictChurnRisk(lowRiskCustomer);

      if (prediction.churn_probability < 0.3) {
        expect(prediction.time_to_churn_days).toBeNull();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle customer with all zero values', () => {
      const zeroCustomer: CustomerBehavior = {
        customer_id: '123e4567-e89b-12d3-a456-426614174999',
        total_bookings: 0,
        total_spent: 0,
        avg_booking_value: 0,
        last_booking_days_ago: 999,
        booking_frequency_days: 365,
        email_open_rate: 0,
        email_click_rate: 0,
        website_visits_last_30d: 0,
        support_tickets_count: 0,
        refund_requests: 0,
        preferred_destination_changes: 0,
        payment_delays: 0,
        mobile_app_usage: 0,
        newsletter_subscribed: false,
        referral_count: 0,
        account_age_days: 1,
        last_login_days_ago: 999,
        profile_completion: 0
      };

      const prediction = predictor.predictChurnRisk(zeroCustomer);

      expect(prediction.churn_probability).toBeGreaterThanOrEqual(0);
      expect(prediction.churn_probability).toBeLessThanOrEqual(1);
      expect(prediction.risk_level).toBeDefined();
    });

    it('should handle customer with perfect values', () => {
      const perfectCustomer: CustomerBehavior = {
        customer_id: '123e4567-e89b-12d3-a456-426614174998',
        total_bookings: 10,
        total_spent: 50000,
        avg_booking_value: 5000,
        last_booking_days_ago: 1,
        booking_frequency_days: 30,
        email_open_rate: 1.0,
        email_click_rate: 0.8,
        website_visits_last_30d: 25,
        support_tickets_count: 0,
        refund_requests: 0,
        preferred_destination_changes: 0,
        payment_delays: 0,
        mobile_app_usage: 1.0,
        newsletter_subscribed: true,
        referral_count: 5,
        account_age_days: 1095, // 3 years
        last_login_days_ago: 1,
        profile_completion: 1.0
      };

      const prediction = predictor.predictChurnRisk(perfectCustomer);

      expect(prediction.churn_probability).toBeLessThan(0.3);
      expect(prediction.risk_level).toBe('low');
      expect(prediction.retention_score).toBeGreaterThan(0.7);
    });

    it('should handle empty customer list for insights', async () => {
      const insights = await predictor.generateChurnInsights([]);

      expect(insights.total_customers).toBe(0);
      expect(insights.high_risk_count).toBe(0);
      expect(insights.top_risk_factors).toHaveLength(0);
      expect(insights.retention_opportunities).toHaveLength(0);
    });
  });

  describe('Feature Normalization', () => {
    it('should normalize recency values correctly', () => {
      const recentCustomer = {
        ...sampleCustomers[0],
        last_booking_days_ago: 5
      };

      const oldCustomer = {
        ...sampleCustomers[0],
        last_booking_days_ago: 100
      };

      const recentPrediction = predictor.predictChurnRisk(recentCustomer);
      const oldPrediction = predictor.predictChurnRisk(oldCustomer);

      // Recent customer should have lower churn probability
      expect(recentPrediction.churn_probability).toBeLessThan(
        oldPrediction.churn_probability
      );
    });

    it('should normalize frequency values correctly', () => {
      const frequentCustomer = {
        ...sampleCustomers[0],
        booking_frequency_days: 30
      };

      const infrequentCustomer = {
        ...sampleCustomers[0],
        booking_frequency_days: 300
      };

      const frequentPrediction = predictor.predictChurnRisk(frequentCustomer);
      const infrequentPrediction =
        predictor.predictChurnRisk(infrequentCustomer);

      // Frequent customer should have lower churn probability
      expect(frequentPrediction.churn_probability).toBeLessThan(
        infrequentPrediction.churn_probability
      );
    });

    it('should normalize monetary values correctly', () => {
      const highValueCustomer = {
        ...sampleCustomers[0],
        total_spent: 20000,
        avg_booking_value: 4000
      };

      const lowValueCustomer = {
        ...sampleCustomers[0],
        total_spent: 500,
        avg_booking_value: 500
      };

      const highValuePrediction = predictor.predictChurnRisk(highValueCustomer);
      const lowValuePrediction = predictor.predictChurnRisk(lowValueCustomer);

      // High-value customer should have lower churn probability
      expect(highValuePrediction.churn_probability).toBeLessThan(
        lowValuePrediction.churn_probability
      );
      expect(highValuePrediction.predicted_ltv_remaining).toBeGreaterThan(
        lowValuePrediction.predicted_ltv_remaining
      );
    });
  });

  describe('Performance', () => {
    it('should process single prediction quickly', () => {
      const startTime = Date.now();

      predictor.predictChurnRisk(sampleCustomers[0]);

      const executionTime = Date.now() - startTime;

      // Should complete in less than 100ms
      expect(executionTime).toBeLessThan(100);
    });

    it('should handle large batch efficiently', async () => {
      // Create a large batch of customers
      const largeBatch: CustomerBehavior[] = [];
      for (let i = 0; i < 100; i++) {
        largeBatch.push({
          ...sampleCustomers[i % sampleCustomers.length],
          customer_id: `customer-${i}`
        });
      }

      const startTime = Date.now();
      const predictions = await predictor.batchPredictChurn(largeBatch);
      const executionTime = Date.now() - startTime;

      expect(predictions.length).toBeLessThanOrEqual(100);
      // Should complete in less than 1 second for 100 customers
      expect(executionTime).toBeLessThan(1000);
    });
  });
});
