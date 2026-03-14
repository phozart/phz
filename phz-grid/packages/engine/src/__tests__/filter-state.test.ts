import { describe, it, expect } from 'vitest';
import {
  createFilterStateManager, resolveFilterValue, createMemoryStorageAdapter,
  reconcilePersistedState,
} from '../criteria/filter-state.js';
import type { FilterDefinition, StateResolutionInputs } from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';

function makeDef(id: string, sessionBehavior: 'reset' | 'persist' = 'reset'): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id,
    type: 'single_select',
    sessionBehavior,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as FilterDefinition;
}

const ID = filterDefinitionId('region');

describe('resolveFilterValue', () => {
  it('level 1: rule values win', () => {
    const result = resolveFilterValue(ID, {
      ruleValues: { region: ['US'] },
      presetValues: { region: ['EU'] },
      persistedValues: { region: ['APAC'] },
    });
    expect(result.value).toEqual(['US']);
    expect(result.level).toBe('rule');
  });

  it('level 2: preset values win when no rule', () => {
    const result = resolveFilterValue(ID, {
      presetValues: { region: ['EU'] },
      persistedValues: { region: ['APAC'] },
    });
    expect(result.value).toEqual(['EU']);
    expect(result.level).toBe('preset');
  });

  it('level 3: persisted values win when no rule or preset', () => {
    const result = resolveFilterValue(ID, {
      persistedValues: { region: ['APAC'] },
      bindingDefaults: { region: ['US'] },
    });
    expect(result.value).toEqual(['APAC']);
    expect(result.level).toBe('persisted');
  });

  it('level 4: binding defaults win when no higher levels', () => {
    const result = resolveFilterValue(ID, {
      bindingDefaults: { region: ['US'] },
      definitionDefaults: { region: ['EU'] },
    });
    expect(result.value).toEqual(['US']);
    expect(result.level).toBe('binding_default');
  });

  it('level 5: definition defaults win when no higher levels', () => {
    const result = resolveFilterValue(ID, {
      definitionDefaults: { region: ['EU'] },
    });
    expect(result.value).toEqual(['EU']);
    expect(result.level).toBe('definition_default');
  });

  it('level 6: falls through to all_selected (null)', () => {
    const result = resolveFilterValue(ID, {});
    expect(result.value).toBeNull();
    expect(result.level).toBe('all_selected');
  });

  it('null at each level falls through to next', () => {
    // rule has undefined (not set), preset has undefined — should fall through
    const result = resolveFilterValue(ID, {
      ruleValues: {},
      presetValues: {},
      persistedValues: { region: 'value' },
    });
    expect(result.level).toBe('persisted');
  });

  it('explicit null value is valid (not fall-through)', () => {
    const result = resolveFilterValue(ID, {
      presetValues: { region: null },
    });
    expect(result.value).toBeNull();
    expect(result.level).toBe('preset');
  });
});

describe('createMemoryStorageAdapter', () => {
  it('persist and load round-trip', () => {
    const adapter = createMemoryStorageAdapter();
    adapter.persist('session-1', { region: ['US'] });
    expect(adapter.load('session-1')).toEqual({ region: ['US'] });
  });

  it('load returns null for unknown key', () => {
    const adapter = createMemoryStorageAdapter();
    expect(adapter.load('unknown')).toBeNull();
  });

  it('remove deletes stored data', () => {
    const adapter = createMemoryStorageAdapter();
    adapter.persist('session-1', { region: ['US'] });
    adapter.remove('session-1');
    expect(adapter.load('session-1')).toBeNull();
  });

  it('returns copies (immutable)', () => {
    const adapter = createMemoryStorageAdapter();
    adapter.persist('session-1', { region: ['US'] });
    const loaded = adapter.load('session-1')!;
    loaded.region = ['EU'];
    expect(adapter.load('session-1')!.region).toEqual(['US']);
  });
});

describe('FilterStateManager', () => {
  it('resolveState delegates to resolveFilterValue', () => {
    const mgr = createFilterStateManager();
    const result = mgr.resolveState(ID, { presetValues: { region: 'test' } });
    expect(result.value).toBe('test');
    expect(result.level).toBe('preset');
  });

  it('persistState only persists filters with persist behavior', () => {
    const adapter = createMemoryStorageAdapter();
    const mgr = createFilterStateManager(adapter);
    const defs = [
      makeDef('region', 'persist'),
      makeDef('status', 'reset'),
    ];
    mgr.persistState('key', { region: ['US'], status: ['active'] }, defs);
    const loaded = adapter.load('key');
    expect(loaded).toEqual({ region: ['US'] });
    expect(loaded!.status).toBeUndefined();
  });

  it('persistState does nothing without adapter', () => {
    const mgr = createFilterStateManager();
    // Should not throw
    mgr.persistState('key', { region: ['US'] }, [makeDef('region', 'persist')]);
  });

  it('loadPersistedState reconciles stale keys', () => {
    const adapter = createMemoryStorageAdapter();
    adapter.persist('key', { region: ['US'], deleted_field: ['old'] });
    const mgr = createFilterStateManager(adapter);
    const defs = [makeDef('region', 'persist')];
    const { reconciled, staleKeys } = mgr.loadPersistedState('key', defs);
    expect(reconciled).toEqual({ region: ['US'] });
    expect(staleKeys).toEqual(['deleted_field']);
  });

  it('loadPersistedState returns empty for no adapter', () => {
    const mgr = createFilterStateManager();
    const { reconciled, staleKeys } = mgr.loadPersistedState('key', []);
    expect(reconciled).toEqual({});
    expect(staleKeys).toEqual([]);
  });
});

describe('reconcilePersistedState', () => {
  it('removes unknown keys', () => {
    const defs = [makeDef('region', 'persist')];
    const { reconciled, staleKeys } = reconcilePersistedState(
      { region: ['US'], unknown: ['x'] },
      defs,
    );
    expect(reconciled).toEqual({ region: ['US'] });
    expect(staleKeys).toEqual(['unknown']);
  });

  it('keeps only persist-behavior definitions', () => {
    const defs = [makeDef('region', 'persist'), makeDef('status', 'reset')];
    const { reconciled } = reconcilePersistedState(
      { region: ['US'], status: ['active'] },
      defs,
    );
    expect(reconciled).toEqual({ region: ['US'] });
  });

  it('returns empty for empty input', () => {
    const { reconciled, staleKeys } = reconcilePersistedState({}, []);
    expect(reconciled).toEqual({});
    expect(staleKeys).toEqual([]);
  });
});
