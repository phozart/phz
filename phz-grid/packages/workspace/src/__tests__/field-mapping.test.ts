import { describe, it, expect } from 'vitest';
import type { FieldMapping, FieldMappingSchema } from '../types.js';
import { resolveFieldForSource, autoSuggestMappings } from '../types.js';

describe('FieldMapping', () => {
  describe('resolveFieldForSource', () => {
    const mappings: FieldMapping[] = [
      {
        canonicalField: 'revenue',
        sources: [
          { dataSourceId: 'ds-1', field: 'total_revenue' },
          { dataSourceId: 'ds-2', field: 'rev' },
        ],
      },
      {
        canonicalField: 'region',
        sources: [
          { dataSourceId: 'ds-1', field: 'sales_region' },
        ],
      },
    ];

    it('resolves a mapped field', () => {
      expect(resolveFieldForSource('revenue', 'ds-1', mappings)).toBe('total_revenue');
    });

    it('resolves from a different data source', () => {
      expect(resolveFieldForSource('revenue', 'ds-2', mappings)).toBe('rev');
    });

    it('returns canonical field as passthrough when no mapping exists', () => {
      expect(resolveFieldForSource('revenue', 'ds-unknown', mappings)).toBe('revenue');
    });

    it('returns canonical field when not in mappings at all', () => {
      expect(resolveFieldForSource('nonexistent', 'ds-1', mappings)).toBe('nonexistent');
    });

    it('handles empty mappings array', () => {
      expect(resolveFieldForSource('revenue', 'ds-1', [])).toBe('revenue');
    });
  });

  describe('autoSuggestMappings', () => {
    it('suggests mappings for fields with identical names', () => {
      const schemas: FieldMappingSchema[] = [
        { dataSourceId: 'ds-1', fields: [{ name: 'revenue', dataType: 'number' }, { name: 'region', dataType: 'string' }] },
        { dataSourceId: 'ds-2', fields: [{ name: 'revenue', dataType: 'number' }, { name: 'country', dataType: 'string' }] },
      ];
      const result = autoSuggestMappings(schemas);
      const revenueMapping = result.find(m => m.canonicalField === 'revenue');
      expect(revenueMapping).toBeDefined();
      expect(revenueMapping!.sources).toHaveLength(2);
      expect(revenueMapping!.sources).toContainEqual({ dataSourceId: 'ds-1', field: 'revenue' });
      expect(revenueMapping!.sources).toContainEqual({ dataSourceId: 'ds-2', field: 'revenue' });
    });

    it('does not suggest mappings for fields only in one source', () => {
      const schemas: FieldMappingSchema[] = [
        { dataSourceId: 'ds-1', fields: [{ name: 'revenue', dataType: 'number' }] },
        { dataSourceId: 'ds-2', fields: [{ name: 'cost', dataType: 'number' }] },
      ];
      const result = autoSuggestMappings(schemas);
      expect(result).toHaveLength(0);
    });

    it('handles empty schemas array', () => {
      expect(autoSuggestMappings([])).toEqual([]);
    });

    it('handles single schema (no cross-source mapping possible)', () => {
      const schemas: FieldMappingSchema[] = [
        { dataSourceId: 'ds-1', fields: [{ name: 'revenue', dataType: 'number' }] },
      ];
      expect(autoSuggestMappings(schemas)).toEqual([]);
    });

    it('only suggests mappings when data types match', () => {
      const schemas: FieldMappingSchema[] = [
        { dataSourceId: 'ds-1', fields: [{ name: 'value', dataType: 'number' }] },
        { dataSourceId: 'ds-2', fields: [{ name: 'value', dataType: 'string' }] },
      ];
      const result = autoSuggestMappings(schemas);
      expect(result).toHaveLength(0);
    });

    it('maps across three data sources', () => {
      const schemas: FieldMappingSchema[] = [
        { dataSourceId: 'ds-1', fields: [{ name: 'amount', dataType: 'number' }] },
        { dataSourceId: 'ds-2', fields: [{ name: 'amount', dataType: 'number' }] },
        { dataSourceId: 'ds-3', fields: [{ name: 'amount', dataType: 'number' }] },
      ];
      const result = autoSuggestMappings(schemas);
      const amountMapping = result.find(m => m.canonicalField === 'amount');
      expect(amountMapping).toBeDefined();
      expect(amountMapping!.sources).toHaveLength(3);
    });
  });
});
