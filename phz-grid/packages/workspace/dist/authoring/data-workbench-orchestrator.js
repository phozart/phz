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
import { groupFieldsByRole } from '@phozart/phz-shared';
import { createDropZoneState, addFieldToZone, removeFieldFromZone, } from '@phozart/phz-engine';
import { autoPlaceField } from '@phozart/phz-engine';
import { suggestChartType } from '@phozart/phz-engine';
import { toExploreQuery } from '@phozart/phz-engine';
// ========================================================================
// Aggregation cycle order
// ========================================================================
const AGG_CYCLE = ['sum', 'avg', 'count', 'min', 'max', 'count_distinct'];
// ========================================================================
// Field Classification — delegates to shared resolveSemanticRole
// ========================================================================
// ========================================================================
// Factory
// ========================================================================
export function createWorkbenchState() {
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
function updateSuggestedChart(state) {
    const query = toExploreQuery(state.dropZones);
    return { ...state, suggestedChart: suggestChartType(query) };
}
// ========================================================================
// Data Source State Transitions
// ========================================================================
export function setWorkbenchSources(state, sources) {
    return { ...state, sources, sourcesLoading: false };
}
export function setWorkbenchSourcesLoading(state) {
    return { ...state, sourcesLoading: true };
}
export function setWorkbenchSchema(state, schema) {
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
export function setWorkbenchSchemaLoading(state) {
    return { ...state, schemaLoading: true };
}
// ========================================================================
// Field Search
// ========================================================================
export function setWorkbenchFieldSearch(state, query) {
    return { ...state, fieldSearch: query };
}
// ========================================================================
// Filtered Fields (for rendering the field palette)
// ========================================================================
function matchesSearch(field, query) {
    if (!query)
        return true;
    return field.name.toLowerCase().includes(query.toLowerCase());
}
/** All classified fields filtered by search, in BI convention order: time → dims → measures → identifiers */
export function getFilteredFields(state) {
    const q = state.fieldSearch;
    return [
        ...state.timeFields.filter(f => matchesSearch(f, q)),
        ...state.dimensions.filter(f => matchesSearch(f, q)),
        ...state.measures.filter(f => matchesSearch(f, q)),
        ...state.identifiers.filter(f => matchesSearch(f, q)),
    ];
}
/** Get filtered fields grouped by category. */
export function getFilteredFieldsByCategory(state) {
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
export function addFieldToWorkbench(state, zone, field) {
    const newZones = addFieldToZone(state.dropZones, zone, field);
    if (newZones === state.dropZones)
        return state; // duplicate check
    return updateSuggestedChart({ ...state, dropZones: newZones });
}
export function removeFieldFromWorkbench(state, zone, fieldName) {
    const newZones = removeFieldFromZone(state.dropZones, zone, fieldName);
    if (newZones === state.dropZones)
        return state;
    return updateSuggestedChart({ ...state, dropZones: newZones });
}
/** Auto-place field based on dataType: number→values, date→columns, bool→filters, string→rows */
export function autoPlaceWorkbenchField(state, field) {
    const zone = autoPlaceField(field);
    return addFieldToWorkbench(state, zone, field);
}
// ========================================================================
// Aggregation Cycling
// ========================================================================
/** Cycle the aggregation function on a value field: sum → avg → count → min → max → count_distinct → sum */
export function cycleAggregation(state, fieldName) {
    const idx = state.dropZones.values.findIndex(v => v.field === fieldName);
    if (idx === -1)
        return state;
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
export function setPreviewMode(state, mode) {
    return { ...state, previewMode: mode };
}
export function setPreviewLoading(state, loading) {
    return { ...state, previewLoading: loading };
}
export function setPreviewResult(state, result) {
    return {
        ...state,
        previewResult: result,
        previewLoading: false,
        previewError: undefined,
    };
}
export function setPreviewError(state, error) {
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
export function workbenchToExploreQuery(state) {
    return toExploreQuery(state.dropZones);
}
/** Check whether the workbench has any fields placed (i.e., a query can be executed). */
export function hasWorkbenchQuery(state) {
    const dz = state.dropZones;
    return dz.rows.length > 0 || dz.columns.length > 0 || dz.values.length > 0;
}
// ========================================================================
// Undo/Redo
// ========================================================================
function cloneDropZones(dz) {
    return {
        rows: [...dz.rows],
        columns: [...dz.columns],
        values: [...dz.values],
        filters: [...dz.filters],
    };
}
/** Push the current drop zone state onto the undo stack. Call BEFORE making changes. */
export function pushWorkbenchSnapshot(state) {
    const maxHistory = 50;
    const stack = [...state.undoStack, cloneDropZones(state.dropZones)];
    if (stack.length > maxHistory)
        stack.shift();
    return { ...state, undoStack: stack, redoStack: [] };
}
export function undoWorkbench(state) {
    if (state.undoStack.length === 0)
        return state;
    const stack = [...state.undoStack];
    const previous = stack.pop();
    return updateSuggestedChart({
        ...state,
        undoStack: stack,
        redoStack: [...state.redoStack, cloneDropZones(state.dropZones)],
        dropZones: previous,
    });
}
export function redoWorkbench(state) {
    if (state.redoStack.length === 0)
        return state;
    const stack = [...state.redoStack];
    const next = stack.pop();
    return updateSuggestedChart({
        ...state,
        redoStack: stack,
        undoStack: [...state.undoStack, cloneDropZones(state.dropZones)],
        dropZones: next,
    });
}
export function canUndoWorkbench(state) {
    return state.undoStack.length > 0;
}
export function canRedoWorkbench(state) {
    return state.redoStack.length > 0;
}
// ========================================================================
// Error State
// ========================================================================
export function setWorkbenchError(state, error) {
    return { ...state, error };
}
export function clearWorkbenchError(state) {
    return { ...state, error: undefined };
}
//# sourceMappingURL=data-workbench-orchestrator.js.map