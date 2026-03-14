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
import {
  evaluateFilterRules,
  type FilterRule,
  type FilterRuleResult,
  type FilterRuleAction,
} from './filter-rule-engine.js';

// ========================================================================
// FilterValue[] → Rule engine input
// ========================================================================

/**
 * Convert FilterValue[] (from FilterContextManager.resolveFilters())
 * into the Record<filterId, value> format that FilterRuleEngine expects.
 */
export function filterValuesToStateRecord(
  filters: readonly FilterValue[],
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const f of filters) {
    record[f.filterId] = f.value;
  }
  return record;
}

// ========================================================================
// Rule evaluation from context
// ========================================================================

/**
 * Evaluate filter rules using the current FilterContextManager state.
 * Combines the FilterContextManager → Record conversion with the
 * FilterRuleEngine evaluation in a single call.
 */
export function evaluateRulesFromContext(
  rules: FilterRule[],
  filterContext: FilterContextManager,
  viewerContext?: ViewerContext,
): FilterRuleResult[] {
  const filterValues = filterContext.resolveFilters();
  const filterState = filterValuesToStateRecord(filterValues);
  return evaluateFilterRules(rules, viewerContext, filterState);
}

// ========================================================================
// Action collection
// ========================================================================

/** Map of filterDefinitionId → actions that apply to it. */
export type FilterRuleActionMap = Record<string, FilterRuleAction[]>;

/**
 * Collect matched rule actions and group them by target filter definition ID.
 * Only includes actions from rules that actually matched.
 */
export function collectRuleActions(
  results: FilterRuleResult[],
): FilterRuleActionMap {
  const map: FilterRuleActionMap = {};

  for (const result of results) {
    if (!result.matched) continue;

    for (const action of result.actions) {
      const key = action.filterDefinitionId;
      if (!map[key]) map[key] = [];
      map[key].push(action);
    }
  }

  return map;
}

// ========================================================================
// Cross-filter wiring (Task 2.4)
// ========================================================================

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
export function applyCrossFilterFromWidget(
  filterContext: FilterContextManager,
  sourceWidgetId: string,
  field: string,
  value: unknown,
): void {
  filterContext.applyCrossFilter({
    sourceWidgetId,
    field,
    value,
    timestamp: Date.now(),
  });
}
