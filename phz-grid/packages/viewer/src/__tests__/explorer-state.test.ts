/**
 * Tests for explorer-state.ts — Explorer Screen State
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createExplorerScreenState,
  setDataSources,
  selectDataSource,
  setFields,
  setExplorer,
  setPreviewMode,
  setSuggestedChartType,
  setFieldSearch,
  getExplorerSnapshot,
  getFilteredFields,
} from '../screens/explorer-state.js';
import type { DataSourceMeta, FieldMetadata } from '@phozart/phz-shared/adapters';

const sampleSources: DataSourceMeta[] = [
  { id: 'src-1', name: 'Sales Data', fieldCount: 12 },
  { id: 'src-2', name: 'Inventory', fieldCount: 8, rowCount: 5000 },
];

const sampleFields: FieldMetadata[] = [
  { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
  { name: 'region', dataType: 'string', nullable: false, semanticHint: 'dimension' },
  { name: 'date', dataType: 'date', nullable: false, semanticHint: 'timestamp' },
  { name: 'is_active', dataType: 'boolean', nullable: true },
];

describe('explorer-state', () => {
  describe('createExplorerScreenState', () => {
    it('creates default state', () => {
      const state = createExplorerScreenState();
      expect(state.dataSources).toEqual([]);
      expect(state.selectedSourceId).toBeNull();
      expect(state.fields).toEqual([]);
      expect(state.explorer).toBeNull();
      expect(state.previewMode).toBe('table');
      expect(state.suggestedChartType).toBeNull();
      expect(state.loadingDataSources).toBe(false);
      expect(state.loadingFields).toBe(false);
      expect(state.fieldSearchQuery).toBe('');
    });
  });

  describe('setDataSources', () => {
    it('sets data sources and clears loading', () => {
      let state = createExplorerScreenState({ loadingDataSources: true });
      state = setDataSources(state, sampleSources);
      expect(state.dataSources).toHaveLength(2);
      expect(state.loadingDataSources).toBe(false);
    });
  });

  describe('selectDataSource', () => {
    it('selects source and clears fields', () => {
      let state = createExplorerScreenState({ fields: sampleFields });
      state = selectDataSource(state, 'src-1');
      expect(state.selectedSourceId).toBe('src-1');
      expect(state.fields).toEqual([]);
      expect(state.loadingFields).toBe(true);
      expect(state.suggestedChartType).toBeNull();
      expect(state.fieldSearchQuery).toBe('');
    });
  });

  describe('setFields', () => {
    it('sets fields and clears loading', () => {
      let state = createExplorerScreenState({ selectedSourceId: 'src-1', loadingFields: true });
      state = setFields(state, sampleFields);
      expect(state.fields).toHaveLength(4);
      expect(state.loadingFields).toBe(false);
    });

    it('calls explorer.setDataSource if explorer is set', () => {
      const mockExplorer = {
        getState: vi.fn(),
        setDataSource: vi.fn(),
        autoPlaceField: vi.fn(),
        addToZone: vi.fn(),
        removeFromZone: vi.fn(),
        toQuery: vi.fn(),
        suggestChart: vi.fn(),
        subscribe: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: vi.fn(),
        canRedo: vi.fn(),
      };
      let state = createExplorerScreenState({
        selectedSourceId: 'src-1',
        explorer: mockExplorer,
      });
      state = setFields(state, sampleFields);
      expect(mockExplorer.setDataSource).toHaveBeenCalledWith('src-1', sampleFields);
    });
  });

  describe('setExplorer', () => {
    it('sets explorer reference', () => {
      const mockExplorer = { getState: vi.fn() } as any;
      const state = setExplorer(createExplorerScreenState(), mockExplorer);
      expect(state.explorer).toBe(mockExplorer);
    });
  });

  describe('setPreviewMode', () => {
    it('sets preview mode', () => {
      let state = createExplorerScreenState();
      state = setPreviewMode(state, 'chart');
      expect(state.previewMode).toBe('chart');
      state = setPreviewMode(state, 'pivot');
      expect(state.previewMode).toBe('pivot');
    });
  });

  describe('setSuggestedChartType', () => {
    it('sets suggested chart type', () => {
      const state = setSuggestedChartType(createExplorerScreenState(), 'bar');
      expect(state.suggestedChartType).toBe('bar');
    });
  });

  describe('setFieldSearch / getFilteredFields', () => {
    it('filters fields by search query', () => {
      let state = createExplorerScreenState({ fields: sampleFields });
      state = setFieldSearch(state, 'rev');
      const filtered = getFilteredFields(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('revenue');
    });

    it('returns all fields on empty search', () => {
      const state = createExplorerScreenState({ fields: sampleFields });
      expect(getFilteredFields(state)).toHaveLength(4);
    });

    it('is case-insensitive', () => {
      let state = createExplorerScreenState({ fields: sampleFields });
      state = setFieldSearch(state, 'REGION');
      expect(getFilteredFields(state)).toHaveLength(1);
    });
  });

  describe('getExplorerSnapshot', () => {
    it('returns null when no explorer', () => {
      expect(getExplorerSnapshot(createExplorerScreenState())).toBeNull();
    });

    it('returns explorer state when set', () => {
      const mockState = { fields: [], dropZones: { rows: [], columns: [], values: [], filters: [] } };
      const mockExplorer = { getState: vi.fn().mockReturnValue(mockState) } as any;
      const state = setExplorer(createExplorerScreenState(), mockExplorer);
      expect(getExplorerSnapshot(state)).toBe(mockState);
    });
  });
});
