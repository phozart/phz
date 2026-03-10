/**
 * data-workbench-orchestrator — Headless state machine for the interactive
 * data workbench (Tableau-like visual query builder).
 *
 * Combines:
 * - Data source browsing & field classification
 * - 4 drop zones (rows, columns, values, filters)
 * - Preview state management
 * - Chart suggestion
 * - Aggregation cycling
 * - Undo/redo via snapshot stack
 *
 * All functions are PURE — no side effects, no async, no DOM.
 * The Lit component handles async DataAdapter calls and feeds
 * results into these state transitions.
 */

import type {
  FieldMetadata,
  DataSourceMeta,
} from '@phozart/phz-shared';
import { groupFieldsByRole } from '@phozart/phz-shared';
import type {
  DropZoneState,
  DimensionEntry,
  ValueEntry,
  FilterEntry,
  ZoneName,
} from '@phozart/phz-engine';
import type {
  ExploreQuery,
  ExploreFieldSlot,
  ExploreValueSlot,
  ExploreFilterSlot,
} from '@phozart/phz-engine';
import {
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  getDefaultAggregation,
} from '@phozart/phz-engine';
import { autoPlaceField } from '@phozart/phz-engine';
import { suggestChartType } from '@phozart/phz-engine';
import { toExploreQuery } from '@phozart/phz-engine';

// ========================================================================
// Types
// ========================================================================

export interface DataSourceSchema {
  id: string;
  name: string;
  fields: FieldMetadata[];
}

export type PreviewMode = 'table' | 'chart' | 'sql';

/** Column descriptor for preview results. */
export interface PreviewColumn {
  name: string;
  dataType: string;
}

/** Preview data result from DataAdapter. */
export interface PreviewResult {
  columns: PreviewColumn[];
  rows: unknown[][];
  metadata: {
    totalRows: number;
    truncated: boolean;
    queryTimeMs: number;
  };
}

export interface WorkbenchState {
  // ── Data sources ──
  sources: DataSourceMeta[];
  sourcesLoading: boolean;
  selectedSourceId: string | null;
  schema: DataSourceSchema | null;
  schemaLoading: boolean;

  // ── Classified fields ──
  dimensions: FieldMetadata[];
  measures: FieldMetadata[];
  timeFields: FieldMetadata[];
  identifiers: FieldMetadata[];
  fieldSearch: string;

  // ── Drop zones (Tableau shelves) ──
  dropZones: DropZoneState;

  // ── Preview ──
  previewMode: PreviewMode;
  previewLoading: boolean;
  previewResult?: PreviewResult;
  previewError?: string;
  suggestedChart: string;

  // ── Undo/redo (snapshot stacks of drop zone state) ──
  undoStack: DropZoneState[];
  redoStack: DropZoneState[];

  // ── General ──
  error?: string;
}

// ========================================================================
// Aggregation cycle order
// ========================================================================

const AGG_CYCLE: string[] = ['sum', 'avg', 'count', 'min', 'max', 'count_distinct'];

// ========================================================================
// Field Classification — delegates to shared resolveSemanticRole
// ========================================================================

// ========================================================================
// Factory
// ========================================================================

export function createWorkbenchState(): WorkbenchState {
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
    fieldSearch: '',
    dropZones: createDropZoneState(),
    previewMode: 'table',
    previewLoading: false,
    suggestedChart: 'table',
    undoStack: [],
    redoStack: [],
  };
}

// ========================================================================
// Chart suggestion helper
// ========================================================================

function updateSuggestedChart(state: WorkbenchState): WorkbenchState {
  const query = toExploreQuery(state.dropZones);
  return { ...state, suggestedChart: suggestChartType(query) };
}

// ========================================================================
// Data Source State Transitions
// ========================================================================

export function setWorkbenchSources(state: WorkbenchState, sources: DataSourceMeta[]): WorkbenchState {
  return { ...state, sources, sourcesLoading: false };
}

export function setWorkbenchSourcesLoading(state: WorkbenchState): WorkbenchState {
  return { ...state, sourcesLoading: true };
}

export function setWorkbenchSchema(state: WorkbenchState, schema: DataSourceSchema): WorkbenchState {
  const { dimensions, measures, timeFields, identifiers } = groupFieldsByRole(schema.fields);
  return updateSuggestedChart({
    ...state,
    selectedSourceId: schema.id,
    schema,
    schemaLoading: false,
    dimensions,
    measures,
    timeFields,
    identifiers,
    dropZones: createDropZoneState(), // fresh zones when schema changes
    undoStack: [],
    redoStack: [],
    previewResult: undefined,
    previewError: undefined,
    fieldSearch: '',
  });
}

export function setWorkbenchSchemaLoading(state: WorkbenchState): WorkbenchState {
  return { ...state, schemaLoading: true };
}

// ========================================================================
// Field Search
// ========================================================================

export function setWorkbenchFieldSearch(state: WorkbenchState, query: string): WorkbenchState {
  return { ...state, fieldSearch: query };
}

// ========================================================================
// Filtered Fields (for rendering the field palette)
// ========================================================================

function matchesSearch(field: FieldMetadata, query: string): boolean {
  if (!query) return true;
  return field.name.toLowerCase().includes(query.toLowerCase());
}

/** All classified fields filtered by search, in BI convention order: time → dims → measures → identifiers */
export function getFilteredFields(state: WorkbenchState): FieldMetadata[] {
  const q = state.fieldSearch;
  return [
    ...state.timeFields.filter(f => matchesSearch(f, q)),
    ...state.dimensions.filter(f => matchesSearch(f, q)),
    ...state.measures.filter(f => matchesSearch(f, q)),
    ...state.identifiers.filter(f => matchesSearch(f, q)),
  ];
}

