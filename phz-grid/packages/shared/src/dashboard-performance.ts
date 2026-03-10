/**
 * @phozart/phz-shared — Dashboard Performance Estimation (WE-14)
 *
 * Heuristic performance estimation for dashboard authoring feedback.
 * All functions are pure — no side effects, no DOM access.
 *
 * Thresholds are heuristic guidance, not precise predictions.
 * They help authors spot potential bottlenecks before publishing.
 */

import type { DashboardDataConfig } from './coordination/dashboard-data-pipeline.js';
import type { DashboardWidget } from './types/widgets.js';
import type {
  DashboardLoadProfile,
  DashboardSourceProfile,
  DashboardPerformanceWarning,
  SourcePerformanceHint,
} from './types/dashboard-performance.js';

// Re-export types for convenient single-module import
export type {
  DashboardLoadProfile,
  DashboardSourceProfile,
  DashboardPerformanceWarning,
  PerformanceWarningCode,
  SourcePerformanceHint,
} from './types/dashboard-performance.js';

// ========================================================================
// Constants
// ========================================================================

const DUCKDB_FAST_THRESHOLD = 100_000;
const DUCKDB_MODERATE_THRESHOLD = 1_000_000;
const SERVER_BASE_LATENCY_MS = 200;
const SERVER_PER_10K_ROWS_MS = 50;
const ARROW_IPC_SPEED_BONUS = 0.7; // 30% faster
const DUCKDB_MS_PER_10K_ROWS = 10;

const WIDGET_WARNING_THRESHOLD = 10;
const WIDGET_CRITICAL_THRESHOLD = 20;
const CROSS_FILTER_WARNING_THRESHOLD = 5;

const FULL_LOAD_FAST_MS = 1000;
const FULL_LOAD_MODERATE_MS = 5000;
const FULL_LOAD_SLOW_MS = 10000;

// ========================================================================
// getSourceAssessment
// ========================================================================

/**
 * Assess a single source's expected performance tier.
 */
export function getSourceAssessment(
  estimatedRows: number,
  engine: string,
  hasArrowIPC: boolean,
): 'fast' | 'moderate' | 'slow' {
  const rows = Math.max(0, estimatedRows);

  // Estimate effective latency in ms
  let latencyMs: number;

  if (engine === 'server') {
    latencyMs = SERVER_BASE_LATENCY_MS + (rows / 10_000) * SERVER_PER_10K_ROWS_MS;
  } else {
    // duckdb-wasm, local-duckdb, cache, auto
    latencyMs = (rows / 10_000) * DUCKDB_MS_PER_10K_ROWS;
  }

  if (hasArrowIPC) {
    latencyMs *= ARROW_IPC_SPEED_BONUS;
  }

  if (rows <= 0) return 'fast';
  if (engine === 'cache') return 'fast';

  if (engine === 'server') {
    // Server thresholds: higher due to network overhead
    if (latencyMs < 500) return 'fast';
    if (latencyMs < 2000) return 'moderate';
    return 'slow';
  }

  // DuckDB-WASM / local-duckdb thresholds
  if (rows < DUCKDB_FAST_THRESHOLD) return 'fast';
  if (rows < DUCKDB_MODERATE_THRESHOLD) return 'moderate';
  return 'slow';
}

// ========================================================================
// getOverallAssessment
// ========================================================================

/**
 * Determine overall dashboard assessment from aggregate timing estimates.
 */
export function getOverallAssessment(
  preloadMs: number,
  fullLoadMs: number,
): 'fast' | 'moderate' | 'slow' | 'warning' {
  const effectiveFull = Math.max(0, fullLoadMs);
  const effectivePreload = Math.max(0, preloadMs);
  const worst = Math.max(effectiveFull, effectivePreload);

  if (worst < FULL_LOAD_FAST_MS) return 'fast';
  if (worst < FULL_LOAD_MODERATE_MS) return 'moderate';
  if (worst < FULL_LOAD_SLOW_MS) return 'slow';
  return 'warning';
}

// ========================================================================
// estimateDashboardPerformance
// ========================================================================

/**
 * Estimate dashboard load performance and generate actionable warnings.
 *
 * @param config - Dashboard data configuration (multi-source or legacy)
 * @param widgets - All widgets on the dashboard
 * @param filters - Cross-filter rules (any array with items)
 * @param sourceHints - Per-source performance hints keyed by sourceId
 */
