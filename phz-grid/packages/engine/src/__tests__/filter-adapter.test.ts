/**
 * Filter Adapter — bridges CriteriaEngine output to widget data filtering.
 *
 * TDD: RED phase — tests written before implementation.
 */
import { describe, it, expect, vi } from 'vitest';
import { createBIEngine } from '../engine.js';
import { createCriteriaEngine } from '../criteria/criteria-engine.js';
import { createFilterAdapter, applyArtefactCriteria } from '../filter-adapter.js';
import type { FilterAdapter } from '../filter-adapter.js';
import { dashboardId, widgetId } from '../types.js';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';
import type { ArtefactCriteria, FilterCriterion, FilterDefinition, FilterBinding } from '@phozart/phz-core';

// --- Test Data ---

const testData = [
  { name: 'Alice', department: 'Engineering', region: 'North', score: 95 },
  { name: 'Bob', department: 'Engineering', region: 'South', score: 85 },
  { name: 'Carol', department: 'Sales', region: 'North', score: 90 },
  { name: 'Dave', department: 'Sales', region: 'East', score: 72 },
  { name: 'Eve', department: 'HR', region: 'West', score: 88 },
];

// --- applyArtefactCriteria (pure function) ---

describe('applyArtefactCriteria', () => {
  it('returns all rows when criteria has no filters', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(5);
  });

  it('filters by "equals" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('dept'),
          operator: 'equals',
          value: 'Engineering',
          dataField: 'department',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.department === 'Engineering')).toBe(true);
  });

  it('filters by "in" operator with array value', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('region'),
          operator: 'in',
          value: ['North', 'East'],
          dataField: 'region',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Carol', 'Dave']);
  });

  it('skips filters with null value (all selected)', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('region'),
          operator: 'in',
          value: null,
          dataField: 'region',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(5);
  });

  it('applies "like" operator for substring search', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('name-search'),
          operator: 'like',
          value: 'al',
          dataField: 'name',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('applies "between" operator for numeric range', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('score-range'),
          operator: 'between',
          value: ['80', '90'],
          dataField: 'score',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.name).sort()).toEqual(['Bob', 'Carol', 'Eve']);
  });

  it('applies "is_null" operator', () => {
    const dataWithNulls = [
      ...testData,
      { name: 'Frank', department: null, region: 'West', score: 60 },
    ];
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('dept'),
          operator: 'is_null',
          value: null,
          dataField: 'department',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(dataWithNulls, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Frank');
  });

  it('applies "is_not_null" operator', () => {
    const dataWithNulls = [
      ...testData,
      { name: 'Frank', department: null, region: 'West', score: 60 },
    ];
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('dept'),
          operator: 'is_not_null',
          value: null,
          dataField: 'department',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(dataWithNulls, criteria);
    expect(result).toHaveLength(5);
  });

  it('applies "starts_with" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('name-search'),
          operator: 'starts_with',
          value: 'Ca',
          dataField: 'name',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Carol');
  });

  it('applies "not_in" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('region'),
          operator: 'not_in',
          value: ['North', 'East'],
          dataField: 'region',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name).sort()).toEqual(['Bob', 'Eve']);
  });

  it('applies "not_equals" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('dept'),
          operator: 'not_equals',
          value: 'Sales',
          dataField: 'department',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(3);
    expect(result.every(r => r.department !== 'Sales')).toBe(true);
  });

  it('applies "greater_than" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('score'),
          operator: 'greater_than',
          value: '89',
          dataField: 'score',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name).sort()).toEqual(['Alice', 'Carol']);
  });

  it('applies "less_than" operator', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('score'),
          operator: 'less_than',
          value: '86',
          dataField: 'score',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name).sort()).toEqual(['Bob', 'Dave']);
  });

  it('combines multiple filters (AND logic)', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('dept'),
          operator: 'equals',
          value: 'Engineering',
          dataField: 'department',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
        {
          filterDefinitionId: filterDefinitionId('region'),
          operator: 'equals',
          value: 'North',
          dataField: 'region',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('skips filter without dataField', () => {
    const criteria: ArtefactCriteria = {
      artefactId: artefactId('test'),
      filters: [
        {
          filterDefinitionId: filterDefinitionId('no-field'),
          operator: 'equals',
          value: 'anything',
          isRuleApplied: false,
          activeRuleIds: [],
          resolvedFrom: 'all_selected',
        },
      ],
      timestamp: Date.now(),
      isComplete: true,
    };
    const result = applyArtefactCriteria(testData, criteria);
    expect(result).toHaveLength(5);
  });
});

// --- FilterAdapter integration ---

