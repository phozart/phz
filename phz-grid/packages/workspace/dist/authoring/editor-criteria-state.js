/**
 * @phozart/workspace — Editor Criteria State
 *
 * Pure functions for managing criteria bar integration in editors.
 * Controls criteria visibility, configuration, and active filters
 * within report and dashboard editors.
 */
export function initialEditorCriteriaState() {
    return {
        criteriaVisible: false,
        criteriaConfig: {
            position: 'top',
            collapsible: true,
            showActiveCount: true,
        },
        activeFilters: [],
    };
}
export function toggleCriteria(state) {
    return { ...state, criteriaVisible: !state.criteriaVisible };
}
export function setCriteriaConfig(state, config) {
    return {
        ...state,
        criteriaConfig: { ...state.criteriaConfig, ...config },
    };
}
export function addCriteriaFilter(state, filter) {
    // Replace existing filter with same id
    const filtered = state.activeFilters.filter(f => f.id !== filter.id);
    return { ...state, activeFilters: [...filtered, filter] };
}
export function removeCriteriaFilter(state, filterId) {
    return {
        ...state,
        activeFilters: state.activeFilters.filter(f => f.id !== filterId),
    };
}
export function clearCriteriaFilters(state) {
    return { ...state, activeFilters: [] };
}
//# sourceMappingURL=editor-criteria-state.js.map