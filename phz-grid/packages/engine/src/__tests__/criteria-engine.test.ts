import { describe, it, expect, vi } from 'vitest';
import { createCriteriaEngine, migrateFromCriteriaConfig } from '../criteria/criteria-engine.js';
import { createMemoryStorageAdapter } from '../criteria/filter-state.js';
import type { FilterDefinition, FilterBinding, CriteriaConfig, ArtefactCriteria } from '@phozart/core';
import { filterDefinitionId, artefactId } from '@phozart/core';

const ART_A = artefactId('report-1');

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id,
    type: 'single_select',
    sessionBehavior: 'reset',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as FilterDefinition;
}

function makeBinding(filterId: string, order: number, overrides?: Partial<FilterBinding>): FilterBinding {
  return {
    filterDefinitionId: filterDefinitionId(filterId),
    artefactId: ART_A,
    visible: true,
    order,
    ...overrides,
  };
}

describe('CriteriaEngine', () => {
  describe('createCriteriaEngine', () => {
    it('creates engine with all sub-systems', () => {
      const engine = createCriteriaEngine();
      expect(engine.registry).toBeDefined();
      expect(engine.bindings).toBeDefined();
      expect(engine.stateManager).toBeDefined();
      expect(engine.ruleEngine).toBeDefined();
      expect(engine.output).toBeDefined();
      expect(engine.admin).toBeDefined();
    });
  });

  describe('full round-trip', () => {
    it('register → bind → resolve → output', () => {
      const engine = createCriteriaEngine();

      // Register definitions
      engine.registry.register(makeDef('region', {
        type: 'multi_select',
        options: [{ value: 'US', label: 'US' }, { value: 'UK', label: 'UK' }],
        dataField: 'region_code',
        required: true,
      }));
      engine.registry.register(makeDef('status', {
        type: 'chip_group',
        options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
        dataField: 'status',
      }));

      // Bind to artefact
      engine.bindings.bind(makeBinding('region', 0));
      engine.bindings.bind(makeBinding('status', 1));

      // Resolve fields
      const fields = engine.resolveFields(ART_A);
      expect(fields).toHaveLength(2);
      expect(fields[0].id).toBe('region');
      expect(fields[0].type).toBe('multi_select');
      expect(fields[1].id).toBe('status');

      // Build criteria
      const criteria = engine.buildCriteria(ART_A, {
        region: ['US'],
        status: ['active'],
      });

      expect(criteria.artefactId).toBe('report-1');
      expect(criteria.filters).toHaveLength(2);
      expect(criteria.isComplete).toBe(true);
      expect(criteria.filters[0].operator).toBe('in');
      expect(criteria.filters[0].value).toEqual(['US']);
      expect(criteria.filters[0].dataField).toBe('region_code');
    });
  });

  describe('rules applied to output', () => {
    it('marks isRuleApplied when rules exist', () => {
      const engine = createCriteriaEngine();

      engine.registry.register(makeDef('region', {
        type: 'multi_select',
        options: [{ value: 'US', label: 'US' }, { value: 'UK', label: 'UK' }],
      }));
      engine.bindings.bind(makeBinding('region', 0));

      // Add a rule
      engine.ruleEngine.addRule({
        id: 'r1',
        filterDefinitionId: filterDefinitionId('region'),
        type: 'value_set',
        priority: 0,
        enabled: true,
        config: { type: 'value_set', mode: 'include', values: ['US'] },
        createdAt: Date.now(),
      });

      const criteria = engine.buildCriteria(ART_A, { region: ['US'] });
      expect(criteria.filters[0].isRuleApplied).toBe(true);
      expect(criteria.filters[0].activeRuleIds).toEqual(['r1']);
    });
  });

  describe('subscription', () => {
    it('subscriber receives emitted criteria', () => {
      const engine = createCriteriaEngine();
      engine.registry.register(makeDef('region'));
      engine.bindings.bind(makeBinding('region', 0));

      const received: ArtefactCriteria[] = [];
      engine.subscribe(c => received.push(c));

      const criteria = engine.buildCriteria(ART_A, { region: 'US' });
      engine.output.emit(criteria);

      expect(received).toHaveLength(1);
    });

    it('debouncing coalesces rapid emissions', async () => {
      const engine = createCriteriaEngine({ debounceMs: 50 });
      engine.registry.register(makeDef('region'));
      engine.bindings.bind(makeBinding('region', 0));

      const received: ArtefactCriteria[] = [];
      engine.subscribe(c => received.push(c));

      engine.output.emit(engine.buildCriteria(ART_A, { region: 'US' }));
      engine.output.emit(engine.buildCriteria(ART_A, { region: 'UK' }));
      engine.output.emit(engine.buildCriteria(ART_A, { region: 'DE' }));

      await new Promise(r => setTimeout(r, 100));
      expect(received).toHaveLength(1);
    });
  });

  describe('state persistence', () => {
    it('persist and load round-trip', () => {
      const storage = createMemoryStorageAdapter();
      const engine = createCriteriaEngine({ storage });

      engine.registry.register(makeDef('region', { sessionBehavior: 'persist' }));
      engine.registry.register(makeDef('status', { sessionBehavior: 'reset' }));

      const defs = engine.registry.getAll();
      engine.stateManager.persistState('session-1', {
        region: ['US'],
        status: ['active'],
      }, defs);

      const { reconciled, staleKeys } = engine.stateManager.loadPersistedState('session-1', defs);
      expect(reconciled).toEqual({ region: ['US'] });
      expect(staleKeys).toEqual([]);
    });
  });

  describe('clear = null semantics', () => {
    it('null value means all selected', () => {
      const engine = createCriteriaEngine();
      engine.registry.register(makeDef('region', { type: 'multi_select' }));
      engine.bindings.bind(makeBinding('region', 0));

      const criteria = engine.buildCriteria(ART_A, { region: null });
      expect(criteria.filters[0].value).toBeNull();
      expect(criteria.filters[0].operator).toBe('in');
    });
  });
});

