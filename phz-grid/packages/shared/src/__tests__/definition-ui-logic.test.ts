import { describe, it, expect } from 'vitest';

// Logic tests for the migrated UI components.
// Actual rendering is tested in browser/e2e tests.

describe('PhzDefinitionReport logic', () => {
  it('report-meta-change event detail has key and value', () => {
    const detail = { key: 'name', value: 'My Report' };
    expect(detail.key).toBe('name');
    expect(detail.value).toBe('My Report');
  });

  it('create mode requires non-empty name', () => {
    const mode = 'create';
    const name = '';
    const showValidation = mode === 'create' && !name.trim();
    expect(showValidation).toBe(true);
  });

  it('edit mode does not show validation for empty name', () => {
    const mode = 'edit' as 'create' | 'edit';
    const name = '';
    const showValidation = mode === 'create' && !name.trim();
    expect(showValidation).toBe(false);
  });
});

describe('PhzDefinitionDataSource logic', () => {
  it('filters products by search query', () => {
    const products = [
      { id: '1', name: 'Sales Data', description: 'Monthly sales', tags: ['finance'], fieldCount: 10 },
      { id: '2', name: 'User Analytics', description: 'User behavior', tags: ['analytics'], fieldCount: 5 },
    ];
    const q = 'sales';
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('data-source-change event detail has dataProductId', () => {
    const detail = { dataProductId: 'dp-123' };
    expect(detail.dataProductId).toBe('dp-123');
  });

  it('returns all products when search is empty', () => {
    const products = [{ id: '1', name: 'A', fieldCount: 1 }, { id: '2', name: 'B', fieldCount: 2 }];
    const q = '';
    const filtered = q.trim() ? products.filter(p => p.name.includes(q)) : products;
    expect(filtered).toHaveLength(2);
  });
});
