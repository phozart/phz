import { describe, it, expect } from 'vitest';
import type {
  InteractionType,
  WidgetSizeBounds,
  FieldRequirement,
  WidgetVariant,
  WidgetResponsiveBehavior,
  WidgetManifest,
} from '../types.js';
import {
  isWidgetManifest,
  validateWidgetSizeBounds,
  validateWidgetVariants,
} from '../types.js';

describe('WidgetManifest types', () => {
  const validManifest: WidgetManifest = {
    type: 'bar-chart',
    category: 'charts',
    name: 'Bar Chart',
    description: 'A standard bar chart',
    requiredFields: [
      { name: 'value', dataType: 'number', role: 'measure', required: true },
      { name: 'category', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 4, rows: 3 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-csv'],
    variants: [
      { id: 'stacked', name: 'Stacked Bar', description: 'Stacked variant', presetConfig: { stacked: true } },
      { id: 'grouped', name: 'Grouped Bar', description: 'Grouped variant', presetConfig: { grouped: true } },
    ],
  };

  describe('isWidgetManifest', () => {
    it('returns true for a valid manifest', () => {
      expect(isWidgetManifest(validManifest)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isWidgetManifest(null)).toBe(false);
      expect(isWidgetManifest(undefined)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isWidgetManifest('string')).toBe(false);
      expect(isWidgetManifest(42)).toBe(false);
    });

    it('returns false when required fields are missing', () => {
      expect(isWidgetManifest({ type: 'bar' })).toBe(false);
      expect(isWidgetManifest({ ...validManifest, type: undefined })).toBe(false);
      expect(isWidgetManifest({ ...validManifest, name: undefined })).toBe(false);
    });

    it('accepts manifest with optional fields', () => {
      const withOptionals: WidgetManifest = {
        ...validManifest,
        thumbnail: 'bar-chart.png',
        configSchema: { type: 'object' },
        responsiveBehavior: {
          compactBelow: 400,
          compactBehavior: { hideLegend: true },
        },
      };
      expect(isWidgetManifest(withOptionals)).toBe(true);
    });

    it('accepts manifest with load function', () => {
      const withLoad: WidgetManifest = {
        ...validManifest,
        load: async () => ({ render: () => {} }),
      };
      expect(isWidgetManifest(withLoad)).toBe(true);
    });
  });

  describe('validateWidgetSizeBounds', () => {
    it('returns true when min <= preferred <= max', () => {
      expect(validateWidgetSizeBounds(
        { cols: 2, rows: 2 },
        { cols: 4, rows: 3 },
        { cols: 12, rows: 8 },
      )).toBe(true);
    });

    it('returns true when all sizes are equal', () => {
      const same: WidgetSizeBounds = { cols: 4, rows: 4 };
      expect(validateWidgetSizeBounds(same, same, same)).toBe(true);
    });

    it('returns false when min > preferred', () => {
      expect(validateWidgetSizeBounds(
        { cols: 6, rows: 2 },
        { cols: 4, rows: 3 },
        { cols: 12, rows: 8 },
      )).toBe(false);
    });

    it('returns false when preferred > max', () => {
      expect(validateWidgetSizeBounds(
        { cols: 2, rows: 2 },
        { cols: 14, rows: 3 },
        { cols: 12, rows: 8 },
      )).toBe(false);
    });

    it('returns false when min rows > preferred rows', () => {
      expect(validateWidgetSizeBounds(
        { cols: 2, rows: 5 },
        { cols: 4, rows: 3 },
        { cols: 12, rows: 8 },
      )).toBe(false);
    });
  });

  describe('validateWidgetVariants', () => {
    it('returns true for variants with unique IDs', () => {
      const variants: WidgetVariant[] = [
        { id: 'a', name: 'A', description: 'Variant A', presetConfig: {} },
        { id: 'b', name: 'B', description: 'Variant B', presetConfig: {} },
      ];
      expect(validateWidgetVariants(variants)).toBe(true);
    });

    it('returns true for empty variants array', () => {
      expect(validateWidgetVariants([])).toBe(true);
    });

    it('returns false for duplicate variant IDs', () => {
      const variants: WidgetVariant[] = [
        { id: 'dup', name: 'First', description: 'First', presetConfig: {} },
        { id: 'dup', name: 'Second', description: 'Second', presetConfig: {} },
      ];
      expect(validateWidgetVariants(variants)).toBe(false);
    });
  });

  describe('InteractionType', () => {
    it('supports all defined interaction types', () => {
      const types: InteractionType[] = [
        'drill-through', 'cross-filter', 'export-csv', 'export-png', 'click-detail',
      ];
      expect(types).toHaveLength(5);
    });
  });

  describe('FieldRequirement', () => {
    it('supports all data types and roles', () => {
      const fields: FieldRequirement[] = [
        { name: 'a', dataType: 'string', role: 'dimension', required: true },
        { name: 'b', dataType: 'number', role: 'measure', required: false },
        { name: 'c', dataType: 'date', role: 'time', required: true },
        { name: 'd', dataType: 'boolean', role: 'category', required: false },
      ];
      expect(fields).toHaveLength(4);
    });
  });

  describe('WidgetResponsiveBehavior', () => {
    it('accepts full responsive configuration', () => {
      const behavior: WidgetResponsiveBehavior = {
        compactBelow: 400,
        compactBehavior: {
          hideLegend: true,
          hideAxisLabels: true,
          hideDataLabels: false,
          simplifyToSingleValue: false,
          collapseToSummary: true,
        },
        minimalBelow: 200,
        minAspectRatio: 0.5,
        maxAspectRatio: 2.0,
      };
      expect(behavior.compactBelow).toBe(400);
      expect(behavior.compactBehavior.hideLegend).toBe(true);
      expect(behavior.minimalBelow).toBe(200);
    });
  });
});
