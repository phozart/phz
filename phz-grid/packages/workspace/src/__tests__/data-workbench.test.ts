/**
 * Data Workbench Orchestrator Tests
 *
 * Tests the headless orchestration layer that combines:
 * - Data source loading & field classification
 * - Drop zone management (rows, columns, values, filters)
 * - Live preview fetching via DataAdapter
 * - Chart suggestion
 * - Aggregation cycling
 * - Undo/redo
 * - Save as report / dashboard widget
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createWorkbenchState,
  setWorkbenchSources,
  setWorkbenchSchema,
  addFieldToWorkbench,
  removeFieldFromWorkbench,
  autoPlaceWorkbenchField,
  cycleAggregation,
  setWorkbenchFieldSearch,
  setPreviewMode,
  setPreviewResult,
  setPreviewLoading,
  setPreviewError,
  workbenchToExploreQuery,
  getFilteredFields,
  undoWorkbench,
  redoWorkbench,
  canUndoWorkbench,
  canRedoWorkbench,
  pushWorkbenchSnapshot,
  type WorkbenchState,
} from '../authoring/data-workbench-orchestrator.js';

// ── Mock data ──
const MOCK_FIELDS = [
  { name: 'order_date', dataType: 'date' as const, nullable: false },
  { name: 'region', dataType: 'string' as const, nullable: false, cardinality: 'low' as const },
  { name: 'product', dataType: 'string' as const, nullable: false, cardinality: 'medium' as const },
  { name: 'revenue', dataType: 'number' as const, nullable: false, semanticHint: 'measure' as const },
  { name: 'quantity', dataType: 'number' as const, nullable: false },
  { name: 'is_returned', dataType: 'boolean' as const, nullable: false },
  { name: 'customer_id', dataType: 'string' as const, nullable: false, cardinality: 'high' as const },
];

const MOCK_SOURCES = [
  { id: 'sales', name: 'Sales Data', fieldCount: 7 },
  { id: 'inventory', name: 'Inventory', fieldCount: 4 },
];

const MOCK_SCHEMA = {
  id: 'sales',
  name: 'Sales Data',
  fields: MOCK_FIELDS,
};

describe('Data Workbench Orchestrator', () => {
  let state: WorkbenchState;

  beforeEach(() => {
    state = createWorkbenchState();
  });

  // ── Initialization ──

  describe('createWorkbenchState', () => {
    it('creates empty initial state', () => {
      expect(state.sources).toEqual([]);
      expect(state.selectedSourceId).toBeNull();
      expect(state.dropZones.rows).toEqual([]);
      expect(state.dropZones.columns).toEqual([]);
      expect(state.dropZones.values).toEqual([]);
      expect(state.dropZones.filters).toEqual([]);
      expect(state.previewMode).toBe('table');
      expect(state.previewLoading).toBe(false);
      expect(state.suggestedChart).toBe('table');
    });
  });

  // ── Data Source Loading ──

  describe('setWorkbenchSources', () => {
    it('sets available data sources', () => {
      const next = setWorkbenchSources(state, MOCK_SOURCES);
      expect(next.sources).toHaveLength(2);
      expect(next.sources[0].name).toBe('Sales Data');
      expect(next.sourcesLoading).toBe(false);
    });
  });

  describe('setWorkbenchSchema', () => {
    it('classifies fields into categories', () => {
      const next = setWorkbenchSchema(state, MOCK_SCHEMA);
      expect(next.selectedSourceId).toBe('sales');
      expect(next.schema).toBe(MOCK_SCHEMA);

      // Time fields: order_date (date type)
      expect(next.timeFields.map(f => f.name)).toContain('order_date');

      // Dimensions: region (low cardinality string), product (medium cardinality string), is_returned (boolean)
      expect(next.dimensions.map(f => f.name)).toContain('region');
      expect(next.dimensions.map(f => f.name)).toContain('product');
      expect(next.dimensions.map(f => f.name)).toContain('is_returned');

      // Measures: revenue (semanticHint=measure), quantity (number type)
      expect(next.measures.map(f => f.name)).toContain('revenue');
      expect(next.measures.map(f => f.name)).toContain('quantity');

      // Identifiers: customer_id (high cardinality string)
      expect(next.identifiers.map(f => f.name)).toContain('customer_id');
    });

    it('clears drop zones when schema changes', () => {
      // Add a field first, then change schema
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue
      expect(s.dropZones.values).toHaveLength(1);

      // Changing schema clears zones
      const next = setWorkbenchSchema(s, { id: 'other', name: 'Other', fields: [] });
      expect(next.dropZones.values).toEqual([]);
      expect(next.dropZones.rows).toEqual([]);
    });
  });

  // ── Field Classification Filtering ──

  describe('getFilteredFields', () => {
    it('returns all fields when no search', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const filtered = getFilteredFields(s);
      // time → dims → measures → identifiers
      expect(filtered).toHaveLength(7);
      expect(filtered[0].name).toBe('order_date'); // time first
    });

    it('filters by search query', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = setWorkbenchFieldSearch(s, 'rev');
      const filtered = getFilteredFields(s);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('revenue');
    });

    it('search is case-insensitive', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = setWorkbenchFieldSearch(s, 'REGION');
      const filtered = getFilteredFields(s);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('region');
    });
  });

  // ── Drop Zone Management ──

  describe('addFieldToWorkbench', () => {
    it('adds dimension to rows zone', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region
      expect(next.dropZones.rows).toHaveLength(1);
      expect(next.dropZones.rows[0].field).toBe('region');
    });

    it('adds measure to values zone with default aggregation', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue
      expect(next.dropZones.values).toHaveLength(1);
      expect(next.dropZones.values[0].field).toBe('revenue');
      expect(next.dropZones.values[0].aggregation).toBe('sum');
    });

    it('string field in values zone gets count aggregation', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = addFieldToWorkbench(s, 'values', MOCK_FIELDS[1]); // region (string)
      expect(next.dropZones.values[0].aggregation).toBe('count');
    });

    it('rejects duplicate fields in same zone', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region
      const next = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region again
      expect(next.dropZones.rows).toHaveLength(1); // no duplicate
    });

    it('adds filter with default operator', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = addFieldToWorkbench(s, 'filters', MOCK_FIELDS[1]); // region
      expect(next.dropZones.filters).toHaveLength(1);
      expect(next.dropZones.filters[0].operator).toBe('eq');
    });

    it('updates suggested chart after adding fields', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region → rows
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue → values
      expect(s.suggestedChart).toBe('bar'); // 1 dim + 1 measure = bar
    });

    it('suggests line chart for date dimension', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[0]); // order_date → rows
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue → values
      expect(s.suggestedChart).toBe('line'); // date dim + 1 measure = line
    });

    it('suggests kpi for measures only', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue → values
      expect(s.suggestedChart).toBe('kpi'); // 0 dim + 1 measure = kpi
    });
  });

  describe('removeFieldFromWorkbench', () => {
    it('removes field from zone', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[2]); // product
      expect(s.dropZones.rows).toHaveLength(2);

      const next = removeFieldFromWorkbench(s, 'rows', 'region');
      expect(next.dropZones.rows).toHaveLength(1);
      expect(next.dropZones.rows[0].field).toBe('product');
    });

    it('updates suggested chart after removal', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue
      expect(s.suggestedChart).toBe('bar');

      const next = removeFieldFromWorkbench(s, 'rows', 'region');
      expect(next.suggestedChart).toBe('kpi'); // 0 dims + 1 measure = kpi
    });
  });

  // ── Auto-placement ──

  describe('autoPlaceWorkbenchField', () => {
    it('places number field in values', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = autoPlaceWorkbenchField(s, MOCK_FIELDS[3]); // revenue (number)
      expect(next.dropZones.values).toHaveLength(1);
      expect(next.dropZones.values[0].field).toBe('revenue');
    });

    it('places date field in columns', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = autoPlaceWorkbenchField(s, MOCK_FIELDS[0]); // order_date (date)
      expect(next.dropZones.columns).toHaveLength(1);
      expect(next.dropZones.columns[0].field).toBe('order_date');
    });

    it('places string field in rows', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = autoPlaceWorkbenchField(s, MOCK_FIELDS[1]); // region (string)
      expect(next.dropZones.rows).toHaveLength(1);
      expect(next.dropZones.rows[0].field).toBe('region');
    });

    it('places boolean field in filters', () => {
      const s = setWorkbenchSchema(state, MOCK_SCHEMA);
      const next = autoPlaceWorkbenchField(s, MOCK_FIELDS[5]); // is_returned (boolean)
      expect(next.dropZones.filters).toHaveLength(1);
      expect(next.dropZones.filters[0].field).toBe('is_returned');
    });
  });

  // ── Aggregation Cycling ──

  describe('cycleAggregation', () => {
    it('cycles sum → avg → count → min → max → count_distinct → sum', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue, default sum
      expect(s.dropZones.values[0].aggregation).toBe('sum');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('avg');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('count');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('min');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('max');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('count_distinct');

      s = cycleAggregation(s, 'revenue');
      expect(s.dropZones.values[0].aggregation).toBe('sum'); // wraps around
    });

    it('does nothing for non-existent field', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]); // revenue
      const next = cycleAggregation(s, 'nonexistent');
      expect(next).toBe(s); // same reference
    });
  });

  // ── Query Generation ──

  describe('workbenchToExploreQuery', () => {
    it('generates ExploreQuery from drop zones', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]);    // region
      s = addFieldToWorkbench(s, 'columns', MOCK_FIELDS[0]); // order_date
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]);  // revenue SUM
      s = addFieldToWorkbench(s, 'filters', MOCK_FIELDS[5]); // is_returned

      const query = workbenchToExploreQuery(s);
      expect(query.dimensions).toHaveLength(2); // rows + columns
      expect(query.dimensions[0].field).toBe('region');
      expect(query.dimensions[1].field).toBe('order_date');
      expect(query.measures).toHaveLength(1);
      expect(query.measures[0].field).toBe('revenue');
      expect(query.measures[0].aggregation).toBe('sum');
      expect(query.filters).toHaveLength(1);
      expect(query.filters[0].field).toBe('is_returned');
    });

    it('returns empty query when no fields placed', () => {
      const query = workbenchToExploreQuery(state);
      expect(query.dimensions).toEqual([]);
      expect(query.measures).toEqual([]);
      expect(query.filters).toEqual([]);
    });
  });

  // ── Preview State ──

  describe('preview state management', () => {
    it('setPreviewMode changes mode', () => {
      const next = setPreviewMode(state, 'chart');
      expect(next.previewMode).toBe('chart');
    });

    it('setPreviewLoading sets loading flag', () => {
      const next = setPreviewLoading(state, true);
      expect(next.previewLoading).toBe(true);
    });

    it('setPreviewResult stores data and clears loading', () => {
      const mockResult = {
        columns: [{ name: 'region', dataType: 'string' }],
        rows: [['West'], ['East']],
        metadata: { totalRows: 2, truncated: false, queryTimeMs: 12 },
      };
      const next = setPreviewResult(state, mockResult as any);
      expect(next.previewResult).toBe(mockResult);
      expect(next.previewLoading).toBe(false);
      expect(next.previewError).toBeUndefined();
    });

    it('setPreviewError stores error and clears loading', () => {
      const next = setPreviewError(state, 'Connection refused');
      expect(next.previewError).toBe('Connection refused');
      expect(next.previewLoading).toBe(false);
    });
  });

  // ── Undo/Redo ──

  describe('undo/redo', () => {
    it('initially cannot undo or redo', () => {
      expect(canUndoWorkbench(state)).toBe(false);
      expect(canRedoWorkbench(state)).toBe(false);
    });

    it('can undo after pushing snapshot', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      // Push snapshot BEFORE change — captures empty drop zones
      s = pushWorkbenchSnapshot(s);
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region
      expect(s.dropZones.rows).toHaveLength(1);

      expect(canUndoWorkbench(s)).toBe(true);
      const undone = undoWorkbench(s);
      expect(undone.dropZones.rows).toHaveLength(0); // restored to empty
    });

    it('can redo after undo', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = pushWorkbenchSnapshot(s); // snapshot: empty
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region added

      s = undoWorkbench(s); // back to empty, current (with region) goes to redo
      expect(s.dropZones.rows).toHaveLength(0);
      expect(canRedoWorkbench(s)).toBe(true);

      s = redoWorkbench(s); // restore to with region
      expect(s.dropZones.rows).toHaveLength(1);
      expect(s.dropZones.rows[0].field).toBe('region');
    });

    it('redo stack clears on new push', () => {
      let s = setWorkbenchSchema(state, MOCK_SCHEMA);
      s = pushWorkbenchSnapshot(s); // snapshot: empty
      s = addFieldToWorkbench(s, 'rows', MOCK_FIELDS[1]); // region

      s = undoWorkbench(s); // back to empty
      expect(canRedoWorkbench(s)).toBe(true);

      // New action + push clears redo
      s = pushWorkbenchSnapshot(s);
      s = addFieldToWorkbench(s, 'values', MOCK_FIELDS[3]);
      expect(canRedoWorkbench(s)).toBe(false);
    });
  });
});
