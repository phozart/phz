/**
 * @phozart/phz-shared — FilterValueHandling (A-1.10)
 *
 * Defines how filter values are sourced, transformed, defaulted,
 * and handled across the lifecycle of a filter interaction.
 */

// ========================================================================
// FilterValueSource — where filter values come from
// ========================================================================

export type FilterValueSource =
  | { type: 'data-source'; dataSourceId: string; field: string; sort?: 'asc' | 'desc'; limit?: number }
  | { type: 'lookup-table'; entries: Array<{ value: string; label: string }> }
  | { type: 'static'; values: string[] };

// ========================================================================
// FilterValueTransform — how values are transformed before use
// ========================================================================

export type FilterValueTransform =
  | { type: 'lookup'; lookupSourceId: string; keyField: string; valueField: string }
  | { type: 'expression'; expr: string }
  | { type: 'granularity-shift'; from: string; to: string };

// ========================================================================
// FilterDefault — how default values are determined
// ========================================================================

export type FilterDefault =
  | { type: 'static'; value: unknown }
  | { type: 'relative-date'; offset: number; unit: 'days' | 'weeks' | 'months' | 'years' }
  | { type: 'viewer-attribute'; attribute: string }
  | { type: 'expression'; expr: string };

// ========================================================================
// FilterValueHandling — complete value handling configuration
// ========================================================================

/**
 * Comprehensive configuration for how a filter's values are sourced,
 * transformed, defaulted, validated, and displayed. Used by filter
 * definitions to describe the full value lifecycle.
 */
export interface FilterValueHandling {
  /** Where filter values come from. */
  source: FilterValueSource;
  /** Optional transformation applied to values before use. */
  transform?: FilterValueTransform;
  /** Default value configuration. */
  defaultValue?: FilterDefault;
  /** Whether the filter must have a value set. */
  required: boolean;
  /** Whether multiple values can be selected. */
  multi: boolean;
  /** Maximum number of values a user can select (0 = unlimited). */
  maxSelections: number;
  /** Whether to allow free-text entry in addition to predefined values. */
  allowFreeText: boolean;
  /** Placeholder text shown when no value is selected. */
  placeholder?: string;
  /** Whether null/empty values should be excluded from the value list. */
  excludeNulls: boolean;
  /** Whether to show a count of matching records next to each value. */
  showCounts: boolean;
  /** Debounce delay in ms for search-based value loading. */
  searchDebounceMs: number;
}

// ========================================================================
// Factory: createDefaultFilterValueHandling
// ========================================================================

/**
 * Create a FilterValueHandling with sensible defaults.
 * Returns a single-select, non-required configuration with
 * static empty values, search debounce of 300ms, and no
 * free-text entry.
 */
export function createDefaultFilterValueHandling(
  overrides?: Partial<FilterValueHandling>,
): FilterValueHandling {
  return {
    source: overrides?.source ?? { type: 'static', values: [] },
    transform: overrides?.transform,
    defaultValue: overrides?.defaultValue,
    required: overrides?.required ?? false,
    multi: overrides?.multi ?? false,
    maxSelections: overrides?.maxSelections ?? 0,
    allowFreeText: overrides?.allowFreeText ?? false,
    placeholder: overrides?.placeholder,
    excludeNulls: overrides?.excludeNulls ?? true,
    showCounts: overrides?.showCounts ?? false,
    searchDebounceMs: overrides?.searchDebounceMs ?? 300,
  };
}

// ========================================================================
// Utility: resolveStaticDefault
// ========================================================================

export function resolveStaticDefault(def: FilterDefault): unknown | undefined {
  if (def.type === 'static') return def.value;
  return undefined;
}