describe('migrateFromCriteriaConfig', () => {
  it('converts legacy config to full engine', () => {
    const config: CriteriaConfig = {
      fields: [
        {
          id: 'region',
          label: 'Region',
          type: 'multi_select',
          options: [{ value: 'US', label: 'US' }, { value: 'UK', label: 'UK' }],
          dataField: 'region_code',
          required: true,
        },
        {
          id: 'status',
          label: 'Status',
          type: 'chip_group',
          options: [{ value: 'active', label: 'Active' }],
        },
      ],
    };

    const engine = migrateFromCriteriaConfig(config, ART_A);

    // Registry has definitions
    expect(engine.registry.getAll()).toHaveLength(2);

    // Bindings exist
    const bindings = engine.bindings.getBindingsForArtefact(ART_A);
    expect(bindings).toHaveLength(2);

    // Resolved fields match original
    const fields = engine.resolveFields(ART_A);
    expect(fields.map(f => f.id)).toEqual(['region', 'status']);
    expect(fields[0].label).toBe('Region');
    expect(fields[0].type).toBe('multi_select');
    expect(fields[1].label).toBe('Status');
  });

  it('migrated engine produces valid criteria output', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'dept', label: 'Department', type: 'single_select', required: true },
      ],
    };

    const engine = migrateFromCriteriaConfig(config, ART_A);
    const criteria = engine.buildCriteria(ART_A, { dept: 'engineering' });

    expect(criteria.filters).toHaveLength(1);
    expect(criteria.filters[0].operator).toBe('equals');
    expect(criteria.filters[0].value).toBe('engineering');
    expect(criteria.isComplete).toBe(true);
  });

  it('backward compat: legacy mode unchanged', () => {
    const config: CriteriaConfig = {
      fields: [
        {
          id: 'search',
          label: 'Search',
          type: 'search',
          searchConfig: { minChars: 3, debounceMs: 300 },
        },
      ],
    };

    const engine = migrateFromCriteriaConfig(config, ART_A);
    const def = engine.registry.get(filterDefinitionId('search'));
    expect(def).toBeDefined();
    expect(def!.searchConfig?.minChars).toBe(3);
  });
});
