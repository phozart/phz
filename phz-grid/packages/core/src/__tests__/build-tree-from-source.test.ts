/**
 * @phozart/phz-core — buildTreeFromSource Tests
 */
import { describe, it, expect } from 'vitest';
import { buildTreeFromSource } from '../utils.js';
import type { TreeLevelConfig } from '../types/selection-context.js';

describe('buildTreeFromSource', () => {
  it('builds a 2-level tree (region → country)', () => {
    const rows = [
      { region: 'Europe', country: 'France' },
      { region: 'Europe', country: 'Germany' },
      { region: 'Asia', country: 'Japan' },
      { region: 'Asia', country: 'China' },
    ];
    const levels: TreeLevelConfig[] = [
      { field: 'region' },
      { field: 'country' },
    ];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree).toHaveLength(2);
    expect(tree[0].value).toBe('Asia');
    expect(tree[0].label).toBe('Asia');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].value).toBe('China');
    expect(tree[0].children![1].value).toBe('Japan');
    expect(tree[0].children![0].children).toBeUndefined();

    expect(tree[1].value).toBe('Europe');
    expect(tree[1].children).toHaveLength(2);
    expect(tree[1].children![0].value).toBe('France');
    expect(tree[1].children![1].value).toBe('Germany');
  });

  it('builds a 3-level tree (continent → country → city)', () => {
    const rows = [
      { continent: 'Europe', country: 'France', city: 'Paris' },
      { continent: 'Europe', country: 'France', city: 'Lyon' },
      { continent: 'Europe', country: 'Germany', city: 'Berlin' },
      { continent: 'Asia', country: 'Japan', city: 'Tokyo' },
    ];
    const levels: TreeLevelConfig[] = [
      { field: 'continent' },
      { field: 'country' },
      { field: 'city' },
    ];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree).toHaveLength(2);
    // Asia
    const asia = tree[0];
    expect(asia.value).toBe('Asia');
    expect(asia.children).toHaveLength(1);
    expect(asia.children![0].value).toBe('Japan');
    expect(asia.children![0].children).toHaveLength(1);
    expect(asia.children![0].children![0].value).toBe('Tokyo');
    expect(asia.children![0].children![0].children).toBeUndefined();

    // Europe → France → 2 cities
    const europe = tree[1];
    expect(europe.children).toHaveLength(2);
    const france = europe.children![0];
    expect(france.value).toBe('France');
    expect(france.children).toHaveLength(2);
    expect(france.children![0].value).toBe('Lyon');
    expect(france.children![1].value).toBe('Paris');
  });

  it('applies per-level label templates', () => {
    const rows = [
      { code: 'EU', name: 'Europe', country_code: 'FR', country_name: 'France' },
      { code: 'EU', name: 'Europe', country_code: 'DE', country_name: 'Germany' },
      { code: 'AS', name: 'Asia', country_code: 'JP', country_name: 'Japan' },
    ];
    const levels: TreeLevelConfig[] = [
      { field: 'code', labelTemplate: '{code} - {name}' },
      { field: 'country_code', labelTemplate: '{country_code} - {country_name}' },
    ];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree[0].value).toBe('AS');
    expect(tree[0].label).toBe('AS - Asia');
    expect(tree[1].value).toBe('EU');
    expect(tree[1].label).toBe('EU - Europe');

    expect(tree[1].children![1].value).toBe('FR');
    expect(tree[1].children![1].label).toBe('FR - France');
  });

  it('returns empty array for empty rows', () => {
    const levels: TreeLevelConfig[] = [{ field: 'region' }, { field: 'country' }];
    expect(buildTreeFromSource([], levels)).toEqual([]);
  });

  it('returns empty array for empty levels', () => {
    const rows = [{ region: 'Europe', country: 'France' }];
    expect(buildTreeFromSource(rows, [])).toEqual([]);
  });

  it('deduplicates rows with the same group value', () => {
    const rows = [
      { region: 'Europe', country: 'France' },
      { region: 'Europe', country: 'France' },
      { region: 'Europe', country: 'Germany' },
    ];
    const levels: TreeLevelConfig[] = [
      { field: 'region' },
      { field: 'country' },
    ];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
  });

  it('sorts nodes alphabetically by label', () => {
    const rows = [
      { category: 'Zebra' },
      { category: 'Apple' },
      { category: 'Mango' },
    ];
    const levels: TreeLevelConfig[] = [{ field: 'category' }];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree.map(n => n.value)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('skips rows with null/undefined/empty field values', () => {
    const rows = [
      { region: 'Europe' },
      { region: null },
      { region: undefined },
      { region: '' },
      { region: 'Asia' },
    ];
    const levels: TreeLevelConfig[] = [{ field: 'region' }];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree).toHaveLength(2);
    expect(tree[0].value).toBe('Asia');
    expect(tree[1].value).toBe('Europe');
  });

  it('uses raw value as label when no labelTemplate is provided', () => {
    const rows = [{ region: 'Europe' }];
    const levels: TreeLevelConfig[] = [{ field: 'region' }];

    const tree = buildTreeFromSource(rows, levels);

    expect(tree[0].label).toBe('Europe');
    expect(tree[0].value).toBe('Europe');
  });

  it('leaf nodes have no children property', () => {
    const rows = [
      { region: 'Europe', country: 'France' },
    ];
    const levels: TreeLevelConfig[] = [
      { field: 'region' },
      { field: 'country' },
    ];

    const tree = buildTreeFromSource(rows, levels);
    const leaf = tree[0].children![0];

    expect(leaf.children).toBeUndefined();
  });
});
