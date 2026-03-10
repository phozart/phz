/**
 * @phozart/phz-workspace — Govern > Settings State (B-3.10)
 *
 * Pure functions for workspace-level settings: theme/branding,
 * default presentation, and feature flag toggles.
 */
export type ThemeMode = 'light' | 'dark' | 'auto';
export interface BrandingConfig {
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
    appName: string;
    faviconUrl?: string;
}
export interface DefaultSettings {
    density: 'compact' | 'dense' | 'comfortable';
    pageSize: number;
    defaultView: 'card' | 'table';
    locale: string;
    timezone: string;
    dateFormat: string;
    numberFormat: 'us' | 'eu';
}
export interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: string;
}
export interface SettingsState {
    theme: ThemeMode;
    branding: BrandingConfig;
    defaults: DefaultSettings;
    featureFlags: FeatureFlag[];
    dirty: boolean;
    lastSavedAt?: number;
}
export declare const BUILT_IN_FLAGS: FeatureFlag[];
export declare function initialSettingsState(overrides?: Partial<SettingsState>): SettingsState;
export declare function setTheme(state: SettingsState, theme: ThemeMode): SettingsState;
export declare function updateBranding(state: SettingsState, updates: Partial<BrandingConfig>): SettingsState;
export declare function updateDefaults(state: SettingsState, updates: Partial<DefaultSettings>): SettingsState;
export declare function toggleFeatureFlag(state: SettingsState, flagId: string): SettingsState;
export declare function setFeatureFlag(state: SettingsState, flagId: string, enabled: boolean): SettingsState;
export declare function addFeatureFlag(state: SettingsState, flag: FeatureFlag): SettingsState;
export declare function removeFeatureFlag(state: SettingsState, flagId: string): SettingsState;
export declare function isFeatureEnabled(state: SettingsState, flagId: string): boolean;
export declare function getFlagsByCategory(state: SettingsState, category: string): FeatureFlag[];
export declare function getCategories(state: SettingsState): string[];
export declare function markSettingsSaved(state: SettingsState): SettingsState;
export declare function resetToDefaults(state: SettingsState): SettingsState;
export interface SettingsValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateSettings(state: SettingsState): SettingsValidation;
//# sourceMappingURL=settings-state.d.ts.map