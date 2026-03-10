/**
 * @phozart/phz-editor — Config Panel State (B-2.08)
 *
 * Constrained configuration panel state machine. Authors configure
 * widgets by picking from pre-approved measures and fields, not
 * raw data source columns. The panel validates configuration
 * against the widget type's configSchema.
 */

// ========================================================================
// ValidationError
// ========================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ========================================================================
// FieldConstraint — defines what the author can select
// ========================================================================

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

// ========================================================================
// ConfigPanelState
// ========================================================================

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

// ========================================================================
// Factory
// ========================================================================

export function createConfigPanelState(
  widgetType: string,
  widgetId: string,
  overrides?: Partial<ConfigPanelState>,
): ConfigPanelState {
  const state: ConfigPanelState = {
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
export function setConfigValue(
  state: ConfigPanelState,
  field: string,
  value: unknown,
): ConfigPanelState {
  const newConfig = { ...state.currentConfig, [field]: value };
  const newState = { ...state, currentConfig: newConfig, dirty: true };
  return { ...newState, validationErrors: validateConfig(newState) };
}

/**
 * Remove a configuration value.
 */
export function removeConfigValue(
  state: ConfigPanelState,
  field: string,
): ConfigPanelState {
  const newConfig = { ...state.currentConfig };
  delete newConfig[field];
  const newState = { ...state, currentConfig: newConfig, dirty: true };
  return { ...newState, validationErrors: validateConfig(newState) };
}

/**
 * Replace the entire config object (e.g. after loading from persistence).
 */
export function setFullConfig(
  state: ConfigPanelState,
  config: Record<string, unknown>,
): ConfigPanelState {
  const newState = { ...state, currentConfig: config, dirty: false };
  return { ...newState, validationErrors: validateConfig(newState) };
}

// ========================================================================
// Allowed fields
// ========================================================================

/**
 * Set the allowed fields for the widget type.
 */
export function setAllowedFields(
  state: ConfigPanelState,
  fields: FieldConstraint[],
): ConfigPanelState {
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
export function validateConfig(state: ConfigPanelState): ValidationError[] {
  const errors: ValidationError[] = [];

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
export function isConfigValid(state: ConfigPanelState): boolean {
  return state.validationErrors.filter(e => e.severity === 'error').length === 0;
}

// ========================================================================
// UI state
// ========================================================================

/**
 * Set the expanded section in the config panel accordion.
 */
export function setExpandedSection(
  state: ConfigPanelState,
  section: string | null,
): ConfigPanelState {
  return { ...state, expandedSection: section };
}

/**
 * Set the loading state.
 */
export function setConfigPanelLoading(
  state: ConfigPanelState,
  loading: boolean,
): ConfigPanelState {
  return { ...state, loading };
}

/**
 * Mark the config panel as saved.
 */
export function markConfigSaved(state: ConfigPanelState): ConfigPanelState {
  return { ...state, dirty: false };
}
