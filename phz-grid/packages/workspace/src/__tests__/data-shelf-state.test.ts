import { describe, it, expect } from 'vitest';
import {
  initialDataShelfFromWidget,
  addFieldToDataShelf,
  removeFieldFromDataShelf,
  moveFieldBetweenDataShelves,
  reorderDataShelfField,
  setDataShelfAggregation,
  startDataShelfDrag,
  setDataShelfHoveredZone,
  endDataShelfDrag,
  toggleDataShelfDropZones,
  setDataShelfSuggestion,
  applyDataShelfToWidget,
  getDefaultDataShelfAggregation,
} from '../authoring/data-shelf-state.js';
import type { DataShelfField, DataShelfState } from '../authoring/data-shelf-state.js';

// ========================================================================
// Helpers
// ========================================================================

function emptyShelf(widgetId = 'w1'): DataShelfState {
  return initialDataShelfFromWidget(widgetId, {
    dimensions: [],
    measures: [],
    filters: [],
  });
}

function numField(name = 'amount'): DataShelfField {
  return { name, dataType: 'number' };
}

function strField(name = 'category'): DataShelfField {
  return { name, dataType: 'string' };
}

function dateField(name = 'created_at'): DataShelfField {
  return { name, dataType: 'date' };
}

// ========================================================================
// Factory
// ========================================================================

describe('initialDataShelfFromWidget', () => {
  it('creates from empty widget data config', () => {
    const state = emptyShelf();
    expect(state.widgetId).toBe('w1');
    expect(state.rows).toEqual([]);
    expect(state.columns).toEqual([]);
    expect(state.values).toEqual([]);
    expect(state.filters).toEqual([]);
    expect(state.showDropZones).toBe(true);
    expect(state.draggedField).toBeUndefined();
    expect(state.hoveredZone).toBeUndefined();
    expect(state.suggestedChartType).toBeUndefined();
  });

  it('creates from widget with dimensions (first → rows, rest → columns)', () => {
    const state = initialDataShelfFromWidget('w2', {
      dimensions: [
        { field: 'region', alias: 'Region' },
        { field: 'product', alias: 'Product' },
        { field: 'channel' },
      ],
      measures: [],
      filters: [],
    });

    expect(state.rows).toEqual([{ name: 'region', dataType: 'string', alias: 'Region' }]);
    expect(state.columns).toEqual([
      { name: 'product', dataType: 'string', alias: 'Product' },
      { name: 'channel', dataType: 'string', alias: undefined },
    ]);
  });

  it('creates from widget with measures (preserves aggregation)', () => {
    const state = initialDataShelfFromWidget('w3', {
      dimensions: [],
      measures: [
        { field: 'revenue', aggregation: 'sum', alias: 'Total Revenue' },
        { field: 'orders', aggregation: 'count' },
      ],
      filters: [],
    });

    expect(state.values).toEqual([
      { name: 'revenue', aggregation: 'sum', alias: 'Total Revenue' },
      { name: 'orders', aggregation: 'count', alias: undefined },
    ]);
  });

  it('creates from widget with filters', () => {
    const state = initialDataShelfFromWidget('w4', {
      dimensions: [],
      measures: [],
      filters: [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'amount', operator: 'gt', value: 100 },
      ],
    });

    expect(state.filters).toEqual([
      { field: 'status', operator: 'eq', value: 'active' },
      { field: 'amount', operator: 'gt', value: 100 },
    ]);
  });
});

// ========================================================================
// Add field
// ========================================================================

