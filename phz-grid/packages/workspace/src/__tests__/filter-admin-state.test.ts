import { describe, it, expect } from 'vitest';
import type { FilterDefinition, FilterBinding } from '../filters/filter-definition.js';
import {
  initialFilterAdminState,
  setFilterSearch,
  setFilterTypeFilter,
  getFilteredDefinitions,
  addDefinition,
  updateDefinition,
  removeDefinition,
  selectDefinition,
  clearSelection,
  addBindingToEditing,
  removeBindingFromEditing,
  setArtifactContract,
  removeArtifactContract,
  addFilterToContract,
  removeFilterFromContract,
  addTestCase,
  clearTestCases,
  runTestCase,
  getDefinitionUsage,
  getUnusedDefinitions,
} from '../filters/filter-admin-state.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const def1: FilterDefinition = {
  id: 'fd-1',
  label: 'Region Filter',
  description: 'Filter by region',
  filterType: 'select',
  valueSource: { type: 'static', values: ['US', 'EU', 'APAC'] },
  bindings: [{ dataSourceId: 'ds-1', targetField: 'region' }],
};

const def2: FilterDefinition = {
  id: 'fd-2',
  label: 'Date Range',
  filterType: 'date-range',
  valueSource: { type: 'data-source', dataSourceId: 'ds-1', field: 'created_at' },
  bindings: [],
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialFilterAdminState', () => {
  it('creates empty state', () => {
    const state = initialFilterAdminState();
    expect(state.definitions).toHaveLength(0);
    expect(state.search).toBe('');
  });

  it('accepts initial definitions', () => {
    const state = initialFilterAdminState([def1, def2]);
    expect(state.definitions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Search and filter
// ---------------------------------------------------------------------------

describe('search and filter', () => {
  it('searches by label', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = setFilterSearch(state, 'region');
    expect(getFilteredDefinitions(state)).toHaveLength(1);
  });

  it('searches by description', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = setFilterSearch(state, 'by region');
    expect(getFilteredDefinitions(state)).toHaveLength(1);
  });

  it('filters by type', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = setFilterTypeFilter(state, 'select');
    expect(getFilteredDefinitions(state)).toHaveLength(1);
    expect(getFilteredDefinitions(state)[0].id).toBe('fd-1');
  });

  it('combined search and type filter', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = setFilterSearch(state, 'date');
    state = setFilterTypeFilter(state, 'date-range');
    expect(getFilteredDefinitions(state)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

describe('CRUD', () => {
  it('adds a definition', () => {
    let state = initialFilterAdminState();
    state = addDefinition(state, def1);
    expect(state.definitions).toHaveLength(1);
  });

  it('does not add duplicate', () => {
    let state = initialFilterAdminState([def1]);
    state = addDefinition(state, def1);
    expect(state.definitions).toHaveLength(1);
  });

  it('updates a definition', () => {
    let state = initialFilterAdminState([def1]);
    state = updateDefinition(state, { ...def1, label: 'Updated' });
    expect(state.definitions[0].label).toBe('Updated');
  });

  it('removes a definition', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = removeDefinition(state, 'fd-1');
    expect(state.definitions).toHaveLength(1);
    expect(state.definitions[0].id).toBe('fd-2');
  });
});

// ---------------------------------------------------------------------------
// Selection / editing
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects a definition and creates editing copy', () => {
    let state = initialFilterAdminState([def1]);
    state = selectDefinition(state, 'fd-1');
    expect(state.selectedDefinitionId).toBe('fd-1');
    expect(state.editingDefinition).toBeDefined();
    expect(state.editingDefinition!.label).toBe('Region Filter');
  });

  it('clearSelection resets', () => {
    let state = initialFilterAdminState([def1]);
    state = selectDefinition(state, 'fd-1');
    state = clearSelection(state);
    expect(state.selectedDefinitionId).toBeUndefined();
    expect(state.editingDefinition).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Binding management
// ---------------------------------------------------------------------------

describe('binding management', () => {
  it('adds binding to editing definition', () => {
    let state = initialFilterAdminState([def1]);
    state = selectDefinition(state, 'fd-1');
    const binding: FilterBinding = { dataSourceId: 'ds-2', targetField: 'region' };
    state = addBindingToEditing(state, binding);
    expect(state.editingDefinition!.bindings).toHaveLength(2);
  });

  it('does not add duplicate binding for same data source', () => {
    let state = initialFilterAdminState([def1]);
    state = selectDefinition(state, 'fd-1');
    const binding: FilterBinding = { dataSourceId: 'ds-1', targetField: 'region' };
    state = addBindingToEditing(state, binding);
    expect(state.editingDefinition!.bindings).toHaveLength(1);
  });

  it('removes binding from editing definition', () => {
    let state = initialFilterAdminState([def1]);
    state = selectDefinition(state, 'fd-1');
    state = removeBindingFromEditing(state, 'ds-1');
    expect(state.editingDefinition!.bindings).toHaveLength(0);
  });

  it('does nothing without editing definition', () => {
    const state = initialFilterAdminState([def1]);
    const binding: FilterBinding = { dataSourceId: 'ds-2', targetField: 'region' };
    expect(addBindingToEditing(state, binding)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Contract management
// ---------------------------------------------------------------------------

describe('contract management', () => {
  it('sets artifact contract', () => {
    let state = initialFilterAdminState([def1]);
    state = setArtifactContract(state, 'artifact-1', {
      acceptedFilters: [{ filterDefinitionId: 'fd-1' }],
    });
    expect(state.contracts.get('artifact-1')).toBeDefined();
  });

  it('removes artifact contract', () => {
    let state = initialFilterAdminState([def1]);
    state = setArtifactContract(state, 'artifact-1', { acceptedFilters: [] });
    state = removeArtifactContract(state, 'artifact-1');
    expect(state.contracts.has('artifact-1')).toBe(false);
  });

  it('adds filter to contract', () => {
    let state = initialFilterAdminState([def1]);
    state = addFilterToContract(state, 'artifact-1', { filterDefinitionId: 'fd-1' });
    expect(state.contracts.get('artifact-1')!.acceptedFilters).toHaveLength(1);
  });

  it('removes filter from contract', () => {
    let state = initialFilterAdminState([def1]);
    state = addFilterToContract(state, 'artifact-1', { filterDefinitionId: 'fd-1' });
    state = removeFilterFromContract(state, 'artifact-1', 'fd-1');
    expect(state.contracts.get('artifact-1')!.acceptedFilters).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Usage analysis
// ---------------------------------------------------------------------------

describe('usage analysis', () => {
  it('getDefinitionUsage finds referencing artifacts', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = addFilterToContract(state, 'art-1', { filterDefinitionId: 'fd-1' });
    state = addFilterToContract(state, 'art-2', { filterDefinitionId: 'fd-1' });
    expect(getDefinitionUsage(state, 'fd-1')).toHaveLength(2);
    expect(getDefinitionUsage(state, 'fd-2')).toHaveLength(0);
  });

  it('getUnusedDefinitions returns unreferenced definitions', () => {
    let state = initialFilterAdminState([def1, def2]);
    state = addFilterToContract(state, 'art-1', { filterDefinitionId: 'fd-1' });
    expect(getUnusedDefinitions(state)).toHaveLength(1);
    expect(getUnusedDefinitions(state)[0].id).toBe('fd-2');
  });
});

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

describe('test cases', () => {
  it('adds and clears test cases', () => {
    let state = initialFilterAdminState();
    state = addTestCase(state, { filterDefinitionId: 'fd-1', inputValue: 'US' });
    expect(state.testCases).toHaveLength(1);
    state = clearTestCases(state);
    expect(state.testCases).toHaveLength(0);
  });

  it('runs a test case with transform', () => {
    const tc = { filterDefinitionId: 'fd-1', inputValue: 'us', expectedOutput: 'US' };
    const result = runTestCase(tc, (v) => String(v).toUpperCase());
    expect(result.passed).toBe(true);
  });

  it('runs a test case that fails', () => {
    const tc = { filterDefinitionId: 'fd-1', inputValue: 'us', expectedOutput: 'UK' };
    const result = runTestCase(tc, (v) => String(v).toUpperCase());
    expect(result.passed).toBe(false);
  });

  it('runs a test case with no transform', () => {
    const tc = { filterDefinitionId: 'fd-1', inputValue: 'test' };
    const result = runTestCase(tc, undefined);
    expect(result.passed).toBe(true);
  });

  it('handles transform errors', () => {
    const tc = { filterDefinitionId: 'fd-1', inputValue: 'test' };
    const result = runTestCase(tc, () => { throw new Error('boom'); });
    expect(result.passed).toBe(false);
    expect(result.error).toContain('boom');
  });
});
