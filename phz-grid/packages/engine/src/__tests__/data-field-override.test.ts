import { describe, it, expect } from 'vitest';
import { createFilterBindingStore, resolveArtefactFields } from '../criteria/filter-bindings.js';
import { createCriteriaOutputManager } from '../criteria/criteria-output.js';
import { createFilterRegistry } from '../criteria/filter-registry.js';
import type { FilterDefinition, FilterBinding } from '@phozart/core';
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

describe('dataFieldOverride', () => {
  describe('resolveArtefactFields', () => {
    it('uses dataFieldOverride from binding when set', () => {
      const registry = createFilterRegistry();
      registry.register(makeDef('region', { dataField: 'region_code' }));

      const bindingStore = createFilterBindingStore();
      bindingStore.bind(makeBinding('region', 'report-1', 0, {
        dataFieldOverride: 'country_code',
      }));

      const fields = resolveArtefactFields(registry, bindingStore, ART_A);
      expect(fields).toHaveLength(1);
      expect(fields[0].dataField).toBe('country_code');
    });

    it('falls back to definition dataField when no override', () => {
      const registry = createFilterRegistry();
      registry.register(makeDef('region', { dataField: 'region_code' }));

      const bindingStore = createFilterBindingStore();
      bindingStore.bind(makeBinding('region', 'report-1', 0));

      const fields = resolveArtefactFields(registry, bindingStore, ART_A);
      expect(fields[0].dataField).toBe('region_code');
    });

    it('handles undefined dataField on both definition and binding', () => {
      const registry = createFilterRegistry();
      registry.register(makeDef('status'));

      const bindingStore = createFilterBindingStore();
      bindingStore.bind(makeBinding('status', 'report-1', 0));

      const fields = resolveArtefactFields(registry, bindingStore, ART_A);
      expect(fields[0].dataField).toBeUndefined();
    });
  });

  describe('buildCriteria', () => {
    it('includes dataFieldOverride in FilterCriterion', () => {
      const registry = createFilterRegistry();
      registry.register(makeDef('region', { dataField: 'region_code' }));

      const bindingStore = createFilterBindingStore();
      bindingStore.bind(makeBinding('region', 'report-1', 0, {
        dataFieldOverride: 'country_code',
      }));

      const outputManager = createCriteriaOutputManager(registry, bindingStore);
      const criteria = outputManager.buildCriteria(
        ART_A,
        { region: 'US' },
        { region: 'definition_default' },
        {},
      );

      expect(criteria.filters).toHaveLength(1);
      expect(criteria.filters[0].dataField).toBe('country_code');
    });

    it('falls back to definition dataField in criteria output when no override', () => {
      const registry = createFilterRegistry();
      registry.register(makeDef('region', { dataField: 'region_code' }));

      const bindingStore = createFilterBindingStore();
      bindingStore.bind(makeBinding('region', 'report-1', 0));

      const outputManager = createCriteriaOutputManager(registry, bindingStore);
      const criteria = outputManager.buildCriteria(
        ART_A,
        { region: 'US' },
        { region: 'definition_default' },
        {},
      );

      expect(criteria.filters[0].dataField).toBe('region_code');
    });
  });
});
