/**
 * Field Mapping Admin Logic (L.15) — Tests
 */
import { describe, it, expect } from 'vitest';
import { buildMappingTable, type MappingTableRow } from '../shell/field-mapping-admin.js';
import type { DataSourceSchema, FieldMetadata } from '../data-adapter.js';

function makeSchema(id: string, fields: Array<{ name: string; dataType: string }>): DataSourceSchema {
  return {
    id,
    name: `Source ${id}`,
    fields: fields.map(f => ({
      name: f.name,
      dataType: f.dataType as FieldMetadata['dataType'],
      nullable: false,
    })),
  };
}

describe('Field Mapping Admin (L.15)', () => {
  describe('buildMappingTable', () => {
    it('returns empty table for empty schemas', () => {
      const rows = buildMappingTable([]);
      expect(rows).toEqual([]);
    });

    it('creates rows from a single schema', () => {
      const schemas = [makeSchema('s1', [
        { name: 'name', dataType: 'string' },
        { name: 'age', dataType: 'number' },
      ])];
      const rows = buildMappingTable(schemas);
      expect(rows).toHaveLength(2);
      expect(rows[0].canonicalField).toBe('name');
      expect(rows[0].dataType).toBe('string');
      expect(rows[0].sources.get('s1')).toBe('name');
    });

    it('merges matching fields across schemas via autoSuggest', () => {
      const schemas = [
        makeSchema('s1', [{ name: 'email', dataType: 'string' }]),
        makeSchema('s2', [{ name: 'email', dataType: 'string' }]),
      ];
      const rows = buildMappingTable(schemas);
      const emailRow = rows.find(r => r.canonicalField === 'email');
      expect(emailRow).toBeDefined();
      expect(emailRow!.sources.get('s1')).toBe('email');
      expect(emailRow!.sources.get('s2')).toBe('email');
    });

    it('preserves existing mappings when provided', () => {
      const schemas = [
        makeSchema('s1', [{ name: 'user_email', dataType: 'string' }]),
        makeSchema('s2', [{ name: 'contact_email', dataType: 'string' }]),
      ];
      const existingMappings = [
        { canonicalField: 'email', sources: [{ dataSourceId: 's1', field: 'user_email' }, { dataSourceId: 's2', field: 'contact_email' }] },
      ];
      const rows = buildMappingTable(schemas, existingMappings);
      const emailRow = rows.find(r => r.canonicalField === 'email');
      expect(emailRow).toBeDefined();
      expect(emailRow!.sources.get('s1')).toBe('user_email');
      expect(emailRow!.sources.get('s2')).toBe('contact_email');
    });

    it('includes unmapped fields from schemas', () => {
      const schemas = [
        makeSchema('s1', [
          { name: 'id', dataType: 'number' },
          { name: 'name', dataType: 'string' },
        ]),
      ];
      const rows = buildMappingTable(schemas);
      expect(rows).toHaveLength(2);
    });
  });
});
