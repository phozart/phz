/**
 * Tests for the DataExplorer orchestrator from the workspace explore module.
 *
 * Covers createDataExplorer lifecycle: setDataSource, autoPlaceField,
 * addToZone, removeFromZone, toQuery, suggestChart, undo/redo, subscribe.
 */
import {
  createDataExplorer,
} from '@phozart/workspace/explore';

interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  cardinality?: 'low' | 'medium' | 'high';
  semanticHint?: string;
}

const FIELDS: FieldMetadata[] = [
  { name: 'region', dataType: 'string', nullable: false },
  { name: 'revenue', dataType: 'number', nullable: false },
  { name: 'created_at', dataType: 'date', nullable: true },
  { name: 'active', dataType: 'boolean', nullable: false },
];

// ========================================================================
// createDataExplorer — initial state
// ========================================================================

describe('createDataExplorer', () => {
  it('starts with empty fields and drop zones', () => {
    const explorer = createDataExplorer();
    const state = explorer.getState();
    expect(state.fields).toEqual([]);
    expect(state.dropZones.rows).toEqual([]);
    expect(state.dropZones.columns).toEqual([]);
    expect(state.dropZones.values).toEqual([]);
    expect(state.dropZones.filters).toEqual([]);
    expect(state.dataSourceId).toBeUndefined();
  });

  it('cannot undo or redo initially', () => {
    const explorer = createDataExplorer();
    expect(explorer.canUndo()).toBe(false);
    expect(explorer.canRedo()).toBe(false);
  });
});

// ========================================================================
// setDataSource
// ========================================================================

describe('setDataSource', () => {
  it('sets data source and fields', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    const state = explorer.getState();
    expect(state.dataSourceId).toBe('ds1');
    expect(state.fields).toHaveLength(4);
  });

  it('resets drop zones on new data source', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.setDataSource('ds2', FIELDS);
    const state = explorer.getState();
    expect(state.dropZones.rows).toHaveLength(0);
  });

  it('resets undo/redo stacks on new data source', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    expect(explorer.canUndo()).toBe(true);
    explorer.setDataSource('ds2', FIELDS);
    expect(explorer.canUndo()).toBe(false);
    expect(explorer.canRedo()).toBe(false);
  });

  it('notifies subscribers', () => {
    const explorer = createDataExplorer();
    const handler = vi.fn();
    explorer.subscribe(handler);
    explorer.setDataSource('ds1', FIELDS);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('makes a defensive copy of fields', () => {
    const explorer = createDataExplorer();
    const fields = [...FIELDS];
    explorer.setDataSource('ds1', fields);
    fields.push({ name: 'extra', dataType: 'string', nullable: false });
    expect(explorer.getState().fields).toHaveLength(FIELDS.length);
  });
});

// ========================================================================
// autoPlaceField
// ========================================================================

describe('autoPlaceField', () => {
  it('places a number field in values', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.autoPlaceField(FIELDS[1]); // revenue -> number -> values
    expect(explorer.getState().dropZones.values).toHaveLength(1);
    expect(explorer.getState().dropZones.values[0].field).toBe('revenue');
  });

  it('places a string field in rows', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.autoPlaceField(FIELDS[0]); // region -> string -> rows
    expect(explorer.getState().dropZones.rows).toHaveLength(1);
  });

  it('places a date field in columns', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.autoPlaceField(FIELDS[2]); // created_at -> date -> columns
    expect(explorer.getState().dropZones.columns).toHaveLength(1);
  });

  it('places a boolean field in filters', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.autoPlaceField(FIELDS[3]); // active -> boolean -> filters
    expect(explorer.getState().dropZones.filters).toHaveLength(1);
  });

  it('pushes an undo entry', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.autoPlaceField(FIELDS[0]);
    expect(explorer.canUndo()).toBe(true);
  });
});

// ========================================================================
// addToZone / removeFromZone
// ========================================================================

describe('addToZone / removeFromZone', () => {
  it('adds a field to a specific zone', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('values', FIELDS[1]);
    expect(explorer.getState().dropZones.values).toHaveLength(1);
  });

  it('removes a field from a zone', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.removeFromZone('rows', 'region');
    expect(explorer.getState().dropZones.rows).toHaveLength(0);
  });

  it('both operations push undo entries', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.removeFromZone('rows', 'region');
    expect(explorer.canUndo()).toBe(true);
  });
});

