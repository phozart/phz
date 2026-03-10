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

// ========================================================================
// Feature flags
// ========================================================================

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

// ========================================================================
// EditorShellConfig — full configuration object
// ========================================================================

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

// ========================================================================
// createEditorShellConfig — factory with sensible defaults
// ========================================================================

/**
 * Create a default EditorShellConfig. All features are enabled by default.
 * Pass partial overrides to customize.
 */
export function createEditorShellConfig(
  overrides?: Partial<EditorShellConfig>,
): EditorShellConfig {
  const defaultFeatures: EditorFeatureFlags = {
    explorer: true,
    sharing: true,
    alerts: true,
    measurePalette: true,
    autoSave: true,
    undoRedo: true,
    createDashboard: true,
    createReport: true,
  };

  const config: EditorShellConfig = {
    features: defaultFeatures,
    defaultScreen: 'catalog',
    autoSaveDebounceMs: 2000,
    maxUndoDepth: 50,
    baseUrl: '',
    theme: 'auto',
    locale: 'en',
  };

  if (!overrides) return config;

  return {
    ...config,
    ...overrides,
    features: {
      ...defaultFeatures,
      ...overrides.features,
    },
  };
}

// ========================================================================
// Validation
// ========================================================================

export interface ConfigValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validate an EditorShellConfig and return warnings for mismatched
 * feature flags (e.g. sharing enabled without persistence adapter).
 */
export function validateEditorConfig(config: EditorShellConfig): ConfigValidationResult {
  const warnings: string[] = [];

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
