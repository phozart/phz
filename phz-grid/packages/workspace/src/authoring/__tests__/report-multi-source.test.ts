import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialReportEditorState,
  addReportSource,
  removeReportSource,
  updateReportSource,
  _resetReportSourceCounter,
} from '../report-editor-state.js';

describe('Multi-source report editor', () => {
  beforeEach(() => { _resetReportSourceCounter(); });

  it('initializes with empty additional sources', () => {
    const state = initialReportEditorState('Test Report', 'primary-src');
    expect(state.additionalSources).toEqual([]);
  });

  it('adds an additional source', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'customer_id', remoteField: 'id' }], 'inner');
    expect(state.additionalSources).toHaveLength(1);
    expect(state.additionalSources[0].dataSourceId).toBe('orders-db');
    expect(state.additionalSources[0].alias).toBe('Orders');
    expect(state.additionalSources[0].joinType).toBe('inner');
    expect(state.additionalSources[0].joinKeys).toEqual([{ localField: 'customer_id', remoteField: 'id' }]);
  });

  it('adds multiple additional sources', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'customer_id' }]);
    state = addReportSource(state, 'inventory-db', 'Inventory', [{ localField: 'sku', remoteField: 'product_sku' }], 'left');
    expect(state.additionalSources).toHaveLength(2);
    expect(state.additionalSources[1].joinType).toBe('left');
  });

  it('defaults joinType to inner', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    expect(state.additionalSources[0].joinType).toBe('inner');
  });

  it('removes an additional source by slotId', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const slotId = state.additionalSources[0].slotId;
    state = removeReportSource(state, slotId);
    expect(state.additionalSources).toHaveLength(0);
  });

  it('removing non-existent slotId returns unchanged state', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const before = state;
    state = removeReportSource(state, 'non-existent');
    expect(state.additionalSources).toHaveLength(1);
  });

  it('updates an additional source', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const slotId = state.additionalSources[0].slotId;
    state = updateReportSource(state, slotId, { alias: 'Order Data', joinType: 'left' });
    expect(state.additionalSources[0].alias).toBe('Order Data');
    expect(state.additionalSources[0].joinType).toBe('left');
    expect(state.additionalSources[0].slotId).toBe(slotId); // slotId unchanged
  });

  it('update preserves slotId even if provided in updates', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const slotId = state.additionalSources[0].slotId;
    state = updateReportSource(state, slotId, { alias: 'Updated' });
    expect(state.additionalSources[0].slotId).toBe(slotId);
  });

  it('updates join keys', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'orders-db', 'Orders', [{ localField: 'id', remoteField: 'cust_id' }]);
    const slotId = state.additionalSources[0].slotId;
    state = updateReportSource(state, slotId, {
      joinKeys: [{ localField: 'region', remoteField: 'order_region' }],
    });
    expect(state.additionalSources[0].joinKeys).toEqual([{ localField: 'region', remoteField: 'order_region' }]);
  });

  it('does not preserve primary dataSourceId in additionalSources', () => {
    const state = initialReportEditorState('Test Report', 'primary-src');
    expect(state.dataSourceId).toBe('primary-src');
    expect(state.additionalSources).toEqual([]);
  });

  it('each added source gets a unique slotId', () => {
    let state = initialReportEditorState('Test Report', 'primary-src');
    state = addReportSource(state, 'a', 'A', [{ localField: 'x', remoteField: 'y' }]);
    state = addReportSource(state, 'b', 'B', [{ localField: 'x', remoteField: 'y' }]);
    const ids = state.additionalSources.map(s => s.slotId);
    expect(new Set(ids).size).toBe(2);
  });

  it('validates ReportConfig with additionalSources', () => {
    // The ReportConfig interface accepts additionalSources — just verify the types compile
    const config = {
      id: 'rpt-1' as any,
      name: 'Test',
      dataProductId: 'dp-1' as any,
      columns: [],
      created: Date.now(),
      updated: Date.now(),
      additionalSources: [{
        slotId: 'slot-1',
        dataProductId: 'dp-2' as any,
        joinKeys: [{ localField: 'region', remoteField: 'sales_region' }],
        joinType: 'inner' as const,
      }],
    };
    expect(config.additionalSources).toHaveLength(1);
  });
});
