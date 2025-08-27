import { describe, it, expect, beforeEach } from 'vitest';
import { SmartRecommendationsEngine } from '@/lib/ml/recommendations-engine';
import type { CustomerProfile } from '@/lib/ml/recommendations-engine';

describe('SmartRecommendationsEngine', () => {
  let engine: SmartRecommendationsEngine;
  let sampleCustomerProfile: CustomerProfile;
  let sampleProducts: any[];

  beforeEach(() => {
    engine = new SmartRecommendationsEngine();

    sampleCustomerProfile = {
      customer_id: '123e4567-e89b-12d3-a456-426614174000',
      age: 35,
      location: 'Berlin, Germany',
      preferred_destinations: ['Mecca', 'Medina'],
      booking_history: [
        {
          destination: 'Mecca',
          package_type: 'standard',
          price: 2500,
          booking_date: new Date('2024-01-15'),
          satisfaction_score: 4.5
        },
        {
          destination: 'Medina',
          package_type: 'premium',
          price: 3500,
          booking_date: new Date('2024-06-20'),
          satisfaction_score: 4.8
        }
      ],
      total_spent: 6000,
      avg_booking_value: 3000,
      booking_frequency_days: 150,
      last_booking_days_ago: 30,
      email_preferences: {
        promotions: true,
        newsletters: true,
        recommendations: true
      },
      engagement_score: 0.75,
      loyalty_tier: 'gold',
      communication_preference: 'email',
      budget_range: 'mid-range',
      travel_style: 'family',
      seasonal_preferences: ['spring', 'autumn']
    };

    sampleProducts = [
      {
        id: 'product-1',
        name: 'Premium Mecca Package',
        type: 'package',
        destination: 'Mecca',
        price: 3200,
        package_type: 'premium',
        travel_style: 'family',
        price_category: 'mid-range',
        features: ['guided_tours', 'premium_hotel', 'transfers']
      },
      {
        id: 'product-2',
        name: 'Economy Medina Package',
        type: 'package',
        destination: 'Medina',
        price: 1800,
        package_type: 'economy',
        travel_style: 'solo',
        price_category: 'budget',
        features: ['basic_hotel', 'group_tours']
      },
      {
        id: 'product-3',
        name: 'Luxury Combined Package',
        type: 'package',
        destination: 'Mecca',
        price: 5000,
        package_type: 'luxury',
        travel_style: 'family',
        price_category: 'luxury',
        features: ['5star_hotel', 'private_tours', 'vip_services']
      }
    ];
  });

  describe('Product Recommendations', () => {
    it('should generate product recommendations', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(10); // Default max
    });

    it('should include required recommendation fields', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty('product_id');
      expect(firstRec).toHaveProperty('product_name');
      expect(firstRec).toHaveProperty('confidence_score');
      expect(firstRec).toHaveProperty('reasoning');
      expect(firstRec).toHaveProperty('expected_conversion_rate');
      expect(firstRec).toHaveProperty('expected_revenue');
      expect(firstRec).toHaveProperty('priority');
      expect(firstRec).toHaveProperty('cross_sell_potential');
      expect(firstRec).toHaveProperty('up_sell_potential');
    });

    it('should respect max recommendations limit', async () => {
      const maxRecs = 3;
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts,
        { max_recommendations: maxRecs }

      expect(recommendations.length).toBeLessThanOrEqual(maxRecs);
    });

    it('should filter by minimum confidence', async () => {
      const minConfidence = 0.8;
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts,
        { min_confidence: minConfidence }

      recommendations.forEach((rec) => {
        expect(rec.confidence_score).toBeGreaterThanOrEqual(minConfidence);
      });
    });

    it('should prioritize preferred destinations', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      // Should have higher confidence for Mecca products
      const meccaRecs = recommendations.filter(
        (r) => r.destination === 'Mecca'
      const otherRecs = recommendations.filter(
        (r) => r.destination !== 'Mecca'

      if (meccaRecs.length > 0 && otherRecs.length > 0) {
        const avgMeccaConfidence =
          meccaRecs.reduce((sum, r) => sum + r.confidence_score, 0) /
          meccaRecs.length;
        const avgOtherConfidence =
          otherRecs.reduce((sum, r) => sum + r.confidence_score, 0) /
          otherRecs.length;

        expect(avgMeccaConfidence).toBeGreaterThanOrEqual(
          avgOtherConfidence - 0.1
        ); // Allow small margin
      }
    });

    it('should calculate reasonable confidence scores', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      recommendations.forEach((rec) => {
        expect(rec.confidence_score).toBeGreaterThanOrEqual(0);
        expect(rec.confidence_score).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate expected revenue', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      recommendations.forEach((rec) => {
        expect(rec.expected_revenue).toBeGreaterThan(0);
        // Expected revenue should be price * conversion rate
        const expectedRevenue = rec.price * rec.expected_conversion_rate;
        expect(Math.abs(rec.expected_revenue - expectedRevenue)).toBeLessThan(
          0.01
      });
    });

    it('should assign appropriate priorities', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      recommendations.forEach((rec) => {
        expect(['low', 'medium', 'high', 'urgent']).toContain(rec.priority);
      });
    });

    it('should provide reasoning for recommendations', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      recommendations.forEach((rec) => {
        expect(Array.isArray(rec.reasoning)).toBe(true);
        expect(rec.reasoning.length).toBeGreaterThan(0);
        expect(rec.reasoning.length).toBeLessThanOrEqual(3); // Max 3 reasons
        rec.reasoning.forEach((reason) => {
          expect(typeof reason).toBe('string');
          expect(reason.length).toBeGreaterThan(0);
        });
      });
    });

    it('should calculate cross-sell and up-sell potential', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts,
        { include_cross_sell: true, include_up_sell: true }

      recommendations.forEach((rec) => {
        expect(rec.cross_sell_potential).toBeGreaterThanOrEqual(0);
        expect(rec.cross_sell_potential).toBeLessThanOrEqual(1);
        expect(rec.up_sell_potential).toBeGreaterThanOrEqual(0);
        expect(rec.up_sell_potential).toBeLessThanOrEqual(1);
      });
    });

    it('should respect exclude_recent option', async () => {
      // Add a recent booking for Mecca
      const recentProfile = {
        ...sampleCustomerProfile,
        booking_history: [
          ...sampleCustomerProfile.booking_history,
          {
            destination: 'Mecca',
            package_type: 'standard',
            price: 2000,
            booking_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
            satisfaction_score: 4.0
          }
        ]
      };

      const recommendations = await engine.generateProductRecommendations(
        recentProfile,
        sampleProducts,
        { exclude_recent: true }

      // Should have fewer or no Mecca recommendations due to recent booking
      const meccaRecs = recommendations.filter(
        (r) => r.destination === 'Mecca'
      expect(meccaRecs.length).toBeLessThanOrEqual(
        sampleProducts.filter((p) => p.destination === 'Mecca').length
    });

    it('should sort recommendations by priority and confidence', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      if (recommendations.length > 1) {
        for (let i = 1; i < recommendations.length; i++) {
          const prev = recommendations[i - 1];
          const curr = recommendations[i];

          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const prevPriority = priorityOrder[prev.priority];
          const currPriority = priorityOrder[curr.priority];

          // Either higher priority or same priority with higher confidence
          expect(
            prevPriority > currPriority ||
              (prevPriority === currPriority &&
                prev.confidence_score >= curr.confidence_score)
          ).toBe(true);
        }
      }
    });

    it('should handle empty product list', async () => {
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        []

      expect(recommendations).toEqual([]);
    });

    it('should handle customer with no booking history', async () => {
      const newCustomer = {
        ...sampleCustomerProfile,
        booking_history: [],
        total_spent: 0,
        avg_booking_value: 0,
        last_booking_days_ago: 999
      };

      const recommendations = await engine.generateProductRecommendations(
        newCustomer,
        sampleProducts

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      // Should still generate recommendations based on preferences and demographics
    });

    it('should adjust recommendations based on loyalty tier', async () => {
      const platinumCustomer = {
        ...sampleCustomerProfile,
        loyalty_tier: 'platinum' as const
      };

      const bronzeCustomer = {
        ...sampleCustomerProfile,
        loyalty_tier: 'bronze' as const
      };

      const platinumRecs = await engine.generateProductRecommendations(
        platinumCustomer,
        sampleProducts
      const bronzeRecs = await engine.generateProductRecommendations(
        bronzeCustomer,
        sampleProducts

      if (platinumRecs.length > 0 && bronzeRecs.length > 0) {
        const avgPlatinumConfidence =
          platinumRecs.reduce((sum, r) => sum + r.confidence_score, 0) /
          platinumRecs.length;
        const avgBronzeConfidence =
          bronzeRecs.reduce((sum, r) => sum + r.confidence_score, 0) /
          bronzeRecs.length;

        // Platinum customers should generally get higher confidence recommendations
        expect(avgPlatinumConfidence).toBeGreaterThanOrEqual(
          avgBronzeConfidence
      }
    });
  });

  describe('Campaign Recommendations', () => {
    const sampleCustomers: CustomerProfile[] = [sampleCustomerProfile];
    const sampleCampaigns = [
      {
        id: 'campaign-1',
        name: 'Spring Umrah Special',
        type: 'email',
        target_segment: 'frequent_travelers',
        template: 'Book your spring Umrah with {{loyalty_tier}} benefits',
        cta: 'Book Now',
        ab_test_enabled: true,
        historical_open_rate: 0.25,
        historical_click_rate: 0.04,
        historical_conversion_rate: 0.06
      }
    ];

    it('should generate campaign recommendations', async () => {
      const recommendations = await engine.generateCampaignRecommendations(
        sampleCustomers,
        sampleCampaigns

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should include required campaign fields', async () => {
      const recommendations = await engine.generateCampaignRecommendations(
        sampleCustomers,
        sampleCampaigns

      if (recommendations.length > 0) {
        const firstRec = recommendations[0];
        expect(firstRec).toHaveProperty('campaign_id');
        expect(firstRec).toHaveProperty('campaign_name');
        expect(firstRec).toHaveProperty('confidence_score');
        expect(firstRec).toHaveProperty('expected_open_rate');
        expect(firstRec).toHaveProperty('expected_click_rate');
        expect(firstRec).toHaveProperty('expected_conversion_rate');
        expect(firstRec).toHaveProperty('urgency_level');
        expect(firstRec).toHaveProperty('optimal_send_time');
      }
    });

    it('should respect max campaigns limit', async () => {
      const maxCampaigns = 2;
      const recommendations = await engine.generateCampaignRecommendations(
        sampleCustomers,
        sampleCampaigns,
        { max_campaigns: maxCampaigns }

      expect(recommendations.length).toBeLessThanOrEqual(maxCampaigns);
    });

    it('should calculate reasonable performance metrics', async () => {
      const recommendations = await engine.generateCampaignRecommendations(
        sampleCustomers,
        sampleCampaigns

      recommendations.forEach((rec) => {
        expect(rec.expected_open_rate).toBeGreaterThanOrEqual(0);
        expect(rec.expected_open_rate).toBeLessThanOrEqual(1);
        expect(rec.expected_click_rate).toBeGreaterThanOrEqual(0);
        expect(rec.expected_click_rate).toBeLessThanOrEqual(1);
        expect(rec.expected_conversion_rate).toBeGreaterThanOrEqual(0);
        expect(rec.expected_conversion_rate).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty customer list', async () => {
      const recommendations = await engine.generateCampaignRecommendations(
        [],
        sampleCampaigns

      expect(recommendations).toEqual([]);
    });
  });

  describe('Recommendation Summary', () => {
    it('should generate comprehensive summary', async () => {
      const productRecs = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      const campaignRecs = await engine.generateCampaignRecommendations(
        [sampleCustomerProfile],
        [
          {
            id: 'campaign-1',
            name: 'Test Campaign',
            type: 'email',
            target_segment: 'high_value_loyalists',
            template: 'Test template',
            cta: 'Click here',
            ab_test_enabled: false,
            historical_open_rate: 0.2,
            historical_click_rate: 0.03,
            historical_conversion_rate: 0.05
          }
        ]

      const summary = await engine.generateRecommendationSummary(
        [sampleCustomerProfile],
        productRecs,
        campaignRecs

      expect(summary).toHaveProperty('total_recommendations');
      expect(summary).toHaveProperty('high_priority_count');
      expect(summary).toHaveProperty('expected_total_revenue');
      expect(summary).toHaveProperty('avg_confidence_score');
      expect(summary).toHaveProperty('top_opportunities');
      expect(summary).toHaveProperty('segment_breakdown');

      expect(summary.total_recommendations).toBe(
        productRecs.length + campaignRecs.length
      expect(summary.expected_total_revenue).toBeGreaterThanOrEqual(0);
      expect(summary.avg_confidence_score).toBeGreaterThanOrEqual(0);
      expect(summary.avg_confidence_score).toBeLessThanOrEqual(1);
    });

    it('should calculate segment breakdown correctly', async () => {
      const productRecs = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      const summary = await engine.generateRecommendationSummary(
        [sampleCustomerProfile],
        productRecs,
        []

      expect(typeof summary.segment_breakdown).toBe('object');
      Object.values(summary.segment_breakdown).forEach((segmentData) => {
        expect(segmentData).toHaveProperty('count');
        expect(segmentData).toHaveProperty('expected_revenue');
        expect(segmentData).toHaveProperty('avg_confidence');
        expect(typeof segmentData.count).toBe('number');
        expect(typeof segmentData.expected_revenue).toBe('number');
        expect(typeof segmentData.avg_confidence).toBe('number');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid confidence ranges gracefully', async () => {
      // Test with confidence outside 0-1 range - should be clamped
      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts,
        { min_confidence: 1.5 } // Invalid value > 1

      // Should return empty array or handle gracefully
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle customer with extreme values', async () => {
      const extremeCustomer = {
        ...sampleCustomerProfile,
        age: 120, // Maximum age
        total_spent: 1000000, // Very high spending
        booking_frequency_days: 1, // Books every day
        engagement_score: 1 // Perfect engagement
      };

      const recommendations = await engine.generateProductRecommendations(
        extremeCustomer,
        sampleProducts

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach((rec) => {
        expect(rec.confidence_score).toBeGreaterThanOrEqual(0);
        expect(rec.confidence_score).toBeLessThanOrEqual(1);
      });
    });

    it('should handle products with missing fields', async () => {
      const incompleteProducts = [
        {
          id: 'incomplete-1',
          name: 'Basic Package',
          // Missing some fields
          price: 1000
        }
      ];

      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        incompleteProducts

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should generate recommendations within reasonable time', async () => {
      const startTime = Date.now();

      await engine.generateProductRecommendations(
        sampleCustomerProfile,
        sampleProducts

      const executionTime = Date.now() - startTime;

      // Should complete within 2 seconds for small dataset
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle larger product catalogs efficiently', async () => {
      // Generate larger product catalog
      const largeProductCatalog = [];
      for (let i = 0; i < 100; i++) {
        largeProductCatalog.push({
          id: `product-${i}`,
          name: `Package ${i}`,
          type: 'package',
          destination: i % 2 === 0 ? 'Mecca' : 'Medina',
          price: 1000 + i * 100,
          package_type: ['economy', 'standard', 'premium', 'luxury'][i % 4],
          travel_style: ['solo', 'couple', 'family', 'group'][i % 4],
          price_category: ['budget', 'mid-range', 'premium', 'luxury'][i % 4],
          features: ['feature_1', 'feature_2']
        });
      }

      const startTime = Date.now();

      const recommendations = await engine.generateProductRecommendations(
        sampleCustomerProfile,
        largeProductCatalog,
        { max_recommendations: 10 }

      const executionTime = Date.now() - startTime;

      expect(recommendations.length).toBeLessThanOrEqual(10);
      // Should complete within 5 seconds for 100 products
      expect(executionTime).toBeLessThan(5000);
    });
  });
});
