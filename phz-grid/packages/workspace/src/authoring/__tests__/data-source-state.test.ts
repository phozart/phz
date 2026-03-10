/**
 * data-source-state — TDD tests
 *
 * Headless state machine for browsing data sources, loading schemas,
 * classifying fields into dimensions/measures, and selecting fields
 * for report composition. Driven by the DataAdapter SPI.
 */
import { describe, it, expect } from 'vitest';
import {
  createDataSourceState,
  setSources,
  selectSource,
  setSchema,
  setSchemaLoading,
  setFieldSearch,
  addField,
  removeField,
  reorderFields,
  setFieldStats,
  setError,
  clearError,
  filteredDimensions,
  filteredMeasures,
  filteredTimeFields,
  filteredIdentifiers,
  allFilteredFields,
  type DataSourceState,
} from '../data-source-state.js';

// ── Mock data ──────────────────────────────────────────────────────

const mockSources = [
  { id: 'ds-1', name: 'Sales Data', description: 'Monthly sales', fieldCount: 8, rowCount: 50000 },
  { id: 'ds-2', name: 'HR Records', description: 'Employee data', fieldCount: 12 },
];

const mockSchema = {
  id: 'ds-1',
  name: 'Sales Data',
  fields: [
    { name: 'order_id', dataType: 'string' as const, nullable: false, semanticHint: 'identifier' as const },
    { name: 'customer_name', dataType: 'string' as const, nullable: false, semanticHint: 'dimension' as const, cardinality: 'medium' as const },
    { name: 'region', dataType: 'string' as const, nullable: false, semanticHint: 'dimension' as const, cardinality: 'low' as const },
    { name: 'product_category', dataType: 'string' as const, nullable: false, semanticHint: 'category' as const, cardinality: 'low' as const },
    { name: 'order_date', dataType: 'date' as const, nullable: false, semanticHint: 'timestamp' as const },
    { name: 'revenue', dataType: 'number' as const, nullable: false, semanticHint: 'measure' as const, unit: { type: 'currency' as const, currencyCode: 'USD' } },
    { name: 'quantity', dataType: 'number' as const, nullable: false, semanticHint: 'measure' as const },
    { name: 'discount_pct', dataType: 'number' as const, nullable: true, semanticHint: 'percentage' as const },
  ],
};

// Schema where some fields have NO semanticHint — must auto-classify
const ambiguousSchema = {
  id: 'ds-3',
  name: 'Raw Data',
  fields: [
    { name: 'id', dataType: 'string' as const, nullable: false },
    { name: 'name', dataType: 'string' as const, nullable: false, cardinality: 'high' as const },
    { name: 'category', dataType: 'string' as const, nullable: false, cardinality: 'low' as const },
    { name: 'amount', dataType: 'number' as const, nullable: false },
    { name: 'created_at', dataType: 'date' as const, nullable: false },
    { name: 'is_active', dataType: 'boolean' as const, nullable: false },
  ],
};

// ── Tests ──────────────────────────────────────────────────────────