describe('FilterAdapter', () => {
  function setupEngine() {
    const engine = createBIEngine();
    const criteriaEngine = engine.criteria;
    const artId = artefactId('dashboard:test-dash');
    const now = Date.now();

    // Register filter definitions
    criteriaEngine.registry.register({
      id: filterDefinitionId('department'),
      label: 'Department',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'department',
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Sales', label: 'Sales' },
        { value: 'HR', label: 'HR' },
      ],
      createdAt: now,
      updatedAt: now,
    });

    criteriaEngine.registry.register({
      id: filterDefinitionId('region'),
      label: 'Region',
      type: 'multi_select',
      sessionBehavior: 'reset',
      dataField: 'region',
      options: [
        { value: 'North', label: 'North' },
        { value: 'South', label: 'South' },
        { value: 'East', label: 'East' },
        { value: 'West', label: 'West' },
      ],
      createdAt: now,
      updatedAt: now,
    });

    // Bind to artefact
    criteriaEngine.bindings.bind({
      filterDefinitionId: filterDefinitionId('department'),
      artefactId: artId,
      visible: true,
      order: 0,
    });
    criteriaEngine.bindings.bind({
      filterDefinitionId: filterDefinitionId('region'),
      artefactId: artId,
      visible: true,
      order: 1,
    });

    return { engine, criteriaEngine, artId };
  }

  it('creates an adapter that bridges criteria engine to data filtering', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    expect(adapter).toBeDefined();
    expect(typeof adapter.applyFilters).toBe('function');
    expect(typeof adapter.subscribe).toBe('function');
    expect(typeof adapter.setValues).toBe('function');
    expect(typeof adapter.getValues).toBe('function');
    expect(typeof adapter.getCurrentCriteria).toBe('function');
  });

  it('returns all data when no filter values are set', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    const result = adapter.applyFilters(testData);
    expect(result).toHaveLength(5);
  });

  it('filters data when filter values are set', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    adapter.setValues({ department: ['Engineering'] });
    const result = adapter.applyFilters(testData);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.department === 'Engineering')).toBe(true);
  });

  it('notifies subscribers when filter values change', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    const listener = vi.fn();
    adapter.subscribe(listener);

    adapter.setValues({ department: ['Sales'] });
    expect(listener).toHaveBeenCalledTimes(1);
    const criteria = listener.mock.calls[0][0];
    expect(criteria.filters).toHaveLength(2); // both bindings
    expect(criteria.filters.find((f: FilterCriterion) => f.dataField === 'department')?.value).toEqual(['Sales']);
  });

  it('unsubscribe stops notifications', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    const listener = vi.fn();
    const unsub = adapter.subscribe(listener);
    unsub();

    adapter.setValues({ department: ['Sales'] });
    expect(listener).not.toHaveBeenCalled();
  });

  it('getCurrentCriteria returns the latest ArtefactCriteria', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    adapter.setValues({ region: ['North', 'East'] });
    const criteria = adapter.getCurrentCriteria();
    expect(criteria).toBeDefined();
    expect(criteria!.artefactId).toBe(artId);
    expect(criteria!.filters.find(f => f.dataField === 'region')?.value).toEqual(['North', 'East']);
  });

  it('getValues returns current filter values', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    adapter.setValues({ department: ['HR'], region: ['West'] });
    const values = adapter.getValues();
    expect(values.department).toEqual(['HR']);
    expect(values.region).toEqual(['West']);
  });

  it('reset clears all filter values', () => {
    const { criteriaEngine, artId } = setupEngine();
    const adapter = createFilterAdapter(criteriaEngine, artId);
    adapter.setValues({ department: ['Engineering'] });
    adapter.reset();
    const result = adapter.applyFilters(testData);
    expect(result).toHaveLength(5);
    expect(adapter.getValues()).toEqual({});
  });
});

// --- GlobalFilter to CriteriaEngine bridge ---

describe('globalFiltersToCriteriaBindings', () => {
  it('converts GlobalFilter[] to filter definitions + bindings in criteria engine', async () => {
    const { globalFiltersToCriteriaBindings } = await import('../filter-adapter.js');
    const criteriaEngine = createCriteriaEngine();
    const artId = artefactId('dashboard:gf-test');

    const globalFilters = [
      { id: 'gf-dept', label: 'Department', fieldKey: 'department', filterType: 'select' as const },
      { id: 'gf-region', label: 'Region', fieldKey: 'region', filterType: 'multi-select' as const },
      { id: 'gf-search', label: 'Name', fieldKey: 'name', filterType: 'text-search' as const },
    ];

    globalFiltersToCriteriaBindings(criteriaEngine, artId, globalFilters);

    // Definitions should be registered
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-dept'))).toBeDefined();
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-region'))).toBeDefined();
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-search'))).toBeDefined();

    // Bindings should exist
    const bindings = criteriaEngine.bindings.getBindingsForArtefact(artId);
    expect(bindings).toHaveLength(3);

    // Types should be mapped correctly
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-dept'))?.type).toBe('single_select');
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-region'))?.type).toBe('multi_select');
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-search'))?.type).toBe('search');
  });

  it('maps date-range and number-range types correctly', async () => {
    const { globalFiltersToCriteriaBindings } = await import('../filter-adapter.js');
    const criteriaEngine = createCriteriaEngine();
    const artId = artefactId('dashboard:gf-test-2');

    globalFiltersToCriteriaBindings(criteriaEngine, artId, [
      { id: 'gf-date', label: 'Date', fieldKey: 'created', filterType: 'date-range' as const },
      { id: 'gf-score', label: 'Score', fieldKey: 'score', filterType: 'number-range' as const },
    ]);

    expect(criteriaEngine.registry.get(filterDefinitionId('gf-date'))?.type).toBe('date_range');
    expect(criteriaEngine.registry.get(filterDefinitionId('gf-score'))?.type).toBe('numeric_range');
  });
});
