/**
 * @phozart/phz-workspace — Govern > Settings State (B-3.10)
 *
 * Pure functions for workspace-level settings: theme/branding,
 * default presentation, and feature flag toggles.
 */
// ========================================================================
// Default constants
// ========================================================================
const DEFAULT_BRANDING = {
    primaryColor: '#1a73e8',
    accentColor: '#fbbc04',
    appName: 'PHZ Workspace',
};
const DEFAULT_SETTINGS = {
    density: 'comfortable',
    pageSize: 50,
    defaultView: 'card',
    locale: 'en-US',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'us',
};
// ========================================================================
// Built-in feature flags
// ========================================================================
export const BUILT_IN_FLAGS = [
    { id: 'ai-assist', name: 'AI Assistant', description: 'Enable AI-powered suggestions', enabled: false, category: 'ai' },
    { id: 'collab', name: 'Real-time Collaboration', description: 'Enable multi-user editing', enabled: false, category: 'collaboration' },
    { id: 'export-pdf', name: 'PDF Export', description: 'Enable PDF export for reports', enabled: true, category: 'export' },
    { id: 'export-excel', name: 'Excel Export', description: 'Enable Excel export for reports', enabled: true, category: 'export' },
    { id: 'dark-mode', name: 'Dark Mode', description: 'Allow dark mode theme switching', enabled: true, category: 'ui' },
    { id: 'command-palette', name: 'Command Palette', description: 'Enable Ctrl+K command palette', enabled: true, category: 'ui' },
    { id: 'alerts', name: 'Alert System', description: 'Enable alert rules and breach notifications', enabled: false, category: 'monitoring' },
    { id: 'custom-widgets', name: 'Custom Widgets', description: 'Allow custom widget registration', enabled: false, category: 'extensibility' },
];
// ========================================================================
// Factory
// ========================================================================
export function initialSettingsState(overrides) {
    return {
        theme: overrides?.theme ?? 'auto',
        branding: overrides?.branding ?? { ...DEFAULT_BRANDING },
        defaults: overrides?.defaults ?? { ...DEFAULT_SETTINGS },
        featureFlags: overrides?.featureFlags ?? BUILT_IN_FLAGS.map(f => ({ ...f })),
        dirty: false,
    };
}
// ========================================================================
// Theme
// ========================================================================
export function setTheme(state, theme) {
    return { ...state, theme, dirty: true };
}
// ========================================================================
// Branding
// ========================================================================
export function updateBranding(state, updates) {
    return {
        ...state,
        branding: { ...state.branding, ...updates },
        dirty: true,
    };
}
// ========================================================================
// Default settings
// ========================================================================
export function updateDefaults(state, updates) {
    return {
        ...state,
        defaults: { ...state.defaults, ...updates },
        dirty: true,
    };
}
// ========================================================================
// Feature flags
// ========================================================================
export function toggleFeatureFlag(state, flagId) {
    return {
        ...state,
        featureFlags: state.featureFlags.map(f => f.id === flagId ? { ...f, enabled: !f.enabled } : f),
        dirty: true,
    };
}
export function setFeatureFlag(state, flagId, enabled) {
    return {
        ...state,
        featureFlags: state.featureFlags.map(f => f.id === flagId ? { ...f, enabled } : f),
        dirty: true,
    };
}
export function addFeatureFlag(state, flag) {
    if (state.featureFlags.some(f => f.id === flag.id))
        return state;
    return {
        ...state,
        featureFlags: [...state.featureFlags, flag],
        dirty: true,
    };
}
export function removeFeatureFlag(state, flagId) {
    return {
        ...state,
        featureFlags: state.featureFlags.filter(f => f.id !== flagId),
        dirty: true,
    };
}
export function isFeatureEnabled(state, flagId) {
    return state.featureFlags.find(f => f.id === flagId)?.enabled ?? false;
}
export function getFlagsByCategory(state, category) {
    return state.featureFlags.filter(f => f.category === category);
}
export function getCategories(state) {
    return [...new Set(state.featureFlags.map(f => f.category))].sort();
}
// ========================================================================
// Save
// ========================================================================
export function markSettingsSaved(state) {
    return { ...state, dirty: false, lastSavedAt: Date.now() };
}
// ========================================================================
// Reset
// ========================================================================
export function resetToDefaults(state) {
    return {
        ...state,
        theme: 'auto',
        branding: { ...DEFAULT_BRANDING },
        defaults: { ...DEFAULT_SETTINGS },
        dirty: true,
    };
}
export function validateSettings(state) {
    const errors = [];
    if (!state.branding.appName?.trim()) {
        errors.push('App name is required');
    }
    if (!state.branding.primaryColor?.match(/^#[0-9a-fA-F]{6}$/)) {
        errors.push('Primary color must be a valid hex color');
    }
    if (!state.branding.accentColor?.match(/^#[0-9a-fA-F]{6}$/)) {
        errors.push('Accent color must be a valid hex color');
    }
    if (state.defaults.pageSize < 1 || state.defaults.pageSize > 10000) {
        errors.push('Page size must be between 1 and 10000');
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=settings-state.js.map