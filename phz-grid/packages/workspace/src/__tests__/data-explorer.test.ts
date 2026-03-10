/**
 * data-explorer.test.ts — P.5: Data explorer orchestrator
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createDataExplorer,
  type DataExplorerState,
} from '../explore/phz-data-explorer.js';
import type { FieldMetadata } from '../data-adapter.js';

function makeField(name: string, dataType: FieldMetadata['dataType'], overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return { name, dataType, nullable: false, ...overrides };
}

const SAMPLE_FIELDS: FieldMetadata[] = [
  makeField('region', 'string', { cardinality: 'low' }),
  makeField('revenue', 'number', { semanticHint: 'measure' }),
  makeField('order_date', 'date'),
];

describe('createDataExplorer (P.5)', () => {
  it('creates explorer with initial empty state', () => {
    const explorer = createDataExplorer();
    const state = explorer.getState();
    expect(state.dropZones.rows).toEqual([]);
    expect(state.dropZones.values).toEqual([]);
    expect(state.dataSourceId).toBeUndefined();
    expect(state.fields).toEqual([]);
  });

  it('sets data source and fields', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    const state = explorer.getState();
    expect(state.dataSourceId).toBe('orders');
    expect(state.fields).toHaveLength(3);
  });

  it('adds a field via auto-place (double-click)', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.autoPlaceField(SAMPLE_FIELDS[0]); // region → rows
    expect(explorer.getState().dropZones.rows).toHaveLength(1);

    explorer.autoPlaceField(SAMPLE_FIELDS[1]); // revenue → values
    expect(explorer.getState().dropZones.values).toHaveLength(1);
  });

  it('adds a field to a specific zone', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('columns', SAMPLE_FIELDS[2]); // order_date
    expect(explorer.getState().dropZones.columns).toHaveLength(1);
  });

  it('removes a field from a zone', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    explorer.removeFromZone('rows', 'region');
    expect(explorer.getState().dropZones.rows).toHaveLength(0);
  });

  it('builds ExploreQuery from current state', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    explorer.addToZone('values', SAMPLE_FIELDS[1]);

    const query = explorer.toQuery();
    expect(query.dimensions).toHaveLength(1);
    expect(query.measures).toHaveLength(1);
    expect(query.limit).toBe(10000);
  });

  it('suggests chart type based on current query', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    explorer.addToZone('values', SAMPLE_FIELDS[1]);

    expect(explorer.suggestChart()).toBe('bar');
  });

  it('notifies subscribers on state change', () => {
    const explorer = createDataExplorer();
    const listener = vi.fn();
    explorer.subscribe(listener);
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    expect(listener).toHaveBeenCalled();
  });

  it('returns unsubscribe function', () => {
    const explorer = createDataExplorer();
    const listener = vi.fn();
    const unsub = explorer.subscribe(listener);
    unsub();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('DataExplorer undo/redo (P.5)', () => {
  it('supports undo after adding a field', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    expect(explorer.getState().dropZones.rows).toHaveLength(1);

    explorer.undo();
    expect(explorer.getState().dropZones.rows).toHaveLength(0);
  });

  it('supports redo after undo', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    explorer.undo();
    explorer.redo();
    expect(explorer.getState().dropZones.rows).toHaveLength(1);
  });

  it('canUndo returns false when at initial state', () => {
    const explorer = createDataExplorer();
    expect(explorer.canUndo()).toBe(false);
  });

  it('canRedo returns false when at latest state', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    expect(explorer.canRedo()).toBe(false);
  });

  it('clears redo stack on new action after undo', () => {
    const explorer = createDataExplorer();
    explorer.setDataSource('orders', SAMPLE_FIELDS);
    explorer.addToZone('rows', SAMPLE_FIELDS[0]);
    explorer.undo();
    explorer.addToZone('values', SAMPLE_FIELDS[1]);
    expect(explorer.canRedo()).toBe(false);
  });
});