describe('addFieldToDataShelf', () => {
  it('adds dimension to rows', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toEqual({ name: 'region', dataType: 'string' });
  });

  it('adds dimension to columns', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'columns', strField('product'));
    expect(state.columns).toHaveLength(1);
    expect(state.columns[0]).toEqual({ name: 'product', dataType: 'string' });
  });

  it('adds number field to values with auto-aggregation sum', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'values', numField('revenue'));
    expect(state.values).toHaveLength(1);
    expect(state.values[0]).toEqual({ name: 'revenue', aggregation: 'sum', alias: undefined });
  });

  it('adds string field to values with auto-aggregation count', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'values', strField('name'));
    expect(state.values).toHaveLength(1);
    expect(state.values[0]).toEqual({ name: 'name', aggregation: 'count', alias: undefined });
  });

  it('adds filter with default operator eq and value null', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'filters', strField('status'));
    expect(state.filters).toHaveLength(1);
    expect(state.filters[0]).toEqual({ field: 'status', operator: 'eq', value: null });
  });
});

// ========================================================================
// Remove field
// ========================================================================

describe('removeFieldFromDataShelf', () => {
  it('removes from rows', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    state = addFieldToDataShelf(state, 'rows', strField('country'));
    state = removeFieldFromDataShelf(state, 'rows', 'region');

    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].name).toBe('country');
  });

  it('removes from values', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'values', numField('revenue'));
    state = removeFieldFromDataShelf(state, 'values', 'revenue');

    expect(state.values).toHaveLength(0);
  });

  it('returns same state if field not found', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    const result = removeFieldFromDataShelf(state, 'rows', 'nonexistent');

    // rows array reference may differ but length stays the same
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('region');
  });
});

// ========================================================================
// Move field between zones
// ========================================================================

describe('moveFieldBetweenDataShelves', () => {
  it('moves from rows to columns', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    state = moveFieldBetweenDataShelves(state, 'rows', 'columns', 'region');

    expect(state.rows).toHaveLength(0);
    expect(state.columns).toHaveLength(1);
    expect(state.columns[0].name).toBe('region');
  });

  it('moves from rows to values — gets auto-aggregation', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'rows', numField('revenue'));
    state = moveFieldBetweenDataShelves(state, 'rows', 'values', 'revenue');

    expect(state.rows).toHaveLength(0);
    expect(state.values).toHaveLength(1);
    expect(state.values[0].aggregation).toBe('sum');
  });

  it('moves from values to rows — strips aggregation', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'values', numField('revenue'));
    state = moveFieldBetweenDataShelves(state, 'values', 'rows', 'revenue');

    expect(state.values).toHaveLength(0);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].name).toBe('revenue');
    expect(state.rows[0]).not.toHaveProperty('aggregation');
  });

  it('no-op if field not in source zone', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    const result = moveFieldBetweenDataShelves(state, 'columns', 'values', 'region');

    // State unchanged — field is in rows, not columns
    expect(result.rows).toHaveLength(1);
    expect(result.columns).toHaveLength(0);
    expect(result.values).toHaveLength(0);
  });
});

// ========================================================================
// Reorder
// ========================================================================

describe('reorderDataShelfField', () => {
  it('reorders field to new position within rows', () => {
    let state = emptyShelf();
    state = addFieldToDataShelf(state, 'rows', strField('a'));
    state = addFieldToDataShelf(state, 'rows', strField('b'));
    state = addFieldToDataShelf(state, 'rows', strField('c'));

    state = reorderDataShelfField(state, 'rows', 'c', 0);
    expect(state.rows.map(f => f.name)).toEqual(['c', 'a', 'b']);
  });

  it('no-op for field not in zone', () => {
    let state = emptyShelf();
    state = addFieldToDataShelf(state, 'rows', strField('a'));
    const result = reorderDataShelfField(state, 'rows', 'nonexistent', 0);
    expect(result.rows.map(f => f.name)).toEqual(['a']);
  });
});

// ========================================================================
// Aggregation
// ========================================================================

describe('setDataShelfAggregation', () => {
  it('sets aggregation on existing measure', () => {
    let state = addFieldToDataShelf(emptyShelf(), 'values', numField('revenue'));
    state = setDataShelfAggregation(state, 'revenue', 'avg');

    expect(state.values[0].aggregation).toBe('avg');
  });

  it('no-op for field not in values', () => {
    const state = addFieldToDataShelf(emptyShelf(), 'rows', strField('region'));
    const result = setDataShelfAggregation(state, 'region', 'avg');

    expect(result.values).toHaveLength(0);
  });
});

