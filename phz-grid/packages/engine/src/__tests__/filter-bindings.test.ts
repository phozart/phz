import { describe, it, expect } from 'vitest';
import { createFilterBindingStore, resolveArtefactFields, migrateCriteriaConfig } from '../criteria/filter-bindings.js';
import { createFilterRegistry } from '../criteria/filter-registry.js';
import type { FilterDefinition, FilterBinding, CriteriaConfig } from '@phozart/core';
import { filterDefinitionId, artefactId } from '@phozart/core';

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

function makeBinding(filterId: string, artId: string, order: number, overrides?: Partial<FilterBinding>): FilterBinding {
  return {
    filterDefinitionId: filterDefinitionId(filterId),
    artefactId: artefactId(artId),
    visible: true,
    order,
    ...overrides,
  };
}

const ART_A = artefactId('report-1');
const ART_B = artefactId('dashboard-1');

describe('FilterBindingStore', () => {
  describe('bind / unbind', () => {
    it('binds a filter to an artefact', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      expect(store.getBindingsForArtefact(ART_A)).toHaveLength(1);
    });

    it('unbinds a filter from an artefact', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      store.unbind(filterDefinitionId('region'), ART_A);
      expect(store.getBindingsForArtefact(ART_A)).toHaveLength(0);
    });

    it('throws on duplicate binding', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      expect(() => store.bind(makeBinding('region', 'report-1', 1))).toThrow('already exists');
    });

    it('throws on unbind of non-existent binding', () => {
      const store = createFilterBindingStore();
      expect(() => store.unbind(filterDefinitionId('x'), ART_A)).toThrow('not found');
    });
  });

  describe('getBindingsForArtefact', () => {
    it('returns bindings sorted by order', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('c', 'report-1', 2));
      store.bind(makeBinding('a', 'report-1', 0));
      store.bind(makeBinding('b', 'report-1', 1));
      const bindings = store.getBindingsForArtefact(ART_A);
      expect(bindings.map(b => b.filterDefinitionId)).toEqual([
        filterDefinitionId('a'),
        filterDefinitionId('b'),
        filterDefinitionId('c'),
      ]);
    });

    it('returns empty array for unknown artefact', () => {
      const store = createFilterBindingStore();
      expect(store.getBindingsForArtefact(artefactId('unknown'))).toHaveLength(0);
    });
  });

  describe('getArtefactsForFilter', () => {
    it('returns artefact ids for a filter', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      store.bind(makeBinding('region', 'dashboard-1', 0));
      const arts = store.getArtefactsForFilter(filterDefinitionId('region'));
      expect(arts).toHaveLength(2);
    });
  });

  describe('updateBinding', () => {
    it('updates label override', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      store.updateBinding(filterDefinitionId('region'), ART_A, { labelOverride: 'Area' });
      expect(store.getBindingsForArtefact(ART_A)[0].labelOverride).toBe('Area');
    });

    it('updates default value override', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      store.updateBinding(filterDefinitionId('region'), ART_A, { defaultValueOverride: ['US'] });
      expect(store.getBindingsForArtefact(ART_A)[0].defaultValueOverride).toEqual(['US']);
    });

    it('throws for unknown binding', () => {
      const store = createFilterBindingStore();
      expect(() => store.updateBinding(filterDefinitionId('x'), ART_A, { visible: false })).toThrow('not found');
    });
  });

  describe('reorderBindings', () => {
    it('reorders bindings for an artefact', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('a', 'report-1', 0));
      store.bind(makeBinding('b', 'report-1', 1));
      store.bind(makeBinding('c', 'report-1', 2));
      store.reorderBindings(ART_A, [filterDefinitionId('c'), filterDefinitionId('a'), filterDefinitionId('b')]);
      const bindings = store.getBindingsForArtefact(ART_A);
      expect(bindings.map(b => b.filterDefinitionId)).toEqual([
        filterDefinitionId('c'),
        filterDefinitionId('a'),
        filterDefinitionId('b'),
      ]);
    });
  });

  describe('hasBindings', () => {
    it('returns true when bindings exist', () => {
      const store = createFilterBindingStore();
      store.bind(makeBinding('region', 'report-1', 0));
      expect(store.hasBindings(filterDefinitionId('region'))).toBe(true);
    });

    it('returns false when no bindings', () => {
      const store = createFilterBindingStore();
      expect(store.hasBindings(filterDefinitionId('region'))).toBe(false);
    });
  });
});

describe('resolveArtefactFields', () => {
  it('merges definition + binding into SelectionFieldDef', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', {
      label: 'Region',
      type: 'multi_select',
      options: [{ value: 'US', label: 'United States' }],
      dataField: 'region_code',
    }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields).toHaveLength(1);
    expect(fields[0].id).toBe('region');
    expect(fields[0].label).toBe('Region');
    expect(fields[0].type).toBe('multi_select');
    expect(fields[0].dataField).toBe('region_code');
  });

  it('applies label override from binding', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { label: 'Region' }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0, { labelOverride: 'Area' }));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields[0].label).toBe('Area');
  });

  it('filters out invisible bindings', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region'));
    registry.register(makeDef('status'));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0, { visible: false }));
    bindingStore.bind(makeBinding('status', 'report-1', 1));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields).toHaveLength(1);
    expect(fields[0].id).toBe('status');
  });

  it('filters out deprecated definitions', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('old', { deprecated: true }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('old', 'report-1', 0));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields).toHaveLength(0);
  });

  it('applies selectionModeOverride from binding', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { selectionMode: 'single' }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0, { selectionModeOverride: 'multiple' }));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields[0].selectionMode).toBe('multiple');
  });

  it('falls back to definition selectionMode when no override', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { selectionMode: 'single' }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields[0].selectionMode).toBe('single');
  });

  it('applies allowNullValueOverride from binding', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { allowNullValue: false }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0, { allowNullValueOverride: true }));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields[0].allowNullValue).toBe(true);
  });

  it('falls back to definition allowNullValue when no override', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('region', { allowNullValue: true }));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('region', 'report-1', 0));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields[0].allowNullValue).toBe(true);
  });

  it('sorts by binding order', () => {
    const registry = createFilterRegistry();
    registry.register(makeDef('a'));
    registry.register(makeDef('b'));
    registry.register(makeDef('c'));
    const bindingStore = createFilterBindingStore();
    bindingStore.bind(makeBinding('c', 'report-1', 0));
    bindingStore.bind(makeBinding('a', 'report-1', 1));
    bindingStore.bind(makeBinding('b', 'report-1', 2));

    const fields = resolveArtefactFields(registry, bindingStore, ART_A);
    expect(fields.map(f => f.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('migrateCriteriaConfig', () => {
  it('round-trips a legacy CriteriaConfig into registry + bindings', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'region', label: 'Region', type: 'multi_select', options: [{ value: 'US', label: 'US' }] },
        { id: 'status', label: 'Status', type: 'chip_group', required: true },
      ],
    };

    const { registry, bindings } = migrateCriteriaConfig(config, ART_A);
    expect(registry.getAll()).toHaveLength(2);
    expect(bindings.getBindingsForArtefact(ART_A)).toHaveLength(2);

    // Resolving back should match original field ids and labels
    const fields = resolveArtefactFields(registry, bindings, ART_A);
    expect(fields.map(f => f.id)).toEqual(['region', 'status']);
    expect(fields[0].label).toBe('Region');
    expect(fields[1].required).toBe(true);
  });
});
