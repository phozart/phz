/**
 * @phozart/phz-core — Prototype pollution prevention tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createGrid } from '../create-grid.js';

const sampleData = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

const columns = [
  { field: 'name', header: 'Name' },
  { field: 'age', header: 'Age', type: 'number' as const },
];

describe('prototype pollution prevention', () => {
  afterEach(() => {
    // Clean up any pollution that may have occurred
    delete (Object.prototype as any).isAdmin;
    delete (Object.prototype as any).polluted;
  });

  it('updateRow does not pollute Object.prototype via __proto__', () => {
    const grid = createGrid({ data: sampleData, columns });
    const row = grid.getData()[0];

    grid.updateRow(row.__id, { __proto__: { isAdmin: true } } as any);

    expect((Object.prototype as any).isAdmin).toBeUndefined();
    expect(({} as any).isAdmin).toBeUndefined();
  });

  it('updateRow does not allow constructor key', () => {
    const grid = createGrid({ data: sampleData, columns });
    const row = grid.getData()[0];

    grid.updateRow(row.__id, { constructor: { prototype: { polluted: true } } } as any);

    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  it('updateRow does not allow prototype key', () => {
    const grid = createGrid({ data: sampleData, columns });
    const row = grid.getData()[0];

    grid.updateRow(row.__id, { prototype: { polluted: true } } as any);

    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  it('updateRow still applies safe keys normally', () => {
    const grid = createGrid({ data: sampleData, columns });
    const row = grid.getData()[0];

    grid.updateRow(row.__id, { name: 'Updated', age: 99 });

    expect(grid.getData()[0].name).toBe('Updated');
    expect(grid.getData()[0].age).toBe(99);
  });
});
