/**
 * @phozart/engine — Filter State Management
 *
 * 6-level state resolution chain and StateStorageAdapter for
 * persist/reset session behavior.
 */

import type {
  FilterDefinition, FilterDefinitionId, FilterBinding,
  StateStorageAdapter, StateResolutionInputs, StateResolutionLevel,
} from '@phozart/core';

// --- Resolved Value ---

export interface ResolvedFilterValue {
  value: string | string[] | null;
  level: StateResolutionLevel;
}

// --- State Manager Interface ---

export interface FilterStateManager {
  resolveState(
    filterId: FilterDefinitionId,
    inputs: StateResolutionInputs,
  ): ResolvedFilterValue;
  persistState(
    key: string,
    values: Record<string, string | string[] | null>,
    definitions: FilterDefinition[],
  ): void;
  loadPersistedState(
    key: string,
    definitions: FilterDefinition[],
    bindings?: FilterBinding[],
  ): { reconciled: Record<string, string | string[] | null>; staleKeys: string[] };
}

// --- Factory ---

export function createFilterStateManager(storage?: StateStorageAdapter): FilterStateManager {
  return {
    resolveState(
      filterId: FilterDefinitionId,
      inputs: StateResolutionInputs,
    ): ResolvedFilterValue {
      return resolveFilterValue(filterId, inputs);
    },

    persistState(
      key: string,
      values: Record<string, string | string[] | null>,
      definitions: FilterDefinition[],
    ): void {
      if (!storage) return;

      const toPersist: Record<string, string | string[] | null> = {};
      for (const def of definitions) {
        if (def.sessionBehavior === 'persist' && filterId(def.id) in values) {
          toPersist[def.id] = values[def.id];
        }
      }
      if (Object.keys(toPersist).length > 0) {
        storage.persist(key, toPersist);
      }
    },

    loadPersistedState(
      key: string,
      definitions: FilterDefinition[],
      bindings?: FilterBinding[],
    ): { reconciled: Record<string, string | string[] | null>; staleKeys: string[] } {
      if (!storage) return { reconciled: {}, staleKeys: [] };
      const raw = storage.load(key);
      if (!raw) return { reconciled: {}, staleKeys: [] };
      return reconcilePersistedState(raw, definitions, bindings);
    },
  };
}

function filterId(id: FilterDefinitionId): string {
  return id as string;
}

// --- 6-Level State Resolution ---

export function resolveFilterValue(
  id: FilterDefinitionId,
  inputs: StateResolutionInputs,
): ResolvedFilterValue {
  const key = id as string;

  // Level 1: Rule values (highest priority)
  if (inputs.ruleValues && key in inputs.ruleValues && inputs.ruleValues[key] !== undefined) {
    return { value: inputs.ruleValues[key], level: 'rule' };
  }

  // Level 2: Preset values
  if (inputs.presetValues && key in inputs.presetValues && inputs.presetValues[key] !== undefined) {
    return { value: inputs.presetValues[key], level: 'preset' };
  }

  // Level 3: Persisted values
  if (inputs.persistedValues && key in inputs.persistedValues && inputs.persistedValues[key] !== undefined) {
    return { value: inputs.persistedValues[key], level: 'persisted' };
  }

  // Level 4: Binding defaults
  if (inputs.bindingDefaults && key in inputs.bindingDefaults && inputs.bindingDefaults[key] !== undefined) {
    return { value: inputs.bindingDefaults[key], level: 'binding_default' };
  }

  // Level 5: Definition defaults
  if (inputs.definitionDefaults && key in inputs.definitionDefaults && inputs.definitionDefaults[key] !== undefined) {
    return { value: inputs.definitionDefaults[key], level: 'definition_default' };
  }

  // Level 6: All selected (null = all)
  return { value: null, level: 'all_selected' };
}

// --- Memory Storage Adapter ---

export function createMemoryStorageAdapter(): StateStorageAdapter {
  const store = new Map<string, Record<string, string | string[] | null>>();
  return {
    persist(key: string, state: Record<string, string | string[] | null>): void {
      store.set(key, { ...state });
    },
    load(key: string): Record<string, string | string[] | null> | null {
      const data = store.get(key);
      return data ? { ...data } : null;
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

// --- Stale Reconciliation ---

export function reconcilePersistedState(
  persisted: Record<string, string | string[] | null>,
  definitions: FilterDefinition[],
  bindings?: FilterBinding[],
): { reconciled: Record<string, string | string[] | null>; staleKeys: string[] } {
  const validIds = new Set<string>();
  for (const def of definitions) {
    if (def.sessionBehavior === 'persist') {
      validIds.add(def.id as string);
    }
  }

  // If bindings provided, further restrict to only bound filters
  if (bindings) {
    const boundIds = new Set(bindings.map(b => b.filterDefinitionId as string));
    for (const id of validIds) {
      if (!boundIds.has(id)) validIds.delete(id);
    }
  }

  const reconciled: Record<string, string | string[] | null> = {};
  const staleKeys: string[] = [];

  for (const [key, value] of Object.entries(persisted)) {
    if (validIds.has(key)) {
      reconciled[key] = value;
    } else {
      staleKeys.push(key);
    }
  }

  return { reconciled, staleKeys };
}
