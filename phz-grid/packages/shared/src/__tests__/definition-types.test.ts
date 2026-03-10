import { describe, it, expect } from 'vitest';
import type { GridDefinition } from '../definitions/types/grid-definition.js';
import type { DefinitionDataSource } from '../definitions/types/data-source.js';
import { createDefinitionId } from '../definitions/types/identity.js';

function makeDefinition(overrides?: Partial<GridDefinition>): GridDefinition {
  return {
    id: createDefinitionId('test-id'),
    name: 'Test Grid',
    schemaVersion: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    dataSource: { type: 'local', data: [{ a: 1 }] },
    columns: [{ field: 'a', header: 'A', type: 'number' }],
    ...overrides,
  };
}

describe('GridDefinition types', () => {
  it('creates a valid definition with local data source', () => {
    const def = makeDefinition();
    expect(def.id).toBe('test-id');
    expect(def.name).toBe('Test Grid');
    expect(def.dataSource.type).toBe('local');
  });

  it('supports url data source', () => {
    const ds: DefinitionDataSource = {
      type: 'url',
      url: 'https://api.example.com/data',
      method: 'GET',
    };
    const def = makeDefinition({ dataSource: ds });
    expect(def.dataSource.type).toBe('url');
  });

  it('supports data-product data source', () => {
    const ds: DefinitionDataSource = {
      type: 'data-product',
      dataProductId: 'dp-123',
    };
    const def = makeDefinition({ dataSource: ds });
    expect(def.dataSource.type).toBe('data-product');
  });

  it('supports duckdb-query data source', () => {
    const ds: DefinitionDataSource = {
      type: 'duckdb-query',
      sql: 'SELECT * FROM users',
    };
    const def = makeDefinition({ dataSource: ds });
    expect(def.dataSource.type).toBe('duckdb-query');
  });

  it('supports optional sections', () => {
    const def = makeDefinition({
      defaults: { sort: { field: 'a', direction: 'asc' } },
      behavior: { density: 'compact', editMode: 'dblclick' },
      access: { visibility: 'public' },
      metadata: { custom: 'value' },
    });
    expect(def.defaults?.sort?.field).toBe('a');
    expect(def.behavior?.density).toBe('compact');
    expect(def.access?.visibility).toBe('public');
    expect(def.metadata?.custom).toBe('value');
  });

  it('createDefinitionId generates unique ids', () => {
    const id1 = createDefinitionId();
    const id2 = createDefinitionId();
    expect(id1).not.toBe(id2);
  });

  it('createDefinitionId accepts custom id', () => {
    const id = createDefinitionId('my-custom-id');
    expect(id).toBe('my-custom-id');
  });
});
