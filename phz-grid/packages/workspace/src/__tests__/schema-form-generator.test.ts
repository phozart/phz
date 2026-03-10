import { describe, it, expect } from 'vitest';
import { generateFormFields } from '../registry/schema-form-generator.js';
import type { FormFieldDescriptor } from '../registry/schema-form-generator.js';

describe('SchemaFormGenerator', () => {
  describe('generateFormFields', () => {
    it('generates a text field for string properties', () => {
      const schema = {
        properties: {
          title: { type: 'string', label: 'Title' },
        },
        required: ['title'],
      };
      const fields = generateFormFields(schema);
      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('title');
      expect(fields[0].type).toBe('text');
      expect(fields[0].label).toBe('Title');
      expect(fields[0].required).toBe(true);
    });

    it('generates a number field for number properties', () => {
      const schema = {
        properties: {
          pageSize: { type: 'number', label: 'Page Size', min: 1, max: 1000 },
        },
        required: [],
      };
      const fields = generateFormFields(schema);
      expect(fields[0].type).toBe('number');
      expect(fields[0].min).toBe(1);
      expect(fields[0].max).toBe(1000);
      expect(fields[0].required).toBe(false);
    });

    it('generates a checkbox for boolean properties', () => {
      const schema = {
        properties: {
          showLegend: { type: 'boolean', label: 'Show Legend', default: true },
        },
        required: [],
      };
      const fields = generateFormFields(schema);
      expect(fields[0].type).toBe('checkbox');
      expect(fields[0].defaultValue).toBe(true);
    });

    it('generates a select for enum properties', () => {
      const schema = {
        properties: {
          format: { type: 'string', label: 'Format', enum: ['number', 'currency', 'percent'] },
        },
        required: [],
      };
      const fields = generateFormFields(schema);
      expect(fields[0].type).toBe('select');
      expect(fields[0].options).toEqual(['number', 'currency', 'percent']);
    });

    it('generates a color picker for color properties', () => {
      const schema = {
        properties: {
          color: { type: 'string', label: 'Color', format: 'color' },
        },
        required: [],
      };
      const fields = generateFormFields(schema);
      expect(fields[0].type).toBe('color');
    });

    it('generates fields for array properties', () => {
      const schema = {
        properties: {
          columns: { type: 'array', label: 'Columns', items: { type: 'string' } },
        },
        required: ['columns'],
      };
      const fields = generateFormFields(schema);
      expect(fields[0].type).toBe('array');
      expect(fields[0].required).toBe(true);
    });

    it('handles multiple properties in order', () => {
      const schema = {
        properties: {
          title: { type: 'string', label: 'Title' },
          showLegend: { type: 'boolean', label: 'Show Legend' },
          pageSize: { type: 'number', label: 'Page Size' },
        },
        required: ['title'],
      };
      const fields = generateFormFields(schema);
      expect(fields).toHaveLength(3);
      expect(fields.map(f => f.name)).toEqual(['title', 'showLegend', 'pageSize']);
    });

    it('returns empty array for empty schema', () => {
      expect(generateFormFields({ properties: {}, required: [] })).toEqual([]);
    });

    it('handles missing required array', () => {
      const schema = {
        properties: {
          title: { type: 'string', label: 'Title' },
        },
      };
      const fields = generateFormFields(schema);
      expect(fields[0].required).toBe(false);
    });
  });
});
