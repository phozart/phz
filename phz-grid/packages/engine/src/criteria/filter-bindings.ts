/**
 * @phozart/engine — Filter Bindings
 *
 * Associates filter definitions to artefacts (reports/dashboards)
 * with per-binding overrides. Includes migration from legacy CriteriaConfig.
 */

import type {
  FilterDefinition, FilterDefinitionId, FilterBinding, ArtefactId,
  SelectionFieldDef, CriteriaConfig, FilterBarFieldConfig,
} from '@phozart/core';
import { filterDefinitionId, artefactId } from '@phozart/core';
import { createFilterRegistry } from './filter-registry.js';
import type { FilterRegistry } from './filter-registry.js';
import { hydrateCriteriaConfig } from './resolve-criteria.js';

// --- Binding Store Interface ---

export interface FilterBindingStore {
  bind(binding: FilterBinding): void;
  unbind(filterDefId: FilterDefinitionId, artId: ArtefactId): void;
  getBindingsForArtefact(artId: ArtefactId): FilterBinding[];
  getArtefactsForFilter(filterDefId: FilterDefinitionId): ArtefactId[];
  updateBinding(filterDefId: FilterDefinitionId, artId: ArtefactId, patch: Partial<Omit<FilterBinding, 'filterDefinitionId' | 'artefactId'>>): void;
  reorderBindings(artId: ArtefactId, orderedIds: FilterDefinitionId[]): void;
  hasBindings(filterDefId: FilterDefinitionId): boolean;
}

// --- Factory ---

export function createFilterBindingStore(): FilterBindingStore {
  const bindings: FilterBinding[] = [];

  function findIndex(filterDefId: FilterDefinitionId, artId: ArtefactId): number {
    return bindings.findIndex(b => b.filterDefinitionId === filterDefId && b.artefactId === artId);
  }

  return {
    bind(binding: FilterBinding): void {
      if (findIndex(binding.filterDefinitionId, binding.artefactId) >= 0) {
        throw new Error(`Binding for filter "${binding.filterDefinitionId}" to artefact "${binding.artefactId}" already exists`);
      }
      bindings.push({ ...binding });
    },

    unbind(filterDefId: FilterDefinitionId, artId: ArtefactId): void {
      const idx = findIndex(filterDefId, artId);
      if (idx < 0) {
        throw new Error(`Binding not found for filter "${filterDefId}" on artefact "${artId}"`);
      }
      bindings.splice(idx, 1);
    },

    getBindingsForArtefact(artId: ArtefactId): FilterBinding[] {
      return bindings
        .filter(b => b.artefactId === artId)
        .sort((a, b) => a.order - b.order)
        .map(b => ({ ...b }));
    },

    getArtefactsForFilter(filterDefId: FilterDefinitionId): ArtefactId[] {
      return [...new Set(bindings.filter(b => b.filterDefinitionId === filterDefId).map(b => b.artefactId))];
    },

    updateBinding(filterDefId: FilterDefinitionId, artId: ArtefactId, patch: Partial<Omit<FilterBinding, 'filterDefinitionId' | 'artefactId'>>): void {
      const idx = findIndex(filterDefId, artId);
      if (idx < 0) {
        throw new Error(`Binding not found for filter "${filterDefId}" on artefact "${artId}"`);
      }
      bindings[idx] = { ...bindings[idx], ...patch, filterDefinitionId: bindings[idx].filterDefinitionId, artefactId: bindings[idx].artefactId };
    },

    reorderBindings(artId: ArtefactId, orderedIds: FilterDefinitionId[]): void {
      for (let i = 0; i < orderedIds.length; i++) {
        const idx = findIndex(orderedIds[i], artId);
        if (idx >= 0) {
          bindings[idx] = { ...bindings[idx], order: i };
        }
      }
    },

    hasBindings(filterDefId: FilterDefinitionId): boolean {
      return bindings.some(b => b.filterDefinitionId === filterDefId);
    },
  };
}

// --- Resolve Artefact Fields ---

export function resolveArtefactFields(
  registry: FilterRegistry,
  bindingStore: FilterBindingStore,
  artId: ArtefactId,
): SelectionFieldDef[] {
  const bindings = bindingStore.getBindingsForArtefact(artId);
  const fields: SelectionFieldDef[] = [];

  for (const binding of bindings) {
    if (!binding.visible) continue;

    const def = registry.get(binding.filterDefinitionId);
    if (!def || def.deprecated) continue;

    const field: SelectionFieldDef = {
      id: def.id as string,
      label: binding.labelOverride ?? def.label,
      type: def.type,
      dataField: binding.dataFieldOverride ?? def.dataField,
      options: def.options,
      treeOptions: def.treeOptions,
      dateRangeConfig: def.dateRangeConfig,
      numericRangeConfig: def.numericRangeConfig,
      searchConfig: def.searchConfig,
      fieldPresenceConfig: def.fieldPresenceConfig,
      defaultValue: binding.defaultValueOverride ?? def.defaultValue,
      required: binding.requiredOverride ?? def.required,
      selectionMode: binding.selectionModeOverride ?? def.selectionMode,
      allowNullValue: binding.allowNullValueOverride ?? def.allowNullValue,
      dependsOn: def.dependsOn?.[0] as string | undefined,
      barConfig: binding.barConfigOverride,
    };

    fields.push(field);
  }

  return fields;
}

// --- Migration Bridge ---

export function migrateCriteriaConfig(
  config: CriteriaConfig,
  artId: ArtefactId,
): { registry: FilterRegistry; bindings: FilterBindingStore } {
  const registry = createFilterRegistry();
  const bindingStore = createFilterBindingStore();
  hydrateCriteriaConfig(registry, bindingStore, config, artId);
  return { registry, bindings: bindingStore };
}