export function estimateDashboardPerformance(
  config: DashboardDataConfig,
  widgets: DashboardWidget[],
  filters: unknown[],
  sourceHints: Record<string, SourcePerformanceHint>,
): DashboardLoadProfile {
  const warnings: DashboardPerformanceWarning[] = [];
  const sources: DashboardSourceProfile[] = [];

  const configSources = config.sources ?? [];

  // --- Per-source analysis ---
  let totalPreloadMs = 0;
  let totalFullLoadMs = 0;

  for (const src of configSources) {
    const hint = sourceHints[src.sourceId];
    if (!hint) continue;

    const rows = Math.max(0, hint.estimatedRows);
    const assessment = getSourceAssessment(rows, hint.executionEngine, hint.hasArrowIPC);

    sources.push({
      id: src.sourceId,
      name: src.alias ?? src.sourceId,
      estimatedRows: rows,
      executionEngine: hint.executionEngine,
      hasArrowIPC: hint.hasArrowIPC,
      assessment,
    });

    // Estimate timings
    let sourceMs: number;
    if (hint.executionEngine === 'server') {
      sourceMs = SERVER_BASE_LATENCY_MS + (rows / 10_000) * SERVER_PER_10K_ROWS_MS;
    } else if (hint.executionEngine === 'cache') {
      sourceMs = 10; // near-instant
    } else {
      sourceMs = (rows / 10_000) * DUCKDB_MS_PER_10K_ROWS;
    }

    if (hint.hasArrowIPC) {
      sourceMs *= ARROW_IPC_SPEED_BONUS;
    }

    // Preload is typically ~30% of full load (subset query)
    totalPreloadMs += sourceMs * 0.3;
    totalFullLoadMs += sourceMs;

    // Source-level warnings
    if (rows > DUCKDB_MODERATE_THRESHOLD) {
      warnings.push({
        severity: 'warning',
        code: 'large-dataset',
        message: `Source "${src.alias ?? src.sourceId}" has ~${(rows / 1_000_000).toFixed(1)}M rows`,
        suggestion: 'Consider server-side aggregation or pre-computed summaries to reduce client-side data volume.',
      });
    }

    if (hint.executionEngine === 'server') {
      warnings.push({
        severity: 'info',
        code: 'server-source',
        message: `Source "${src.alias ?? src.sourceId}" uses server-side execution`,
        suggestion: 'Server sources add network latency. Consider DuckDB-WASM for local datasets under 1M rows.',
      });
    }

    if (!hint.hasArrowIPC && rows > DUCKDB_FAST_THRESHOLD) {
      warnings.push({
        severity: 'info',
        code: 'no-arrow-ipc',
        message: `Source "${src.alias ?? src.sourceId}" is not using Arrow IPC`,
        suggestion: 'Enable Arrow IPC transfer for up to 30% faster data loading.',
      });
    }
  }

  // --- Widget analysis ---
  const widgetCount = widgets.length;
  const visibleCount = widgets.filter(w => w.visible).length;

  // Simple heuristic tier distribution: half preload, half full, none deferred by default
  const preloadWidgets = Math.ceil(widgetCount / 2);
  const fullLoadWidgets = widgetCount - preloadWidgets;

  if (widgetCount > WIDGET_CRITICAL_THRESHOLD) {
    warnings.push({
      severity: 'critical',
      code: 'many-widgets',
      message: `Dashboard has ${widgetCount} widgets (>${WIDGET_CRITICAL_THRESHOLD})`,
      suggestion: 'Split into multiple dashboards or use deferred loading for below-the-fold widgets.',
    });
  } else if (widgetCount > WIDGET_WARNING_THRESHOLD) {
    warnings.push({
      severity: 'warning',
      code: 'many-widgets',
      message: `Dashboard has ${widgetCount} widgets (>${WIDGET_WARNING_THRESHOLD})`,
      suggestion: 'Consider grouping related widgets or using tabs to reduce simultaneous rendering.',
    });
  }

  // --- Filter analysis ---
  const filterCount = filters.length;

  if (filterCount > CROSS_FILTER_WARNING_THRESHOLD) {
    warnings.push({
      severity: 'warning',
      code: 'cross-filter-chain',
      message: `Dashboard has ${filterCount} cross-filter rules (>${CROSS_FILTER_WARNING_THRESHOLD})`,
      suggestion: 'Complex filter chains cause cascading re-queries. Simplify or batch filter changes.',
    });
  }

  // Add per-widget rendering overhead (~5ms per widget for preload, ~10ms for full)
  totalPreloadMs += preloadWidgets * 5;
  totalFullLoadMs += widgetCount * 10;

  // Ensure no NaN / Infinity
  totalPreloadMs = Number.isFinite(totalPreloadMs) ? Math.max(0, totalPreloadMs) : 0;
  totalFullLoadMs = Number.isFinite(totalFullLoadMs) ? Math.max(0, totalFullLoadMs) : 0;

  const overallAssessment = getOverallAssessment(totalPreloadMs, totalFullLoadMs);

  return {
    sources,
    widgetsByTier: {
      preload: preloadWidgets,
      fullLoad: fullLoadWidgets,
      deferred: 0,
    },
    filterCount,
    estimatedPreloadMs: Math.round(totalPreloadMs),
    estimatedFullLoadMs: Math.round(totalFullLoadMs),
    warnings,
    overallAssessment,
  };
}
