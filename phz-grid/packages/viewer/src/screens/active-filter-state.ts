/** @phozart/viewer — Active Filter Visibility State (UX-021)
 *
 * Pure-function state machine for managing active filter chips in
 * the viewer filter bar. Supports expand/collapse of individual
 * chips, bulk collapse of the chip bar, and chip removal. All
 * transitions are immutable with no-op same-reference semantics.
 */

// ========================================================================
// Types
// ========================================================================

export interface FilterDefinitionInput {
  filterId: string;
  field: string;
  label: string;
  removable?: boolean; // default true
}

export interface FilterValueInput {
  filterId: string;
  field: string;
  operator: string;
  value: unknown;
  label?: string;
}

export interface ActiveFilterChip {
  filterId: string;
  field: string;
  label: string;
  displayValue: string;
  operator: string;
  removable: boolean;
}

export interface ActiveFilterVisibilityState {
  chips: ActiveFilterChip[];
  expandedChipId: string | null;
  collapsed: boolean;
}

// ========================================================================
// Factory
// ========================================================================

/** Create an empty ActiveFilterVisibilityState. */
export function createActiveFilterVisibilityState(): ActiveFilterVisibilityState {
  return { chips: [], expandedChipId: null, collapsed: false };
}

// ========================================================================
// Helpers
// ========================================================================

/** Operator label map for display formatting. */
const OPERATOR_LABELS: Record<string, string> = {
  equals: '=',
  greaterThan: '>',
  lessThan: '<',
  contains: 'contains',
};

/**
 * Format a filter value for display in a chip.
 *
 * Rules:
 * - null/undefined → "Any"
 * - boolean → "Yes" / "No"
 * - "between" with array of 2 → "X – Y"
 * - "in" with array → "X, Y, Z"
 * - arrays (other) → join with ", " then apply operator prefix
 * - string/number → String(value) with operator prefix
 * - unknown operator → "operator: value"
 */
export function formatFilterValue(operator: string, value: unknown): string {
  // null / undefined → "Any" (regardless of operator)
  if (value === null || value === undefined) {
    return 'Any';
  }

  // boolean → "Yes" / "No" (regardless of operator)
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // "between" special handling
  if (operator === 'between') {
    if (Array.isArray(value) && value.length === 2) {
      return `${String(value[0])} – ${String(value[1])}`;
    }
    // Non-array or wrong length — fallback
    const formatted = Array.isArray(value) ? value.join(', ') : String(value);
    return `between: ${formatted}`;
  }

  // "in" operator → comma-separated list (no prefix)
  if (operator === 'in') {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  // Stringify the value (arrays joined with ", ")
  const strValue = Array.isArray(value) ? value.join(', ') : String(value);

  // Known operator → "prefix value"
  const prefix = OPERATOR_LABELS[operator];
  if (prefix !== undefined) {
    return `${prefix} ${strValue}`;
  }

  // Unknown operator → "operator: value"
  return `${operator}: ${strValue}`;
}

// ========================================================================
// Pure computations
// ========================================================================

/**
 * Build an array of ActiveFilterChip from active filter values and their
 * definitions. Chips are sorted by definition order. Filters without a
 * matching definition are skipped.
 */
export function computeFilterChips(
  filters: Record<string, FilterValueInput>,
  definitions: FilterDefinitionInput[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const def of definitions) {
    const filter = filters[def.filterId];
    if (!filter) continue;

    chips.push({
      filterId: def.filterId,
      field: def.field,
      label: def.label || def.field,
      displayValue: formatFilterValue(filter.operator, filter.value),
      operator: filter.operator,
      removable: def.removable ?? true,
    });
  }

  return chips;
}

// ========================================================================
// State transitions
// ========================================================================

/** Replace the chips array in state. */
export function setFilterChips(
  state: ActiveFilterVisibilityState,
  chips: ActiveFilterChip[],
): ActiveFilterVisibilityState {
  return { ...state, chips };
}

/**
 * Expand a chip by filterId. No-op (same ref) if chipId is not in the
 * chips array or if the chip is already expanded.
 */
export function expandChip(
  state: ActiveFilterVisibilityState,
  chipId: string,
): ActiveFilterVisibilityState {
  if (state.expandedChipId === chipId) return state;
  if (!state.chips.some((c) => c.filterId === chipId)) return state;
  return { ...state, expandedChipId: chipId };
}

/**
 * Collapse the currently expanded chip. No-op (same ref) if nothing
 * is expanded.
 */
export function collapseChip(
  state: ActiveFilterVisibilityState,
): ActiveFilterVisibilityState {
  if (state.expandedChipId === null) return state;
  return { ...state, expandedChipId: null };
}

/** Toggle the collapsed boolean for the entire chip bar. */
export function toggleCollapsed(
  state: ActiveFilterVisibilityState,
): ActiveFilterVisibilityState {
  return { ...state, collapsed: !state.collapsed };
}

/**
 * Remove a chip by filterId. No-op (same ref) if the chip is not found.
 * If the removed chip was expanded, clears expandedChipId.
 */
export function removeChip(
  state: ActiveFilterVisibilityState,
  chipId: string,
): ActiveFilterVisibilityState {
  const idx = state.chips.findIndex((c) => c.filterId === chipId);
  if (idx === -1) return state;

  const chips = [...state.chips.slice(0, idx), ...state.chips.slice(idx + 1)];
  const expandedChipId = state.expandedChipId === chipId ? null : state.expandedChipId;
  return { ...state, chips, expandedChipId };
}

// ========================================================================
// Selectors
// ========================================================================

/** Return the number of active filter chips. */
export function getChipCount(state: ActiveFilterVisibilityState): number {
  return state.chips.length;
}

/** Return the currently expanded chip, or null. */
export function getExpandedChip(state: ActiveFilterVisibilityState): ActiveFilterChip | null {
  if (state.expandedChipId === null) return null;
  return state.chips.find((c) => c.filterId === state.expandedChipId) ?? null;
}
