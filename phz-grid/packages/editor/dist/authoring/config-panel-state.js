/**
 * @phozart/phz-editor — Config Panel State (B-2.08)
 *
 * Constrained configuration panel state machine. Authors configure
 * widgets by picking from pre-approved measures and fields, not
 * raw data source columns. The panel validates configuration
 * against the widget type's configSchema.
 */
// ========================================================================
// Factory
// ========================================================================
export function createConfigPanelState(widgetType, widgetId, overrides) {
    const state = {
        widgetType,
        widgetId,
        allowedFields: [],
        currentConfig: {},
        validationErrors: [],
        dirty: false,
        loading: false,
        expandedSection: null,
        ...overrides,
    };
    // Run validation with the initial state
    state.validationErrors = validateConfig(state);
    return state;
}
// ========================================================================
// Configuration operations
// ========================================================================
/**
 * Set a configuration value for a field.
 */
export function setConfigValue(state, field, value) {
    const newConfig = { ...state.currentConfig, [field]: value };
    const newState = { ...state, currentConfig: newConfig, dirty: true };
    return { ...newState, validationErrors: validateConfig(newState) };
}
/**
 * Remove a configuration value.
 */
export function removeConfigValue(state, field) {
    const newConfig = { ...state.currentConfig };
    delete newConfig[field];
    const newState = { ...state, currentConfig: newConfig, dirty: true };
    return { ...newState, validationErrors: validateConfig(newState) };
}
/**
 * Replace the entire config object (e.g. after loading from persistence).
 */
export function setFullConfig(state, config) {
    const newState = { ...state, currentConfig: config, dirty: false };
    return { ...newState, validationErrors: validateConfig(newState) };
}
// ========================================================================
// Allowed fields
// ========================================================================
/**
 * Set the allowed fields for the widget type.
 */
export function setAllowedFields(state, fields) {
    const newState = { ...state, allowedFields: fields };
    return { ...newState, validationErrors: validateConfig(newState) };
}
// ========================================================================
// Validation
// ========================================================================
/**
 * Validate the current configuration against field constraints.
 * Returns an array of validation errors.
 */
export function validateConfig(state) {
    const errors = [];
    for (const constraint of state.allowedFields) {
        const value = state.currentConfig[constraint.name];
        // Required check
        if (constraint.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: constraint.name,
                message: `${constraint.label} is required`,
                severity: 'error',
            });
        }
    }
    return errors;
}
/**
 * Check whether the current configuration is valid (no errors).
 */
export function isConfigValid(state) {
    return state.validationErrors.filter(e => e.severity === 'error').length === 0;
}
// ========================================================================
// UI state
// ========================================================================
/**
 * Set the expanded section in the config panel accordion.
 */
export function setExpandedSection(state, section) {
    return { ...state, expandedSection: section };
}
/**
 * Set the loading state.
 */
export function setConfigPanelLoading(state, loading) {
    return { ...state, loading };
}
/**
 * Mark the config panel as saved.
 */
export function markConfigSaved(state) {
    return { ...state, dirty: false };
}
//# sourceMappingURL=config-panel-state.js.map