import { describe, it, expect } from 'vitest';
import { inferFilterUIType } from '../filters/phz-filter-bar.js';
import type { FilterUIType } from '../types.js';
import type { FieldMetadata } from '../data-adapter.js';

describe('FilterBar (O.5)', () => {
  describe('inferFilterUIType', () => {
    it('returns boolean-toggle for boolean fields', () => {
      const field: FieldMetadata = { name: 'active', dataType: 'boolean', nullable: false };
      expect(inferFilterUIType(field)).toBe('boolean-toggle');
    });

    it('returns date-range for date fields', () => {
      const field: FieldMetadata = { name: 'created_at', dataType: 'date', nullable: false };
      expect(inferFilterUIType(field)).toBe('date-range');
    });

    it('returns numeric-range for number fields', () => {
      const field: FieldMetadata = { name: 'revenue', dataType: 'number', nullable: false };
      expect(inferFilterUIType(field)).toBe('numeric-range');
    });

    it('returns select for low-cardinality string fields', () => {
      const field: FieldMetadata = {
        name: 'status',
        dataType: 'string',
        nullable: false,
        cardinality: 'low',
      };
      expect(inferFilterUIType(field)).toBe('select');
    });

    it('returns chip-select for medium-cardinality string fields', () => {
      const field: FieldMetadata = {
        name: 'category',
        dataType: 'string',
        nullable: false,
        cardinality: 'medium',
      };
      expect(inferFilterUIType(field)).toBe('chip-select');
    });

    it('returns search for high-cardinality string fields', () => {
      const field: FieldMetadata = {
        name: 'email',
        dataType: 'string',
        nullable: false,
        cardinality: 'high',
      };
      expect(inferFilterUIType(field)).toBe('search');
    });

    it('returns multi-select for string fields with no cardinality', () => {
      const field: FieldMetadata = {
        name: 'region',
        dataType: 'string',
        nullable: false,
      };
      expect(inferFilterUIType(field)).toBe('multi-select');
    });

    it('returns date-preset when field has timestamp semantic hint', () => {
      const field: FieldMetadata = {
        name: 'order_date',
        dataType: 'date',
        nullable: false,
        semanticHint: 'timestamp',
      };
      // date-preset is preferred when time intelligence is available
      expect(inferFilterUIType(field, { hasTimeIntelligence: true })).toBe('date-preset');
    });
  });
});
