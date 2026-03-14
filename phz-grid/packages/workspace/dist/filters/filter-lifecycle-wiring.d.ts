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
import type { FilterContextManager, DashboardFilterDef } from '@phozart/shared';
import type { DataAdapter } from '../data-adapter.js';
import type { FilterDefinition } from './filter-definition.js';
export interface UrlSyncOptions {
    /** Callback to push URL state. Defaults to history.pushState if available. */
    pushState: (queryString: string) => void;
}
export interface UrlFilterSync {
    /** Restore filter state from a URL query string */
    restoreFromUrl(queryString: string): void;
    /** Clean up subscription */
    destroy(): void;
}
/**
 * Create a reactive URL sync that:
 * - Serializes filter state to URL on every filter change
 * - Provides restoreFromUrl() to hydrate filter context from URL
 */
export declare function createUrlFilterSync(filterContext: FilterContextManager, options: UrlSyncOptions): UrlFilterSync;
export interface CascadeDependency {
    parentFilterId: string;
    childFilterId: string;
    cascadeField?: string;
}
export interface CascadeWiringOptions {
    dependencies: CascadeDependency[];
    filterDefs: DashboardFilterDef[];
    onChildValuesLoaded?: (childFilterId: string, values: unknown[]) => void;
}
export interface CascadeWiring {
    destroy(): void;
}
/**
 * Create reactive cascade wiring that:
 * - Subscribes to FilterContextManager changes
 * - When a parent filter changes, resolves child dropdown values
 *   via DataAdapter.getDistinctValues()
 * - Calls onChildValuesLoaded() callback with the new values
 */
export declare function createCascadeWiring(filterContext: FilterContextManager, dataAdapter: DataAdapter, options: CascadeWiringOptions): CascadeWiring;
/**
 * Minimal adapter interface for filter persistence.
 * WorkspaceAdapter satisfies this via its generic listArtifacts
 * plus optional saveAlertRule-style extension methods.
 */
export interface FilterStorageAdapter {
    saveArtifact?(type: string, data: unknown): Promise<void>;
    deleteArtifact?(type: string, id: string): Promise<void>;
    listArtifacts(type?: string): Promise<Array<{
        id: string;
        type: string;
        name: string;
    }>>;
}
export interface FilterAdminPersistence {
    saveFilterDefinition(def: FilterDefinition): Promise<void>;
    deleteFilterDefinition(id: string): Promise<void>;
    listFilterDefinitions(): Promise<Array<{
        id: string;
        type: string;
        name: string;
    }>>;
}
/**
 * Create a persistence layer for filter definitions.
 * Wraps the WorkspaceAdapter's generic artifact CRUD.
 */
export declare function createFilterAdminPersistence(adapter: FilterStorageAdapter): FilterAdminPersistence;
//# sourceMappingURL=filter-lifecycle-wiring.d.ts.map