/**
 * @phozart/phz-shared — Dashboard Performance Estimation Tests (WE-14)
 *
 * TDD: Tests written first, implementation follows.
 */
import { describe, it, expect } from 'vitest';
import {
  estimateDashboardPerformance,
  getSourceAssessment,
  getOverallAssessment,
  type DashboardLoadProfile,
  type DashboardSourceProfile,
  type DashboardPerformanceWarning,
  type PerformanceWarningCode,
} from '../dashboard-performance.js';
import type { DashboardDataConfig } from '../coordination/dashboard-data-pipeline.js';
import type { DashboardWidget } from '../types/widgets.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides?: Partial<DashboardDataConfig>): DashboardDataConfig {
  return {
    sources: [
      {
        sourceId: 'src-1',
        preload: { query: { source: 'sales', fields: ['revenue'] } },
        fullLoad: { query: { source: 'sales', fields: ['revenue', 'region'] } },
      },
    ],
    ...overrides,
  };
}

function makeWidget(id: string, overrides?: Partial<DashboardWidget>): DashboardWidget {
  return {
    id,
    widgetType: 'kpi-card',
    position: { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
    config: {},
    visible: true,
    ...overrides,
  };
}

function makeWidgets(count: number): DashboardWidget[] {
  return Array.from({ length: count }, (_, i) => makeWidget(`w-${i}`));
}

// ---------------------------------------------------------------------------
// getSourceAssessment
// ---------------------------------------------------------------------------

describe('getSourceAssessment', () => {
  it('returns fast for small DuckDB-WASM dataset (<100K rows)', () => {
    expect(getSourceAssessment(50_000, 'duckdb-wasm', false)).toBe('fast');
  });

  it('returns moderate for medium DuckDB-WASM dataset (100K-1M rows)', () => {
    expect(getSourceAssessment(500_000, 'duckdb-wasm', false)).toBe('moderate');
  });

  it('returns slow for large DuckDB-WASM dataset (>1M rows)', () => {
    expect(getSourceAssessment(2_000_000, 'duckdb-wasm', false)).toBe('slow');
  });

  it('returns fast for zero rows', () => {
    expect(getSourceAssessment(0, 'duckdb-wasm', false)).toBe('fast');
  });

  it('treats negative rows as zero (defensive)', () => {
    expect(getSourceAssessment(-100, 'server', false)).toBe('fast');
  });

  it('server source with moderate rows is slower than duckdb-wasm equivalent', () => {
    // Server adds latency, so 50K rows (fast for duckdb) becomes moderate for server
    expect(getSourceAssessment(80_000, 'server', false)).toBe('moderate');
  });
});

// ---------------------------------------------------------------------------
// getOverallAssessment
// ---------------------------------------------------------------------------

describe('getOverallAssessment', () => {
  it('returns fast for low estimated times', () => {
    expect(getOverallAssessment(100, 300)).toBe('fast');
  });

  it('returns moderate for medium estimated times', () => {
    expect(getOverallAssessment(500, 2000)).toBe('moderate');
  });

  it('returns slow for high estimated times', () => {
    expect(getOverallAssessment(1000, 6000)).toBe('slow');
  });

  it('returns warning for very high estimated times', () => {
    expect(getOverallAssessment(5000, 15000)).toBe('warning');
  });

  it('handles zero values gracefully', () => {
    expect(getOverallAssessment(0, 0)).toBe('fast');
  });

  it('handles negative values gracefully (clamps to 0)', () => {
    expect(getOverallAssessment(-100, -200)).toBe('fast');
  });
});

// ---------------------------------------------------------------------------
// estimateDashboardPerformance
// ---------------------------------------------------------------------------

describe('estimateDashboardPerformance', () => {
  it('returns fast for a small DuckDB-WASM dashboard with few widgets', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 10_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    expect(result.overallAssessment).toBe('fast');
    expect(result.warnings).toHaveLength(0);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].assessment).toBe('fast');
  });

  it('generates large-dataset warning for >1M rows', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 5_000_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    expect(result.overallAssessment).not.toBe('fast');
    const warning = result.warnings.find(w => w.code === 'large-dataset');
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe('warning');
  });

  it('applies Arrow IPC speed bonus (30% faster)', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);

    const withoutArrow = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 200_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });
    const withArrow = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 200_000, executionEngine: 'duckdb-wasm', hasArrowIPC: true },
    });

    expect(withArrow.estimatedFullLoadMs).toBeLessThan(withoutArrow.estimatedFullLoadMs);
  });

  it('server source adds network latency', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 50_000, executionEngine: 'server', hasArrowIPC: false },
    });

    // Server adds 200ms base + 50ms per 10K rows => 200 + 250 = 450ms
    expect(result.estimatedFullLoadMs).toBeGreaterThan(400);
  });

  it('generates many-widgets warning when >10 widgets', () => {
    const config = makeConfig();
    const widgets = makeWidgets(12);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 10_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    const warning = result.warnings.find(w => w.code === 'many-widgets');
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe('warning');
  });

  it('generates critical many-widgets warning when >20 widgets', () => {
    const config = makeConfig();
    const widgets = makeWidgets(25);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 10_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    const warning = result.warnings.find(w => w.code === 'many-widgets');
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe('critical');
  });

  it('generates cross-filter-chain warning when >5 filters', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const filters = Array.from({ length: 7 }, (_, i) => ({ id: `f-${i}`, type: 'cross-filter' }));
    const result = estimateDashboardPerformance(config, widgets, filters, {
      'src-1': { estimatedRows: 10_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    const warning = result.warnings.find(w => w.code === 'cross-filter-chain');
    expect(warning).toBeDefined();
  });

  it('generates server-source warning for server execution engine', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 10_000, executionEngine: 'server', hasArrowIPC: false },
    });

    const warning = result.warnings.find(w => w.code === 'server-source');
    expect(warning).toBeDefined();
  });

  it('handles empty config gracefully (no sources)', () => {
    const config: DashboardDataConfig = { sources: [] };
    const widgets: DashboardWidget[] = [];
    const result = estimateDashboardPerformance(config, widgets, [], {});

    expect(result.overallAssessment).toBe('fast');
    expect(result.sources).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.estimatedPreloadMs).toBe(0);
    expect(result.estimatedFullLoadMs).toBe(0);
  });

  it('handles undefined sources gracefully', () => {
    const config: DashboardDataConfig = {};
    const widgets: DashboardWidget[] = [];
    const result = estimateDashboardPerformance(config, widgets, [], {});

    expect(result.overallAssessment).toBe('fast');
    expect(result.sources).toHaveLength(0);
  });

  it('widgetsByTier counts visible widgets', () => {
    const config = makeConfig();
    const widgets = [
      makeWidget('w-1', { visible: true }),
      makeWidget('w-2', { visible: true }),
      makeWidget('w-3', { visible: false }),
    ];
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 10_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    // Total widgets are tracked, including invisible
    expect(result.widgetsByTier.preload + result.widgetsByTier.fullLoad + result.widgetsByTier.deferred).toBe(3);
  });

  it('produces no NaN or Infinity in estimates', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 0, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    expect(Number.isFinite(result.estimatedPreloadMs)).toBe(true);
    expect(Number.isFinite(result.estimatedFullLoadMs)).toBe(true);
    for (const src of result.sources) {
      expect(Number.isFinite(src.estimatedRows)).toBe(true);
    }
  });

  it('generates no-arrow-ipc info for non-Arrow sources', () => {
    const config = makeConfig();
    const widgets = makeWidgets(3);
    const result = estimateDashboardPerformance(config, widgets, [], {
      'src-1': { estimatedRows: 200_000, executionEngine: 'duckdb-wasm', hasArrowIPC: false },
    });

    const warning = result.warnings.find(w => w.code === 'no-arrow-ipc');
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe('info');
  });
});
