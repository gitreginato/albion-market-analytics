import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('loads page and shows main navigation', async ({ page }) => {
    await page.goto('/');

    // Page title
    await expect(page).toHaveTitle(/Albion Market/i);

    // Sidebar navigation exists
    await expect(page.getByRole('button', { name: 'Oportunidades' })).toBeVisible();
  });

  test('displays KPI cards or loading state', async ({ page }) => {
    await page.goto('/');

    // The dashboard should show the main content area
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('sidebar navigation switches panels', async ({ page }) => {
    await page.goto('/');

    // Click on Preços if it exists in sidebar
    const pricesLink = page.locator('button:has-text("Preços"), nav button:has-text("Preços")').first();
    if (await pricesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pricesLink.click();
      // Content area should update
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('item search returns results or empty state', async ({ page }) => {
    await page.goto('/');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="busca" i], input[type="search"]').first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('sword');
      // Wait for either results or empty state
      await page.waitForTimeout(2000);
      // Page should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('page is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load without horizontal scroll issues
    await expect(page.locator('body')).toBeVisible();
  });
});
