/**
 * @phozart/phz-workspace — Filter Admin State (B-3.06)
 *
 * Pure functions for a central filter definition registry.
 * Manages filter definitions, their bindings per data source,
 * dashboard filter contract management, and filter testing/preview.
 */
import type { FilterDefinition, FilterBinding } from './filter-definition.js';
import type { ArtifactFilterContract, DashboardFilterRef } from '../types.js';
export interface FilterTestCase {
    filterDefinitionId: string;
    inputValue: unknown;
    expectedOutput?: unknown;
    passed?: boolean;
    error?: string;
}
export interface FilterAdminState {
    definitions: FilterDefinition[];
    search: string;
    selectedDefinitionId?: string;
    editingDefinition?: FilterDefinition;
    contracts: Map<string, ArtifactFilterContract>;
    testCases: FilterTestCase[];
    filterTypeFilter?: FilterDefinition['filterType'];
}
export declare function initialFilterAdminState(definitions?: FilterDefinition[]): FilterAdminState;
export declare function setFilterSearch(state: FilterAdminState, search: string): FilterAdminState;
export declare function setFilterTypeFilter(state: FilterAdminState, filterType: FilterDefinition['filterType'] | undefined): FilterAdminState;
export declare function getFilteredDefinitions(state: FilterAdminState): FilterDefinition[];
export declare function addDefinition(state: FilterAdminState, definition: FilterDefinition): FilterAdminState;
export declare function updateDefinition(state: FilterAdminState, definition: FilterDefinition): FilterAdminState;
export declare function removeDefinition(state: FilterAdminState, definitionId: string): FilterAdminState;
export declare function selectDefinition(state: FilterAdminState, definitionId: string): FilterAdminState;
export declare function clearSelection(state: FilterAdminState): FilterAdminState;
export declare function addBindingToEditing(state: FilterAdminState, binding: FilterBinding): FilterAdminState;
export declare function removeBindingFromEditing(state: FilterAdminState, dataSourceId: string): FilterAdminState;
export declare function setArtifactContract(state: FilterAdminState, artifactId: string, contract: ArtifactFilterContract): FilterAdminState;
export declare function removeArtifactContract(state: FilterAdminState, artifactId: string): FilterAdminState;
export declare function addFilterToContract(state: FilterAdminState, artifactId: string, filterRef: DashboardFilterRef): FilterAdminState;
export declare function removeFilterFromContract(state: FilterAdminState, artifactId: string, filterDefinitionId: string): FilterAdminState;
export declare function addTestCase(state: FilterAdminState, testCase: FilterTestCase): FilterAdminState;
export declare function clearTestCases(state: FilterAdminState): FilterAdminState;
export declare function runTestCase(testCase: FilterTestCase, transform: ((value: unknown) => unknown) | undefined): FilterTestCase;
export declare function getDefinitionUsage(state: FilterAdminState, definitionId: string): string[];
export declare function getUnusedDefinitions(state: FilterAdminState): FilterDefinition[];
//# sourceMappingURL=filter-admin-state.d.ts.map