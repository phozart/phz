/**
 * @phozart/phz-engine — Filter Definition Registry
 *
 * Reusable, artefact-independent filter definitions with dependency
 * graph validation (cycle detection + topological sort).
 */
import type { FilterDefinition, FilterDefinitionId } from '@phozart/phz-core';
export interface FilterRegistry {
    register(def: FilterDefinition): void;
    get(id: FilterDefinitionId): FilterDefinition | undefined;
    getAll(): FilterDefinition[];
    update(id: FilterDefinitionId, patch: Partial<Omit<FilterDefinition, 'id' | 'createdAt'>>): void;
    deprecate(id: FilterDefinitionId): void;
    remove(id: FilterDefinitionId): void;
    validateDependencyGraph(): FilterDefinitionId[][];
}
export declare function createFilterRegistry(): FilterRegistry;
export declare function detectDependencyCycles(definitions: FilterDefinition[]): FilterDefinitionId[][];
export declare function topologicalSortFilters(definitions: FilterDefinition[]): FilterDefinition[];
//# sourceMappingURL=filter-registry.d.ts.map