describe('data-source-state', () => {
  describe('createDataSourceState', () => {
    it('creates initial empty state', () => {
      const state = createDataSourceState();
      expect(state.sources).toEqual([]);
      expect(state.selectedSourceId).toBeNull();
      expect(state.schema).toBeNull();
      expect(state.schemaLoading).toBe(false);
      expect(state.sourcesLoading).toBe(false);
      expect(state.dimensions).toEqual([]);
      expect(state.measures).toEqual([]);
      expect(state.timeFields).toEqual([]);
      expect(state.identifiers).toEqual([]);
      expect(state.selectedFields).toEqual([]);
      expect(state.fieldSearch).toBe('');
      expect(state.fieldStats).toEqual({});
      expect(state.error).toBeNull();
    });
  });

  describe('setSources', () => {
    it('sets available data sources', () => {
      const state = createDataSourceState();
      const next = setSources(state, mockSources);
      expect(next.sources).toEqual(mockSources);
      expect(next.sourcesLoading).toBe(false);
    });

    it('does not mutate original state', () => {
      const state = createDataSourceState();
      const next = setSources(state, mockSources);
      expect(state.sources).toEqual([]);
      expect(next).not.toBe(state);
    });
  });

  describe('selectSource', () => {
    it('sets selectedSourceId and clears previous schema/fields', () => {
      let state = createDataSourceState();
      state = setSources(state, mockSources);
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');

      const next = selectSource(state, 'ds-2');
      expect(next.selectedSourceId).toBe('ds-2');
      expect(next.schema).toBeNull();
      expect(next.schemaLoading).toBe(true);
      expect(next.dimensions).toEqual([]);
      expect(next.measures).toEqual([]);
      expect(next.timeFields).toEqual([]);
      expect(next.identifiers).toEqual([]);
      expect(next.selectedFields).toEqual([]);
      expect(next.fieldStats).toEqual({});
      expect(next.fieldSearch).toBe('');
      expect(next.error).toBeNull();
    });

    it('does nothing if same source already selected', () => {
      let state = createDataSourceState();
      state = setSources(state, mockSources);
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      const next = selectSource(state, 'ds-1');
      expect(next).toBe(state); // same reference — no change
    });
  });

  describe('setSchema — field classification', () => {
    it('classifies fields by semanticHint', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      expect(state.schemaLoading).toBe(false);
      expect(state.schema).toBe(mockSchema);

      // Dimensions: dimension + category
      expect(state.dimensions.map(f => f.name)).toEqual(
        expect.arrayContaining(['customer_name', 'region', 'product_category']),
      );
      expect(state.dimensions).toHaveLength(3);

      // Measures: measure + currency + percentage
      expect(state.measures.map(f => f.name)).toEqual(
        expect.arrayContaining(['revenue', 'quantity', 'discount_pct']),
      );
      expect(state.measures).toHaveLength(3);

      // Time: timestamp
      expect(state.timeFields.map(f => f.name)).toEqual(['order_date']);

      // Identifiers
      expect(state.identifiers.map(f => f.name)).toEqual(['order_id']);
    });

    it('auto-classifies fields without semanticHint', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-3');
      state = setSchema(state, ambiguousSchema);

      // string with high cardinality or name 'id' → identifier
      expect(state.identifiers.map(f => f.name)).toContain('id');

      // string with low cardinality → dimension
      expect(state.dimensions.map(f => f.name)).toContain('category');

      // number without hint → measure (default for numbers)
      expect(state.measures.map(f => f.name)).toContain('amount');

      // date without hint → time field
      expect(state.timeFields.map(f => f.name)).toContain('created_at');

      // boolean → dimension
      expect(state.dimensions.map(f => f.name)).toContain('is_active');

      // high-cardinality string without hint → identifier (heuristic)
      expect(state.identifiers.map(f => f.name)).toContain('name');
    });
  });

  describe('field search / filtering', () => {
    it('filters dimensions by search query', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = setFieldSearch(state, 'region');

      expect(filteredDimensions(state).map(f => f.name)).toEqual(['region']);
    });

    it('filters measures by search query', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = setFieldSearch(state, 'rev');

      expect(filteredMeasures(state).map(f => f.name)).toEqual(['revenue']);
      expect(filteredDimensions(state)).toEqual([]);
    });

    it('search is case-insensitive', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = setFieldSearch(state, 'REVENUE');

      expect(filteredMeasures(state).map(f => f.name)).toEqual(['revenue']);
    });

    it('empty search returns all fields', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = setFieldSearch(state, '');

      expect(filteredDimensions(state)).toHaveLength(3);
      expect(filteredMeasures(state)).toHaveLength(3);
    });

    it('allFilteredFields returns combined list in order: time, dimensions, measures, identifiers', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      const all = allFilteredFields(state);
      // Time first, then dimensions, then measures, then identifiers
      const names = all.map(f => f.name);
      const timeIdx = names.indexOf('order_date');
      const dimIdx = names.indexOf('region');
      const measIdx = names.indexOf('revenue');
      const idIdx = names.indexOf('order_id');

      expect(timeIdx).toBeLessThan(dimIdx);
      expect(dimIdx).toBeLessThan(measIdx);
      expect(measIdx).toBeLessThan(idIdx);
    });
  });

  describe('selected fields (report composition)', () => {
    it('addField adds to selectedFields', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');
      state = addField(state, 'region');

      expect(state.selectedFields).toEqual(['revenue', 'region']);
    });

    it('addField is idempotent — no duplicates', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');
      state = addField(state, 'revenue');

      expect(state.selectedFields).toEqual(['revenue']);
    });

    it('addField rejects unknown field names', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      const next = addField(state, 'nonexistent');
      expect(next.selectedFields).toEqual([]);
      expect(next).toBe(state); // no change
    });

    it('removeField removes from selectedFields', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');
      state = addField(state, 'region');
      state = removeField(state, 'revenue');

      expect(state.selectedFields).toEqual(['region']);
    });

    it('removeField does nothing for non-selected field', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');

      const next = removeField(state, 'region');
      expect(next).toBe(state); // no change
    });

    it('reorderFields moves field from one position to another', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);
      state = addField(state, 'revenue');
      state = addField(state, 'region');
      state = addField(state, 'quantity');

      // Move region (index 1) to index 0
      state = reorderFields(state, 1, 0);
      expect(state.selectedFields).toEqual(['region', 'revenue', 'quantity']);

      // Move quantity (index 2) to index 1
      state = reorderFields(state, 2, 1);
      expect(state.selectedFields).toEqual(['region', 'quantity', 'revenue']);
    });
  });

  describe('field stats', () => {
    it('setFieldStats stores stats for a field', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      const stats = { min: 10, max: 5000, distinctCount: 450, nullCount: 0, totalCount: 50000 };
      state = setFieldStats(state, 'revenue', stats);

      expect(state.fieldStats['revenue']).toEqual(stats);
    });

    it('preserves existing stats when adding new ones', () => {
      let state = createDataSourceState();
      state = selectSource(state, 'ds-1');
      state = setSchema(state, mockSchema);

      state = setFieldStats(state, 'revenue', { min: 10, max: 5000, distinctCount: 450, nullCount: 0, totalCount: 50000 });
      state = setFieldStats(state, 'quantity', { min: 1, max: 100, distinctCount: 80, nullCount: 0, totalCount: 50000 });

      expect(state.fieldStats['revenue']).toBeDefined();
      expect(state.fieldStats['quantity']).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('setError stores error message', () => {
      const state = createDataSourceState();
      const next = setError(state, 'Failed to connect to data source');
      expect(next.error).toBe('Failed to connect to data source');
    });

    it('clearError removes error', () => {
      let state = createDataSourceState();
      state = setError(state, 'Some error');
      state = clearError(state);
      expect(state.error).toBeNull();
    });
  });

  describe('setSchemaLoading', () => {
    it('sets loading state', () => {
      const state = createDataSourceState();
      const next = setSchemaLoading(state, true);
      expect(next.schemaLoading).toBe(true);
    });
  });
});
