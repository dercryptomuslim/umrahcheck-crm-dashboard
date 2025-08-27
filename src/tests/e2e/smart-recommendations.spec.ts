import { test, expect } from '@playwright/test';

test.describe('Smart Recommendations Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI dashboard and switch to Recommendations tab
    await page.goto('/dashboard/ai');
    await page.waitForLoadState('networkidle');

    // Click on Recommendations tab
    await page.getByRole('tab', { name: /Empfehlungen/i }).click();
    await page.waitForSelector('[data-testid="smart-recommendations"]', {
      timeout: 10000
    });
  });

  test('should display smart recommendations dashboard', async ({ page }) => {
    // Check for main heading
    await expect(page.getByText('Smart Recommendations')).toBeVisible();

    // Check for tab navigation
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Campaigns')).toBeVisible();
    await expect(page.getByText('Segments')).toBeVisible();

    // Should have refresh and export buttons
    await expect(page.getByText('Aktualisieren')).toBeVisible();
    await expect(page.getByText('Export')).toBeVisible();
  });

  test('should switch between recommendation tabs', async ({ page }) => {
    // Should start on products tab (default)
    await expect(page.getByText('Products')).toHaveClass(/active|selected/);

    // Switch to campaigns tab
    await page.getByText('Campaigns').click();
    await page.waitForTimeout(500);

    // Should show campaigns content
    await expect(page.getByText('Load Campaign Recommendations')).toBeVisible();

    // Switch to segments tab
    await page.getByText('Segments').click();
    await page.waitForTimeout(500);

    // Should show segments content
    await expect(page.getByText('Load Segment Analysis')).toBeVisible();

    // Switch back to products tab
    await page.getByText('Products').click();
    await page.waitForTimeout(500);

    // Should show products content
    await expect(page.getByText('Load Product Recommendations')).toBeVisible();
  });

  test('should load product recommendations successfully', async ({ page }) => {
    // Mock successful product recommendations API response
    await page.route('/api/ai/recommendations/products', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            recommendations: [
              {
                product_id: 'p1',
                product_name: 'Premium Mecca Package',
                product_type: 'package',
                destination: 'Mecca',
                price: 3500,
                confidence_score: 0.87,
                reasoning: [
                  'Matches your preferred destination: Mecca',
                  'Within your typical spending range',
                  'High compatibility with your travel preferences'
                ],
                expected_conversion_rate: 0.15,
                expected_revenue: 525,
                priority: 'high',
                validity_days: 45,
                personalization_factors: [
                  'preferred_destination',
                  'loyalty_gold',
                  'repeat_customer'
                ],
                cross_sell_potential: 0.6,
                up_sell_potential: 0.3
              },
              {
                product_id: 'p2',
                product_name: 'Economy Medina Package',
                product_type: 'package',
                destination: 'Medina',
                price: 1800,
                confidence_score: 0.62,
                reasoning: ['Budget-friendly option', 'Good value for money'],
                expected_conversion_rate: 0.08,
                expected_revenue: 144,
                priority: 'medium',
                validity_days: 30,
                personalization_factors: ['budget_conscious'],
                cross_sell_potential: 0.4,
                up_sell_potential: 0.7
              }
            ],
            customer_segment: 'High-Value Frequent Travelers',
            summary: {
              total_recommendations: 2,
              high_priority_count: 1,
              expected_total_revenue: 669,
              avg_confidence_score: 0.745,
              cross_sell_opportunities: 1,
              up_sell_opportunities: 1
            }
          }
        })
      });
    });

    // Click load product recommendations button
    await page.getByText('Load Product Recommendations').click();
    await page.waitForTimeout(1000);

    // Should show summary cards
    await expect(page.getByText('Total Recommendations')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // Total recommendations count
    await expect(page.getByText('1')).toBeVisible(); // High priority count
    await expect(page.getByText('€669')).toBeVisible(); // Expected revenue
    await expect(page.getByText('75%')).toBeVisible(); // Average confidence

    // Should show customer segment
    await expect(page.getByText('High-Value Frequent Travelers')).toBeVisible();

    // Should show product recommendations
    await expect(page.getByText('Premium Mecca Package')).toBeVisible();
    await expect(page.getByText('Economy Medina Package')).toBeVisible();
    await expect(page.getByText('€3,500')).toBeVisible();
    await expect(page.getByText('87%')).toBeVisible(); // Confidence score

    // Should show reasoning
    await expect(
      page.getByText('Matches your preferred destination: Mecca')
    ).toBeVisible();
    await expect(
      page.getByText('Within your typical spending range')
    ).toBeVisible();

    // Should show priority badges
    await expect(page.getByText('high')).toBeVisible();
    await expect(page.getByText('medium')).toBeVisible();
  });

  test('should load campaign recommendations successfully', async ({
    page
  }) => {
    // Switch to campaigns tab
    await page.getByText('Campaigns').click();

    // Mock successful campaign recommendations API response
    await page.route('/api/ai/recommendations/campaigns', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            campaigns: [
              {
                campaign_id: 'c1',
                campaign_name: 'Spring Umrah Special',
                campaign_type: 'email',
                target_segment: 'frequent_travelers',
                message_template:
                  'Book your spiritual journey this season with exclusive gold member benefits.',
                call_to_action: 'Book Now with 15% Discount',
                confidence_score: 0.82,
                expected_open_rate: 0.28,
                expected_click_rate: 0.045,
                expected_conversion_rate: 0.08,
                optimal_send_time: {
                  day_of_week: 2,
                  hour: 10,
                  timezone: 'Europe/Berlin'
                },
                urgency_level: 'high',
                personalization_tokens: {
                  customer_id: 'cust123',
                  loyalty_tier: 'gold'
                },
                a_b_test_variant: 'variant_a'
              }
            ],
            target_analysis: {
              total_customers_analyzed: 150,
              segments_identified: 4,
              avg_engagement_score: 0.65,
              estimated_reach: 120
            },
            performance_forecast: {
              expected_total_opens: 42,
              expected_total_clicks: 6,
              expected_conversions: 2,
              estimated_revenue: 3200,
              roi_projection: 185
            },
            optimization_suggestions: [
              'Consider improving email subject lines and content personalization to boost engagement',
              'Schedule email campaigns for Tuesday-Thursday, 10 AM - 2 PM for optimal open rates',
              'Implement A/B testing for more campaigns to optimize performance'
            ]
          }
        })
      });
    });

    // Click load campaign recommendations button
    await page.getByText('Load Campaign Recommendations').click();
    await page.waitForTimeout(1000);

    // Should show campaign summary
    await expect(page.getByText('Recommended Campaigns')).toBeVisible();
    await expect(page.getByText('1')).toBeVisible(); // Campaign count
    await expect(page.getByText('120')).toBeVisible(); // Estimated reach
    await expect(page.getByText('185%')).toBeVisible(); // ROI projection
    await expect(page.getByText('€3,200')).toBeVisible(); // Expected revenue

    // Should show performance forecast
    await expect(page.getByText('42')).toBeVisible(); // Expected opens
    await expect(page.getByText('6')).toBeVisible(); // Expected clicks
    await expect(page.getByText('2')).toBeVisible(); // Expected conversions

    // Should show campaign details
    await expect(page.getByText('Spring Umrah Special')).toBeVisible();
    await expect(page.getByText('frequent_travelers')).toBeVisible();
    await expect(page.getByText('Book your spiritual journey')).toBeVisible();
    await expect(page.getByText('Book Now with 15% Discount')).toBeVisible();

    // Should show performance metrics
    await expect(page.getByText('28%')).toBeVisible(); // Open rate
    await expect(page.getByText('45%')).toBeVisible(); // Click rate (4.5% shown as 45%)
    await expect(page.getByText('82%')).toBeVisible(); // Confidence

    // Should show optimization suggestions
    await expect(
      page.getByText('Consider improving email subject lines')
    ).toBeVisible();
    await expect(
      page.getByText('Schedule email campaigns for Tuesday-Thursday')
    ).toBeVisible();
  });

  test('should load segment analysis successfully', async ({ page }) => {
    // Switch to segments tab
    await page.getByText('Segments').click();

    // Mock successful segment analysis API response
    await page.route('/api/ai/recommendations/segments', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            analysis_date: '2024-01-25T10:00:00Z',
            total_customers: 245,
            segments: [
              {
                segment_id: 's1',
                segment_name: 'High Value Loyalists',
                description:
                  'Behavioral segment with average booking value of €3,200, age range 35-55, primarily family travelers.',
                customer_count: 45,
                total_value: 144000,
                avg_customer_value: 3200,
                growth_rate: 0.15,
                churn_risk: 'low',
                engagement_level: 'high',
                profitability: 'high',
                characteristics: {
                  age_range: { min: 35, max: 55 },
                  avg_booking_value: 3200,
                  avg_booking_frequency: 75,
                  top_destinations: ['Mecca', 'Medina'],
                  preferred_package_types: ['premium', 'luxury'],
                  common_travel_style: 'family',
                  dominant_communication_preference: 'email',
                  loyalty_distribution: { gold: 0.6, platinum: 0.4 }
                },
                insights: {
                  key_behaviors: [
                    'High booking frequency',
                    'Premium package preference'
                  ],
                  opportunities: [
                    'Cross-sell complementary services',
                    'VIP program expansion'
                  ],
                  risks: ['Price sensitivity may emerge'],
                  recommended_strategies: [
                    'Maintain premium experience',
                    'Loyalty rewards'
                  ]
                },
                metrics: {
                  lifetime_value: 3200,
                  acquisition_cost: 150,
                  retention_rate: 0.92,
                  satisfaction_score: 4.6,
                  net_promoter_score: 75,
                  campaign_response_rate: 0.28
                }
              },
              {
                segment_id: 's2',
                segment_name: 'Budget Conscious',
                description:
                  'RFM-based segment with average booking value of €850, age range 25-40, primarily solo travelers.',
                customer_count: 78,
                total_value: 66300,
                avg_customer_value: 850,
                growth_rate: 0.08,
                churn_risk: 'medium',
                engagement_level: 'medium',
                profitability: 'medium',
                characteristics: {
                  age_range: { min: 25, max: 40 },
                  avg_booking_value: 850,
                  avg_booking_frequency: 180,
                  top_destinations: ['Mecca'],
                  preferred_package_types: ['economy', 'standard'],
                  common_travel_style: 'solo',
                  dominant_communication_preference: 'email',
                  loyalty_distribution: { bronze: 0.7, silver: 0.3 }
                },
                insights: {
                  key_behaviors: ['Price-sensitive booking patterns'],
                  opportunities: ['Value packages promotion'],
                  risks: ['May switch for better deals'],
                  recommended_strategies: [
                    'Early bird discounts',
                    'Package bundles'
                  ]
                },
                metrics: {
                  lifetime_value: 850,
                  acquisition_cost: 150,
                  retention_rate: 0.68,
                  satisfaction_score: 4.1,
                  net_promoter_score: 45,
                  campaign_response_rate: 0.18
                }
              }
            ],
            insights: {
              largest_segment: 'Budget Conscious',
              most_valuable_segment: 'High Value Loyalists',
              fastest_growing_segment: 'High Value Loyalists',
              highest_risk_segment: 'Budget Conscious',
              best_opportunity_segment: 'High Value Loyalists'
            }
          }
        })
      });
    });

    // Click load segment analysis button
    await page.getByText('Load Segment Analysis').click();
    await page.waitForTimeout(1000);

    // Should show segments overview
    await expect(page.getByText('Total Customers')).toBeVisible();
    await expect(page.getByText('245')).toBeVisible(); // Total customers
    await expect(page.getByText('Segments Created')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // Segment count

    // Should show key insights
    await expect(page.getByText('Budget Conscious')).toBeVisible(); // Largest segment
    await expect(page.getByText('High Value Loyalists')).toBeVisible(); // Most valuable

    // Should show segment details
    await expect(page.getByText('45')).toBeVisible(); // Customer count for first segment
    await expect(page.getByText('€144,000')).toBeVisible(); // Total value
    await expect(page.getByText('€3,200')).toBeVisible(); // Avg customer value
    await expect(page.getByText('15%')).toBeVisible(); // Growth rate

    // Should show segment characteristics
    await expect(page.getByText('35-55')).toBeVisible(); // Age range
    await expect(page.getByText('family')).toBeVisible(); // Travel style

    // Should show engagement and risk indicators
    await expect(page.getByText('high')).toBeVisible(); // Engagement level
    await expect(page.getByText('low')).toBeVisible(); // Churn risk
    await expect(page.getByText('medium')).toBeVisible(); // For second segment

    // Should show analysis date
    const analysisDate = new Date('2024-01-25').toLocaleDateString();
    await expect(page.getByText(analysisDate)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure for products
    await page.route('/api/ai/recommendations/products', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Internal server error' })
      });
    });

    // Try to load product recommendations
    await page.getByText('Load Product Recommendations').click();
    await page.waitForTimeout(1000);

    // Should show error message
    await expect(
      page.getByText(/Fehler beim Laden|Failed to load|Error/i)
    ).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/ai/recommendations/products', async (route) => {
      await page.waitForTimeout(2000); // 2 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            recommendations: [],
            customer_segment: 'Test Segment',
            summary: {
              total_recommendations: 0,
              high_priority_count: 0,
              expected_total_revenue: 0,
              avg_confidence_score: 0,
              cross_sell_opportunities: 0,
              up_sell_opportunities: 0
            }
          }
        })
      });
    });

    // Click load button
    await page.getByText('Load Product Recommendations').click();

    // Should show loading state (spinning icon or disabled button)
    const loadButton = page.getByText('Load Product Recommendations');
    await expect(loadButton).toBeDisabled({ timeout: 1000 });
  });

  test('should handle export functionality', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Mock some data first
    await page.route('/api/ai/recommendations/products', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            recommendations: [
              {
                product_id: 'p1',
                product_name: 'Test Package',
                product_type: 'package',
                destination: 'Mecca',
                price: 2000,
                confidence_score: 0.8,
                reasoning: ['Test reason'],
                expected_conversion_rate: 0.1,
                expected_revenue: 200,
                priority: 'medium',
                validity_days: 30,
                personalization_factors: [],
                cross_sell_potential: 0.5,
                up_sell_potential: 0.3
              }
            ],
            customer_segment: 'Test Segment',
            summary: {
              total_recommendations: 1,
              high_priority_count: 0,
              expected_total_revenue: 200,
              avg_confidence_score: 0.8,
              cross_sell_opportunities: 0,
              up_sell_opportunities: 0
            }
          }
        })
      });
    });

    // Load data first
    await page.getByText('Load Product Recommendations').click();
    await page.waitForTimeout(500);

    // Click export button
    const exportButton = page.getByText('Export');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Click export and wait for download
    await exportButton.click();
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(
      /smart-recommendations-\d{4}-\d{2}-\d{2}\.json/
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Interface should still be usable
    await expect(page.getByText('Smart Recommendations')).toBeVisible();

    // Tab navigation should be accessible
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Campaigns')).toBeVisible();
    await expect(page.getByText('Segments')).toBeVisible();

    // Buttons should be accessible
    await expect(page.getByText('Aktualisieren')).toBeVisible();
    await expect(page.getByText('Export')).toBeVisible();

    // Should be able to switch tabs on mobile
    await page.getByText('Campaigns').click();
    await expect(page.getByText('Load Campaign Recommendations')).toBeVisible();
  });

  test('should handle refresh functionality', async ({ page }) => {
    let requestCount = 0;

    // Count API requests
    await page.route('/api/ai/recommendations/products', (route) => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            recommendations: [],
            customer_segment: 'Test Segment',
            summary: {
              total_recommendations: 0,
              high_priority_count: 0,
              expected_total_revenue: 0,
              avg_confidence_score: 0,
              cross_sell_opportunities: 0,
              up_sell_opportunities: 0
            }
          }
        })
      });
    });

    await page.route('/api/ai/recommendations/campaigns', (route) => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            campaigns: [],
            target_analysis: {
              total_customers_analyzed: 0,
              segments_identified: 0,
              avg_engagement_score: 0,
              estimated_reach: 0
            },
            performance_forecast: {
              expected_total_opens: 0,
              expected_total_clicks: 0,
              expected_conversions: 0,
              estimated_revenue: 0,
              roi_projection: 0
            },
            optimization_suggestions: []
          }
        })
      });
    });

    await page.route('/api/ai/recommendations/segments', (route) => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            analysis_date: new Date().toISOString(),
            total_customers: 0,
            segments: [],
            insights: {
              largest_segment: '',
              most_valuable_segment: '',
              fastest_growing_segment: '',
              highest_risk_segment: '',
              best_opportunity_segment: ''
            }
          }
        })
      });
    });

    // Initial request count should be 0
    expect(requestCount).toBe(0);

    // Click refresh all data
    await page.getByText('Aktualisieren').first().click();
    await page.waitForTimeout(1000);

    // Should make requests to all 3 endpoints
    expect(requestCount).toBe(3);
  });

  test('should handle empty data states', async ({ page }) => {
    // Mock empty responses
    await page.route('/api/ai/recommendations/products', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'No products available for recommendations'
        })
      });
    });

    // Try to load data
    await page.getByText('Load Product Recommendations').click();
    await page.waitForTimeout(500);

    // Should show appropriate empty state or error message
    await expect(
      page.getByText(/No products available|Keine.*verfügbar/i)
    ).toBeVisible();
  });
});
