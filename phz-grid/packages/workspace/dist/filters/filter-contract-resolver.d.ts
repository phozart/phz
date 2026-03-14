/**
 * @phozart/workspace — FilterContractResolver (U.3)
 *
 * Resolves an ArtifactFilterContract against available FilterDefinitions.
 * Validates filter values against the contract and produces pruned results.
 */
import type { ArtifactFilterContract, DashboardFilterRef, ViewerContext } from '../types.js';
import type { FilterDefinition } from './filter-definition.js';
export interface ResolvedFilter {
    definition: FilterDefinition;
    overrides: DashboardFilterRef['overrides'];
    queryLayer: 'server' | 'client' | 'auto';
    resolvedDefault?: unknown;
}
export interface ResolvedFilterContract {
    filters: ResolvedFilter[];
    warnings: string[];
}
export declare function resolveFilterContract(contract: ArtifactFilterContract, definitions: FilterDefinition[], viewerContext?: ViewerContext): ResolvedFilterContract;
export interface FilterValuesValidation {
    valid: boolean;
    pruned: Record<string, unknown>;
    warnings: string[];
}
export declare function validateFilterValues(contract: ArtifactFilterContract, values: Record<string, unknown>, definitions: FilterDefinition[]): FilterValuesValidation;
//# sourceMappingURL=filter-contract-resolver.d.ts.map