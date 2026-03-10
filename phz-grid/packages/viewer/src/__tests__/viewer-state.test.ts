/**
 * Tests for viewer-state.ts — Viewer Shell State Machine
 */
import { describe, it, expect } from 'vitest';
import {
  createViewerShellState,
  navigateTo,
  navigateBack,
  navigateForward,
  canGoBack,
  canGoForward,
  setError,
  setEmpty,
  setLoading,
  setAttentionCount,
  setViewerContext,
  setFilterContext,
  setMobileLayout,
} from '../viewer-state.js';

describe('viewer-state', () => {
  describe('createViewerShellState', () => {
    it('creates default state on catalog screen', () => {
      const state = createViewerShellState();
      expect(state.currentScreen).toBe('catalog');
      expect(state.activeArtifactId).toBeNull();
      expect(state.activeArtifactType).toBeNull();
      expect(state.navigationHistory).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.empty).toBeNull();
      expect(state.attentionCount).toBe(0);
      expect(state.viewerContext).toBeNull();
      expect(state.mobileLayout).toBe(false);
    });

    it('accepts partial overrides', () => {
      const state = createViewerShellState({
        currentScreen: 'dashboard',
        activeArtifactId: 'dash-1',
        attentionCount: 5,
      });
      expect(state.currentScreen).toBe('dashboard');
      expect(state.activeArtifactId).toBe('dash-1');
      expect(state.attentionCount).toBe(5);
    });
  });

  describe('navigateTo', () => {
    it('navigates to a new screen', () => {
      const state = createViewerShellState();
      const next = navigateTo(state, 'dashboard', 'dash-1', 'dashboard');
      expect(next.currentScreen).toBe('dashboard');
      expect(next.activeArtifactId).toBe('dash-1');
      expect(next.activeArtifactType).toBe('dashboard');
      expect(next.navigationHistory).toHaveLength(2);
      expect(next.historyIndex).toBe(1);
    });

    it('clears error and empty state', () => {
      let state = createViewerShellState();
      state = setError(state, { code: 'ERR', message: 'fail', severity: 'error', retryable: false, timestamp: 1 });
      state = setEmpty(state, { reason: 'no-data', title: 'empty', message: 'no data' });
      const next = navigateTo(state, 'report');
      expect(next.error).toBeNull();
      expect(next.empty).toBeNull();
      expect(next.loading).toBe(false);
    });

    it('truncates forward history', () => {
      let state = createViewerShellState();
      state = navigateTo(state, 'dashboard', 'dash-1');
      state = navigateTo(state, 'report', 'rpt-1');
      // Go back to dashboard
      state = navigateBack(state);
      expect(state.currentScreen).toBe('dashboard');
      // Navigate to explorer (truncates 'report' from forward history)
      state = navigateTo(state, 'explorer');
      expect(state.navigationHistory).toHaveLength(3);
      expect(state.historyIndex).toBe(2);
      expect(canGoForward(state)).toBe(false);
    });
  });

  describe('navigateBack / navigateForward', () => {
    it('navigates back through history', () => {
      let state = createViewerShellState();
      state = navigateTo(state, 'dashboard', 'dash-1');
      state = navigateTo(state, 'report', 'rpt-1');
      expect(canGoBack(state)).toBe(true);
      expect(canGoForward(state)).toBe(false);

      state = navigateBack(state);
      expect(state.currentScreen).toBe('dashboard');
      expect(state.activeArtifactId).toBe('dash-1');
      expect(canGoForward(state)).toBe(true);

      state = navigateBack(state);
      expect(state.currentScreen).toBe('catalog');
      expect(canGoBack(state)).toBe(false);
    });

    it('navigates forward', () => {
      let state = createViewerShellState();
      state = navigateTo(state, 'dashboard', 'dash-1');
      state = navigateBack(state);
      state = navigateForward(state);
      expect(state.currentScreen).toBe('dashboard');
      expect(state.activeArtifactId).toBe('dash-1');
    });

    it('returns same state when cannot go back', () => {
      const state = createViewerShellState();
      expect(navigateBack(state)).toBe(state);
    });

    it('returns same state when cannot go forward', () => {
      const state = createViewerShellState();
      expect(navigateForward(state)).toBe(state);
    });
  });

  describe('canGoBack / canGoForward', () => {
    it('returns false for initial state', () => {
      const state = createViewerShellState();
      expect(canGoBack(state)).toBe(false);
      expect(canGoForward(state)).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error and clears loading', () => {
      let state = createViewerShellState();
      state = setLoading(state, true);
      const error = { code: 'E01', message: 'test', severity: 'error' as const, retryable: true, timestamp: 1 };
      state = setError(state, error);
      expect(state.error).toEqual(error);
      expect(state.loading).toBe(false);
    });

    it('clears error when null', () => {
      let state = createViewerShellState();
      state = setError(state, { code: 'E01', message: 'test', severity: 'error', retryable: false, timestamp: 1 });
      state = setError(state, null);
      expect(state.error).toBeNull();
    });
  });

  describe('setEmpty', () => {
    it('sets empty state', () => {
      const empty = { reason: 'no-data' as const, title: 'empty', message: 'no data' };
      const state = setEmpty(createViewerShellState(), empty);
      expect(state.empty).toEqual(empty);
    });
  });

  describe('setLoading', () => {
    it('sets loading and clears error when starting load', () => {
      let state = createViewerShellState();
      state = setError(state, { code: 'E01', message: 'test', severity: 'error', retryable: false, timestamp: 1 });
      state = setLoading(state, true);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('preserves error when stopping load', () => {
      let state = createViewerShellState();
      state = { ...state, error: { code: 'E01', message: 'test', severity: 'error', retryable: false, timestamp: 1 } };
      state = setLoading(state, false);
      expect(state.loading).toBe(false);
      expect(state.error).not.toBeNull();
    });
  });

  describe('setAttentionCount', () => {
    it('sets count', () => {
      const state = setAttentionCount(createViewerShellState(), 7);
      expect(state.attentionCount).toBe(7);
    });

    it('clamps to zero', () => {
      const state = setAttentionCount(createViewerShellState(), -3);
      expect(state.attentionCount).toBe(0);
    });
  });

  describe('setViewerContext', () => {
    it('sets viewer context', () => {
      const ctx = { userId: 'u1', roles: ['viewer'] };
      const state = setViewerContext(createViewerShellState(), ctx);
      expect(state.viewerContext).toEqual(ctx);
    });
  });

  describe('setFilterContext', () => {
    it('sets filter context', () => {
      const mockFc = {
        getState: () => ({ values: new Map(), activeFilterIds: new Set(), crossFilters: [], lastUpdated: 0, source: 'default' as const }),
        setFilter: () => {},
        clearFilter: () => {},
        clearAll: () => {},
        applyCrossFilter: () => {},
        clearCrossFilter: () => {},
        resolveFilters: () => [],
        resolveFiltersForSource: () => [],
        subscribe: () => () => {},
        setSource: () => {},
      };
      const state = setFilterContext(createViewerShellState(), mockFc);
      expect(state.filterContext).toBe(mockFc);
    });
  });

  describe('setMobileLayout', () => {
    it('toggles mobile layout', () => {
      let state = createViewerShellState();
      state = setMobileLayout(state, true);
      expect(state.mobileLayout).toBe(true);
      state = setMobileLayout(state, false);
      expect(state.mobileLayout).toBe(false);
    });
  });
});
