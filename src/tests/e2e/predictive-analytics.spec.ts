import { test, expect } from '@playwright/test';

test.describe('Predictive Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI dashboard and switch to Predictions tab
    await page.goto('/dashboard/ai');
    await page.waitForLoadState('networkidle');

    // Click on Predictions tab
    await page.getByRole('tab', { name: /Predictions/i }).click();
    await page.waitForSelector('[data-testid="predictive-analytics"]', {
      timeout: 10000
    });
  });

  test('should display predictive analytics dashboard', async ({ page }) => {
    // Check for main heading
    await expect(page.getByText('Predictive Analytics')).toBeVisible();

    // Check for tab navigation
    await expect(page.getByText('Revenue Forecasting')).toBeVisible();
    await expect(page.getByText('Churn Prediction')).toBeVisible();

    // Should have refresh and export buttons
    await expect(page.getByText('Aktualisieren')).toBeVisible();
    await expect(page.getByText('Export')).toBeVisible();
  });

  test('should switch between revenue and churn tabs', async ({ page }) => {
    // Start on revenue tab (default)
    await expect(page.getByText('Revenue Forecasting')).toHaveClass(/active/);

    // Switch to churn tab
    await page.getByText('Churn Prediction').click();

    // Should show churn content
    await expect(page.getByText('At Risk')).toBeVisible();
    await expect(page.getByText('High Risk')).toBeVisible();

    // Switch back to revenue tab
    await page.getByText('Revenue Forecasting').click();

    // Should show revenue content
    await expect(page.getByText('Forecast Total')).toBeVisible();
    await expect(page.getByText('Growth Rate')).toBeVisible();
  });

  test('should load revenue forecast data', async ({ page }) => {
    // Mock successful revenue forecast API response
    await page.route('/api/ai/predictions/revenue', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            forecast_summary: {
              total_forecast: 125000,
              growth_rate: 15.5,
              confidence: 0.87,
              trend: 'increasing',
              risk_factors: [],
              opportunities: [
                'Strong growth momentum',
                'High confidence predictions'
              ]
            },
            forecasts: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(
                Date.now() + i * 24 * 60 * 60 * 1000
              ).toISOString(),
              predicted_amount: 4000 + Math.sin(i / 7) * 500,
              confidence_lower: 3500 + Math.sin(i / 7) * 400,
              confidence_upper: 4500 + Math.sin(i / 7) * 600,
              trend_direction: 'up'
            })),
            model_metrics: {
              mape: 8.5,
              forecast_accuracy: 'high',
              confidence: 0.87
            }
          }
        })
      });
    });

    // Click refresh to trigger data load
    await page.getByText('Aktualisieren').click();

    // Should show forecast data
    await expect(page.getByText('€125,000.00')).toBeVisible();
    await expect(page.getByText('+15.5%')).toBeVisible();
    await expect(page.getByText('87%')).toBeVisible();
    await expect(page.getByText('high')).toBeVisible();

    // Should show opportunities
    await expect(page.getByText('Strong growth momentum')).toBeVisible();
  });

  test('should load churn prediction data', async ({ page }) => {
    // Mock successful churn prediction API response
    await page.route('/api/ai/predictions/churn', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            predictions: [
              {
                customer_id: '123e4567-e89b-12d3-a456-426614174001',
                churn_probability: 0.85,
                risk_level: 'critical',
                confidence: 0.92,
                primary_risk_factors: [
                  'Long time since last booking (120 days)',
                  'Poor email engagement'
                ],
                recommended_actions: [
                  'Schedule immediate personal outreach call',
                  'Offer exclusive discount'
                ],
                predicted_ltv_remaining: 2500,
                time_to_churn_days: 45
              }
            ],
            summary: {
              total_customers_analyzed: 150,
              at_risk_customers: 23,
              high_risk_customers: 8,
              total_ltv_at_risk: 45000,
              avg_confidence: 0.78
            },
            insights: {
              top_risk_factors: [
                { factor: 'Poor email engagement', impact: 0.6, frequency: 12 },
                { factor: 'Long booking intervals', impact: 0.45, frequency: 8 }
              ],
              retention_opportunities: [
                {
                  segment: 'High-Value At-Risk',
                  customer_count: 5,
                  potential_revenue: 15000,
                  recommended_action: 'Personal outreach with VIP treatment'
                }
              ]
            }
          }
        })
      });
    });

    // Switch to churn prediction tab
    await page.getByText('Churn Prediction').click();

    // Click refresh to trigger data load
    await page.getByText('Aktualisieren').click();

    // Should show churn summary data
    await expect(page.getByText('150')).toBeVisible(); // total customers
    await expect(page.getByText('23')).toBeVisible(); // at risk
    await expect(page.getByText('8')).toBeVisible(); // high risk

    // Should show risk factors
    await expect(page.getByText('Poor email engagement')).toBeVisible();

    // Should show retention opportunities
    await expect(page.getByText('High-Value At-Risk')).toBeVisible();
    await expect(
      page.getByText('Personal outreach with VIP treatment')
    ).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/ai/predictions/revenue', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Internal server error' })
      });
    });

    await page.route('/api/ai/predictions/churn', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Internal server error' })
      });
    });

    // Click refresh to trigger data load
    await page.getByText('Aktualisieren').click();

    // Should show error message
    await expect(page.getByText(/Failed to load|Error/i)).toBeVisible({
      timeout: 5000
    });
  });

  test('should display loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/ai/predictions/revenue', async (route) => {
      await page.waitForTimeout(2000); // 2 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            forecast_summary: {
              total_forecast: 10000,
              growth_rate: 5,
              confidence: 0.8,
              trend: 'stable',
              risk_factors: [],
              opportunities: []
            },
            forecasts: [],
            model_metrics: {
              mape: 10,
              forecast_accuracy: 'medium',
              confidence: 0.8
            }
          }
        })
      });
    });

    // Click refresh
    await page.getByText('Aktualisieren').click();

    // Should show loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible({ timeout: 1000 });
  });

  test('should render revenue forecast chart', async ({ page }) => {
    // Mock chart data
    await page.route('/api/ai/predictions/revenue', (route) => {
      const forecasts = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        predicted_amount: 3000 + i * 100,
        confidence_lower: 2500 + i * 80,
        confidence_upper: 3500 + i * 120,
        trend_direction: 'up'
      }));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            forecast_summary: {
              total_forecast: 45000,
              growth_rate: 10,
              confidence: 0.85,
              trend: 'increasing',
              risk_factors: [],
              opportunities: []
            },
            forecasts,
            model_metrics: {
              mape: 7,
              forecast_accuracy: 'high',
              confidence: 0.85
            }
          }
        })
      });
    });

    // Load data
    await page.getByText('Aktualisieren').click();
    await page.waitForTimeout(1000);

    // Should render chart
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    await expect(page.getByText('Revenue Forecast')).toBeVisible();
  });

  test('should render churn risk distribution chart', async ({ page }) => {
    // Mock churn data with risk distribution
    await page.route('/api/ai/predictions/churn', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            predictions: [
              {
                customer_id: '1',
                churn_probability: 0.9,
                risk_level: 'critical',
                confidence: 0.85,
                primary_risk_factors: [],
                recommended_actions: [],
                predicted_ltv_remaining: 1000,
                time_to_churn_days: 30
              },
              {
                customer_id: '2',
                churn_probability: 0.7,
                risk_level: 'high',
                confidence: 0.8,
                primary_risk_factors: [],
                recommended_actions: [],
                predicted_ltv_remaining: 1500,
                time_to_churn_days: 45
              },
              {
                customer_id: '3',
                churn_probability: 0.4,
                risk_level: 'medium',
                confidence: 0.75,
                primary_risk_factors: [],
                recommended_actions: [],
                predicted_ltv_remaining: 2000,
                time_to_churn_days: null
              },
              {
                customer_id: '4',
                churn_probability: 0.2,
                risk_level: 'low',
                confidence: 0.9,
                primary_risk_factors: [],
                recommended_actions: [],
                predicted_ltv_remaining: 3000,
                time_to_churn_days: null
              }
            ],
            summary: {
              total_customers_analyzed: 4,
              at_risk_customers: 2,
              high_risk_customers: 2,
              total_ltv_at_risk: 2500,
              avg_confidence: 0.83
            },
            insights: { top_risk_factors: [], retention_opportunities: [] }
          }
        })
      });
    });

    // Switch to churn tab and load data
    await page.getByText('Churn Prediction').click();
    await page.getByText('Aktualisieren').click();
    await page.waitForTimeout(1000);

    // Should render pie chart for risk distribution
    await expect(page.getByText('Risk Level Distribution')).toBeVisible();
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display high-risk customers table', async ({ page }) => {
    // Mock high-risk customers data
    await page.route('/api/ai/predictions/churn', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            predictions: [
              {
                customer_id: '123e4567-e89b-12d3-a456-426614174001',
                churn_probability: 0.95,
                risk_level: 'critical',
                confidence: 0.92,
                primary_risk_factors: ['Long booking gap'],
                recommended_actions: ['Immediate outreach'],
                predicted_ltv_remaining: 3500,
                time_to_churn_days: 30
              }
            ],
            summary: {
              total_customers_analyzed: 1,
              at_risk_customers: 1,
              high_risk_customers: 1,
              total_ltv_at_risk: 3500,
              avg_confidence: 0.92
            },
            insights: { top_risk_factors: [], retention_opportunities: [] }
          }
        })
      });
    });

    // Switch to churn tab and load data
    await page.getByText('Churn Prediction').click();
    await page.getByText('Aktualisieren').click();
    await page.waitForTimeout(1000);

    // Should show high-risk customers table
    await expect(page.getByText('High-Risk Customers')).toBeVisible();
    await expect(page.getByText('123e4567...')).toBeVisible(); // Truncated customer ID
    await expect(page.getByText('critical')).toBeVisible();
    await expect(page.getByText('95%')).toBeVisible();
    await expect(page.getByText('€3,500.00')).toBeVisible();
    await expect(page.getByText('30d')).toBeVisible();
  });

  test('should handle refresh button', async ({ page }) => {
    let requestCount = 0;

    // Count API requests
    await page.route('/api/ai/predictions/revenue', (route) => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            forecast_summary: {
              total_forecast: 10000,
              growth_rate: 5,
              confidence: 0.8,
              trend: 'stable',
              risk_factors: [],
              opportunities: []
            },
            forecasts: [],
            model_metrics: {
              mape: 10,
              forecast_accuracy: 'medium',
              confidence: 0.8
            }
          }
        })
      });
    });

    // Initial load
    expect(requestCount).toBe(1);

    // Click refresh
    await page.getByText('Aktualisieren').click();
    await page.waitForTimeout(500);

    // Should make another request
    expect(requestCount).toBe(2);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Interface should still be usable
    await expect(page.getByText('Predictive Analytics')).toBeVisible();

    // Tab navigation should be accessible
    await expect(page.getByText('Revenue Forecasting')).toBeVisible();
    await expect(page.getByText('Churn Prediction')).toBeVisible();

    // Buttons should be accessible
    await expect(page.getByText('Aktualisieren')).toBeVisible();
    await expect(page.getByText('Export')).toBeVisible();
  });

  test('should handle empty data states', async ({ page }) => {
    // Mock empty responses
    await page.route('/api/ai/predictions/revenue', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error:
            'Insufficient historical data. Need at least 14 days of booking data.',
          meta: { days_available: 5 }
        })
      });
    });

    await page.route('/api/ai/predictions/churn', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'No customer data found for analysis'
        })
      });
    });

    // Try to load data
    await page.getByText('Aktualisieren').click();

    // Should show appropriate empty states
    await expect(page.getByText(/Keine.*Daten|No.*data/i)).toBeVisible();
  });

  test('should handle export functionality', async ({ page }) => {
    // Mock successful data for export
    await page.route('/api/ai/predictions/revenue', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            forecast_summary: {
              total_forecast: 50000,
              growth_rate: 12,
              confidence: 0.9,
              trend: 'increasing',
              risk_factors: [],
              opportunities: []
            },
            forecasts: [],
            model_metrics: {
              mape: 5,
              forecast_accuracy: 'high',
              confidence: 0.9
            }
          }
        })
      });
    });

    // Load data first
    await page.getByText('Aktualisieren').click();
    await page.waitForTimeout(500);

    // Click export button
    const exportButton = page.getByText('Export');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Note: In a real test, you might want to test actual download functionality
    // This would require setting up download handling in Playwright
  });
});
