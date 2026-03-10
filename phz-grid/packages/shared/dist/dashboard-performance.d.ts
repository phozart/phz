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
import type { DashboardLoadProfile, SourcePerformanceHint } from './types/dashboard-performance.js';
export type { DashboardLoadProfile, DashboardSourceProfile, DashboardPerformanceWarning, PerformanceWarningCode, SourcePerformanceHint, } from './types/dashboard-performance.js';
/**
 * Assess a single source's expected performance tier.
 */
export declare function getSourceAssessment(estimatedRows: number, engine: string, hasArrowIPC: boolean): 'fast' | 'moderate' | 'slow';
/**
 * Determine overall dashboard assessment from aggregate timing estimates.
 */
export declare function getOverallAssessment(preloadMs: number, fullLoadMs: number): 'fast' | 'moderate' | 'slow' | 'warning';
/**
 * Estimate dashboard load performance and generate actionable warnings.
 *
 * @param config - Dashboard data configuration (multi-source or legacy)
 * @param widgets - All widgets on the dashboard
 * @param filters - Cross-filter rules (any array with items)
 * @param sourceHints - Per-source performance hints keyed by sourceId
 */
export declare function estimateDashboardPerformance(config: DashboardDataConfig, widgets: DashboardWidget[], filters: unknown[], sourceHints: Record<string, SourcePerformanceHint>): DashboardLoadProfile;
//# sourceMappingURL=dashboard-performance.d.ts.map