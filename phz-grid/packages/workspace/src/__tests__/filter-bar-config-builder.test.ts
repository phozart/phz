/**
 * Filter Bar Config Builder (L.9) — Tests
 */
import { describe, it, expect } from 'vitest';
import { buildFilterBarConfig } from '../filters/filter-bar-config-builder.js';
import type { FieldMetadata } from '../data-adapter.js';

function field(name: string, dataType: FieldMetadata['dataType'], cardinality?: FieldMetadata['cardinality']): FieldMetadata {
  return { name, dataType, nullable: false, cardinality };
}

describe('Filter Bar Config Builder (L.9)', () => {
  it('returns empty config for no fields', () => {
    const config = buildFilterBarConfig([]);
    expect(config.filters).toEqual([]);
    expect(config.dependencies).toEqual([]);
  });

  it('maps string+low cardinality to chip-select', () => {
    const config = buildFilterBarConfig([field('status', 'string', 'low')]);
    expect(config.filters[0].filterType).toBe('chip-select');
  });

  it('maps string+medium cardinality to multi-select', () => {
    const config = buildFilterBarConfig([field('city', 'string', 'medium')]);
    expect(config.filters[0].filterType).toBe('multi-select');
  });

  it('maps string+high cardinality to search', () => {
    const config = buildFilterBarConfig([field('email', 'string', 'high')]);
    expect(config.filters[0].filterType).toBe('search');
  });

  it('maps string with no cardinality to multi-select (default)', () => {
    const config = buildFilterBarConfig([field('name', 'string')]);
    expect(config.filters[0].filterType).toBe('multi-select');
  });

  it('maps number to numeric-range', () => {
    const config = buildFilterBarConfig([field('price', 'number')]);
    expect(config.filters[0].filterType).toBe('numeric-range');
  });

  it('maps date to date-range', () => {
    const config = buildFilterBarConfig([field('createdAt', 'date')]);
    expect(config.filters[0].filterType).toBe('date-range');
  });

  it('maps boolean to boolean-toggle', () => {
    const config = buildFilterBarConfig([field('active', 'boolean')]);
    expect(config.filters[0].filterType).toBe('boolean-toggle');
  });

  it('builds filters for mixed field types', () => {
    const fields = [
      field('status', 'string', 'low'),
      field('amount', 'number'),
      field('date', 'date'),
      field('active', 'boolean'),
    ];
    const config = buildFilterBarConfig(fields);
    expect(config.filters).toHaveLength(4);
    expect(config.filters.map(f => f.filterType)).toEqual([
      'chip-select', 'numeric-range', 'date-range', 'boolean-toggle',
    ]);
  });

  it('sets sensible defaults on the config', () => {
    const config = buildFilterBarConfig([field('x', 'string', 'low')]);
    expect(config.position).toBe('top');
    expect(config.collapsible).toBe(true);
    expect(config.defaultCollapsed).toBe(false);
    expect(config.showActiveFilterCount).toBe(true);
    expect(config.showPresetPicker).toBe(false);
  });

  it('allows overriding config-level options', () => {
    const config = buildFilterBarConfig(
      [field('x', 'string', 'low')],
      { position: 'left', collapsible: false },
    );
    expect(config.position).toBe('left');
    expect(config.collapsible).toBe(false);
  });

  it('generates unique filter IDs', () => {
    const fields = [field('a', 'string', 'low'), field('b', 'number')];
    const config = buildFilterBarConfig(fields);
    const ids = config.filters.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sets field and label on each filter def', () => {
    const config = buildFilterBarConfig([field('orderDate', 'date')]);
    expect(config.filters[0].field).toBe('orderDate');
    expect(config.filters[0].label).toBe('orderDate');
  });
});
