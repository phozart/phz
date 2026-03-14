/**
 * @phozart/workspace — Filter Value Handling Admin State (B-3.07)
 *
 * Pure functions for configuring FilterValueSource (data-source, lookup-table, static),
 * transform configuration, default value setup, and display options
 * (multi-select, free text, count display).
 */

import type { FilterValueSource, FilterValueTransform, FilterDefault } from '../types.js';

// ========================================================================
// Display options
// ========================================================================

export interface FilterDisplayOptions {
  showCount: boolean;
  allowFreeText: boolean;
  multiSelect: boolean;
  searchable: boolean;
  maxVisibleItems: number;
  placeholder?: string;
  emptyStateText?: string;
}

// ========================================================================
// Lookup table entry (matches FilterValueSource lookup-table shape)
// ========================================================================

export interface LookupEntry {
  value: string;
  label: string;
  order?: number;
}

// ========================================================================
// State
// ========================================================================

export interface FilterValueAdminState {
  filterDefinitionId: string;
  valueSource: FilterValueSource;
  transform?: FilterValueTransform;
  defaultValue?: FilterDefault;
  displayOptions: FilterDisplayOptions;
  previewValues: unknown[];
  previewLoading: boolean;
  previewError?: string;
}

// ========================================================================
// Defaults
// ========================================================================

const DEFAULT_DISPLAY_OPTIONS: FilterDisplayOptions = {
  showCount: false,
  allowFreeText: false,
  multiSelect: false,
  searchable: true,
  maxVisibleItems: 10,
};

// ========================================================================
// Factory
// ========================================================================

export function initialFilterValueAdminState(
  filterDefinitionId: string,
  valueSource?: FilterValueSource,
): FilterValueAdminState {
  return {
    filterDefinitionId,
    valueSource: valueSource ?? { type: 'static', values: [] },
    displayOptions: { ...DEFAULT_DISPLAY_OPTIONS },
    previewValues: [],
    previewLoading: false,
  };
}

// ========================================================================
// Value source configuration
// ========================================================================

export function setValueSourceType(
  state: FilterValueAdminState,
  type: 'data-source' | 'lookup-table' | 'static',
): FilterValueAdminState {
  let valueSource: FilterValueSource;

  switch (type) {
    case 'data-source':
      valueSource = { type: 'data-source', dataSourceId: '', field: '' };
      break;
    case 'lookup-table':
      valueSource = { type: 'lookup-table', entries: [] };
      break;
    case 'static':
      valueSource = { type: 'static', values: [] };
      break;
  }

  return { ...state, valueSource };
}

export function updateDataSourceConfig(
  state: FilterValueAdminState,
  dataSourceId: string,
  field: string,
): FilterValueAdminState {
  if (state.valueSource.type !== 'data-source') return state;
  return {
    ...state,
    valueSource: { ...state.valueSource, dataSourceId, field },
  };
}

export function setStaticValues(
  state: FilterValueAdminState,
  values: string[],
): FilterValueAdminState {
  if (state.valueSource.type !== 'static') return state;
  return {
    ...state,
    valueSource: { ...state.valueSource, values },
  };
}

export function addLookupEntry(
  state: FilterValueAdminState,
  entry: LookupEntry,
): FilterValueAdminState {
  if (state.valueSource.type !== 'lookup-table') return state;
  const existing = state.valueSource.entries ?? [];
  if (existing.some((e: { value: string }) => e.value === entry.value)) return state;
  return {
    ...state,
    valueSource: { ...state.valueSource, entries: [...existing, entry] },
  };
}

export function removeLookupEntry(
  state: FilterValueAdminState,
  value: string,
): FilterValueAdminState {
  if (state.valueSource.type !== 'lookup-table') return state;
  const entries = (state.valueSource.entries ?? []).filter(
    (e: { value: string }) => e.value !== value,
  );
  return {
    ...state,
    valueSource: { ...state.valueSource, entries },
  };
}