// ========================================================================
// Drag state
// ========================================================================

describe('drag state', () => {
  it('startDataShelfDrag sets field and source zone', () => {
    const state = startDataShelfDrag(emptyShelf(), { name: 'revenue', dataType: 'number' }, 'values');

    expect(state.draggedField).toEqual({ name: 'revenue', dataType: 'number', sourceZone: 'values' });
  });

  it('setDataShelfHoveredZone sets hovered zone', () => {
    const state = setDataShelfHoveredZone(emptyShelf(), 'rows');
    expect(state.hoveredZone).toBe('rows');
  });

  it('endDataShelfDrag clears drag state', () => {
    let state = startDataShelfDrag(emptyShelf(), { name: 'revenue', dataType: 'number' }, 'values');
    state = setDataShelfHoveredZone(state, 'rows');
    state = endDataShelfDrag(state);

    expect(state.draggedField).toBeUndefined();
    expect(state.hoveredZone).toBeUndefined();
  });
});

// ========================================================================
// Toggle & Suggestion
// ========================================================================

describe('toggleDataShelfDropZones', () => {
  it('toggles showDropZones', () => {
    let state = emptyShelf();
    expect(state.showDropZones).toBe(true);
    state = toggleDataShelfDropZones(state);
    expect(state.showDropZones).toBe(false);
    state = toggleDataShelfDropZones(state);
    expect(state.showDropZones).toBe(true);
  });
});

describe('setDataShelfSuggestion', () => {
  it('sets suggested chart type', () => {
    const state = setDataShelfSuggestion(emptyShelf(), 'bar');
    expect(state.suggestedChartType).toBe('bar');
  });

  it('clears suggestion with undefined', () => {
    let state = setDataShelfSuggestion(emptyShelf(), 'bar');
    state = setDataShelfSuggestion(state, undefined);
    expect(state.suggestedChartType).toBeUndefined();
  });
});

// ========================================================================
// Apply to widget
// ========================================================================

describe('applyDataShelfToWidget', () => {
  it('converts populated shelf to correct widget config format', () => {
    let state = emptyShelf();
    state = addFieldToDataShelf(state, 'rows', strField('region'));
    state = addFieldToDataShelf(state, 'columns', strField('product'));
    state = addFieldToDataShelf(state, 'values', numField('revenue'));
    state = addFieldToDataShelf(state, 'filters', strField('status'));

    const config = applyDataShelfToWidget(state);

    expect(config.dimensions).toEqual([
      { field: 'region', alias: undefined },
      { field: 'product', alias: undefined },
    ]);
    expect(config.measures).toEqual([
      { field: 'revenue', aggregation: 'sum', alias: undefined },
    ]);
    expect(config.filters).toEqual([
      { field: 'status', operator: 'eq', value: null },
    ]);
  });

  it('handles empty zones', () => {
    const config = applyDataShelfToWidget(emptyShelf());

    expect(config.dimensions).toEqual([]);
    expect(config.measures).toEqual([]);
    expect(config.filters).toEqual([]);
  });
});

// ========================================================================
// Default aggregation helper
// ========================================================================

describe('getDefaultDataShelfAggregation', () => {
  it('returns sum for number', () => {
    expect(getDefaultDataShelfAggregation('number')).toBe('sum');
  });

  it('returns count for string', () => {
    expect(getDefaultDataShelfAggregation('string')).toBe('count');
  });

  it('returns count for date', () => {
    expect(getDefaultDataShelfAggregation('date')).toBe('count');
  });

  it('returns count for boolean', () => {
    expect(getDefaultDataShelfAggregation('boolean')).toBe('count');
  });
});
