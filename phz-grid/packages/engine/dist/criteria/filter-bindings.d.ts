/**
 * @phozart/engine — Filter Bindings
 *
 * Associates filter definitions to artefacts (reports/dashboards)
 * with per-binding overrides. Includes migration from legacy CriteriaConfig.
 */
import type { FilterDefinitionId, FilterBinding, ArtefactId, SelectionFieldDef, CriteriaConfig } from '@phozart/core';
import type { FilterRegistry } from './filter-registry.js';
export interface FilterBindingStore {
    bind(binding: FilterBinding): void;
    unbind(filterDefId: FilterDefinitionId, artId: ArtefactId): void;
    getBindingsForArtefact(artId: ArtefactId): FilterBinding[];
    getArtefactsForFilter(filterDefId: FilterDefinitionId): ArtefactId[];
    updateBinding(filterDefId: FilterDefinitionId, artId: ArtefactId, patch: Partial<Omit<FilterBinding, 'filterDefinitionId' | 'artefactId'>>): void;
    reorderBindings(artId: ArtefactId, orderedIds: FilterDefinitionId[]): void;
    hasBindings(filterDefId: FilterDefinitionId): boolean;
}
export declare function createFilterBindingStore(): FilterBindingStore;
export declare function resolveArtefactFields(registry: FilterRegistry, bindingStore: FilterBindingStore, artId: ArtefactId): SelectionFieldDef[];
export declare function migrateCriteriaConfig(config: CriteriaConfig, artId: ArtefactId): {
    registry: FilterRegistry;
    bindings: FilterBindingStore;
};
//# sourceMappingURL=filter-bindings.d.ts.map