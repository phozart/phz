/**
 * @phozart/engine — Filter State Management
 *
 * 6-level state resolution chain and StateStorageAdapter for
 * persist/reset session behavior.
 */
import type { FilterDefinition, FilterDefinitionId, FilterBinding, StateStorageAdapter, StateResolutionInputs, StateResolutionLevel } from '@phozart/core';
export interface ResolvedFilterValue {
    value: string | string[] | null;
    level: StateResolutionLevel;
}
export interface FilterStateManager {
    resolveState(filterId: FilterDefinitionId, inputs: StateResolutionInputs): ResolvedFilterValue;
    persistState(key: string, values: Record<string, string | string[] | null>, definitions: FilterDefinition[]): void;
    loadPersistedState(key: string, definitions: FilterDefinition[], bindings?: FilterBinding[]): {
        reconciled: Record<string, string | string[] | null>;
        staleKeys: string[];
    };
}
export declare function createFilterStateManager(storage?: StateStorageAdapter): FilterStateManager;
export declare function resolveFilterValue(id: FilterDefinitionId, inputs: StateResolutionInputs): ResolvedFilterValue;
export declare function createMemoryStorageAdapter(): StateStorageAdapter;
export declare function reconcilePersistedState(persisted: Record<string, string | string[] | null>, definitions: FilterDefinition[], bindings?: FilterBinding[]): {
    reconciled: Record<string, string | string[] | null>;
    staleKeys: string[];
};
//# sourceMappingURL=filter-state.d.ts.map