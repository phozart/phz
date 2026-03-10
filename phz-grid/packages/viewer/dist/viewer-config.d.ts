/**
 * @phozart/phz-viewer — ViewerShellConfig
 *
 * Configuration type and factory for the viewer shell. Consumers
 * provide adapters (data, persistence, attention) and optional
 * feature toggles to customise the viewer experience.
 */
import type { DataAdapter, ViewerContext } from '@phozart/phz-shared/adapters';
import type { PersistenceAdapter } from '@phozart/phz-shared/adapters';
import type { AttentionAdapter } from '@phozart/phz-shared/adapters';
import type { ViewerScreen } from './viewer-state.js';
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
/**
 * Create a ViewerShellConfig with sensible defaults.
 * Only dataAdapter and persistenceAdapter are required.
 */
export declare function createViewerShellConfig(input: Pick<ViewerShellConfig, 'dataAdapter' | 'persistenceAdapter'> & Partial<Omit<ViewerShellConfig, 'dataAdapter' | 'persistenceAdapter'>>): ViewerShellConfig;
export declare function createDefaultFeatureFlags(overrides?: Partial<ViewerFeatureFlags>): ViewerFeatureFlags;
//# sourceMappingURL=viewer-config.d.ts.map