// ========================================================================
// toQuery
// ========================================================================

describe('toQuery', () => {
  it('produces an ExploreQuery from the current state', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.addToZone('values', FIELDS[1]);
    const query = explorer.toQuery();
    expect(query.dimensions).toHaveLength(1);
    expect(query.dimensions[0].field).toBe('region');
    expect(query.measures).toHaveLength(1);
    expect(query.measures[0].field).toBe('revenue');
  });

  it('returns empty query from empty state', () => {
    const explorer = createDataExplorer();
    const query = explorer.toQuery();
    expect(query.dimensions).toEqual([]);
    expect(query.measures).toEqual([]);
    expect(query.filters).toEqual([]);
  });
});

// ========================================================================
// suggestChart
// ========================================================================

describe('suggestChart', () => {
  it('returns table when no measures', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    expect(explorer.suggestChart()).toBe('table');
  });

  it('returns kpi when no dimensions', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('values', FIELDS[1]);
    expect(explorer.suggestChart()).toBe('kpi');
  });

  it('returns bar for 1 non-date dim + 1 measure', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]); // region (string)
    explorer.addToZone('values', FIELDS[1]); // revenue
    expect(explorer.suggestChart()).toBe('bar');
  });

  it('returns line for 1 date dim + 1 measure', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('columns', FIELDS[2]); // created_at (date)
    explorer.addToZone('values', FIELDS[1]); // revenue
    expect(explorer.suggestChart()).toBe('line');
  });
});

// ========================================================================
// undo / redo
// ========================================================================

describe('undo / redo', () => {
  it('undo reverts the last drop zone change', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    expect(explorer.getState().dropZones.rows).toHaveLength(1);
    explorer.undo();
    expect(explorer.getState().dropZones.rows).toHaveLength(0);
  });

  it('redo re-applies the undone change', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.undo();
    explorer.redo();
    expect(explorer.getState().dropZones.rows).toHaveLength(1);
  });

  it('multiple undos work in sequence', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.addToZone('values', FIELDS[1]);
    expect(explorer.getState().dropZones.values).toHaveLength(1);
    explorer.undo();
    expect(explorer.getState().dropZones.values).toHaveLength(0);
    expect(explorer.getState().dropZones.rows).toHaveLength(1);
    explorer.undo();
    expect(explorer.getState().dropZones.rows).toHaveLength(0);
  });

  it('redo is cleared after a new action', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    explorer.undo();
    expect(explorer.canRedo()).toBe(true);
    explorer.addToZone('values', FIELDS[1]); // new action
    expect(explorer.canRedo()).toBe(false);
  });

  it('undo on empty stack is a no-op', () => {
    const explorer = createDataExplorer();
    explorer.undo(); // should not throw
    expect(explorer.canUndo()).toBe(false);
  });

  it('redo on empty stack is a no-op', () => {
    const explorer = createDataExplorer();
    explorer.redo(); // should not throw
    expect(explorer.canRedo()).toBe(false);
  });

  it('undo/redo notify subscribers', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    const handler = vi.fn();
    explorer.subscribe(handler);
    explorer.undo();
    expect(handler).toHaveBeenCalledTimes(1);
    explorer.redo();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

// ========================================================================
// subscribe
// ========================================================================

describe('subscribe', () => {
  it('unsubscribe stops notifications', () => {
    const explorer = createDataExplorer();
    const handler = vi.fn();
    const unsub = explorer.subscribe(handler);
    unsub();
    explorer.setDataSource('ds1', FIELDS);
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const explorer = createDataExplorer();
    const h1 = vi.fn();
    const h2 = vi.fn();
    explorer.subscribe(h1);
    explorer.subscribe(h2);
    explorer.setDataSource('ds1', FIELDS);
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});

// ========================================================================
// getState returns defensive copies
// ========================================================================

describe('getState defensive copies', () => {
  it('returns a copy of dropZones', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('ds1', FIELDS);
    explorer.addToZone('rows', FIELDS[0]);
    const s1 = explorer.getState();
    const s2 = explorer.getState();
    expect(s1.dropZones).not.toBe(s2.dropZones);
    expect(s1.dropZones.rows).not.toBe(s2.dropZones.rows);
    expect(s1.dropZones).toEqual(s2.dropZones);
  });
});
