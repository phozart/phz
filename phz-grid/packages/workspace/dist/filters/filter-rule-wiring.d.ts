/**
 * filter-rule-wiring — Bridges FilterContextManager ↔ FilterRuleEngine
 * and handles cross-filter propagation between widgets.
 *
 * Task 2.3: Converts FilterValue[] → Record<string, unknown> for rule
 * evaluation, and provides helpers to collect/group rule actions.
 *
 * Task 2.4: Applies cross-filter entries when a widget selection occurs,
 * which triggers sibling widget refresh via FilterContextManager subscription.
 *
 * Tasks: 2.3 (WB-008), 2.4 (WB-009)
 */
import type { FilterValue, FilterContextManager } from '@phozart/shared';
import type { ViewerContext } from '../types.js';
import { type FilterRule, type FilterRuleResult, type FilterRuleAction } from './filter-rule-engine.js';
/**
 * Convert FilterValue[] (from FilterContextManager.resolveFilters())
 * into the Record<filterId, value> format that FilterRuleEngine expects.
 */
export declare function filterValuesToStateRecord(filters: readonly FilterValue[]): Record<string, unknown>;
/**
 * Evaluate filter rules using the current FilterContextManager state.
 * Combines the FilterContextManager → Record conversion with the
 * FilterRuleEngine evaluation in a single call.
 */
export declare function evaluateRulesFromContext(rules: FilterRule[], filterContext: FilterContextManager, viewerContext?: ViewerContext): FilterRuleResult[];
/** Map of filterDefinitionId → actions that apply to it. */
export type FilterRuleActionMap = Record<string, FilterRuleAction[]>;
/**
 * Collect matched rule actions and group them by target filter definition ID.
 * Only includes actions from rules that actually matched.
 */
export declare function collectRuleActions(results: FilterRuleResult[]): FilterRuleActionMap;
/**
 * Apply a cross-filter from a widget interaction. When a user clicks on
 * a chart element (e.g., a bar in a bar chart), the clicked value becomes
 * a cross-filter that affects all sibling widgets.
 *
 * The FilterContextManager handles:
 * - Storing the cross-filter entry
 * - Excluding it from the source widget's own queries
 * - Notifying subscribers (which triggers pipeline re-execution)
 */
export declare function applyCrossFilterFromWidget(filterContext: FilterContextManager, sourceWidgetId: string, field: string, value: unknown): void;
//# sourceMappingURL=filter-rule-wiring.d.ts.map