import { test, expect } from '@playwright/test';

test.describe('PhzGrid Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for grid to be ready
    await page.waitForSelector('#status:has-text("GRID_READY")', { timeout: 10000 });
  });

  test('renders the grid element', async ({ page }) => {
    const grid = page.locator('phz-grid');
    await expect(grid).toBeVisible();
  });

  test('renders correct number of data rows', async ({ page }) => {
    const rowCount = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      return grid?.shadowRoot?.querySelectorAll('tbody tr').length ?? 0;
    });
    expect(rowCount).toBe(10);
  });

  test('renders column headers', async ({ page }) => {
    const headerCount = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      return grid?.shadowRoot?.querySelectorAll('th').length ?? 0;
    });
    // 6 columns: ID, Name, Department, Salary, Start Date, Active
    expect(headerCount).toBe(6);
  });

  test('renders cell content correctly', async ({ page }) => {
    const cellTexts = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return [];
      const cells = grid.shadowRoot.querySelectorAll('tbody tr:first-child td');
      return Array.from(cells).map(c => c.textContent?.trim() ?? '');
    });
    // First row should contain Alice Johnson's data
    expect(cellTexts).toContain('Alice Johnson');
  });

  test('renders with different density modes', async ({ page }) => {
    // Test compact density
    await page.evaluate(() => (window as any).__phzTestUtils.setDensity('compact'));
    await page.waitForTimeout(100);

    const grid = page.locator('phz-grid');
    const densityAttr = await grid.getAttribute('density');
    expect(densityAttr).toBe('compact');
  });

  test('shows toolbar when showToolbar is true', async ({ page }) => {
    const hasToolbar = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return false;
      const toolbar = grid.shadowRoot.querySelector('phz-toolbar');
      return toolbar !== null;
    });
    expect(hasToolbar).toBe(true);
  });

  test('handles empty data gracefully', async ({ page }) => {
    await page.evaluate(() => (window as any).__phzTestUtils.setData([]));
    await page.waitForTimeout(200);

    const grid = page.locator('phz-grid');
    // Grid should still be visible
    await expect(grid).toBeVisible();

    // Should have zero data rows
    const rowCount = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      return grid?.shadowRoot?.querySelectorAll('tbody tr').length ?? -1;
    });
    expect(rowCount).toBe(0);
  });
});
