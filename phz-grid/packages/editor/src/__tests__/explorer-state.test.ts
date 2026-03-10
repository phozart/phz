/**
 * Tests for Explorer State (B-2.10)
 */
import {
  createExplorerState,
  addDimension,
  removeDimension,
  addMeasure,
  removeMeasure,
  addExplorerFilter,
  removeExplorerFilter,
  setExplorerSort,
  setExplorerLimit,
  setExplorerExecuting,
  setExplorerResults,
  setSuggestedChartType,
  openSaveDialog,
  updateSaveTarget,
  closeSaveDialog,
  setExplorerDataSource,
  setExplorerError,
} from '../screens/explorer-state.js';

describe('createExplorerState', () => {
  it('creates with defaults', () => {
    const state = createExplorerState();
    expect(state.dataSourceId).toBe('');
    expect(state.query.dimensions).toEqual([]);
    expect(state.query.measures).toEqual([]);
    expect(state.query.filters).toEqual([]);
    expect(state.availableFields).toEqual([]);
    expect(state.suggestedChartType).toBeNull();
    expect(state.previewData).toBeNull();
    expect(state.executing).toBe(false);
    expect(state.saveDialogOpen).toBe(false);
    expect(state.saveTarget).toBeNull();
  });

  it('creates with data source and overrides', () => {
    const state = createExplorerState('ds-1', {
      availableFields: ['name', 'amount', 'date'],
    });
    expect(state.dataSourceId).toBe('ds-1');
    expect(state.availableFields).toHaveLength(3);
  });
});

describe('query building', () => {
  it('adds and removes dimensions', () => {
    let state = createExplorerState('ds-1');
    state = addDimension(state, { field: 'region' });
    expect(state.query.dimensions).toHaveLength(1);
    expect(state.query.dimensions[0].field).toBe('region');
    expect(state.previewData).toBeNull(); // invalidated

    state = addDimension(state, { field: 'product', alias: 'Product Name' });
    expect(state.query.dimensions).toHaveLength(2);

    state = removeDimension(state, 'region');
    expect(state.query.dimensions).toHaveLength(1);
    expect(state.query.dimensions[0].field).toBe('product');
  });

  it('adds and removes measures', () => {
    let state = createExplorerState('ds-1');
    state = addMeasure(state, { field: 'amount', aggregation: 'sum' });
    expect(state.query.measures).toHaveLength(1);

    state = addMeasure(state, { field: 'quantity', aggregation: 'avg' });
    expect(state.query.measures).toHaveLength(2);

    state = removeMeasure(state, 'amount');
    expect(state.query.measures).toHaveLength(1);
    expect(state.query.measures[0].field).toBe('quantity');
  });

  it('adds and removes filters', () => {
    let state = createExplorerState('ds-1');
    state = addExplorerFilter(state, { field: 'status', operator: 'eq', value: 'active' });
    expect(state.query.filters).toHaveLength(1);

    state = addExplorerFilter(state, { field: 'amount', operator: 'gt', value: 100 });
    expect(state.query.filters).toHaveLength(2);

    state = removeExplorerFilter(state, 0);
    expect(state.query.filters).toHaveLength(1);
    expect(state.query.filters[0].field).toBe('amount');
  });

  it('sets sort', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerSort(state, [{ field: 'amount', direction: 'desc' }]);
    expect(state.query.sort).toHaveLength(1);
  });

  it('sets limit', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerLimit(state, 100);
    expect(state.query.limit).toBe(100);

    state = setExplorerLimit(state, undefined);
    expect(state.query.limit).toBeUndefined();
  });

  it('invalidates preview on query changes', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerResults(state, [['a', 1]], 1);
    expect(state.previewData).not.toBeNull();

    state = addDimension(state, { field: 'x' });
    expect(state.previewData).toBeNull();
  });
});

describe('query execution', () => {
  it('sets executing state', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerExecuting(state, true);
    expect(state.executing).toBe(true);
  });

  it('sets results', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerResults(state, [['a', 1], ['b', 2]], 2);
    expect(state.previewData).toHaveLength(2);
    expect(state.resultRowCount).toBe(2);
    expect(state.executing).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets suggested chart type', () => {
    let state = createExplorerState('ds-1');
    state = setSuggestedChartType(state, 'bar-chart');
    expect(state.suggestedChartType).toBe('bar-chart');
  });
});

describe('save-to-artifact flow', () => {
  it('opens save dialog', () => {
    let state = createExplorerState('ds-1');
    state = openSaveDialog(state, 'report', 'My Report');
    expect(state.saveDialogOpen).toBe(true);
    expect(state.saveTarget).toEqual({
      type: 'report',
      name: 'My Report',
      artifactId: undefined,
    });
  });

  it('opens save dialog with artifact ID', () => {
    let state = createExplorerState('ds-1');
    state = openSaveDialog(state, 'dashboard-widget', 'Widget', 'dash-1');
    expect(state.saveTarget).toEqual({
      type: 'dashboard-widget',
      name: 'Widget',
      artifactId: 'dash-1',
    });
  });

  it('updates save target', () => {
    let state = createExplorerState('ds-1');
    state = openSaveDialog(state, 'report');
    state = updateSaveTarget(state, { name: 'Updated Name' });
    expect(state.saveTarget!.name).toBe('Updated Name');
  });

  it('updateSaveTarget is no-op when dialog not open', () => {
    const state = createExplorerState('ds-1');
    const same = updateSaveTarget(state, { name: 'x' });
    expect(same).toBe(state);
  });

  it('closes save dialog', () => {
    let state = createExplorerState('ds-1');
    state = openSaveDialog(state, 'report');
    state = closeSaveDialog(state);
    expect(state.saveDialogOpen).toBe(false);
    expect(state.saveTarget).toBeNull();
  });
});

describe('data source management', () => {
  it('sets data source and resets query', () => {
    let state = createExplorerState('ds-1');
    state = addDimension(state, { field: 'region' });
    state = setExplorerResults(state, [['a']], 1);

    state = setExplorerDataSource(state, 'ds-2', ['col1', 'col2']);
    expect(state.dataSourceId).toBe('ds-2');
    expect(state.availableFields).toEqual(['col1', 'col2']);
    expect(state.query.dimensions).toEqual([]);
    expect(state.previewData).toBeNull();
  });
});

describe('error handling', () => {
  it('sets error and clears executing', () => {
    let state = createExplorerState('ds-1');
    state = setExplorerExecuting(state, true);
    state = setExplorerError(state, 'query timeout');
    expect(state.error).toBe('query timeout');
    expect(state.executing).toBe(false);
  });
});
