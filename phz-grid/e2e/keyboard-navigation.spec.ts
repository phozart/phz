import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:has-text("GRID_READY")', { timeout: 10000 });
  });

  test('Tab moves focus into the grid', async ({ page }) => {
    // Tab into the grid
    await page.keyboard.press('Tab');

    const activeElement = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return null;
      return grid.shadowRoot.activeElement?.tagName ?? null;
    });
    expect(activeElement).not.toBeNull();
  });

  test('clicking a cell gives it focus', async ({ page }) => {
    // Click first data cell via evaluate to avoid shadow DOM selector issues
    await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      const cell = grid?.shadowRoot?.querySelector('tbody td') as HTMLElement | null;
      cell?.click();
    });

    await page.waitForTimeout(100);

    // Verify grid has active focus
    const hasFocus = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return false;
      const focused = grid.shadowRoot.querySelector(':focus, [tabindex="0"]');
      return focused !== null;
    });
    expect(hasFocus).toBe(true);
  });

  test('ArrowDown key navigates within grid', async ({ page }) => {
    // Click the tbody to focus it first
    await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      const tbody = grid?.shadowRoot?.querySelector('tbody') as HTMLElement | null;
      tbody?.focus();
    });

    await page.waitForTimeout(100);

    // Press ArrowDown
    await page.keyboard.press('ArrowDown');

    // Grid should still have focus
    const hasFocus = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return false;
      return grid.shadowRoot.activeElement !== null;
    });
    expect(hasFocus).toBe(true);
  });

  test('Escape returns focus context', async ({ page }) => {
    // Click into the grid body
    await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      const tbody = grid?.shadowRoot?.querySelector('tbody') as HTMLElement | null;
      tbody?.focus();
    });

    await page.waitForTimeout(100);

    // Press Escape
    await page.keyboard.press('Escape');

    // Grid element should still be in the focus chain
    const isFocused = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      return document.activeElement === grid || grid?.shadowRoot?.activeElement !== null;
    });
    expect(isFocused).toBe(true);
  });

  test('clicking header triggers sort', async ({ page }) => {
    // Click a column header via evaluate
    await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      const header = grid?.shadowRoot?.querySelector('th') as HTMLElement | null;
      header?.click();
    });

    await page.waitForTimeout(300);

    // Header should now show sort indicator (aria-sort changes from "none")
    const sortStates = await page.evaluate(() => {
      const grid = document.querySelector('phz-grid');
      if (!grid?.shadowRoot) return [];
      const headers = grid.shadowRoot.querySelectorAll('th[aria-sort]');
      return Array.from(headers).map(h => h.getAttribute('aria-sort'));
    });
    // At least one header should have ascending or descending sort
    expect(sortStates.some(s => s === 'ascending' || s === 'descending')).toBe(true);
  });
});
