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

import type { FilterContextManager, FilterValue, DashboardFilterDef } from '@phozart/shared';
import type { DataAdapter } from '../data-adapter.js';
import type { FilterDependency } from '../types.js';
import type { FilterDefinition } from './filter-definition.js';
import { serializeFilterState, deserializeFilterState } from './url-filter-sync.js';
import { resolveCascadingDependency } from './cascading-resolver.js';

// ========================================================================
// Task 2.6: URL Filter Sync
// ========================================================================

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
export function createUrlFilterSync(
  filterContext: FilterContextManager,
  options: UrlSyncOptions,
): UrlFilterSync {
  const unsub = filterContext.subscribe(() => {
    const state = filterContext.getState();
    const queryString = serializeFilterState(state);
    options.pushState(queryString);
  });

  return {
    restoreFromUrl(queryString: string): void {
      const restored = deserializeFilterState(queryString);
      // Apply each restored filter to the context
      for (const filter of restored.values.values()) {
        filterContext.setFilter(filter);
      }
      filterContext.setSource('url');
    },

    destroy(): void {
      unsub();
    },
  };
}

// ========================================================================
// Task 2.5: Filter Cascade Wiring
// ========================================================================

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
export function createCascadeWiring(
  filterContext: FilterContextManager,
  dataAdapter: DataAdapter,
  options: CascadeWiringOptions,
): CascadeWiring {
  if (options.dependencies.length === 0) {
    return { destroy: () => {} };
  }

  // Track previous parent values to detect changes
  const previousParentValues = new Map<string, unknown>();

  const unsub = filterContext.subscribe(() => {
    const currentFilters = filterContext.resolveFilters();
    const filterMap = new Map<string, FilterValue>(
      currentFilters.map(f => [f.filterId, f]),
    );

    for (const dep of options.dependencies) {
      const parentFilter = filterMap.get(dep.parentFilterId);
      const parentValue = parentFilter?.value;
      const previousValue = previousParentValues.get(dep.parentFilterId);

      // Only reload child if parent value actually changed
      if (parentValue !== previousValue) {
        previousParentValues.set(dep.parentFilterId, parentValue);

        // Find the child filter definition to know which data source/field to query
        const childDef = options.filterDefs.find(f => f.id === dep.childFilterId);
        if (!childDef) continue;

        const filterDep: FilterDependency = {
          parentFilterId: dep.parentFilterId,
          childFilterId: dep.childFilterId,
          constraintType: 'data-driven',
        };

        // Async: resolve cascading values
        resolveCascadingDependency(
          dataAdapter,
          childDef,
          filterDep,
          parentValue,
        ).then(result => {
          options.onChildValuesLoaded?.(dep.childFilterId, result.values);
        }).catch(() => {
          // On error, provide empty values so the child shows "no options"
          options.onChildValuesLoaded?.(dep.childFilterId, []);
        });
      }
    }
  });

  return {
    destroy(): void {
      unsub();
      previousParentValues.clear();
    },
  };
}

// ========================================================================
// Task 2.7: Filter Admin Persistence
// ========================================================================

/**
 * Minimal adapter interface for filter persistence.
 * WorkspaceAdapter satisfies this via its generic listArtifacts
 * plus optional saveAlertRule-style extension methods.
 */
export interface FilterStorageAdapter {
  saveArtifact?(type: string, data: unknown): Promise<void>;
  deleteArtifact?(type: string, id: string): Promise<void>;
  listArtifacts(type?: string): Promise<Array<{ id: string; type: string; name: string }>>;
}

export interface FilterAdminPersistence {
  saveFilterDefinition(def: FilterDefinition): Promise<void>;
  deleteFilterDefinition(id: string): Promise<void>;
  listFilterDefinitions(): Promise<Array<{ id: string; type: string; name: string }>>;
}

/**
 * Create a persistence layer for filter definitions.
 * Wraps the WorkspaceAdapter's generic artifact CRUD.
 */
export function createFilterAdminPersistence(
  adapter: FilterStorageAdapter,
): FilterAdminPersistence {
  return {
    async saveFilterDefinition(def: FilterDefinition): Promise<void> {
      await adapter.saveArtifact?.('filter-definition', def);
    },

    async deleteFilterDefinition(id: string): Promise<void> {
      await adapter.deleteArtifact?.('filter-definition', id);
    },

    async listFilterDefinitions(): Promise<Array<{ id: string; type: string; name: string }>> {
      return adapter.listArtifacts('filter-definition');
    },
  };
}
