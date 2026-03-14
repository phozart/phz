/**
 * Tests for Measure Palette State (B-2.07)
 */
import {
  createMeasurePaletteState,
  searchMeasures,
  filterByCategory,
  setActiveTab,
  selectPaletteItem,
  deselectPaletteItem,
  refreshPaletteData,
} from '../authoring/measure-palette-state.js';
import type { MeasureDefinition, KPIDefinition } from '@phozart/shared/adapters';

const MEASURES: MeasureDefinition[] = [
  { id: 'm1', name: 'Revenue', expression: 'SUM(amount)', dataType: 'currency', dataSourceId: 'ds1', tags: ['finance'], createdAt: 1000, updatedAt: 1000 },
  { id: 'm2', name: 'User Count', expression: 'COUNT(user_id)', dataType: 'number', dataSourceId: 'ds1', tags: ['users'], createdAt: 1000, updatedAt: 1000 },
  { id: 'm3', name: 'Profit Margin', expression: 'profit/total*100', dataType: 'percentage', dataSourceId: 'ds1', tags: ['finance'], createdAt: 1000, updatedAt: 1000 },
];

const KPIS: KPIDefinition[] = [
  { id: 'k1', name: 'MRR', measureId: 'm1', targetDirection: 'higher-is-better', tags: ['finance'], createdAt: 1000, updatedAt: 1000 },
  { id: 'k2', name: 'DAU', measureId: 'm2', targetDirection: 'higher-is-better', tags: ['users'], createdAt: 1000, updatedAt: 1000 },
];

describe('createMeasurePaletteState', () => {
  it('creates state from measures and KPIs', () => {
    const state = createMeasurePaletteState(MEASURES, KPIS);
    expect(state.measures).toHaveLength(3);
    expect(state.kpis).toHaveLength(2);
    expect(state.filteredMeasures).toHaveLength(3);
    expect(state.filteredKPIs).toHaveLength(2);
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBeNull();
    expect(state.activeTab).toBe('measures');
    expect(state.selectedItemId).toBeNull();
  });

  it('extracts unique categories from tags', () => {
    const state = createMeasurePaletteState(MEASURES, KPIS);
    expect(state.categories).toEqual(['finance', 'users']);
  });
});

describe('searchMeasures', () => {
  it('filters measures by name', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'revenue');
    expect(state.filteredMeasures).toHaveLength(1);
    expect(state.filteredMeasures[0].id).toBe('m1');
  });

  it('filters measures by expression', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'SUM');
    expect(state.filteredMeasures).toHaveLength(1);
  });

  it('filters KPIs by name', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'MRR');
    expect(state.filteredKPIs).toHaveLength(1);
    expect(state.filteredKPIs[0].id).toBe('k1');
  });

  it('shows all when search is empty', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'revenue');
    state = searchMeasures(state, '');
    expect(state.filteredMeasures).toHaveLength(3);
    expect(state.filteredKPIs).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'PROFIT');
    expect(state.filteredMeasures).toHaveLength(1);
  });
});

describe('filterByCategory', () => {
  it('filters by finance category', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = filterByCategory(state, 'finance');
    expect(state.filteredMeasures).toHaveLength(2); // Revenue, Profit Margin
    expect(state.filteredKPIs).toHaveLength(1); // MRR
  });

  it('filters by users category', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = filterByCategory(state, 'users');
    expect(state.filteredMeasures).toHaveLength(1); // User Count
    expect(state.filteredKPIs).toHaveLength(1); // DAU
  });

  it('clears filter with null', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = filterByCategory(state, 'finance');
    state = filterByCategory(state, null);
    expect(state.filteredMeasures).toHaveLength(3);
    expect(state.filteredKPIs).toHaveLength(2);
  });

  it('combines with search', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'revenue');
    state = filterByCategory(state, 'finance');
    expect(state.filteredMeasures).toHaveLength(1);
    expect(state.filteredMeasures[0].id).toBe('m1');
  });
});

describe('setActiveTab', () => {
  it('switches to KPIs tab', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = setActiveTab(state, 'kpis');
    expect(state.activeTab).toBe('kpis');
  });

  it('switches back to measures tab', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = setActiveTab(state, 'kpis');
    state = setActiveTab(state, 'measures');
    expect(state.activeTab).toBe('measures');
  });
});

describe('selectPaletteItem / deselectPaletteItem', () => {
  it('selects a measure', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = selectPaletteItem(state, 'm1', 'measure');
    expect(state.selectedItemId).toBe('m1');
    expect(state.selectedItemType).toBe('measure');
  });

  it('selects a KPI', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = selectPaletteItem(state, 'k1', 'kpi');
    expect(state.selectedItemId).toBe('k1');
    expect(state.selectedItemType).toBe('kpi');
  });

  it('deselects', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = selectPaletteItem(state, 'm1', 'measure');
    state = deselectPaletteItem(state);
    expect(state.selectedItemId).toBeNull();
    expect(state.selectedItemType).toBeNull();
  });
});

describe('refreshPaletteData', () => {
  it('replaces data and re-applies filters', () => {
    let state = createMeasurePaletteState(MEASURES, KPIS);
    state = searchMeasures(state, 'revenue');
    expect(state.filteredMeasures).toHaveLength(1);

    const newMeasures: MeasureDefinition[] = [
      { id: 'm4', name: 'Revenue v2', expression: 'SUM(net_amount)', dataType: 'currency', dataSourceId: 'ds1', tags: ['finance'], createdAt: 2000, updatedAt: 2000 },
    ];
    state = refreshPaletteData(state, newMeasures, []);
    expect(state.measures).toHaveLength(1);
    expect(state.filteredMeasures).toHaveLength(1); // "revenue" still matches
    expect(state.filteredMeasures[0].id).toBe('m4');
    expect(state.kpis).toHaveLength(0);
    expect(state.filteredKPIs).toHaveLength(0);
  });
});
