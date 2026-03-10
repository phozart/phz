/**
 * @phozart/phz-editor — EditorShellConfig (B-2.02)
 *
 * Configuration type and factory for the editor shell.
 * Defines which features are enabled, adapter references,
 * theming, and initial state overrides.
 */
import type { ViewerContext } from '@phozart/phz-shared/adapters';
import type { DataAdapter } from '@phozart/phz-shared/adapters';
import type { MeasureRegistryAdapter } from '@phozart/phz-shared/adapters';
import type { PersistenceAdapter } from '@phozart/phz-shared/adapters';
import type { EditorScreen } from './editor-state.js';
export interface EditorFeatureFlags {
    /** Enable the visual explorer screen. */
    explorer: boolean;
    /** Enable sharing flow (requires persistence adapter). */
    sharing: boolean;
    /** Enable personal alerts and subscriptions. */
    alerts: boolean;
    /** Enable measure palette (requires measure registry adapter). */
    measurePalette: boolean;
    /** Enable auto-save. */
    autoSave: boolean;
    /** Enable undo/redo. */
    undoRedo: boolean;
    /** Enable dashboard creation from catalog. */
    createDashboard: boolean;
    /** Enable report creation from catalog. */
    createReport: boolean;
}
export interface EditorShellConfig {
    /** Viewer context (user identity, roles, teams). */
    viewerContext?: ViewerContext;
    /** Data adapter for executing queries. */
    dataAdapter?: DataAdapter;
    /** Persistence adapter for loading/saving artifacts. */
    persistenceAdapter?: PersistenceAdapter;
    /** Measure registry adapter for discovering measures and KPIs. */
    measureRegistryAdapter?: MeasureRegistryAdapter;
    /** Feature flags to enable/disable editor capabilities. */
    features: EditorFeatureFlags;
    /** Default screen to show on initial load. */
    defaultScreen: EditorScreen;
    /** Auto-save debounce in milliseconds. */
    autoSaveDebounceMs: number;
    /** Maximum undo stack depth. */
    maxUndoDepth: number;
    /** Application base URL for deep links. */
    baseUrl: string;
    /** Theme override ('light' | 'dark' | 'auto'). */
    theme: string;
    /** Locale override (BCP 47). */
    locale: string;
}
/**
 * Create a default EditorShellConfig. All features are enabled by default.
 * Pass partial overrides to customize.
 */
export declare function createEditorShellConfig(overrides?: Partial<EditorShellConfig>): EditorShellConfig;
export interface ConfigValidationResult {
    valid: boolean;
    warnings: string[];
}
/**
 * Validate an EditorShellConfig and return warnings for mismatched
 * feature flags (e.g. sharing enabled without persistence adapter).
 */
export declare function validateEditorConfig(config: EditorShellConfig): ConfigValidationResult;
//# sourceMappingURL=editor-config.d.ts.map