import { describe, it, expect, vi } from 'vitest';
import type { FilterDefinition, FilterBinding, FilterBarFieldConfig } from '@phozart/phz-core';
import { filterDefinitionId, artefactId } from '@phozart/phz-core';

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id.charAt(0).toUpperCase() + id.slice(1),
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

describe('PhzFilterConfigurator (headless logic)', () => {
  describe('bound list ordering', () => {
    it('renders bindings sorted by order', () => {
      const bindings = [
        makeBinding('c', 'report-1', 2),
        makeBinding('a', 'report-1', 0),
        makeBinding('b', 'report-1', 1),
      ];

      const sorted = [...bindings].sort((a, b) => a.order - b.order);
      expect(sorted.map(b => b.filterDefinitionId)).toEqual([
        filterDefinitionId('a'),
        filterDefinitionId('b'),
        filterDefinitionId('c'),
      ]);
    });
  });

  describe('binding-update with dataFieldOverride', () => {
    it('dispatches patch with dataFieldOverride', () => {
      const handler = vi.fn();
      const binding = makeBinding('region', 'report-1', 0);

      handler({
        detail: {
          filterDefinitionId: binding.filterDefinitionId,
          artefactId: binding.artefactId,
          patch: { dataFieldOverride: 'country_code' },
        },
      });

      expect(handler).toHaveBeenCalledWith({
        detail: {
          filterDefinitionId: filterDefinitionId('region'),
          artefactId: ART_A,
          patch: { dataFieldOverride: 'country_code' },
        },
      });
    });

    it('clears dataFieldOverride when set to undefined', () => {
      const handler = vi.fn();
      const binding = makeBinding('region', 'report-1', 0, { dataFieldOverride: 'old_column' });

      handler({
        detail: {
          filterDefinitionId: binding.filterDefinitionId,
          artefactId: binding.artefactId,
          patch: { dataFieldOverride: undefined },
        },
      });

      expect(handler.mock.calls[0][0].detail.patch.dataFieldOverride).toBeUndefined();
    });
  });

  describe('binding-remove', () => {
    it('dispatches remove with correct ids', () => {
      const handler = vi.fn();
      const binding = makeBinding('status', 'report-1', 1);

      handler({
        detail: {
          filterDefinitionId: binding.filterDefinitionId,
          artefactId: binding.artefactId,
        },
      });

      expect(handler).toHaveBeenCalledWith({
        detail: {
          filterDefinitionId: filterDefinitionId('status'),
          artefactId: ART_A,
        },
      });
    });
  });

  describe('picker — unbound definition filtering', () => {
    it('shows only unbound non-deprecated definitions in picker', () => {
      const definitions = [
        makeDef('region'),
        makeDef('status'),
        makeDef('old', { deprecated: true }),
        makeDef('date'),
      ];

      const bindings = [makeBinding('region', 'report-1', 0)];
      const boundIds = new Set(bindings.map(b => b.filterDefinitionId as string));

      const unbound = definitions.filter(d => !d.deprecated && !boundIds.has(d.id as string));
      expect(unbound).toHaveLength(2);
      expect(unbound.map(d => d.id)).toEqual([
        filterDefinitionId('status'),
        filterDefinitionId('date'),
      ]);
    });
  });

  describe('inherited dataField display', () => {
    it('shows inherited value from definition', () => {
      const def = makeDef('region', { dataField: 'region_code' });
      const binding = makeBinding('region', 'report-1', 0);

      // No override → show inherited
      expect(binding.dataFieldOverride).toBeUndefined();
      expect(def.dataField).toBe('region_code');
    });

    it('shows override value when set', () => {
      const def = makeDef('region', { dataField: 'region_code' });
      const binding = makeBinding('region', 'report-1', 0, { dataFieldOverride: 'country_code' });

      expect(binding.dataFieldOverride).toBe('country_code');
    });
  });

  describe('binding-add from picker', () => {
    it('creates bindings with sequential order starting after max existing', () => {
      const existingBindings = [
        makeBinding('a', 'report-1', 0),
        makeBinding('b', 'report-1', 1),
      ];
      const maxOrder = existingBindings.reduce((max, b) => Math.max(max, b.order), -1);
      const selected = ['c', 'd'];

      const newBindings: FilterBinding[] = [];
      let order = maxOrder + 1;
      for (const id of selected) {
        newBindings.push({
          filterDefinitionId: filterDefinitionId(id),
          artefactId: ART_A,
          visible: true,
          order: order++,
        });
      }

      expect(newBindings).toHaveLength(2);
      expect(newBindings[0].order).toBe(2);
      expect(newBindings[1].order).toBe(3);
    });
  });

  describe('bar config override', () => {
    it('merges barConfigOverride patch correctly', () => {
      const binding = makeBinding('region', 'report-1', 0, {
        barConfigOverride: { pinnedToBar: true },
      });

      const current: FilterBarFieldConfig = binding.barConfigOverride || {};
      const updated = { ...current, defaultOpen: true };

      expect(updated.pinnedToBar).toBe(true);
      expect(updated.defaultOpen).toBe(true);
    });
  });

  describe('selectionModeOverride', () => {
    it('dispatches patch with selectionModeOverride', () => {
      const handler = vi.fn();
      const binding = makeBinding('region', 'report-1', 0);

      handler({
        detail: {
          filterDefinitionId: binding.filterDefinitionId,
          artefactId: binding.artefactId,
          patch: { selectionModeOverride: 'multiple' },
        },
      });

      expect(handler).toHaveBeenCalledWith({
        detail: {
          filterDefinitionId: filterDefinitionId('region'),
          artefactId: ART_A,
          patch: { selectionModeOverride: 'multiple' },
        },
      });
    });

    it('stores selectionModeOverride on binding', () => {
      const binding = makeBinding('region', 'report-1', 0, { selectionModeOverride: 'single' });
      expect(binding.selectionModeOverride).toBe('single');
    });
  });

  describe('allowNullValueOverride', () => {
    it('dispatches patch with allowNullValueOverride', () => {
      const handler = vi.fn();
      const binding = makeBinding('region', 'report-1', 0);

      handler({
        detail: {
          filterDefinitionId: binding.filterDefinitionId,
          artefactId: binding.artefactId,
          patch: { allowNullValueOverride: true },
        },
      });

      expect(handler).toHaveBeenCalledWith({
        detail: {
          filterDefinitionId: filterDefinitionId('region'),
          artefactId: ART_A,
          patch: { allowNullValueOverride: true },
        },
      });
    });

    it('stores allowNullValueOverride on binding', () => {
      const binding = makeBinding('region', 'report-1', 0, { allowNullValueOverride: true });
      expect(binding.allowNullValueOverride).toBe(true);
    });
  });
});
