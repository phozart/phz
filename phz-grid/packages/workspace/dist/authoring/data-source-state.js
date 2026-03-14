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
import { groupFieldsByRole } from '@phozart/shared';
// ========================================================================
// Factory
// ========================================================================
export function createDataSourceState() {
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
export function setSources(state, sources) {
    return { ...state, sources, sourcesLoading: false };
}
export function selectSource(state, sourceId) {
    if (state.selectedSourceId === sourceId)
        return state;
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
export function setSchema(state, schema) {
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
export function setSchemaLoading(state, loading) {
    return { ...state, schemaLoading: loading };
}
export function setFieldSearch(state, query) {
    return { ...state, fieldSearch: query };
}
export function addField(state, fieldName) {
    // Reject duplicates
    if (state.selectedFields.includes(fieldName))
        return state;
    // Reject unknown fields
    if (!state.schema?.fields.some(f => f.name === fieldName))
        return state;
    return { ...state, selectedFields: [...state.selectedFields, fieldName] };
}
export function removeField(state, fieldName) {
    if (!state.selectedFields.includes(fieldName))
        return state;
    return { ...state, selectedFields: state.selectedFields.filter(f => f !== fieldName) };
}
export function reorderFields(state, fromIndex, toIndex) {
    if (fromIndex === toIndex)
        return state;
    const fields = [...state.selectedFields];
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    return { ...state, selectedFields: fields };
}
export function setFieldStats(state, fieldName, stats) {
    return { ...state, fieldStats: { ...state.fieldStats, [fieldName]: stats } };
}
export function setError(state, message) {
    return { ...state, error: message };
}
export function clearError(state) {
    return { ...state, error: null };
}
// ========================================================================
// Derived Selectors (filtered by search)
// ========================================================================
function matchesSearch(field, query) {
    if (!query)
        return true;
    const q = query.toLowerCase();
    return field.name.toLowerCase().includes(q);
}
export function filteredDimensions(state) {
    return state.dimensions.filter(f => matchesSearch(f, state.fieldSearch));
}
export function filteredMeasures(state) {
    return state.measures.filter(f => matchesSearch(f, state.fieldSearch));
}
export function filteredTimeFields(state) {
    return state.timeFields.filter(f => matchesSearch(f, state.fieldSearch));
}
export function filteredIdentifiers(state) {
    return state.identifiers.filter(f => matchesSearch(f, state.fieldSearch));
}
/**
 * All filtered fields in presentation order: time → dimensions → measures → identifiers.
 * This order matches BI tool conventions (date context first, then slice, then measure, then ID).
 */
export function allFilteredFields(state) {
    return [
        ...filteredTimeFields(state),
        ...filteredDimensions(state),
        ...filteredMeasures(state),
        ...filteredIdentifiers(state),
    ];
}
//# sourceMappingURL=data-source-state.js.map