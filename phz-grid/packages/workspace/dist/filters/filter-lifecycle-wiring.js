/**
 * filter-lifecycle-wiring — Reactive bridges for filter lifecycle events:
 *
 * Task 2.5: Filter cascade — parent filter change → child dropdown repopulation
 *   Uses cascading-resolver.ts + DataAdapter.getDistinctValues()
 *
 * Task 2.6: URL sync — filter state ↔ URL parameters
 *   Uses url-filter-sync.ts serialize/deserialize
 *
 * Task 2.7: Filter admin persistence — CRUD via WorkspaceAdapter
 *   Bridges filter-definition.ts → WorkspaceAdapter generic storage
 *
 * Tasks: 2.5 (WB-010), 2.6 (WB-011), 2.7 (WB-012)
 */
import { serializeFilterState, deserializeFilterState } from './url-filter-sync.js';
import { resolveCascadingDependency } from './cascading-resolver.js';
/**
 * Create a reactive URL sync that:
 * - Serializes filter state to URL on every filter change
 * - Provides restoreFromUrl() to hydrate filter context from URL
 */
export function createUrlFilterSync(filterContext, options) {
    const unsub = filterContext.subscribe(() => {
        const state = filterContext.getState();
        const queryString = serializeFilterState(state);
        options.pushState(queryString);
    });
    return {
        restoreFromUrl(queryString) {
            const restored = deserializeFilterState(queryString);
            // Apply each restored filter to the context
            for (const filter of restored.values.values()) {
                filterContext.setFilter(filter);
            }
            filterContext.setSource('url');
        },
        destroy() {
            unsub();
        },
    };
}
/**
 * Create reactive cascade wiring that:
 * - Subscribes to FilterContextManager changes
 * - When a parent filter changes, resolves child dropdown values
 *   via DataAdapter.getDistinctValues()
 * - Calls onChildValuesLoaded() callback with the new values
 */
export function createCascadeWiring(filterContext, dataAdapter, options) {
    if (options.dependencies.length === 0) {
        return { destroy: () => { } };
    }
    // Track previous parent values to detect changes
    const previousParentValues = new Map();
    const unsub = filterContext.subscribe(() => {
        const currentFilters = filterContext.resolveFilters();
        const filterMap = new Map(currentFilters.map(f => [f.filterId, f]));
        for (const dep of options.dependencies) {
            const parentFilter = filterMap.get(dep.parentFilterId);
            const parentValue = parentFilter?.value;
            const previousValue = previousParentValues.get(dep.parentFilterId);
            // Only reload child if parent value actually changed
            if (parentValue !== previousValue) {
                previousParentValues.set(dep.parentFilterId, parentValue);
                // Find the child filter definition to know which data source/field to query
                const childDef = options.filterDefs.find(f => f.id === dep.childFilterId);
                if (!childDef)
                    continue;
                const filterDep = {
                    parentFilterId: dep.parentFilterId,
                    childFilterId: dep.childFilterId,
                    constraintType: 'data-driven',
                };
                // Async: resolve cascading values
                resolveCascadingDependency(dataAdapter, childDef, filterDep, parentValue).then(result => {
                    options.onChildValuesLoaded?.(dep.childFilterId, result.values);
                }).catch(() => {
                    // On error, provide empty values so the child shows "no options"
                    options.onChildValuesLoaded?.(dep.childFilterId, []);
                });
            }
        }
    });
    return {
        destroy() {
            unsub();
            previousParentValues.clear();
        },
    };
}
/**
 * Create a persistence layer for filter definitions.
 * Wraps the WorkspaceAdapter's generic artifact CRUD.
 */
export function createFilterAdminPersistence(adapter) {
    return {
        async saveFilterDefinition(def) {
            await adapter.saveArtifact?.('filter-definition', def);
        },
        async deleteFilterDefinition(id) {
            await adapter.deleteArtifact?.('filter-definition', id);
        },
        async listFilterDefinitions() {
            return adapter.listArtifacts('filter-definition');
        },
    };
}
//# sourceMappingURL=filter-lifecycle-wiring.js.map