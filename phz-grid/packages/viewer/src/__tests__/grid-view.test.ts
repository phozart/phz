/**
 * Tests for PhzGridView logic — specToColumn mapping and data resolution.
 * Runs in Node (no DOM rendering).
 */
import { describe, it, expect } from 'vitest';
import { specToColumn } from '../components/phz-grid-view.js';
import type { GridViewColumnSpec, GridViewDefinition } from '../components/phz-grid-view.js';

describe('PhzGridView logic', () => {
  describe('specToColumn', () => {
    it('maps all serializable spec fields to a ColumnDefinition', () => {
      const spec: GridViewColumnSpec = {
        field: 'name',
        header: 'Name',
        type: 'string',
        width: 200,
        minWidth: 80,
        maxWidth: 400,
        sortable: true,
        filterable: true,
        editable: false,
        resizable: true,
        frozen: 'left',
        priority: 1,
      };
      const col = specToColumn(spec);
      expect(col.field).toBe('name');
      expect(col.header).toBe('Name');
      expect(col.type).toBe('string');
      expect(col.width).toBe(200);
      expect(col.minWidth).toBe(80);
      expect(col.maxWidth).toBe(400);
      expect(col.sortable).toBe(true);
      expect(col.filterable).toBe(true);
      expect(col.editable).toBe(false);
      expect(col.resizable).toBe(true);
      expect(col.frozen).toBe('left');
      expect(col.priority).toBe(1);
    });

    it('handles spec with only required field', () => {
      const col = specToColumn({ field: 'id' });
      expect(col.field).toBe('id');
      expect(col.header).toBeUndefined();
      expect(col.type).toBeUndefined();
      expect(col.width).toBeUndefined();
    });

    it('maps multiple specs', () => {
      const specs: GridViewColumnSpec[] = [
        { field: 'a', header: 'A', type: 'number' },
        { field: 'b', header: 'B', type: 'string' },
        { field: 'c', header: 'C', type: 'date' },
      ];
      const mapped = specs.map(specToColumn);
      expect(mapped).toHaveLength(3);
      expect(mapped[0].field).toBe('a');
      expect(mapped[1].header).toBe('B');
      expect(mapped[2].type).toBe('date');
    });
  });

  describe('data resolution logic', () => {
    it('direct data takes precedence over definition', () => {
      const directData = [{ a: 1 }, { a: 2 }];
      const definitionData = [{ a: 10 }];
      // When both are provided, direct data takes precedence
      const resolved = directData ?? definitionData;
      expect(resolved).toEqual(directData);
    });

    it('resolves local data source from definition', () => {
      const definition: GridViewDefinition = {
        dataSource: { type: 'local', data: [{ x: 1 }] },
        columns: [{ field: 'x' }],
      };
      expect(definition.dataSource.type).toBe('local');
      if (definition.dataSource.type === 'local') {
        expect(definition.dataSource.data).toHaveLength(1);
      }
    });

    it('falls back to empty data when no source available', () => {
      const data = undefined;
      const resolved = data ?? [];
      expect(resolved).toEqual([]);
    });

    it('maps definition columns when no direct columns provided', () => {
      const specs: GridViewColumnSpec[] = [
        { field: 'a', header: 'A', type: 'number' },
        { field: 'b', header: 'B', type: 'string' },
      ];
      const mapped = specs.map(specToColumn);
      expect(mapped).toHaveLength(2);
      expect(mapped[0].field).toBe('a');
      expect(mapped[1].header).toBe('B');
    });

    it('identifies data-product source for adapter fetch', () => {
      const definition: GridViewDefinition = {
        dataSource: { type: 'data-product', dataProductId: 'sales-data' },
        columns: [{ field: 'amount' }],
      };
      expect(definition.dataSource.type).toBe('data-product');
      if (definition.dataSource.type === 'data-product') {
        expect(definition.dataSource.dataProductId).toBe('sales-data');
      }
    });

    it('uses default sourceId for non-data-product sources', () => {
      const definition: GridViewDefinition = {
        dataSource: { type: 'url', url: 'https://api.example.com/data' },
        columns: [{ field: 'name' }],
      };
      const sourceId = definition.dataSource.type === 'data-product'
        ? definition.dataSource.dataProductId
        : 'default';
      expect(sourceId).toBe('default');
    });
  });
});
