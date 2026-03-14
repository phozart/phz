/**
 * @phozart/engine — Drill-Down State Machine
 *
 * Manages within-visualization drill navigation through hierarchy levels.
 * Complementary to drill-through.ts which handles cross-artifact navigation.
 *
 * Pure functions only — no side effects, no DOM.
 */

import type { HierarchyDefinition } from './hierarchy.js';
import type { DataQueryFilter } from '@phozart/shared/adapters';

// ========================================================================
// Types
// ========================================================================

export interface DrillBreadcrumbEntry {
  level: number;
  label: string;
  field: string;
  value: unknown;
}

export interface DrillDownState {
  hierarchyId: string;
  currentLevel: number;
  breadcrumb: DrillBreadcrumbEntry[];
  filterStack: Array<Record<string, unknown>>;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create initial drill-down state at the top level of a hierarchy.
 */
export function createInitialDrillDownState(hierarchyId: string): DrillDownState {
  return {
    hierarchyId,
    currentLevel: 0,
    breadcrumb: [],
    filterStack: [],
  };
}

// ========================================================================
// State Transitions
// ========================================================================

/**
 * Drill into the next level. Pushes a breadcrumb entry and a filter.
 * The current level advances by 1.
 */
export function drillDown(
  state: DrillDownState,
  field: string,
  value: unknown,
): DrillDownState {
  const entry: DrillBreadcrumbEntry = {
    level: state.currentLevel,
    label: String(value),
    field,
    value,
  };

  return {
    ...state,
    currentLevel: state.currentLevel + 1,
    breadcrumb: [...state.breadcrumb, entry],
    filterStack: [...state.filterStack, { [field]: value }],
  };
}

/**
 * Drill up to the previous level. No-op at the top level (returns same state).
 */
export function drillUp(state: DrillDownState): DrillDownState {
  if (state.currentLevel === 0) {
    return state;
  }

  return {
    ...state,
    currentLevel: state.currentLevel - 1,
    breadcrumb: state.breadcrumb.slice(0, -1),
    filterStack: state.filterStack.slice(0, -1),
  };
}

/**
 * Jump to a specific level, trimming the breadcrumb and filter stack.
 * Jumping to level 0 resets to the initial state.
 */
export function drillToLevel(
  state: DrillDownState,
  targetLevel: number,
): DrillDownState {
  if (targetLevel >= state.currentLevel) {
    return state;
  }

  return {
    ...state,
    currentLevel: targetLevel,
    breadcrumb: state.breadcrumb.slice(0, targetLevel),
    filterStack: state.filterStack.slice(0, targetLevel),
  };
}

// ========================================================================
// Query Helpers
// ========================================================================

/**
 * Check if drill-down is possible (not at the bottom level).
 */
export function canDrillDown(
  state: DrillDownState,
  hierarchy: HierarchyDefinition,
): boolean {
  return state.currentLevel < hierarchy.levels.length - 1;
}

/**
 * Check if drill-up is possible (not at the top level).
 */
export function canDrillUp(state: DrillDownState): boolean {
  return state.currentLevel > 0;
}

/**
 * Get the query parameters for the current drill level.
 * Returns the field to group by and ALL accumulated filters from the breadcrumb stack.
 */
export function getDrillQuery(
  state: DrillDownState,
  hierarchy: HierarchyDefinition,
): { groupByField: string; filters: DataQueryFilter[] } {
  const groupByField = hierarchy.levels[state.currentLevel]?.field ?? '';

  const filters: DataQueryFilter[] = state.breadcrumb.map(entry => ({
    field: entry.field,
    operator: 'equals' as const,
    value: entry.value,
  }));

  return { groupByField, filters };
}
