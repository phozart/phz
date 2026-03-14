/**
 * @phozart/editor — EditorShellConfig (B-2.02)
 *
 * Configuration type and factory for the editor shell.
 * Defines which features are enabled, adapter references,
 * theming, and initial state overrides.
 */
// ========================================================================
// createEditorShellConfig — factory with sensible defaults
// ========================================================================
/**
 * Create a default EditorShellConfig. All features are enabled by default.
 * Pass partial overrides to customize.
 */
export function createEditorShellConfig(overrides) {
    const defaultFeatures = {
        explorer: true,
        sharing: true,
        alerts: true,
        measurePalette: true,
        autoSave: true,
        undoRedo: true,
        createDashboard: true,
        createReport: true,
    };
    const config = {
        features: defaultFeatures,
        defaultScreen: 'catalog',
        autoSaveDebounceMs: 2000,
        maxUndoDepth: 50,
        baseUrl: '',
        theme: 'auto',
        locale: 'en',
    };
    if (!overrides)
        return config;
    return {
        ...config,
        ...overrides,
        features: {
            ...defaultFeatures,
            ...overrides.features,
        },
    };
}
/**
 * Validate an EditorShellConfig and return warnings for mismatched
 * feature flags (e.g. sharing enabled without persistence adapter).
 */
export function validateEditorConfig(config) {
    const warnings = [];
    if (config.features.sharing && !config.persistenceAdapter) {
        warnings.push('Sharing is enabled but no persistenceAdapter is configured. Sharing will be non-functional.');
    }
    if (config.features.measurePalette && !config.measureRegistryAdapter) {
        warnings.push('Measure palette is enabled but no measureRegistryAdapter is configured. Palette will be empty.');
    }
    if (config.features.alerts && !config.persistenceAdapter) {
        warnings.push('Alerts are enabled but no persistenceAdapter is configured. Alerts will be non-functional.');
    }
    if (config.autoSaveDebounceMs < 500) {
        warnings.push('autoSaveDebounceMs is below 500ms. This may cause excessive save operations.');
    }
    return {
        valid: warnings.length === 0,
        warnings,
    };
}
//# sourceMappingURL=editor-config.js.map