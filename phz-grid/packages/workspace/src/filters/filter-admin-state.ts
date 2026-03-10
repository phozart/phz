/**
 * @phozart/phz-workspace — Filter Admin State (B-3.06)
 *
 * Pure functions for a central filter definition registry.
 * Manages filter definitions, their bindings per data source,
 * dashboard filter contract management, and filter testing/preview.
 */

import type { FilterDefinition, FilterBinding } from './filter-definition.js';
import type { ArtifactFilterContract, DashboardFilterRef } from '../types.js';

// ========================================================================
// Types
// ========================================================================

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
  contracts: Map<string, ArtifactFilterContract>; // artifactId -> contract
  testCases: FilterTestCase[];
  filterTypeFilter?: FilterDefinition['filterType'];
}

// ========================================================================
// Factory
// ========================================================================

export function initialFilterAdminState(
  definitions: FilterDefinition[] = [],
): FilterAdminState {
  return {
    definitions,
    search: '',
    contracts: new Map(),
    testCases: [],
  };
}

// ========================================================================
// Search and filter
// ========================================================================

export function setFilterSearch(
  state: FilterAdminState,
  search: string,
): FilterAdminState {
  return { ...state, search };
}

export function setFilterTypeFilter(
  state: FilterAdminState,
  filterType: FilterDefinition['filterType'] | undefined,
): FilterAdminState {
  return { ...state, filterTypeFilter: filterType };
}

export function getFilteredDefinitions(state: FilterAdminState): FilterDefinition[] {
  let result = state.definitions;

  if (state.filterTypeFilter) {
    result = result.filter(d => d.filterType === state.filterTypeFilter);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(
      d =>
        d.label.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false) ||
        d.id.toLowerCase().includes(q),
    );
  }

  return result;
}

// ========================================================================
// CRUD operations
// ========================================================================

export function addDefinition(
  state: FilterAdminState,
  definition: FilterDefinition,
): FilterAdminState {
  if (state.definitions.some(d => d.id === definition.id)) return state;
  return {
    ...state,
    definitions: [...state.definitions, definition],
  };
}

export function updateDefinition(
  state: FilterAdminState,
  definition: FilterDefinition,
): FilterAdminState {
  return {
    ...state,
    definitions: state.definitions.map(d =>
      d.id === definition.id ? definition : d,
    ),
    editingDefinition:
      state.editingDefinition?.id === definition.id ? definition : state.editingDefinition,
  };
}

export function removeDefinition(
  state: FilterAdminState,
  definitionId: string,
): FilterAdminState {
  return {
    ...state,
    definitions: state.definitions.filter(d => d.id !== definitionId),
    selectedDefinitionId:
      state.selectedDefinitionId === definitionId ? undefined : state.selectedDefinitionId,
    editingDefinition:
      state.editingDefinition?.id === definitionId ? undefined : state.editingDefinition,
  };
}

// ========================================================================
// Selection / editing
// ========================================================================

export function selectDefinition(
  state: FilterAdminState,
  definitionId: string,
): FilterAdminState {
  const definition = state.definitions.find(d => d.id === definitionId);
  return {
    ...state,
    selectedDefinitionId: definitionId,
    editingDefinition: definition ? { ...definition, bindings: [...definition.bindings] } : undefined,
  };
}

export function clearSelection(state: FilterAdminState): FilterAdminState {
  return {
    ...state,
    selectedDefinitionId: undefined,
    editingDefinition: undefined,
  };
}

// ========================================================================
// Binding management (on the editing definition)
// ========================================================================

export function addBindingToEditing(
  state: FilterAdminState,
  binding: FilterBinding,
): FilterAdminState {
  if (!state.editingDefinition) return state;

  // Prevent duplicate bindings for same data source
  const existing = state.editingDefinition.bindings.find(
    b => b.dataSourceId === binding.dataSourceId,
  );
  if (existing) return state;

  const editingDefinition: FilterDefinition = {
    ...state.editingDefinition,
    bindings: [...state.editingDefinition.bindings, binding],
  };
  return { ...state, editingDefinition };
}

export function removeBindingFromEditing(
  state: FilterAdminState,
  dataSourceId: string,
): FilterAdminState {
  if (!state.editingDefinition) return state;

  const editingDefinition: FilterDefinition = {
    ...state.editingDefinition,
    bindings: state.editingDefinition.bindings.filter(
      b => b.dataSourceId !== dataSourceId,
    ),
  };
  return { ...state, editingDefinition };
}

// ========================================================================
// Contract management
// ========================================================================

export function setArtifactContract(
  state: FilterAdminState,
  artifactId: string,
  contract: ArtifactFilterContract,
): FilterAdminState {
  const contracts = new Map(state.contracts);
  contracts.set(artifactId, contract);
  return { ...state, contracts };
}

export function removeArtifactContract(
  state: FilterAdminState,
  artifactId: string,
): FilterAdminState {
  const contracts = new Map(state.contracts);
  contracts.delete(artifactId);
  return { ...state, contracts };
}

export function addFilterToContract(
  state: FilterAdminState,
  artifactId: string,
  filterRef: DashboardFilterRef,
): FilterAdminState {
  const existing = state.contracts.get(artifactId) ?? { acceptedFilters: [] };
  const contract: ArtifactFilterContract = {
    ...existing,
    acceptedFilters: [...existing.acceptedFilters, filterRef],
  };
  return setArtifactContract(state, artifactId, contract);
}

export function removeFilterFromContract(
  state: FilterAdminState,
  artifactId: string,
  filterDefinitionId: string,
): FilterAdminState {
  const existing = state.contracts.get(artifactId);
  if (!existing) return state;

  const contract: ArtifactFilterContract = {
    ...existing,
    acceptedFilters: existing.acceptedFilters.filter(
      f => f.filterDefinitionId !== filterDefinitionId,
    ),
  };
  return setArtifactContract(state, artifactId, contract);
}

// ========================================================================
// Filter testing
// ========================================================================

export function addTestCase(
  state: FilterAdminState,
  testCase: FilterTestCase,
): FilterAdminState {
  return { ...state, testCases: [...state.testCases, testCase] };
}

export function clearTestCases(state: FilterAdminState): FilterAdminState {
  return { ...state, testCases: [] };
}

export function runTestCase(
  testCase: FilterTestCase,
  transform: ((value: unknown) => unknown) | undefined,
): FilterTestCase {
  if (!transform) {
    return { ...testCase, passed: true, error: undefined };
  }
  try {
    const result = transform(testCase.inputValue);
    const passed = testCase.expectedOutput !== undefined
      ? JSON.stringify(result) === JSON.stringify(testCase.expectedOutput)
      : true;
    return { ...testCase, passed, error: undefined };
  } catch (e) {
    return { ...testCase, passed: false, error: String(e) };
  }
}

// ========================================================================
// Usage analysis
// ========================================================================

export function getDefinitionUsage(
  state: FilterAdminState,
  definitionId: string,
): string[] {
  const artifactIds: string[] = [];
  for (const [artifactId, contract] of state.contracts) {
    if (contract.acceptedFilters.some(f => f.filterDefinitionId === definitionId)) {
      artifactIds.push(artifactId);
    }
  }
  return artifactIds;
}

export function getUnusedDefinitions(state: FilterAdminState): FilterDefinition[] {
  return state.definitions.filter(d => getDefinitionUsage(state, d.id).length === 0);
}
