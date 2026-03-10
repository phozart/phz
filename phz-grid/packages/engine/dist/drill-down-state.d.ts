/**
 * @phozart/phz-engine — Drill-Down State Machine
 *
 * Manages within-visualization drill navigation through hierarchy levels.
 * Complementary to drill-through.ts which handles cross-artifact navigation.
 *
 * Pure functions only — no side effects, no DOM.
 */
import type { HierarchyDefinition } from './hierarchy.js';
import type { DataQueryFilter } from '@phozart/phz-shared/adapters';
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
/**
 * Create initial drill-down state at the top level of a hierarchy.
 */
export declare function createInitialDrillDownState(hierarchyId: string): DrillDownState;
/**
 * Drill into the next level. Pushes a breadcrumb entry and a filter.
 * The current level advances by 1.
 */
export declare function drillDown(state: DrillDownState, field: string, value: unknown): DrillDownState;
/**
 * Drill up to the previous level. No-op at the top level (returns same state).
 */
export declare function drillUp(state: DrillDownState): DrillDownState;
/**
 * Jump to a specific level, trimming the breadcrumb and filter stack.
 * Jumping to level 0 resets to the initial state.
 */
export declare function drillToLevel(state: DrillDownState, targetLevel: number): DrillDownState;
/**
 * Check if drill-down is possible (not at the bottom level).
 */
export declare function canDrillDown(state: DrillDownState, hierarchy: HierarchyDefinition): boolean;
/**
 * Check if drill-up is possible (not at the top level).
 */
export declare function canDrillUp(state: DrillDownState): boolean;
/**
 * Get the query parameters for the current drill level.
 * Returns the field to group by and ALL accumulated filters from the breadcrumb stack.
 */
export declare function getDrillQuery(state: DrillDownState, hierarchy: HierarchyDefinition): {
    groupByField: string;
    filters: DataQueryFilter[];
};
//# sourceMappingURL=drill-down-state.d.ts.map