/**
 * data-source-state — Headless state machine for data source browsing
 *
 * Manages the lifecycle of browsing data sources, loading schemas,
 * classifying fields into dimensions/measures/time/identifiers, and
 * selecting fields for report composition. Driven by the DataAdapter SPI.
 *
 * All functions are pure — no side effects, no async, no DOM.
 * The Lit component (or any UI) calls DataAdapter methods and feeds
 * results into these state transitions.
 */

import type {
  DataSourceMeta,
  FieldMetadata,
  FieldStatsResult,
} from '@phozart/phz-shared';
import { groupFieldsByRole } from '@phozart/phz-shared';

// Re-export the schema type for consumers
export type { DataSourceMeta, FieldMetadata };

// ========================================================================
// DataSourceSchema — locally defined to match shared adapter's shape
// ========================================================================

export interface DataSourceSchema {
  id: string;
  name: string;
  fields: FieldMetadata[];
}

// ========================================================================
// State
// ========================================================================

export interface DataSourceState {
  /** Available data sources from the adapter. */
  sources: DataSourceMeta[];
  sourcesLoading: boolean;

  /** Currently selected data source ID. */
  selectedSourceId: string | null;

  /** Schema for the selected data source. */
  schema: DataSourceSchema | null;
  schemaLoading: boolean;

  /** Classified field lists (derived from schema). */
  dimensions: FieldMetadata[];
  measures: FieldMetadata[];
  timeFields: FieldMetadata[];
  identifiers: FieldMetadata[];

  /** Fields selected for the current report/visualization. */
  selectedFields: string[];

  /** Field search query for filtering the sidebar. */
  fieldSearch: string;

  /** Cached field statistics (loaded on demand). */
  fieldStats: Record<string, FieldStatsResult>;

  /** Error message, if any. */
  error: string | null;
}

// ========================================================================
// Factory
// ========================================================================

export function createDataSourceState(): DataSourceState {
  return {
    sources: [],
    sourcesLoading: false,
    selectedSourceId: null,
    schema: null,
    schemaLoading: false,
    dimensions: [],
    measures: [],
    timeFields: [],
    identifiers: [],
    selectedFields: [],
    fieldSearch: '',
    fieldStats: {},
    error: null,
  };
}

// ========================================================================
// Field Classification — delegates to shared resolveSemanticRole
// ========================================================================

// ========================================================================
// State Transitions (pure functions)
// ========================================================================

export function setSources(state: DataSourceState, sources: DataSourceMeta[]): DataSourceState {
  return { ...state, sources, sourcesLoading: false };
}

export function selectSource(state: DataSourceState, sourceId: string): DataSourceState {
  if (state.selectedSourceId === sourceId) return state;
  return {
    ...state,
    selectedSourceId: sourceId,
    schema: null,
    schemaLoading: true,
    dimensions: [],
    measures: [],
    timeFields: [],
    identifiers: [],
    selectedFields: [],
    fieldSearch: '',
    fieldStats: {},
    error: null,
  };
}

export function setSchema(state: DataSourceState, schema: DataSourceSchema): DataSourceState {
  const { dimensions, measures, timeFields, identifiers } = groupFieldsByRole(schema.fields);
  return {
    ...state,
    schema,
    schemaLoading: false,
    dimensions,
    measures,
    timeFields,
    identifiers,
  };
}

export function setSchemaLoading(state: DataSourceState, loading: boolean): DataSourceState {
  return { ...state, schemaLoading: loading };
}

export function setFieldSearch(state: DataSourceState, query: string): DataSourceState {
  return { ...state, fieldSearch: query };
}

export function addField(state: DataSourceState, fieldName: string): DataSourceState {
  // Reject duplicates
  if (state.selectedFields.includes(fieldName)) return state;
  // Reject unknown fields
  if (!state.schema?.fields.some(f => f.name === fieldName)) return state;
  return { ...state, selectedFields: [...state.selectedFields, fieldName] };
}

export function removeField(state: DataSourceState, fieldName: string): DataSourceState {
  if (!state.selectedFields.includes(fieldName)) return state;
  return { ...state, selectedFields: state.selectedFields.filter(f => f !== fieldName) };
}

export function reorderFields(state: DataSourceState, fromIndex: number, toIndex: number): DataSourceState {
  if (fromIndex === toIndex) return state;
  const fields = [...state.selectedFields];
  const [moved] = fields.splice(fromIndex, 1);
  fields.splice(toIndex, 0, moved);
  return { ...state, selectedFields: fields };
}

export function setFieldStats(
  state: DataSourceState,
  fieldName: string,
  stats: FieldStatsResult,
): DataSourceState {
  return { ...state, fieldStats: { ...state.fieldStats, [fieldName]: stats } };
}

export function setError(state: DataSourceState, message: string): DataSourceState {
  return { ...state, error: message };
}

export function clearError(state: DataSourceState): DataSourceState {
  return { ...state, error: null };
}

// ========================================================================
// Derived Selectors (filtered by search)
// ========================================================================

function matchesSearch(field: FieldMetadata, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return field.name.toLowerCase().includes(q);
}

export function filteredDimensions(state: DataSourceState): FieldMetadata[] {
  return state.dimensions.filter(f => matchesSearch(f, state.fieldSearch));
}

export function filteredMeasures(state: DataSourceState): FieldMetadata[] {
  return state.measures.filter(f => matchesSearch(f, state.fieldSearch));
}

export function filteredTimeFields(state: DataSourceState): FieldMetadata[] {
  return state.timeFields.filter(f => matchesSearch(f, state.fieldSearch));
}

export function filteredIdentifiers(state: DataSourceState): FieldMetadata[] {
  return state.identifiers.filter(f => matchesSearch(f, state.fieldSearch));
}

/**
 * All filtered fields in presentation order: time → dimensions → measures → identifiers.
 * This order matches BI tool conventions (date context first, then slice, then measure, then ID).
 */
export function allFilteredFields(state: DataSourceState): FieldMetadata[] {
  return [
    ...filteredTimeFields(state),
    ...filteredDimensions(state),
    ...filteredMeasures(state),
    ...filteredIdentifiers(state),
  ];
}
