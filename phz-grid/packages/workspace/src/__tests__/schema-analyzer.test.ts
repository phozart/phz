import { describe, it, expect } from 'vitest';
import { analyzeSchema } from '../templates/schema-analyzer.js';
import type { FieldProfile } from '../templates/schema-analyzer.js';
import type { DataSourceSchema } from '../data-adapter.js';

describe('SchemaAnalyzer', () => {
  const salesSchema: DataSourceSchema = {
    id: 'sales',
    name: 'Sales Data',
    fields: [
      { name: 'revenue', dataType: 'number', nullable: false, cardinality: 'high', semanticHint: 'measure' },
      { name: 'cost', dataType: 'number', nullable: false, cardinality: 'high' },
      { name: 'profit_margin', dataType: 'number', nullable: true, cardinality: 'high', semanticHint: 'percentage' },
      { name: 'region', dataType: 'string', nullable: false, cardinality: 'low', semanticHint: 'dimension' },
      { name: 'product', dataType: 'string', nullable: false, cardinality: 'medium' },
      { name: 'order_date', dataType: 'date', nullable: false, cardinality: 'high', semanticHint: 'timestamp' },
      { name: 'customer_id', dataType: 'string', nullable: false, cardinality: 'high', semanticHint: 'identifier' },
      { name: 'is_active', dataType: 'boolean', nullable: false },
    ],
  };

  describe('analyzeSchema', () => {
    it('classifies numeric fields', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.numericFields).toContain('revenue');
      expect(profile.numericFields).toContain('cost');
      expect(profile.numericFields).toContain('profit_margin');
    });

    it('classifies categorical fields', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.categoricalFields).toContain('region');
      expect(profile.categoricalFields).toContain('product');
    });

    it('classifies date fields', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.dateFields).toContain('order_date');
    });

    it('classifies identifier fields', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.identifierFields).toContain('customer_id');
    });

    it('suggests measures from semantic hints', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.suggestedMeasures).toContain('revenue');
    });

    it('suggests measures from name patterns', () => {
      const profile = analyzeSchema(salesSchema);
      // 'cost' has no semantic hint but name matches measure pattern
      expect(profile.suggestedMeasures).toContain('cost');
    });

    it('suggests dimensions from semantic hints', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.suggestedDimensions).toContain('region');
    });

    it('suggests dimensions from low-cardinality strings', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.suggestedDimensions).toContain('product');
    });

    it('detects time series capability', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.hasTimeSeries).toBe(true);
    });

    it('detects categorical capability', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.hasCategorical).toBe(true);
    });

    it('detects multiple measures', () => {
      const profile = analyzeSchema(salesSchema);
      expect(profile.hasMultipleMeasures).toBe(true);
    });

    it('handles schema with no date fields', () => {
      const schema: DataSourceSchema = {
        id: 'simple',
        name: 'Simple',
        fields: [
          { name: 'value', dataType: 'number', nullable: false },
          { name: 'label', dataType: 'string', nullable: false, cardinality: 'low' },
        ],
      };
      const profile = analyzeSchema(schema);
      expect(profile.hasTimeSeries).toBe(false);
      expect(profile.dateFields).toEqual([]);
    });

    it('handles empty schema', () => {
      const schema: DataSourceSchema = { id: 'empty', name: 'Empty', fields: [] };
      const profile = analyzeSchema(schema);
      expect(profile.numericFields).toEqual([]);
      expect(profile.categoricalFields).toEqual([]);
      expect(profile.dateFields).toEqual([]);
      expect(profile.suggestedMeasures).toEqual([]);
      expect(profile.suggestedDimensions).toEqual([]);
      expect(profile.hasTimeSeries).toBe(false);
      expect(profile.hasCategorical).toBe(false);
      expect(profile.hasMultipleMeasures).toBe(false);
    });

    it('uses name patterns: amount, total, count suggest measure', () => {
      const schema: DataSourceSchema = {
        id: 'test',
        name: 'Test',
        fields: [
          { name: 'total_amount', dataType: 'number', nullable: false },
          { name: 'item_count', dataType: 'number', nullable: false },
        ],
      };
      const profile = analyzeSchema(schema);
      expect(profile.suggestedMeasures).toContain('total_amount');
      expect(profile.suggestedMeasures).toContain('item_count');
    });
  });
});
