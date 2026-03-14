import { describe, it, expect } from 'vitest';
import { createFilterRegistry, detectDependencyCycles, topologicalSortFilters } from '../criteria/filter-registry.js';
import type { FilterDefinition, FilterDefinitionId } from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';

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

describe('FilterRegistry', () => {
  describe('CRUD lifecycle', () => {
    it('registers and retrieves a definition', () => {
      const reg = createFilterRegistry();
      const def = makeDef('region');
      reg.register(def);
      expect(reg.get(filterDefinitionId('region'))).toEqual(def);
    });

    it('getAll returns all registered definitions', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('a'));
      reg.register(makeDef('b'));
      reg.register(makeDef('c'));
      expect(reg.getAll()).toHaveLength(3);
    });

    it('get returns undefined for unknown id', () => {
      const reg = createFilterRegistry();
      expect(reg.get(filterDefinitionId('unknown'))).toBeUndefined();
    });

    it('update modifies existing definition', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('region', { label: 'Region' }));
      reg.update(filterDefinitionId('region'), { label: 'Area' });
      expect(reg.get(filterDefinitionId('region'))!.label).toBe('Area');
    });

    it('update preserves id and createdAt', () => {
      const reg = createFilterRegistry();
      const def = makeDef('region', { createdAt: 1000 });
      reg.register(def);
      reg.update(filterDefinitionId('region'), { label: 'New Label' });
      const updated = reg.get(filterDefinitionId('region'))!;
      expect(updated.id).toBe('region');
      expect(updated.createdAt).toBe(1000);
    });

    it('update sets updatedAt', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('region', { updatedAt: 1000 }));
      reg.update(filterDefinitionId('region'), { label: 'New' });
      expect(reg.get(filterDefinitionId('region'))!.updatedAt).toBeGreaterThan(1000);
    });

    it('deprecate sets deprecated flag', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('old'));
      reg.deprecate(filterDefinitionId('old'));
      expect(reg.get(filterDefinitionId('old'))!.deprecated).toBe(true);
    });

    it('remove deletes the definition', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('temp'));
      reg.remove(filterDefinitionId('temp'));
      expect(reg.get(filterDefinitionId('temp'))).toBeUndefined();
      expect(reg.getAll()).toHaveLength(0);
    });
  });

  describe('duplicate rejection', () => {
    it('throws on duplicate register', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('dup'));
      expect(() => reg.register(makeDef('dup'))).toThrow('already registered');
    });
  });

  describe('error handling', () => {
    it('update throws for unknown id', () => {
      const reg = createFilterRegistry();
      expect(() => reg.update(filterDefinitionId('missing'), { label: 'x' })).toThrow('not found');
    });

    it('deprecate throws for unknown id', () => {
      const reg = createFilterRegistry();
      expect(() => reg.deprecate(filterDefinitionId('missing'))).toThrow('not found');
    });

    it('remove throws for unknown id', () => {
      const reg = createFilterRegistry();
      expect(() => reg.remove(filterDefinitionId('missing'))).toThrow('not found');
    });
  });

  describe('validateDependencyGraph', () => {
    it('returns empty array when no cycles', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('a'));
      reg.register(makeDef('b', { dependsOn: [filterDefinitionId('a')] }));
      expect(reg.validateDependencyGraph()).toHaveLength(0);
    });

    it('detects direct A↔B cycle', () => {
      const reg = createFilterRegistry();
      reg.register(makeDef('a', { dependsOn: [filterDefinitionId('b')] }));
      reg.register(makeDef('b', { dependsOn: [filterDefinitionId('a')] }));
      const cycles = reg.validateDependencyGraph();
      expect(cycles.length).toBeGreaterThan(0);
    });
  });
});

describe('detectDependencyCycles', () => {
  it('returns empty for no dependencies', () => {
    const defs = [makeDef('a'), makeDef('b'), makeDef('c')];
    expect(detectDependencyCycles(defs)).toHaveLength(0);
  });

  it('returns empty for a valid chain', () => {
    const defs = [
      makeDef('a'),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('c', { dependsOn: [filterDefinitionId('b')] }),
    ];
    expect(detectDependencyCycles(defs)).toHaveLength(0);
  });

  it('detects direct A↔B cycle', () => {
    const defs = [
      makeDef('a', { dependsOn: [filterDefinitionId('b')] }),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
    ];
    const cycles = detectDependencyCycles(defs);
    expect(cycles.length).toBeGreaterThan(0);
    // At least one cycle should contain both a and b
    const hasAB = cycles.some(c => c.includes(filterDefinitionId('a')) && c.includes(filterDefinitionId('b')));
    expect(hasAB).toBe(true);
  });

  it('detects indirect A→B→C→A cycle', () => {
    const defs = [
      makeDef('a', { dependsOn: [filterDefinitionId('c')] }),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('c', { dependsOn: [filterDefinitionId('b')] }),
    ];
    const cycles = detectDependencyCycles(defs);
    expect(cycles.length).toBeGreaterThan(0);
  });
});

describe('topologicalSortFilters', () => {
  it('handles no dependencies — preserves all items', () => {
    const defs = [makeDef('c'), makeDef('a'), makeDef('b')];
    const sorted = topologicalSortFilters(defs);
    expect(sorted).toHaveLength(3);
  });

  it('sorts a chain correctly', () => {
    const defs = [
      makeDef('c', { dependsOn: [filterDefinitionId('b')] }),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('a'),
    ];
    const sorted = topologicalSortFilters(defs);
    const ids = sorted.map(d => d.id);
    expect(ids.indexOf(filterDefinitionId('a'))).toBeLessThan(ids.indexOf(filterDefinitionId('b')));
    expect(ids.indexOf(filterDefinitionId('b'))).toBeLessThan(ids.indexOf(filterDefinitionId('c')));
  });

  it('handles diamond dependency', () => {
    // a → b, a → c, b → d, c → d
    const defs = [
      makeDef('d', { dependsOn: [filterDefinitionId('b'), filterDefinitionId('c')] }),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('c', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('a'),
    ];
    const sorted = topologicalSortFilters(defs);
    const ids = sorted.map(d => d.id);
    expect(ids.indexOf(filterDefinitionId('a'))).toBeLessThan(ids.indexOf(filterDefinitionId('b')));
    expect(ids.indexOf(filterDefinitionId('a'))).toBeLessThan(ids.indexOf(filterDefinitionId('c')));
    expect(ids.indexOf(filterDefinitionId('b'))).toBeLessThan(ids.indexOf(filterDefinitionId('d')));
    expect(ids.indexOf(filterDefinitionId('c'))).toBeLessThan(ids.indexOf(filterDefinitionId('d')));
  });

  it('returns partial result for cyclic graph', () => {
    const defs = [
      makeDef('a', { dependsOn: [filterDefinitionId('b')] }),
      makeDef('b', { dependsOn: [filterDefinitionId('a')] }),
      makeDef('c'),
    ];
    const sorted = topologicalSortFilters(defs);
    // c has no cycle, should appear. a and b are in a cycle.
    expect(sorted.length).toBeLessThan(3);
    expect(sorted.some(d => d.id === filterDefinitionId('c'))).toBe(true);
  });

  it('returns snapshot copies (immutable)', () => {
    const reg = createFilterRegistry();
    const def = makeDef('x');
    reg.register(def);
    const got = reg.get(filterDefinitionId('x'))!;
    got.label = 'mutated';
    expect(reg.get(filterDefinitionId('x'))!.label).toBe('x');
  });
});