export function reorderLookupEntries(
  state: FilterValueAdminState,
  fromIndex: number,
  toIndex: number,
): FilterValueAdminState {
  if (state.valueSource.type !== 'lookup-table') return state;
  const entries = [...(state.valueSource.entries ?? [])];
  if (fromIndex < 0 || fromIndex >= entries.length || toIndex < 0 || toIndex >= entries.length) {
    return state;
  }
  const [moved] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, moved);
  return {
    ...state,
    valueSource: { ...state.valueSource, entries },
  };
}

// ========================================================================
// Transform
// ========================================================================

export function setTransform(
  state: FilterValueAdminState,
  transform: FilterValueTransform | undefined,
): FilterValueAdminState {
  return { ...state, transform };
}

// ========================================================================
// Default value
// ========================================================================

export function setDefaultValue(
  state: FilterValueAdminState,
  defaultValue: FilterDefault | undefined,
): FilterValueAdminState {
  return { ...state, defaultValue };
}

export function setStaticDefault(
  state: FilterValueAdminState,
  value: unknown,
): FilterValueAdminState {
  return { ...state, defaultValue: { type: 'static', value } };
}

export function setViewerAttributeDefault(
  state: FilterValueAdminState,
  attribute: string,
): FilterValueAdminState {
  return { ...state, defaultValue: { type: 'viewer-attribute', attribute } };
}

export function setRelativeDateDefault(
  state: FilterValueAdminState,
  offset: number,
  unit: 'days' | 'weeks' | 'months' | 'years',
): FilterValueAdminState {
  return { ...state, defaultValue: { type: 'relative-date', offset, unit } };
}

// ========================================================================
// Display options
// ========================================================================

export function updateDisplayOptions(
  state: FilterValueAdminState,
  updates: Partial<FilterDisplayOptions>,
): FilterValueAdminState {
  return {
    ...state,
    displayOptions: { ...state.displayOptions, ...updates },
  };
}

export function toggleMultiSelect(
  state: FilterValueAdminState,
): FilterValueAdminState {
  return {
    ...state,
    displayOptions: {
      ...state.displayOptions,
      multiSelect: !state.displayOptions.multiSelect,
    },
  };
}

export function toggleShowCount(
  state: FilterValueAdminState,
): FilterValueAdminState {
  return {
    ...state,
    displayOptions: {
      ...state.displayOptions,
      showCount: !state.displayOptions.showCount,
    },
  };
}

export function toggleFreeText(
  state: FilterValueAdminState,
): FilterValueAdminState {
  return {
    ...state,
    displayOptions: {
      ...state.displayOptions,
      allowFreeText: !state.displayOptions.allowFreeText,
    },
  };
}

// ========================================================================
// Preview
// ========================================================================

export function setPreviewLoading(
  state: FilterValueAdminState,
  loading: boolean,
): FilterValueAdminState {
  return { ...state, previewLoading: loading };
}

export function setPreviewValues(
  state: FilterValueAdminState,
  values: unknown[],
): FilterValueAdminState {
  return { ...state, previewValues: values, previewLoading: false, previewError: undefined };
}

export function setPreviewError(
  state: FilterValueAdminState,
  error: string,
): FilterValueAdminState {
  return { ...state, previewError: error, previewLoading: false };
}

// ========================================================================
// Validation
// ========================================================================

export interface FilterValueValidation {
  valid: boolean;
  errors: string[];
}

export function validateFilterValueConfig(
  state: FilterValueAdminState,
): FilterValueValidation {
  const errors: string[] = [];

  switch (state.valueSource.type) {
    case 'data-source':
      if (!state.valueSource.dataSourceId?.trim()) {
        errors.push('Data source ID is required');
      }
      if (!state.valueSource.field?.trim()) {
        errors.push('Field name is required');
      }
      break;
    case 'lookup-table':
      if (!state.valueSource.entries?.length) {
        errors.push('At least one lookup entry is required');
      }
      break;
    case 'static':
      // Static with empty values is valid (unusual but allowed)
      break;
  }

  if (state.displayOptions.maxVisibleItems < 1) {
    errors.push('Max visible items must be at least 1');
  }

  return { valid: errors.length === 0, errors };
}
