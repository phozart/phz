/**
 * Tests for Task 1.3: Connect <phz-data-model-sidebar> to DataAdapter
 *
 * The sidebar takes pure arrays (fields, parameters, calculatedFields, metrics, kpis).
 * The orchestrator bridges DataAdapter.getSchema() → sidebar props.
 */

import { describe, it, expect } from 'vitest';
import {
  fieldsFromSchema,
  buildSidebarProps,
  type SidebarProps,
} from '../engine-admin/data-model-sidebar-wiring.js';

describe('data-model-sidebar-wiring', () => {
  describe('fieldsFromSchema', () => {
    it('converts FieldMetadata[] to DataModelField[]', () => {
      const schema = [
        { name: 'revenue', dataType: 'number' as const },
        { name: 'region', dataType: 'string' as const },
        { name: 'created_at', dataType: 'date' as const },
        { name: 'is_active', dataType: 'boolean' as const },
      ];

      const result = fieldsFromSchema(schema);

      expect(result).toEqual([
        { name: 'revenue', type: 'number', label: 'revenue' },
        { name: 'region', type: 'string', label: 'region' },
        { name: 'created_at', type: 'date', label: 'created_at' },
        { name: 'is_active', type: 'boolean', label: 'is_active' },
      ]);
    });

    it('uses label when present in metadata', () => {
      const schema = [
        { name: 'rev', dataType: 'number' as const, label: 'Revenue' },
      ];

      const result = fieldsFromSchema(schema);

      expect(result).toEqual([
        { name: 'rev', type: 'number', label: 'Revenue' },
      ]);
    });

    it('returns empty array for empty schema', () => {
      expect(fieldsFromSchema([])).toEqual([]);
    });
  });

  describe('buildSidebarProps', () => {
    it('builds SidebarProps with fields from schema', () => {
      const schema = [
        { name: 'revenue', dataType: 'number' as const },
      ];

      const result = buildSidebarProps({ schemaFields: schema });

      expect(result.fields).toEqual([
        { name: 'revenue', type: 'number', label: 'revenue' },
      ]);
      // Non-DataAdapter sections default to empty
      expect(result.parameters).toEqual([]);
      expect(result.calculatedFields).toEqual([]);
      expect(result.metrics).toEqual([]);
      expect(result.kpis).toEqual([]);
    });

    it('passes through existing parameters, calculatedFields, metrics, kpis', () => {
      const params = [{ id: 'p1' as any, name: 'discount', type: 'number' as const, defaultValue: 10 }];
      const metrics = [{ id: 'm1', name: 'total_rev', formula: { type: 'simple' as const, aggregation: 'sum' as const, field: 'revenue' }, format: { type: 'currency' as const } }];

      const result = buildSidebarProps({
        schemaFields: [{ name: 'x', dataType: 'string' as const }],
        parameters: params,
        metrics: metrics as any,
      });

      expect(result.parameters).toBe(params);
      expect(result.metrics).toBe(metrics);
    });

    it('returns all empty arrays when given empty inputs', () => {
      const result = buildSidebarProps({ schemaFields: [] });
      const allEmpty = Object.values(result).every(v => Array.isArray(v) && v.length === 0);
      expect(allEmpty).toBe(true);
    });
  });
});
