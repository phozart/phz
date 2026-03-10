# E2E Test Agent Instructions

> You write end-to-end tests using Playwright against the running test
> applications. You verify that the full user experience works as specified.

## Your Responsibilities

1. Write Playwright tests for all user flows across all three shells.
2. Test real browser interactions: click, drag, type, keyboard shortcuts.
3. Test responsive breakpoints: desktop, tablet, mobile viewport sizes.
4. Test error recovery: simulate adapter failures, verify retry behavior.
5. Test accessibility: keyboard navigation, screen reader announcements.

## Test Environment

- **Playwright** for browser automation
- **Test apps:** test_app/ (Next.js 15) and test/ (Next.js 16 Turbopack)
- Mock adapters in the test app that simulate real behavior
- Use test fixtures for consistent data across test runs

## Test Scenarios by Shell

### Viewer Shell Tests (Gate B-1)

| Test | What It Verifies |
|---|---|
| Catalog navigation | Open catalog, search, switch tabs, click artifact |
| Dashboard viewing | Open dashboard, verify preload renders, full load completes |
| Filter interaction | Apply filter, verify data updates, save preset, load preset |
| Filter value handling | Toggle null inclusion, orphan inclusion, invert, select all |
| Widget expansion | Click KPI to expand, verify child widgets render, collapse |
| View switching | Switch between 2 views (toggle), 3 views (arrows) |
| Drill-through | Click chart data point, verify navigation with filter mapping |
| Explorer from grid | Right-click grid → Explore, verify explorer opens in new tab |
| Explorer drag-drop | Drag field to zone, verify query updates, chart renders |
| Export | Click CSV button, verify download triggers |
| Error state | Simulate adapter failure, verify friendly message + retry |
| Empty state | Empty catalog, verify rotating message + icon |
| Mobile responsive | Set viewport to 375px, verify bottom tabs, stacked layout |
| Keyboard shortcuts | Press /, verify search focuses. Press Escape, verify panel closes |

### Editor Shell Tests (Gate B-2)

| Test | What It Verifies |
|---|---|
| Duplicate flow | View published → Duplicate → personal copy in My Work |
| Constrained editing | Open personal copy, verify measure registry palette (not raw fields) |
| Add widget from registry | Drag measure to canvas, verify widget appears |
| Remove widget | Select widget, Delete key, verify removed |
| Morph widget | Right-click → Morph To, select new type, verify morph |
| Style editing | Select widget, change color in Style tab, verify update |
| No Filters tab | Verify config panel shows Data + Style only, no Filters |
| Share with user | Click Share, search user, select, share, verify visibility change |
| Mobile editing | Tablet viewport, verify sidebar overlay, config panel bottom sheet |

### Workspace Admin Tests (Gate B-3)

| Test | What It Verifies |
|---|---|
| Dense catalog | Verify table layout, sort by columns, search, switch to card view |
| Create dashboard | Create New → Dashboard → pick source → pick template → editor opens |
| Create report | Create New → Report → pick source → editor opens (no template step) |
| Report 30+ columns | Open report editor, search columns, bulk hide, conditional format |
| Dashboard freeform | Place widget, drag to reposition, verify snap-to-grid |
| Preview as viewer | Toggle preview mode, select role, verify constraints applied |
| Filter admin | Create FilterDefinition, set value source, add security binding |
| Filter rules | Create rule with structured builder, switch to raw text, save |
| Filter value handling | Enable orphan detection, set match rule expression, preview matches |
| Alert admin | Create threshold alert, set grace period, add subscribers |
| Data source enrichment | Open data source, rename field, set semantic hint, preview data |
| Publish workflow | Create draft, publish (optional review), verify status change |
| Command palette | Ctrl+K, type artifact name, Enter, verify navigation |
| Keyboard shortcuts | Ctrl+S save, Ctrl+Z undo, Ctrl+D duplicate widget |

### Feature Tests (Gate C-1, C-2)

| Test | What It Verifies |
|---|---|
| Decision tree widget | Place on canvas, add nodes, set conditions, verify status rendering |
| Container box | Place box, drag widgets into it, verify grouping, style box |
| Expandable KPI | Configure expansion child widgets, preview expand behavior |
| Async report | Click "Run in Background", verify attention notification on completion |
| Personal alert | Right-click KPI → Create Alert, set threshold, verify creation |
| Subscription | Subscribe to dashboard, set weekly schedule, verify in Subscriptions tab |
| Expression builder | Build condition with dropdowns, switch to raw text, verify roundtrip |
| OpenAPI generation | Open API Access, configure roles, generate spec, verify JSON structure |

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Viewer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/viewer/dashboard/test-dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
  });

  test('filters update widget data', async ({ page }) => {
    // Apply filter
    await page.click('[data-testid="filter-region"]');
    await page.click('[data-testid="filter-option-north"]');
    
    // Verify widget updates
    await expect(page.locator('[data-testid="kpi-revenue"]'))
      .toContainText('North');
  });

  test('error state shows friendly message on adapter failure', async ({ page }) => {
    // Trigger adapter error (mock)
    await page.evaluate(() => window.__mockAdapterError('timeout'));
    
    // Verify friendly message
    await expect(page.locator('[data-testid="error-message"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="error-message"]'))
      .not.toContainText('Error:'); // no technical jargon
    
    // Verify retry button
    await expect(page.locator('[data-testid="retry-button"]'))
      .toBeVisible();
    
    // Verify technical details are collapsed
    await expect(page.locator('[data-testid="error-details"]'))
      .not.toBeVisible();
    
    // Expand and verify
    await page.click('[data-testid="show-details"]');
    await expect(page.locator('[data-testid="error-details"]'))
      .toContainText('CONNECTION_TIMEOUT');
  });
});
```

## When You're Done

1. Run full test suite, capture results
2. Update TRACKER.md with pass/fail counts
3. If failures: create detailed bug report in TRACKER.md for the responsible dev agent
4. Append to CHANGELOG.md
