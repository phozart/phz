/**
 * @phozart/viewer — ViewerShellConfig
 *
 * Configuration type and factory for the viewer shell. Consumers
 * provide adapters (data, persistence, attention) and optional
 * feature toggles to customise the viewer experience.
 */

import type { DataAdapter, ViewerContext } from '@phozart/shared/adapters';
import type { PersistenceAdapter } from '@phozart/shared/adapters';
import type { AttentionAdapter } from '@phozart/shared/adapters';
import type { ViewerScreen } from './viewer-state.js';

// ========================================================================
// Feature flags
// ========================================================================

export interface ViewerFeatureFlags {
  /** Show the explorer screen in the navigation. Default: true */
  explorer: boolean;
  /** Show the attention items dropdown. Default: true */
  attentionItems: boolean;
  /** Show the filter bar on dashboard/report screens. Default: true */
  filterBar: boolean;
  /** Enable keyboard shortcuts (Ctrl+Left for back, etc.). Default: true */
  keyboardShortcuts: boolean;
  /** Enable mobile responsive layout. Default: true */
  mobileResponsive: boolean;
  /** Enable URL-based routing. Default: false */
  urlRouting: boolean;
}

// ========================================================================
// Branding / theming
// ========================================================================

export interface ViewerBranding {
  /** Application title shown in the shell header. */
  title?: string;
  /** Logo URL or inline SVG string. */
  logo?: string;
  /** Theme name to apply to child components. */
  theme?: string;
  /** Locale for formatting. */
  locale?: string;
}

// ========================================================================
// ViewerShellConfig
// ========================================================================

export interface ViewerShellConfig {
  /** Data adapter for query execution and schema access. */
  dataAdapter: DataAdapter;
  /** Persistence adapter for loading artifacts. */
  persistenceAdapter: PersistenceAdapter;
  /** Attention adapter for notifications (optional). */
  attentionAdapter?: AttentionAdapter;
  /** Current viewer identity and roles. */
  viewerContext?: ViewerContext;
  /** Feature flags controlling which capabilities are visible. */
  features: ViewerFeatureFlags;
  /** Branding and theming configuration. */
  branding: ViewerBranding;
  /** Initial screen to display. Default: 'catalog' */
  initialScreen?: ViewerScreen;
  /** Initial artifact to load (for deep-linking). */
  initialArtifactId?: string;
  /** Initial artifact type (for deep-linking). */
  initialArtifactType?: string;
}

// ========================================================================
// Factory: createViewerShellConfig
// ========================================================================

/**
 * Create a ViewerShellConfig with sensible defaults.
 * Only dataAdapter and persistenceAdapter are required.
 */
export function createViewerShellConfig(
  input: Pick<ViewerShellConfig, 'dataAdapter' | 'persistenceAdapter'> &
    Partial<Omit<ViewerShellConfig, 'dataAdapter' | 'persistenceAdapter'>>,
): ViewerShellConfig {
  return {
    dataAdapter: input.dataAdapter,
    persistenceAdapter: input.persistenceAdapter,
    attentionAdapter: input.attentionAdapter,
    viewerContext: input.viewerContext,
    features: {
      explorer: input.features?.explorer ?? true,
      attentionItems: input.features?.attentionItems ?? true,
      filterBar: input.features?.filterBar ?? true,
      keyboardShortcuts: input.features?.keyboardShortcuts ?? true,
      mobileResponsive: input.features?.mobileResponsive ?? true,
      urlRouting: input.features?.urlRouting ?? false,
    },
    branding: {
      title: input.branding?.title ?? 'phz-grid Viewer',
      logo: input.branding?.logo,
      theme: input.branding?.theme ?? 'auto',
      locale: input.branding?.locale ?? 'en-US',
    },
    initialScreen: input.initialScreen ?? 'catalog',
    initialArtifactId: input.initialArtifactId,
    initialArtifactType: input.initialArtifactType,
  };
}

// ========================================================================
// Default feature flags
// ========================================================================

export function createDefaultFeatureFlags(
  overrides?: Partial<ViewerFeatureFlags>,
): ViewerFeatureFlags {
  return {
    explorer: overrides?.explorer ?? true,
    attentionItems: overrides?.attentionItems ?? true,
    filterBar: overrides?.filterBar ?? true,
    keyboardShortcuts: overrides?.keyboardShortcuts ?? true,
    mobileResponsive: overrides?.mobileResponsive ?? true,
    urlRouting: overrides?.urlRouting ?? false,
  };
}
