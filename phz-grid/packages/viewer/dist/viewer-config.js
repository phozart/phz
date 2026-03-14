/**
 * @phozart/viewer — ViewerShellConfig
 *
 * Configuration type and factory for the viewer shell. Consumers
 * provide adapters (data, persistence, attention) and optional
 * feature toggles to customise the viewer experience.
 */
// ========================================================================
// Factory: createViewerShellConfig
// ========================================================================
/**
 * Create a ViewerShellConfig with sensible defaults.
 * Only dataAdapter and persistenceAdapter are required.
 */
export function createViewerShellConfig(input) {
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
export function createDefaultFeatureFlags(overrides) {
    return {
        explorer: overrides?.explorer ?? true,
        attentionItems: overrides?.attentionItems ?? true,
        filterBar: overrides?.filterBar ?? true,
        keyboardShortcuts: overrides?.keyboardShortcuts ?? true,
        mobileResponsive: overrides?.mobileResponsive ?? true,
        urlRouting: overrides?.urlRouting ?? false,
    };
}
//# sourceMappingURL=viewer-config.js.map