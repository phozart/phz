/**
 * Tests for pivot preview controller and toExploreQuery from the workspace explore module.
 *
 * Covers PreviewController lifecycle, toExploreQuery conversion, and subscribe/notify.
 */
import {
  createPreviewController,
  toExploreQuery,
  createDropZoneState,
  addFieldToZone,
} from '@phozart/phz-workspace/explore';

interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

// ========================================================================
// toExploreQuery
// ========================================================================

describe('toExploreQuery', () => {
  it('converts empty drop zone state to empty ExploreQuery', () => {
    const state = createDropZoneState();
    const query = toExploreQuery(state);
    expect(query.dimensions).toEqual([]);
    expect(query.measures).toEqual([]);
    expect(query.filters).toEqual([]);
    expect(query.limit).toBe(10000);
  });

  it('includes rows and columns as dimensions', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', { name: 'region', dataType: 'string', nullable: false });
    state = addFieldToZone(state, 'columns', { name: 'year', dataType: 'date', nullable: false });
    const query = toExploreQuery(state);
    expect(query.dimensions).toHaveLength(2);
    expect(query.dimensions[0].field).toBe('region');
    expect(query.dimensions[1].field).toBe('year');
  });

  it('maps values to measures with aggregation', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'values', { name: 'revenue', dataType: 'number', nullable: false });
    const query = toExploreQuery(state);
    expect(query.measures).toHaveLength(1);
    expect(query.measures[0].field).toBe('revenue');
    expect(query.measures[0].aggregation).toBe('sum');
  });

  it('maps filters to ExploreFilterSlot', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'filters', { name: 'active', dataType: 'boolean', nullable: false });
    const query = toExploreQuery(state);
    expect(query.filters).toHaveLength(1);
    expect(query.filters[0].field).toBe('active');
    expect(query.filters[0].operator).toBe('eq');
  });

  it('respects custom limit option', () => {
    const state = createDropZoneState();
    const query = toExploreQuery(state, { limit: 500 });
    expect(query.limit).toBe(500);
  });

  it('uses 10000 as default limit when no options provided', () => {
    const state = createDropZoneState();
    const query = toExploreQuery(state);
    expect(query.limit).toBe(10000);
  });

  it('combines multiple rows, columns, values, and filters', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', { name: 'region', dataType: 'string', nullable: false });
    state = addFieldToZone(state, 'rows', { name: 'category', dataType: 'string', nullable: false });
    state = addFieldToZone(state, 'columns', { name: 'year', dataType: 'date', nullable: false });
    state = addFieldToZone(state, 'values', { name: 'revenue', dataType: 'number', nullable: false });
    state = addFieldToZone(state, 'values', { name: 'cost', dataType: 'number', nullable: false });
    state = addFieldToZone(state, 'filters', { name: 'active', dataType: 'boolean', nullable: false });

    const query = toExploreQuery(state);
    expect(query.dimensions).toHaveLength(3); // 2 rows + 1 column
    expect(query.measures).toHaveLength(2);
    expect(query.filters).toHaveLength(1);
  });
});

// ========================================================================
// createPreviewController
// ========================================================================

describe('createPreviewController', () => {
  it('starts with table mode', () => {
    const ctrl = createPreviewController();
    expect(ctrl.getMode()).toBe('table');
  });

  it('starts not loading', () => {
    const ctrl = createPreviewController();
    expect(ctrl.isLoading()).toBe(false);
  });

  it('starts with null result', () => {
    const ctrl = createPreviewController();
    expect(ctrl.getResult()).toBeNull();
  });

  it('setMode changes the mode', () => {
    const ctrl = createPreviewController();
    ctrl.setMode('chart');
    expect(ctrl.getMode()).toBe('chart');
  });

  it('setMode to sql', () => {
    const ctrl = createPreviewController();
    ctrl.setMode('sql');
    expect(ctrl.getMode()).toBe('sql');
  });

  it('setLoading changes loading state', () => {
    const ctrl = createPreviewController();
    ctrl.setLoading(true);
    expect(ctrl.isLoading()).toBe(true);
    ctrl.setLoading(false);
    expect(ctrl.isLoading()).toBe(false);
  });

  it('setResult stores the result', () => {
    const ctrl = createPreviewController();
    const result = {
      columns: [{ name: 'a', dataType: 'string' }],
      rows: [['hello']],
      metadata: { totalRows: 1, truncated: false, queryTimeMs: 10 },
    };
    ctrl.setResult(result);
    expect(ctrl.getResult()).toEqual(result);
  });

  it('subscribe notifies on setMode', () => {
    const ctrl = createPreviewController();
    const handler = vi.fn();
    ctrl.subscribe(handler);
    ctrl.setMode('chart');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('subscribe notifies on setResult', () => {
    const ctrl = createPreviewController();
    const handler = vi.fn();
    ctrl.subscribe(handler);
    ctrl.setResult({
      columns: [],
      rows: [],
      metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('setLoading does NOT notify (not wired to notify)', () => {
    const ctrl = createPreviewController();
    const handler = vi.fn();
    ctrl.subscribe(handler);
    ctrl.setLoading(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribe stops notifications', () => {
    const ctrl = createPreviewController();
    const handler = vi.fn();
    const unsub = ctrl.subscribe(handler);
    unsub();
    ctrl.setMode('chart');
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const ctrl = createPreviewController();
    const h1 = vi.fn();
    const h2 = vi.fn();
    ctrl.subscribe(h1);
    ctrl.subscribe(h2);
    ctrl.setMode('sql');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
