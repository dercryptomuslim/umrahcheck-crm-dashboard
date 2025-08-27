import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerSegmentationEngine } from '@/lib/ml/customer-segmentation';
import type { CustomerSegmentationData } from '@/lib/ml/customer-segmentation';

describe('CustomerSegmentationEngine', () => {
  let engine: CustomerSegmentationEngine;
  let sampleCustomers: CustomerSegmentationData[];

  beforeEach(() => {
    engine = new CustomerSegmentationEngine();

    // Generate diverse sample customers for testing
    sampleCustomers = [
      // High-value frequent traveler
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174001',
        tenant_id: '456e7890-e12c-34d5-b678-426614174001',
        age: 42,
        gender: 'male',
        location_country: 'Germany',
        location_city: 'Berlin',
        language_preference: 'de',
        total_bookings: 8,
        total_spent: 15000,
        avg_booking_value: 1875,
        first_booking_date: new Date('2022-03-15'),
        last_booking_date: new Date('2024-01-20'),
        booking_frequency_days: 60,
        preferred_destinations: ['Mecca', 'Medina'],
        preferred_package_types: ['premium'],
        email_open_rate: 0.85,
        email_click_rate: 0.35,
        website_session_count: 45,
        avg_session_duration: 420,
        page_views_total: 180,
        social_media_engagement: 0.6,
        payment_method_preferences: ['credit_card'],
        payment_delays_count: 0,
        refund_requests_count: 0,
        cancellation_rate: 0.1,
        referral_count: 3,
        review_count: 5,
        avg_review_rating: 4.8,
        loyalty_program_tier: 'platinum',
        loyalty_points_balance: 2500,
        support_ticket_count: 1,
        avg_resolution_satisfaction: 5,
        communication_preferences: ['email'],
        travel_style: 'family',
        travel_frequency: 'frequent',
        booking_lead_time_days: 45,
        seasonal_pattern: ['spring', 'autumn'],
        budget_sensitivity: 'low',
        account_status: 'active',
        last_activity_date: new Date('2024-01-25'),
        created_at: new Date('2022-03-01'),
        updated_at: new Date('2024-01-25')
      },
      // Budget-conscious traveler
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174002',
        tenant_id: '456e7890-e12c-34d5-b678-426614174001',
        age: 28,
        gender: 'female',
        location_country: 'France',
        location_city: 'Paris',
        language_preference: 'fr',
        total_bookings: 3,
        total_spent: 2400,
        avg_booking_value: 800,
        first_booking_date: new Date('2023-05-10'),
        last_booking_date: new Date('2023-12-15'),
        booking_frequency_days: 120,
        preferred_destinations: ['Mecca'],
        preferred_package_types: ['economy'],
        email_open_rate: 0.45,
        email_click_rate: 0.15,
        website_session_count: 12,
        avg_session_duration: 180,
        page_views_total: 48,
        social_media_engagement: 0.3,
        payment_method_preferences: ['bank_transfer'],
        payment_delays_count: 1,
        refund_requests_count: 0,
        cancellation_rate: 0,
        referral_count: 0,
        review_count: 2,
        avg_review_rating: 4.2,
        loyalty_program_tier: 'bronze',
        loyalty_points_balance: 240,
        support_ticket_count: 2,
        avg_resolution_satisfaction: 4,
        communication_preferences: ['email', 'sms'],
        travel_style: 'solo',
        travel_frequency: 'occasional',
        booking_lead_time_days: 90,
        seasonal_pattern: ['summer'],
        budget_sensitivity: 'high',
        account_status: 'active',
        last_activity_date: new Date('2024-01-10'),
        created_at: new Date('2023-05-01'),
        updated_at: new Date('2024-01-10')
      },
      // Luxury seeker
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174003',
        tenant_id: '456e7890-e12c-34d5-b678-426614174001',
        age: 55,
        gender: 'male',
        location_country: 'UK',
        location_city: 'London',
        language_preference: 'en',
        total_bookings: 5,
        total_spent: 25000,
        avg_booking_value: 5000,
        first_booking_date: new Date('2021-08-20'),
        last_booking_date: new Date('2023-11-30'),
        booking_frequency_days: 180,
        preferred_destinations: ['Mecca', 'Medina'],
        preferred_package_types: ['luxury'],
        email_open_rate: 0.7,
        email_click_rate: 0.25,
        website_session_count: 25,
        avg_session_duration: 600,
        page_views_total: 150,
        social_media_engagement: 0.4,
        payment_method_preferences: ['credit_card'],
        payment_delays_count: 0,
        refund_requests_count: 1,
        cancellation_rate: 0.2,
        referral_count: 1,
        review_count: 3,
        avg_review_rating: 4.5,
        loyalty_program_tier: 'gold',
        loyalty_points_balance: 5000,
        support_ticket_count: 0,
        communication_preferences: ['email', 'phone'],
        travel_style: 'couple',
        travel_frequency: 'regular',
        booking_lead_time_days: 120,
        seasonal_pattern: ['winter', 'spring'],
        budget_sensitivity: 'low',
        account_status: 'active',
        last_activity_date: new Date('2024-01-05'),
        created_at: new Date('2021-08-01'),
        updated_at: new Date('2024-01-05')
      },
      // Inactive customer
      {
        customer_id: '123e4567-e89b-12d3-a456-426614174004',
        tenant_id: '456e7890-e12c-34d5-b678-426614174001',
        age: 35,
        gender: 'female',
        location_country: 'Spain',
        location_city: 'Madrid',
        language_preference: 'es',
        total_bookings: 2,
        total_spent: 3000,
        avg_booking_value: 1500,
        first_booking_date: new Date('2022-01-10'),
        last_booking_date: new Date('2022-08-15'),
        booking_frequency_days: 365,
        preferred_destinations: ['Medina'],
        preferred_package_types: ['standard'],
        email_open_rate: 0.25,
        email_click_rate: 0.05,
        website_session_count: 5,
        avg_session_duration: 120,
        page_views_total: 20,
        social_media_engagement: 0.1,
        payment_method_preferences: ['paypal'],
        payment_delays_count: 2,
        refund_requests_count: 1,
        cancellation_rate: 0.5,
        referral_count: 0,
        review_count: 1,
        avg_review_rating: 3.5,
        loyalty_program_tier: 'bronze',
        loyalty_points_balance: 150,
        support_ticket_count: 3,
        avg_resolution_satisfaction: 3,
        communication_preferences: ['email'],
        travel_style: 'family',
        travel_frequency: 'occasional',
        booking_lead_time_days: 60,
        seasonal_pattern: ['summer'],
        budget_sensitivity: 'medium',
        account_status: 'inactive',
        last_activity_date: new Date('2023-06-01'),
        created_at: new Date('2022-01-01'),
        updated_at: new Date('2023-06-01')
      }
    ];

    // Add more customers to meet minimum requirements
    for (let i = 5; i <= 50; i++) {
      sampleCustomers.push({
        customer_id: `123e4567-e89b-12d3-a456-42661417400${i}`,
        tenant_id: '456e7890-e12c-34d5-b678-426614174001',
        age: 25 + (i % 40),
        gender: i % 2 === 0 ? 'male' : 'female',
        location_country: ['Germany', 'France', 'UK', 'Spain', 'Italy'][i % 5],
        location_city: ['Berlin', 'Paris', 'London', 'Madrid', 'Rome'][i % 5],
        language_preference: ['de', 'fr', 'en', 'es', 'it'][i % 5],
        total_bookings: 1 + (i % 10),
        total_spent: 500 + i * 100,
        avg_booking_value: 500 + i * 50,
        first_booking_date: new Date(2023, i % 12, 1),
        last_booking_date:
          i % 3 === 0 ? new Date(2024, 0, (i % 28) + 1) : undefined,
        booking_frequency_days: 30 + i * 10,
        preferred_destinations: i % 2 === 0 ? ['Mecca'] : ['Medina'],
        preferred_package_types: [
          ['economy'],
          ['standard'],
          ['premium'],
          ['luxury']
        ][i % 4],
        email_open_rate: 0.1 + (i % 9) * 0.1,
        email_click_rate: 0.05 + (i % 6) * 0.05,
        website_session_count: i % 20,
        avg_session_duration: 60 + i * 10,
        page_views_total: i * 2,
        social_media_engagement: (i % 10) * 0.1,
        payment_method_preferences: [
          ['credit_card'],
          ['bank_transfer'],
          ['paypal'],
          ['installment']
        ][i % 4],
        payment_delays_count: i % 3,
        refund_requests_count: i % 4 === 0 ? 1 : 0,
        cancellation_rate: (i % 10) * 0.05,
        referral_count: i % 5,
        review_count: i % 3,
        avg_review_rating: i % 3 === 0 ? undefined : 3 + (i % 3) * 0.5,
        loyalty_program_tier: (
          ['bronze', 'silver', 'gold', 'platinum'] as const
        )[i % 4],
        loyalty_points_balance: i * 10,
        support_ticket_count: i % 4,
        avg_resolution_satisfaction: i % 4 === 0 ? undefined : 3 + (i % 3),
        communication_preferences: i % 2 === 0 ? ['email'] : ['email', 'sms'],
        travel_style: (['solo', 'couple', 'family', 'group'] as const)[i % 4],
        travel_frequency: (['occasional', 'regular', 'frequent'] as const)[
          i % 3
        ],
        booking_lead_time_days: 15 + (i % 10) * 15,
        seasonal_pattern: [['spring'], ['summer'], ['autumn'], ['winter']][
          i % 4
        ] as any,
        budget_sensitivity: (['low', 'medium', 'high'] as const)[i % 3],
        account_status: i % 10 === 0 ? 'inactive' : 'active',
        last_activity_date: new Date(2024, 0, (i % 30) + 1),
        created_at: new Date(2022 + (i % 3), i % 12, 1),
        updated_at: new Date(2024, 0, (i % 30) + 1)
      });
    }
  });

  describe('Segmentation Analysis', () => {
    it('should perform basic segmentation analysis', async () => {
      const analysis =
        await engine.performSegmentationAnalysis(sampleCustomers);

      expect(analysis).toBeDefined();
      expect(analysis.analysis_id).toBeDefined();
      expect(analysis.analysis_date).toBeInstanceOf(Date);
      expect(analysis.total_customers).toBe(sampleCustomers.length);
      expect(Array.isArray(analysis.segments)).toBe(true);
      expect(analysis.segments.length).toBeGreaterThan(0);
    });

    it('should create segments with required properties', async () => {
      const analysis =
        await engine.performSegmentationAnalysis(sampleCustomers);

      analysis.segments.forEach((segment) => {
        expect(segment).toHaveProperty('segment_id');
        expect(segment).toHaveProperty('segment_name');
        expect(segment).toHaveProperty('description');
        expect(segment).toHaveProperty('customer_count');
        expect(segment).toHaveProperty('total_value');
        expect(segment).toHaveProperty('avg_customer_value');
        expect(segment).toHaveProperty('growth_rate');
        expect(segment).toHaveProperty('churn_risk');
        expect(segment).toHaveProperty('engagement_level');
        expect(segment).toHaveProperty('profitability');
        expect(segment).toHaveProperty('characteristics');
        expect(segment).toHaveProperty('insights');
        expect(segment).toHaveProperty('metrics');

        // Validate segment characteristics
        expect(segment.characteristics).toHaveProperty('age_range');
        expect(segment.characteristics).toHaveProperty('avg_booking_value');
        expect(segment.characteristics).toHaveProperty('avg_booking_frequency');
        expect(segment.characteristics).toHaveProperty('top_destinations');
        expect(segment.characteristics).toHaveProperty(
          'preferred_package_types'

        // Validate segment insights
        expect(Array.isArray(segment.insights.key_behaviors)).toBe(true);
        expect(Array.isArray(segment.insights.opportunities)).toBe(true);
        expect(Array.isArray(segment.insights.risks)).toBe(true);
        expect(Array.isArray(segment.insights.recommended_strategies)).toBe(
          true

        // Validate segment metrics
        expect(typeof segment.metrics.lifetime_value).toBe('number');
        expect(typeof segment.metrics.retention_rate).toBe('number');
        expect(typeof segment.metrics.satisfaction_score).toBe('number');
      });
    });

    it('should respect segment count parameter', async () => {
      const segmentCount = 4;
      const analysis = await engine.performSegmentationAnalysis(
        sampleCustomers,
        {
          segment_count: segmentCount
        }

      expect(analysis.segments.length).toBeLessThanOrEqual(segmentCount + 5); // RFM adds segments
    });

    it('should respect minimum segment size', async () => {
      const minSegmentSize = 15;
      const analysis = await engine.performSegmentationAnalysis(
        sampleCustomers,
        {
          min_segment_size: minSegmentSize
        }

      analysis.segments.forEach((segment) => {
        expect(segment.customer_count).toBeGreaterThanOrEqual(minSegmentSize);
      });
    });

    it('should include RFM segmentation when requested', async () => {
      const analysis = await engine.performSegmentationAnalysis(
        sampleCustomers,
        {
          include_rfm: true
        }

      // Should have some RFM-based segments
      expect(analysis.segments.length).toBeGreaterThan(0);

      // Check if some segments have RFM-style names
      const segmentNames = analysis.segments.map((s) => s.segment_name);
      const hasRFMSegments = segmentNames.some((name) =>
        ['Champions', 'Loyal Customers', 'At Risk', 'Lost'].some((rfmName) =>
          name.includes(rfmName)
        )
      expect(hasRFMSegments).toBe(true);
    });

    it('should generate comprehensive insights', async () => {
      const analysis =
        await engine.performSegmentationAnalysis(sampleCustomers);

      expect(analysis.insights).toBeDefined();
      expect(analysis.insights.largest_segment).toBeDefined();
      expect(analysis.insights.most_valuable_segment).toBeDefined();
      expect(analysis.insights.fastest_growing_segment).toBeDefined();
      expect(analysis.insights.highest_risk_segment).toBeDefined();
      expect(analysis.insights.best_opportunity_segment).toBeDefined();

      // Validate that largest segment actually has the most customers
      const largestSegment = analysis.segments.find(
        (s) => s.segment_name === analysis.insights.largest_segment
      expect(largestSegment).toBeDefined();
      if (largestSegment) {
        const otherSegments = analysis.segments.filter(
          (s) => s.segment_name !== analysis.insights.largest_segment
        otherSegments.forEach((segment) => {
          expect(largestSegment.customer_count).toBeGreaterThanOrEqual(
            segment.customer_count
        });
      }
    });

    it('should provide strategic recommendations', async () => {
      const analysis =
        await engine.performSegmentationAnalysis(sampleCustomers);

      expect(Array.isArray(analysis.strategic_recommendations)).toBe(true);
      expect(analysis.strategic_recommendations.length).toBeGreaterThan(0);

      analysis.strategic_recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('recommendation');
        expect(rec).toHaveProperty('expected_impact');
        expect(rec).toHaveProperty('implementation_effort');

        expect(['low', 'medium', 'high', 'urgent']).toContain(rec.priority);
        expect([
          'acquisition',
          'retention',
          'growth',
          'optimization'
        ]).toContain(rec.category);
        expect(['low', 'medium', 'high']).toContain(rec.implementation_effort);
      });
    });

    it('should calculate quality metrics', async () => {
      const analysis =
        await engine.performSegmentationAnalysis(sampleCustomers);

      expect(analysis.quality_metrics).toBeDefined();
      expect(typeof analysis.quality_metrics.silhouette_score).toBe('number');
      expect(typeof analysis.quality_metrics.davies_bouldin_index).toBe(
        'number'
      expect(typeof analysis.quality_metrics.calinski_harabasz_index).toBe(
        'number'
      expect(typeof analysis.quality_metrics.segment_stability).toBe('number');
      expect(typeof analysis.quality_metrics.confidence_level).toBe('number');

      // Validate score ranges
      expect(analysis.quality_metrics.silhouette_score).toBeGreaterThanOrEqual(
        -1
      expect(analysis.quality_metrics.silhouette_score).toBeLessThanOrEqual(1);
      expect(analysis.quality_metrics.segment_stability).toBeGreaterThanOrEqual(
        0
      expect(analysis.quality_metrics.segment_stability).toBeLessThanOrEqual(1);
      expect(analysis.quality_metrics.confidence_level).toBeGreaterThanOrEqual(
        0
      expect(analysis.quality_metrics.confidence_level).toBeLessThanOrEqual(1);
    });
  });

  describe('Customer Segment Properties', () => {
    let analysis: any;

    beforeEach(async () => {
      analysis = await engine.performSegmentationAnalysis(sampleCustomers);
    });

    it('should assign appropriate churn risk levels', () => {
      analysis.segments.forEach((segment: any) => {
        expect(['low', 'medium', 'high']).toContain(segment.churn_risk);
      });

      // Check if inactive customers are in high-risk segments
      const highRiskSegments = analysis.segments.filter(
        (s: any) => s.churn_risk === 'high'
      expect(highRiskSegments.length).toBeGreaterThan(0);
    });

    it('should assign engagement levels correctly', () => {
      analysis.segments.forEach((segment: any) => {
        expect(['low', 'medium', 'high']).toContain(segment.engagement_level);
      });

      // High-engagement customers should be in high-engagement segments
      const highEngagementSegments = analysis.segments.filter(
        (s: any) => s.engagement_level === 'high'
      expect(highEngagementSegments.length).toBeGreaterThan(0);
    });

    it('should calculate growth rates properly', () => {
      analysis.segments.forEach((segment: any) => {
        expect(typeof segment.growth_rate).toBe('number');
        expect(segment.growth_rate).toBeGreaterThanOrEqual(0);
        expect(segment.growth_rate).toBeLessThanOrEqual(1);
      });
    });

    it('should determine profitability levels', () => {
      analysis.segments.forEach((segment: any) => {
        expect(['low', 'medium', 'high']).toContain(segment.profitability);
      });

      // High-value customers should be in high-profitability segments
      const highProfitabilitySegments = analysis.segments.filter(
        (s: any) => s.profitability === 'high'
      expect(highProfitabilitySegments.length).toBeGreaterThan(0);
    });

    it('should calculate accurate customer values', () => {
      analysis.segments.forEach((segment: any) => {
        expect(segment.total_value).toBeGreaterThanOrEqual(0);
        expect(segment.avg_customer_value).toBeGreaterThanOrEqual(0);

        // Average should match total / count
        const expectedAvg = segment.total_value / segment.customer_count;
        expect(Math.abs(segment.avg_customer_value - expectedAvg)).toBeLessThan(
          0.01
      });
    });

    it('should identify top destinations and package types', () => {
      analysis.segments.forEach((segment: any) => {
        expect(Array.isArray(segment.characteristics.top_destinations)).toBe(
          true
        expect(
          Array.isArray(segment.characteristics.preferred_package_types)
        ).toBe(true);

        segment.characteristics.top_destinations.forEach((dest: string) => {
          expect(typeof dest).toBe('string');
          expect(dest.length).toBeGreaterThan(0);
        });

        segment.characteristics.preferred_package_types.forEach(
          (type: string) => {
            expect(typeof type).toBe('string');
            expect(type.length).toBeGreaterThan(0);
          }
      });
    });

    it('should provide meaningful segment descriptions', () => {
      analysis.segments.forEach((segment: any) => {
        expect(typeof segment.description).toBe('string');
        expect(segment.description.length).toBeGreaterThan(10);
        expect(segment.description).toContain('€'); // Should mention value
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle insufficient customer data', async () => {
      const fewCustomers = sampleCustomers.slice(0, 5);

      await expect(
        engine.performSegmentationAnalysis(fewCustomers, {
          segment_count: 8,
          min_segment_size: 10
        })
      ).rejects.toThrow('Insufficient customer data');
    });

    it('should handle customers with minimal data', async () => {
      const minimalCustomers = sampleCustomers.map((customer) => ({
        ...customer,
        total_bookings: 0,
        total_spent: 0,
        email_open_rate: 0,
        email_click_rate: 0,
        avg_review_rating: undefined,
        avg_resolution_satisfaction: undefined
      }));

      const analysis =
        await engine.performSegmentationAnalysis(minimalCustomers);

      expect(analysis.segments.length).toBeGreaterThan(0);
      analysis.segments.forEach((segment) => {
        expect(segment.customer_count).toBeGreaterThan(0);
      });
    });

    it('should handle extreme customer values', async () => {
      const extremeCustomers = [...sampleCustomers];
      extremeCustomers[0] = {
        ...extremeCustomers[0],
        age: 120,
        total_spent: 1000000,
        booking_frequency_days: 1,
        email_open_rate: 1.0,
        email_click_rate: 1.0
      };

      const analysis =
        await engine.performSegmentationAnalysis(extremeCustomers);

      expect(analysis.segments.length).toBeGreaterThan(0);
      expect(analysis.total_customers).toBe(extremeCustomers.length);
    });

    it('should handle all customers in same segment scenario', async () => {
      // Create very similar customers
      const similarCustomers = sampleCustomers
        .slice(0, 20)
        .map((customer, index) => ({
          ...customer,
          customer_id: `similar-customer-${index}`,
          age: 30,
          total_spent: 5000,
          loyalty_program_tier: 'gold' as const,
          travel_style: 'family' as const
        }));

      const analysis =
        await engine.performSegmentationAnalysis(similarCustomers);

      expect(analysis.segments.length).toBeGreaterThan(0);
      expect(analysis.total_customers).toBe(similarCustomers.length);
    });
  });

  describe('Performance Tests', () => {
    it('should complete segmentation within reasonable time', async () => {
      const startTime = Date.now();

      await engine.performSegmentationAnalysis(sampleCustomers);

      const executionTime = Date.now() - startTime;

      // Should complete within 5 seconds for 50 customers
      expect(executionTime).toBeLessThan(5000);
    });

    it('should handle larger customer datasets efficiently', async () => {
      // Create larger dataset
      const largeDataset = [...sampleCustomers];
      for (let i = 51; i <= 200; i++) {
        largeDataset.push({
          ...sampleCustomers[0],
          customer_id: `customer-${i}`,
          age: 20 + (i % 50),
          total_spent: 1000 + i * 100,
          booking_frequency_days: 30 + (i % 300)
        });
      }

      const startTime = Date.now();

      const analysis = await engine.performSegmentationAnalysis(largeDataset, {
        segment_count: 6
      });

      const executionTime = Date.now() - startTime;

      expect(analysis.total_customers).toBe(200);
      expect(analysis.segments.length).toBeGreaterThan(0);

      // Should complete within 10 seconds for 200 customers
      expect(executionTime).toBeLessThan(10000);
    });
  });
});
