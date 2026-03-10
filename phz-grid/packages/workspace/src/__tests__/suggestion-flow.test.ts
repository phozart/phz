import { describe, it, expect } from 'vitest';
import { buildSuggestionPipeline } from '../templates/phz-suggestion-flow.js';
import type { DataSourceSchema } from '../data-adapter.js';
import { DEFAULT_TEMPLATES } from '../templates/default-templates.js';

describe('SuggestionFlow', () => {
  const salesSchema: DataSourceSchema = {
    id: 'sales',
    name: 'Sales',
    fields: [
      { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
      { name: 'cost', dataType: 'number', nullable: false },
      { name: 'region', dataType: 'string', nullable: false, cardinality: 'low' },
      { name: 'order_date', dataType: 'date', nullable: false },
    ],
  };

  describe('buildSuggestionPipeline', () => {
    it('returns scored templates for a schema', () => {
      const suggestions = buildSuggestionPipeline(salesSchema, DEFAULT_TEMPLATES);
      expect(suggestions.length).toBeGreaterThan(0);
      // Should be sorted by score descending
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });

    it('returns profile alongside scores', () => {
      const suggestions = buildSuggestionPipeline(salesSchema, DEFAULT_TEMPLATES);
      expect(suggestions[0].profile).toBeDefined();
      expect(suggestions[0].profile.numericFields).toContain('revenue');
    });

    it('handles schema with no fields', () => {
      const emptySchema: DataSourceSchema = { id: 'e', name: 'E', fields: [] };
      const suggestions = buildSuggestionPipeline(emptySchema, DEFAULT_TEMPLATES);
      // All templates should have score 0
      for (const s of suggestions) {
        expect(s.score).toBe(0);
      }
    });
  });
});
