import { describe, it, expect } from 'vitest';
import {
  createFilterRecommendationState,
  computeFilterRecommendations,
  applyRecommendation,
  dismissRecommendation,
  undoDismiss,
  getActiveRecommendations,
  getRecommendationById,
  type FilterFieldInput,
  type FilterRecommendationState,
} from '../filter-recommendation-state.js';

describe('FilterRecommendationState', () => {
  // ========================================================================
  // Factory
  // ========================================================================

  describe('createFilterRecommendationState', () => {
    it('creates empty state', () => {
      const state = createFilterRecommendationState();
      expect(state.recommendations).toEqual([]);
      expect(state.appliedIds.size).toBe(0);
      expect(state.dismissedIds.size).toBe(0);
    });
  });

  // ========================================================================
  // computeFilterRecommendations — per-field type mapping
  // ========================================================================

  describe('computeFilterRecommendations', () => {
    it('boolean field -> boolean filter (confidence 0.9)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'is_active', dataType: 'boolean' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.field).toBe('is_active');
      expect(rec.filterType).toBe('boolean');
      expect(rec.confidence).toBe(0.9);
      expect(rec.rationale).toBe('Boolean field — toggle filter');
    });

    it('date field -> date-range filter (confidence 0.95)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'created_at', dataType: 'date' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.field).toBe('created_at');
      expect(rec.filterType).toBe('date-range');
      expect(rec.confidence).toBe(0.95);
      expect(rec.rationale).toBe('Date field — date range picker');
    });

    it('timestamp semantic hint -> date-range filter (confidence 0.95)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'updated_at', dataType: 'string', semanticHint: 'timestamp' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('date-range');
      expect(rec.confidence).toBe(0.95);
    });

    it('string + low cardinality -> select filter (confidence 0.9)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('select');
      expect(rec.confidence).toBe(0.9);
      expect(rec.rationale).toBe('Few distinct values — dropdown filter');
    });

    it('string + medium cardinality -> multi-select filter (confidence 0.85)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'category', dataType: 'string', cardinality: 'medium' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('multi-select');
      expect(rec.confidence).toBe(0.85);
      expect(rec.rationale).toBe('Multiple values — multi-select filter');
    });

    it('string + high cardinality -> text filter (confidence 0.7)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'description', dataType: 'string', cardinality: 'high' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('text');
      expect(rec.confidence).toBe(0.7);
      expect(rec.rationale).toBe('Many distinct values — search filter');
    });

    it('string with no cardinality info -> multi-select filter (confidence 0.75)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'region', dataType: 'string' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('multi-select');
      expect(rec.confidence).toBe(0.75);
      expect(rec.rationale).toBe('Text field — multi-select filter');
    });

    it('number + measure hint -> range filter (confidence 0.8)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'revenue', dataType: 'number', semanticHint: 'measure' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('range');
      expect(rec.confidence).toBe(0.8);
      expect(rec.rationale).toBe('Numeric measure — range slider');
    });

    it('number with no hint -> range filter (confidence 0.65)', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'quantity', dataType: 'number' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations).toHaveLength(1);

      const rec = next.recommendations[0];
      expect(rec.filterType).toBe('range');
      expect(rec.confidence).toBe(0.65);
      expect(rec.rationale).toBe('Numeric field — range filter');
    });

    // ========================================================================
    // Skipping existing filters
    // ========================================================================

    it('skips fields that are already in existingFilterFields', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'region', dataType: 'string', cardinality: 'medium' },
      ];

      const next = computeFilterRecommendations(state, fields, ['status']);
      expect(next.recommendations).toHaveLength(1);
      expect(next.recommendations[0].field).toBe('region');
    });

    // ========================================================================
    // Sorting
    // ========================================================================

    it('sorts recommendations by confidence descending', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'quantity', dataType: 'number' },         // 0.65
        { name: 'created_at', dataType: 'date' },          // 0.95
        { name: 'status', dataType: 'string', cardinality: 'low' }, // 0.9
        { name: 'region', dataType: 'string' },            // 0.75
      ];

      const next = computeFilterRecommendations(state, fields, []);
      const confidences = next.recommendations.map((r) => r.confidence);
      expect(confidences).toEqual([0.95, 0.9, 0.75, 0.65]);
    });

    // ========================================================================
    // Cascade logic
    // ========================================================================

    it('sets cascadeParentId on select/multi-select when date-range exists', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'order_date', dataType: 'date' },
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'category', dataType: 'string', cardinality: 'medium' },
        { name: 'revenue', dataType: 'number', semanticHint: 'measure' },
      ];

      const next = computeFilterRecommendations(state, fields, []);

      const dateRec = next.recommendations.find((r) => r.field === 'order_date');
      const statusRec = next.recommendations.find((r) => r.field === 'status');
      const categoryRec = next.recommendations.find((r) => r.field === 'category');
      const revenueRec = next.recommendations.find((r) => r.field === 'revenue');

      expect(dateRec!.cascadeParentId).toBeUndefined();
      expect(statusRec!.cascadeParentId).toBe('rec-order_date');
      expect(categoryRec!.cascadeParentId).toBe('rec-order_date');
      // range filters should NOT get a cascadeParentId
      expect(revenueRec!.cascadeParentId).toBeUndefined();
    });

    // ========================================================================
    // suggestedLabel
    // ========================================================================

    it('generates suggestedLabel: capitalize first letter, replace underscores with spaces', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'order_date', dataType: 'date' },
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'is_active', dataType: 'boolean' },
      ];

      const next = computeFilterRecommendations(state, fields, []);

      const dateRec = next.recommendations.find((r) => r.field === 'order_date');
      const statusRec = next.recommendations.find((r) => r.field === 'status');
      const boolRec = next.recommendations.find((r) => r.field === 'is_active');

      expect(dateRec!.suggestedLabel).toBe('Order date');
      expect(statusRec!.suggestedLabel).toBe('Status');
      expect(boolRec!.suggestedLabel).toBe('Is active');
    });

    // ========================================================================
    // ID generation
    // ========================================================================

    it('generates deterministic IDs as rec-${field.name}', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next.recommendations[0].id).toBe('rec-status');
    });
  });

  // ========================================================================
  // applyRecommendation
  // ========================================================================

  describe('applyRecommendation', () => {
    it('adds id to appliedIds', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);

      const next = applyRecommendation(state, 'rec-status');
      expect(next.appliedIds.has('rec-status')).toBe(true);
    });
  });

  // ========================================================================
  // dismissRecommendation
  // ========================================================================

  describe('dismissRecommendation', () => {
    it('adds id to dismissedIds', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);

      const next = dismissRecommendation(state, 'rec-status');
      expect(next.dismissedIds.has('rec-status')).toBe(true);
    });
  });

  // ========================================================================
  // undoDismiss
  // ========================================================================

  describe('undoDismiss', () => {
    it('removes id from dismissedIds', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);
      state = dismissRecommendation(state, 'rec-status');
      expect(state.dismissedIds.has('rec-status')).toBe(true);

      const next = undoDismiss(state, 'rec-status');
      expect(next.dismissedIds.has('rec-status')).toBe(false);
    });
  });

  // ========================================================================
  // getActiveRecommendations
  // ========================================================================

  describe('getActiveRecommendations', () => {
    it('excludes applied and dismissed recommendations', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'region', dataType: 'string', cardinality: 'medium' },
        { name: 'quantity', dataType: 'number' },
      ];
      state = computeFilterRecommendations(state, fields, []);
      state = applyRecommendation(state, 'rec-status');
      state = dismissRecommendation(state, 'rec-region');

      const active = getActiveRecommendations(state);
      expect(active).toHaveLength(1);
      expect(active[0].field).toBe('quantity');
    });
  });

  // ========================================================================
  // getRecommendationById
  // ========================================================================

  describe('getRecommendationById', () => {
    it('returns the correct recommendation', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'region', dataType: 'string', cardinality: 'medium' },
      ];
      state = computeFilterRecommendations(state, fields, []);

      const rec = getRecommendationById(state, 'rec-status');
      expect(rec).not.toBeNull();
      expect(rec!.field).toBe('status');
      expect(rec!.filterType).toBe('select');
    });

    it('returns null for unknown id', () => {
      const state = createFilterRecommendationState();
      const rec = getRecommendationById(state, 'rec-nonexistent');
      expect(rec).toBeNull();
    });
  });

  // ========================================================================
  // Immutability
  // ========================================================================

  describe('immutability', () => {
    it('computeFilterRecommendations returns a new state object', () => {
      const state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];

      const next = computeFilterRecommendations(state, fields, []);
      expect(next).not.toBe(state);
      expect(state.recommendations).toEqual([]); // original unchanged
    });

    it('applyRecommendation returns a new state object', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);

      const next = applyRecommendation(state, 'rec-status');
      expect(next).not.toBe(state);
      expect(state.appliedIds.has('rec-status')).toBe(false); // original unchanged
    });

    it('dismissRecommendation returns a new state object', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);

      const next = dismissRecommendation(state, 'rec-status');
      expect(next).not.toBe(state);
      expect(state.dismissedIds.has('rec-status')).toBe(false); // original unchanged
    });

    it('undoDismiss returns a new state object', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
      ];
      state = computeFilterRecommendations(state, fields, []);
      state = dismissRecommendation(state, 'rec-status');

      const next = undoDismiss(state, 'rec-status');
      expect(next).not.toBe(state);
      expect(state.dismissedIds.has('rec-status')).toBe(true); // original unchanged
    });
  });

  // ========================================================================
  // Preserve appliedIds/dismissedIds across recompute
  // ========================================================================

  describe('preserve state across recompute', () => {
    it('preserves appliedIds and dismissedIds when recomputing recommendations', () => {
      let state = createFilterRecommendationState();
      const fields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'region', dataType: 'string', cardinality: 'medium' },
      ];
      state = computeFilterRecommendations(state, fields, []);
      state = applyRecommendation(state, 'rec-status');
      state = dismissRecommendation(state, 'rec-region');

      // Recompute with different fields
      const newFields: FilterFieldInput[] = [
        { name: 'status', dataType: 'string', cardinality: 'low' },
        { name: 'region', dataType: 'string', cardinality: 'medium' },
        { name: 'quantity', dataType: 'number' },
      ];
      const next = computeFilterRecommendations(state, newFields, []);

      expect(next.appliedIds.has('rec-status')).toBe(true);
      expect(next.dismissedIds.has('rec-region')).toBe(true);
      expect(next.recommendations).toHaveLength(3); // all 3 recommendations generated
    });
  });
});
