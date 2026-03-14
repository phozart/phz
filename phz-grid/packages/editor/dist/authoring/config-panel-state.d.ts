/**
 * @phozart/editor — Config Panel State (B-2.08)
 *
 * Constrained configuration panel state machine. Authors configure
 * widgets by picking from pre-approved measures and fields, not
 * raw data source columns. The panel validates configuration
 * against the widget type's configSchema.
 */
export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}
export interface FieldConstraint {
    /** Field or measure name. */
    name: string;
    /** Human-readable label. */
    label: string;
    /** Whether this field is required. */
    required: boolean;
    /** Data types this field accepts. */
    allowedTypes: Array<'string' | 'number' | 'date' | 'boolean'>;
    /** Whether this field accepts measures (vs. raw fields). */
    measureOnly: boolean;
}
export interface ConfigPanelState {
    /** The widget type being configured (e.g. 'bar-chart', 'kpi-card'). */
    widgetType: string;
    /** Widget instance ID. */
    widgetId: string;
    /** Fields/measures the author is allowed to configure. */
    allowedFields: FieldConstraint[];
    /** Current configuration values (key = config field, value = assigned field/measure/literal). */
    currentConfig: Record<string, unknown>;
    /** Validation errors against the widget schema. */
    validationErrors: ValidationError[];
    /** Whether the config has changed since last save. */
    dirty: boolean;
    /** Whether the panel is in a loading state (e.g. fetching schema). */
    loading: boolean;
    /** Expanded config section (for accordion UI). */
    expandedSection: string | null;
}
export declare function createConfigPanelState(widgetType: string, widgetId: string, overrides?: Partial<ConfigPanelState>): ConfigPanelState;
/**
 * Set a configuration value for a field.
 */
export declare function setConfigValue(state: ConfigPanelState, field: string, value: unknown): ConfigPanelState;
/**
 * Remove a configuration value.
 */
export declare function removeConfigValue(state: ConfigPanelState, field: string): ConfigPanelState;
/**
 * Replace the entire config object (e.g. after loading from persistence).
 */
export declare function setFullConfig(state: ConfigPanelState, config: Record<string, unknown>): ConfigPanelState;
/**
 * Set the allowed fields for the widget type.
 */
export declare function setAllowedFields(state: ConfigPanelState, fields: FieldConstraint[]): ConfigPanelState;
/**
 * Validate the current configuration against field constraints.
 * Returns an array of validation errors.
 */
export declare function validateConfig(state: ConfigPanelState): ValidationError[];
/**
 * Check whether the current configuration is valid (no errors).
 */
export declare function isConfigValid(state: ConfigPanelState): boolean;
/**
 * Set the expanded section in the config panel accordion.
 */
export declare function setExpandedSection(state: ConfigPanelState, section: string | null): ConfigPanelState;
/**
 * Set the loading state.
 */
export declare function setConfigPanelLoading(state: ConfigPanelState, loading: boolean): ConfigPanelState;
/**
 * Mark the config panel as saved.
 */
export declare function markConfigSaved(state: ConfigPanelState): ConfigPanelState;
//# sourceMappingURL=config-panel-state.d.ts.map