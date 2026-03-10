import { describe, it, expect } from 'vitest';
import type { SelectionFieldDef, SelectionContext } from '@phozart/phz-core';

describe('Selection Bar logic', () => {
  const fields: SelectionFieldDef[] = [
    { id: 'region', label: 'Region', type: 'single_select', options: [
      { value: 'north', label: 'North' },
      { value: 'south', label: 'South' },
    ], allowAll: true },
    { id: 'products', label: 'Products', type: 'chip_group', options: [
      { value: 'a', label: 'Product A' },
      { value: 'b', label: 'Product B' },
    ]},
  ];

  it('identifies active chips from selection context', () => {
    const ctx: SelectionContext = { products: ['a'] };
    const active = (ctx.products as string[]).includes('a');
    expect(active).toBe(true);
  });

  it('toggles chip value', () => {
    const current = ['a'];
    const value = 'b';
    const isActive = current.includes(value);
    const newValue = isActive ? current.filter(v => v !== value) : [...current, value];
    expect(newValue).toEqual(['a', 'b']);
  });

  it('removes chip value', () => {
    const current = ['a', 'b'];
    const value = 'a';
    const newValue = current.filter(v => v !== value);
    expect(newValue).toEqual(['b']);
  });
});