/** Get filtered fields grouped by category. */
export function getFilteredFieldsByCategory(state: WorkbenchState): {
  timeFields: FieldMetadata[];
  dimensions: FieldMetadata[];
  measures: FieldMetadata[];
  identifiers: FieldMetadata[];
} {
  const q = state.fieldSearch;
  return {
    timeFields: state.timeFields.filter(f => matchesSearch(f, q)),
    dimensions: state.dimensions.filter(f => matchesSearch(f, q)),
    measures: state.measures.filter(f => matchesSearch(f, q)),
    identifiers: state.identifiers.filter(f => matchesSearch(f, q)),
  };
}

// ========================================================================
// Drop Zone Management
// ========================================================================

export function addFieldToWorkbench(
  state: WorkbenchState,
  zone: ZoneName,
  field: FieldMetadata,
): WorkbenchState {
  const newZones = addFieldToZone(state.dropZones, zone, field);
  if (newZones === state.dropZones) return state; // duplicate check
  return updateSuggestedChart({ ...state, dropZones: newZones });
}

export function removeFieldFromWorkbench(
  state: WorkbenchState,
  zone: ZoneName,
  fieldName: string,
): WorkbenchState {
  const newZones = removeFieldFromZone(state.dropZones, zone, fieldName);
  if (newZones === state.dropZones) return state;
  return updateSuggestedChart({ ...state, dropZones: newZones });
}

/** Auto-place field based on dataType: number→values, date→columns, bool→filters, string→rows */
export function autoPlaceWorkbenchField(
  state: WorkbenchState,
  field: FieldMetadata,
): WorkbenchState {
  const zone = autoPlaceField(field) as ZoneName;
  return addFieldToWorkbench(state, zone, field);
}

// ========================================================================
// Aggregation Cycling
// ========================================================================

/** Cycle the aggregation function on a value field: sum → avg → count → min → max → count_distinct → sum */
export function cycleAggregation(state: WorkbenchState, fieldName: string): WorkbenchState {
  const idx = state.dropZones.values.findIndex(v => v.field === fieldName);
  if (idx === -1) return state;

  const current = state.dropZones.values[idx].aggregation;
  const currentIdx = AGG_CYCLE.indexOf(current);
  const nextIdx = (currentIdx + 1) % AGG_CYCLE.length;

  const newValues = [...state.dropZones.values];
  newValues[idx] = { ...newValues[idx], aggregation: AGG_CYCLE[nextIdx] };

  return {
    ...state,
    dropZones: { ...state.dropZones, values: newValues },
  };
}

// ========================================================================
// Preview State
// ========================================================================

export function setPreviewMode(state: WorkbenchState, mode: PreviewMode): WorkbenchState {
  return { ...state, previewMode: mode };
}

export function setPreviewLoading(state: WorkbenchState, loading: boolean): WorkbenchState {
  return { ...state, previewLoading: loading };
}

export function setPreviewResult(state: WorkbenchState, result: PreviewResult): WorkbenchState {
  return {
    ...state,
    previewResult: result,
    previewLoading: false,
    previewError: undefined,
  };
}

export function setPreviewError(state: WorkbenchState, error: string): WorkbenchState {
  return {
    ...state,
    previewError: error,
    previewLoading: false,
  };
}

// ========================================================================
// Query Generation
// ========================================================================

/** Convert current drop zone state to an ExploreQuery for DataAdapter execution. */
export function workbenchToExploreQuery(state: WorkbenchState): ExploreQuery {
  return toExploreQuery(state.dropZones);
}

/** Check whether the workbench has any fields placed (i.e., a query can be executed). */
export function hasWorkbenchQuery(state: WorkbenchState): boolean {
  const dz = state.dropZones;
  return dz.rows.length > 0 || dz.columns.length > 0 || dz.values.length > 0;
}

// ========================================================================
// Undo/Redo
// ========================================================================

function cloneDropZones(dz: DropZoneState): DropZoneState {
  return {
    rows: [...dz.rows],
    columns: [...dz.columns],
    values: [...dz.values],
    filters: [...dz.filters],
  };
}

/** Push the current drop zone state onto the undo stack. Call BEFORE making changes. */
export function pushWorkbenchSnapshot(state: WorkbenchState): WorkbenchState {
  const maxHistory = 50;
  const stack = [...state.undoStack, cloneDropZones(state.dropZones)];
  if (stack.length > maxHistory) stack.shift();
  return { ...state, undoStack: stack, redoStack: [] };
}

export function undoWorkbench(state: WorkbenchState): WorkbenchState {
  if (state.undoStack.length === 0) return state;

  const stack = [...state.undoStack];
  const previous = stack.pop()!;

  return updateSuggestedChart({
    ...state,
    undoStack: stack,
    redoStack: [...state.redoStack, cloneDropZones(state.dropZones)],
    dropZones: previous,
  });
}

export function redoWorkbench(state: WorkbenchState): WorkbenchState {
  if (state.redoStack.length === 0) return state;

  const stack = [...state.redoStack];
  const next = stack.pop()!;

  return updateSuggestedChart({
    ...state,
    redoStack: stack,
    undoStack: [...state.undoStack, cloneDropZones(state.dropZones)],
    dropZones: next,
  });
}

export function canUndoWorkbench(state: WorkbenchState): boolean {
  return state.undoStack.length > 0;
}

export function canRedoWorkbench(state: WorkbenchState): boolean {
  return state.redoStack.length > 0;
}

// ========================================================================
// Error State
// ========================================================================

export function setWorkbenchError(state: WorkbenchState, error: string): WorkbenchState {
  return { ...state, error };
}

export function clearWorkbenchError(state: WorkbenchState): WorkbenchState {
  return { ...state, error: undefined };
}
