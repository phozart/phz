/**
 * @phozart/shared — Dashboard Performance Estimation Types (WE-14)
 *
 * Heuristic performance profiling types for dashboard authoring feedback.
 * These types drive the performance estimation panel that helps authors
 * understand the expected load characteristics of their dashboard.
 */

// ========================================================================
// Warning Codes
// ========================================================================

/** Enumerated warning codes for performance issues. */
export type PerformanceWarningCode =
  | 'large-dataset'
  | 'many-widgets'
  | 'no-arrow-ipc'
  | 'server-source'
  | 'complex-filters'
  | 'deep-hierarchy'
  | 'cross-filter-chain';

// ========================================================================
// DashboardPerformanceWarning
// ========================================================================

/** A single performance warning with severity, code, and actionable suggestion. */
export interface DashboardPerformanceWarning {
  severity: 'info' | 'warning' | 'critical';
  code: PerformanceWarningCode;
  message: string;
  suggestion: string;
  affectedWidget?: string;
}

// ========================================================================
// DashboardSourceProfile
// ========================================================================

/** Performance profile for a single data source within a dashboard. */
export interface DashboardSourceProfile {
  id: string;
  name: string;
  estimatedRows: number;
  executionEngine: 'duckdb-wasm' | 'server' | 'cache';
  hasArrowIPC: boolean;
  assessment: 'fast' | 'moderate' | 'slow';
}

// ========================================================================
// DashboardLoadProfile
// ========================================================================

/** Full performance profile for a dashboard, including per-source and aggregate metrics. */
export interface DashboardLoadProfile {
  sources: DashboardSourceProfile[];
  widgetsByTier: {
    preload: number;
    fullLoad: number;
    deferred: number;
  };
  filterCount: number;
  estimatedPreloadMs: number;
  estimatedFullLoadMs: number;
  warnings: DashboardPerformanceWarning[];
  overallAssessment: 'fast' | 'moderate' | 'slow' | 'warning';
}

// ========================================================================
// SourceHints — input from consumers
// ========================================================================

/** Per-source hints provided by the consumer for performance estimation. */
export interface SourcePerformanceHint {
  estimatedRows: number;
  executionEngine: 'duckdb-wasm' | 'server' | 'cache';
  hasArrowIPC: boolean;
}
