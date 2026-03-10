/**
 * pivot-preview.test.ts — P.3: Pivot preview headless logic
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createPreviewController,
  toExploreQuery,
} from '../explore/phz-pivot-preview.js';
import { createDropZoneState, addFieldToZone } from '../explore/phz-drop-zones.js';
import type { FieldMetadata } from '../data-adapter.js';

function makeField(name: string, dataType: FieldMetadata['dataType']): FieldMetadata {
  return { name, dataType, nullable: false };
}

describe('toExploreQuery (P.3)', () => {
  it('converts drop zone state to ExploreQuery', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', makeField('region', 'string'));
    state = addFieldToZone(state, 'values', makeField('revenue', 'number'));

    const query = toExploreQuery(state);
    expect(query.dimensions).toEqual([{ field: 'region' }]);
    expect(query.measures).toEqual([{ field: 'revenue', aggregation: 'sum' }]);
    expect(query.filters).toEqual([]);
  });

  it('includes columns as dimensions', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', makeField('region', 'string'));
    state = addFieldToZone(state, 'columns', makeField('year', 'string'));

    const query = toExploreQuery(state);
    expect(query.dimensions).toHaveLength(2);
    expect(query.dimensions.map(d => d.field)).toContain('year');
  });

  it('converts filter zone entries to ExploreFilterSlot', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'filters', makeField('status', 'string'));

    const query = toExploreQuery(state);
    expect(query.filters).toHaveLength(1);
    expect(query.filters[0].field).toBe('status');
  });

  it('applies default limit of 10000', () => {
    const state = createDropZoneState();
    const query = toExploreQuery(state);
    expect(query.limit).toBe(10000);
  });

  it('allows custom limit override', () => {
    const state = createDropZoneState();
    const query = toExploreQuery(state, { limit: 500 });
    expect(query.limit).toBe(500);
  });
});

describe('createPreviewController (P.3)', () => {
  it('starts in table mode', () => {
    const ctrl = createPreviewController();
    expect(ctrl.getMode()).toBe('table');
  });

  it('toggles between table, chart, and sql modes', () => {
    const ctrl = createPreviewController();
    ctrl.setMode('chart');
    expect(ctrl.getMode()).toBe('chart');
    ctrl.setMode('sql');
    expect(ctrl.getMode()).toBe('sql');
    ctrl.setMode('table');
    expect(ctrl.getMode()).toBe('table');
  });

  it('tracks loading state', () => {
    const ctrl = createPreviewController();
    expect(ctrl.isLoading()).toBe(false);
    ctrl.setLoading(true);
    expect(ctrl.isLoading()).toBe(true);
  });

  it('stores last result', () => {
    const ctrl = createPreviewController();
    const result = {
      columns: [{ name: 'region', dataType: 'string' }],
      rows: [['US']],
      metadata: { totalRows: 1, truncated: false, queryTimeMs: 42 },
    };
    ctrl.setResult(result);
    expect(ctrl.getResult()).toEqual(result);
  });

  it('notifies subscribers on mode change', () => {
    const ctrl = createPreviewController();
    const listener = vi.fn();
    ctrl.subscribe(listener);
    ctrl.setMode('chart');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers on result change', () => {
    const ctrl = createPreviewController();
    const listener = vi.fn();
    ctrl.subscribe(listener);
    ctrl.setResult({
      columns: [],
      rows: [],
      metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns unsubscribe function', () => {
    const ctrl = createPreviewController();
    const listener = vi.fn();
    const unsub = ctrl.subscribe(listener);
    unsub();
    ctrl.setMode('sql');
    expect(listener).not.toHaveBeenCalled();
  });
});
