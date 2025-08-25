import { test, expect } from '@playwright/test';

test.describe('Natural Language Query Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI dashboard and switch to NL Query tab
    await page.goto('/dashboard/ai');
    await page.waitForLoadState('networkidle');

    // Click on Natural Language tab
    await page.getByRole('tab', { name: /NL Queries/i }).click();
    await page.waitForSelector('[data-testid="nl-chat-interface"]', {
      timeout: 10000
    });
  });

  test('should display welcome message and examples', async ({ page }) => {
    // Check welcome message
    await expect(
      page.getByText('Willkommen zum AI Query Interface')
    ).toBeVisible();

    // Check examples are displayed
    await expect(page.getByText('Beispiele zum Ausprobieren')).toBeVisible();

    // Verify at least one example is present
    await expect(
      page.locator('button').filter({ hasText: /Zeige mir alle/i })
    ).toBeVisible();
  });

  test('should allow typing and sending queries', async ({ page }) => {
    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .or(page.locator('button[type="submit"]'));

    // Type a query
    await queryInput.fill('Wie viele Leads haben wir?');

    // Send button should be enabled
    await expect(sendButton).toBeEnabled();

    // Click send
    await sendButton.click();

    // Should show user message
    await expect(page.getByText('Wie viele Leads haben wir?')).toBeVisible();

    // Should show processing indicator initially
    await expect(page.getByText(/Processing|Analyzing/)).toBeVisible({
      timeout: 2000
    });
  });

  test('should handle example queries', async ({ page }) => {
    // Click on an example query
    await page
      .locator('button')
      .filter({ hasText: /Zeige mir alle/i })
      .first()
      .click();

    // Input should be filled
    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    await expect(queryInput).not.toHaveValue('');

    // Send the query
    await page.locator('button').filter({ hasText: /send/i }).first().click();

    // Should show the query as sent
    await expect(page.locator('.message, .chat-message').first()).toBeVisible();
  });

  test('should show conversation history sidebar', async ({ page }) => {
    // Look for history toggle button
    const historyButton = page
      .locator('button')
      .filter({ hasText: /History/i })
      .or(page.locator('button[title*="history" i]'));

    if ((await historyButton.count()) > 0) {
      await historyButton.click();

      // Should show conversation history
      await expect(page.getByText('Conversation History')).toBeVisible();
      await expect(page.getByText('New Chat')).toBeVisible();
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');

    // Type a query and press Enter
    await queryInput.fill('Test query');
    await queryInput.press('Enter');

    // Should send the query (same as clicking send button)
    await expect(page.getByText('Test query')).toBeVisible();
  });

  test('should prevent sending empty queries', async ({ page }) => {
    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();

    // Empty input should disable send button
    await expect(queryInput).toHaveValue('');
    await expect(sendButton).toBeDisabled();

    // Whitespace only should also disable
    await queryInput.fill('   ');
    await expect(sendButton).toBeDisabled();

    // Valid input should enable
    await queryInput.fill('Valid query');
    await expect(sendButton).toBeEnabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/ai/query', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'Internal server error' })
      });
    });

    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();

    // Send a query
    await queryInput.fill('Test query');
    await sendButton.click();

    // Should show error message
    await expect(page.getByText(/Entschuldigung|Error|Fehler/i)).toBeVisible({
      timeout: 5000
    });
  });

  test('should display query results appropriately', async ({ page }) => {
    // Mock successful API response
    await page.route('/api/ai/query', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            conversation_id: 'test-conv-id',
            query_id: 'test-query-id',
            interpreted_query: 'count leads',
            query_type: 'leads',
            results: [
              {
                type: 'metric',
                data: { total_leads: 42 },
                metadata: { table: 'aggregated', columns: ['total_leads'] }
              }
            ],
            visualization_type: 'metrics',
            total_results: 1,
            execution_summary: {
              processing_time_ms: 150,
              confidence: 0.95,
              tables_accessed: ['contacts']
            }
          }
        })
      });
    });

    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();

    // Send query
    await queryInput.fill('Wie viele Leads haben wir?');
    await sendButton.click();

    // Should show results
    await expect(page.getByText('42')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Ergebnis.*gefunden/i)).toBeVisible();
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('/api/ai/query', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: 'Rate limit exceeded. Please try again later.'
        })
      });
    });

    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();

    // Send query
    await queryInput.fill('Test query');
    await sendButton.click();

    // Should show rate limit message
    await expect(page.getByText(/Rate limit|zu viele Anfragen/i)).toBeVisible({
      timeout: 5000
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Interface should still be usable
    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    await expect(queryInput).toBeVisible();

    // Send button should be accessible
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();
    await expect(sendButton).toBeVisible();

    // Examples should be scrollable/accessible
    await expect(page.getByText('Beispiele')).toBeVisible();
  });

  test('should maintain conversation context', async ({ page }) => {
    // Mock multiple query responses
    let queryCount = 0;
    await page.route('/api/ai/query', (route) => {
      queryCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            conversation_id: 'persistent-conv-id',
            query_id: `query-${queryCount}`,
            interpreted_query: `query ${queryCount}`,
            query_type: 'leads',
            results: [],
            visualization_type: 'table',
            total_results: 0,
            execution_summary: {
              processing_time_ms: 100,
              confidence: 0.8,
              tables_accessed: ['contacts']
            }
          }
        })
      });
    });

    const queryInput = page.locator('input[placeholder*="Fragen Sie etwas"]');
    const sendButton = page
      .locator('button')
      .filter({ hasText: /send/i })
      .first();

    // Send first query
    await queryInput.fill('First query');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Send second query
    await queryInput.fill('Second query');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Both queries should be visible in conversation
    await expect(page.getByText('First query')).toBeVisible();
    await expect(page.getByText('Second query')).toBeVisible();
  });
});
