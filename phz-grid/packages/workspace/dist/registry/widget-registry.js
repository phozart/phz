/**
 * Open widget registry with lazy loading support.
 * Replaces the closed switch in engine/src/widget-resolver.ts.
 */
export function createWidgetRegistry() {
    const entries = new Map();
    const resolved = new Map();
    return {
        register(type, renderer) {
            entries.set(type, renderer);
            // Clear cached resolution if overriding
            resolved.delete(type);
        },
        get(type) {
            const entry = entries.get(type);
            if (!entry)
                return undefined;
            if (typeof entry === 'function')
                return resolved.get(type);
            return entry;
        },
        has(type) {
            return entries.has(type);
        },
        list() {
            return Array.from(entries.keys());
        },
        async resolve(type) {
            // Check cache first
            const cached = resolved.get(type);
            if (cached)
                return cached;
            const entry = entries.get(type);
            if (!entry)
                return undefined;
            if (typeof entry === 'function') {
                const renderer = await entry();
                resolved.set(type, renderer);
                return renderer;
            }
            return entry;
        },
    };
}
export function createManifestRegistry() {
    const manifests = new Map();
    return {
        registerManifest(manifest) {
            manifests.set(manifest.type, manifest);
        },
        getManifest(type) {
            return manifests.get(type);
        },
        listManifests() {
            return Array.from(manifests.values());
        },
        listByCategory(category) {
            return Array.from(manifests.values()).filter(m => m.category === category);
        },
        findByCapabilities(filter) {
            return Array.from(manifests.values()).filter(m => {
                if (filter.interactions?.length) {
                    const hasAll = filter.interactions.every(i => m.supportedInteractions.includes(i));
                    if (!hasAll)
                        return false;
                }
                if (filter.fieldRoles?.length) {
                    const hasAll = filter.fieldRoles.every(role => m.requiredFields.some(f => f.role === role));
                    if (!hasAll)
                        return false;
                }
                return true;
            });
        },
        getVariants(type) {
            return manifests.get(type)?.variants ?? [];
        },
        resolveVariant(type, variantId) {
            return manifests.get(type)?.variants.find(v => v.id === variantId);
        },
    };
}
//# sourceMappingURL=widget-registry.js.map