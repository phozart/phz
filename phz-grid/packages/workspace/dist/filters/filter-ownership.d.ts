/**
 * @phozart/phz-workspace — Filter Ownership Model (U.5)
 *
 * Bridges FilterDefinitions, ArtifactFilterContracts, security bindings,
 * and filter rules into the existing FilterContextManager system.
 *
 * Admin defines FilterDefinitions -> binds to dashboards via ArtifactFilterContract.
 * End users can only use admin-defined filters + create personal presets within constraints.
 */
import type { ArtifactFilterContract, ViewerContext } from '../types.js';
import type { FilterDefinition, FilterBinding } from './filter-definition.js';
export interface ContractFilterResolution {
    filters: Array<{
        definition: FilterDefinition;
        queryLayer: 'server' | 'client' | 'auto';
        label: string;
        required: boolean;
    }>;
    defaults: Record<string, unknown>;
    effectiveValues: Record<string, unknown>;
}
export declare function resolveFiltersFromContract(contract: ArtifactFilterContract, definitions: FilterDefinition[], viewerContext?: ViewerContext, presetValues?: Record<string, unknown>): ContractFilterResolution;
export interface PruneResult {
    pruned: Record<string, unknown>;
    removed: string[];
}
export declare function prunePresetValues(presetValues: Record<string, unknown>, contract: ArtifactFilterContract, definitions: FilterDefinition[]): PruneResult;
export declare function applySecurityRestrictions(definition: FilterDefinition, viewer: ViewerContext | undefined, allValues: unknown[]): unknown[];
export interface FilterBarEntry {
    id: string;
    label: string;
    filterType: FilterDefinition['filterType'];
    required: boolean;
    defaultValue?: unknown;
    bindings: FilterBinding[];
}
export declare function buildFilterBarFromContract(contract: ArtifactFilterContract, definitions: FilterDefinition[]): FilterBarEntry[];
//# sourceMappingURL=filter-ownership.d.ts.map