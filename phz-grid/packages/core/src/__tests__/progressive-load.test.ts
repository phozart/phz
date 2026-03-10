import { describe, it, expect } from 'vitest';
import {
  createInitialProgressiveState,
  startProgressiveLoad,
  onChunkReceived,
  onAllChunksComplete,
  startRefresh,
  shouldShowOverlay,
  shouldShowFooterIndicator,
  getProgressMessage,
  getNextOffset,
} from '../progressive-load.js';
import type { ProgressiveLoadState, ProgressiveLoadConfig } from '../progressive-load.js';

describe('progressive-load state machine', () => {
  // --- createInitialProgressiveState ---

  describe('createInitialProgressiveState', () => {
    it('creates state with default values', () => {
      const state = createInitialProgressiveState();
      expect(state.phase).toBe('idle');
      expect(state.loadedRowCount).toBe(0);
      expect(state.estimatedTotalCount).toBe(0);
      expect(state.currentOffset).toBe(0);
      expect(state.chunkSize).toBe(500);
      expect(state.refreshIntervalMs).toBe(0);
      expect(state.queryId).toBe(0);
      expect(state.lastRefreshAt).toBe(0);
    });

    it('applies custom chunkSize', () => {
      const state = createInitialProgressiveState({ chunkSize: 100 });
      expect(state.chunkSize).toBe(100);
    });

    it('applies custom refreshIntervalMs', () => {
      const state = createInitialProgressiveState({ refreshIntervalMs: 5000 });
      expect(state.refreshIntervalMs).toBe(5000);
    });

    it('applies both options', () => {
      const config: ProgressiveLoadConfig = { chunkSize: 200, refreshIntervalMs: 10000 };
      const state = createInitialProgressiveState(config);
      expect(state.chunkSize).toBe(200);
      expect(state.refreshIntervalMs).toBe(10000);
    });

    it('handles undefined config', () => {
      const state = createInitialProgressiveState(undefined);
      expect(state.chunkSize).toBe(500);
      expect(state.refreshIntervalMs).toBe(0);
    });
  });

  // --- startProgressiveLoad ---

  describe('startProgressiveLoad', () => {
    it('transitions to initial phase', () => {
      const state = createInitialProgressiveState();
      const next = startProgressiveLoad(state, 1);
      expect(next.phase).toBe('initial');
      expect(next.queryId).toBe(1);
      expect(next.loadedRowCount).toBe(0);
      expect(next.estimatedTotalCount).toBe(0);
      expect(next.currentOffset).toBe(0);
    });

    it('resets counters from a completed state', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500, estimatedTotalCount: 500, currentOffset: 500 };
      const next = startProgressiveLoad(state, 2);
      expect(next.phase).toBe('initial');
      expect(next.loadedRowCount).toBe(0);
      expect(next.currentOffset).toBe(0);
      expect(next.queryId).toBe(2);
    });

    it('preserves chunkSize and refreshIntervalMs', () => {
      const state = createInitialProgressiveState({ chunkSize: 200, refreshIntervalMs: 3000 });
      const next = startProgressiveLoad(state, 1);
      expect(next.chunkSize).toBe(200);
      expect(next.refreshIntervalMs).toBe(3000);
    });
  });

  // --- onChunkReceived ---

  describe('onChunkReceived', () => {
    it('updates counts and transitions to streaming', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      const next = onChunkReceived(state, 100, 500);
      expect(next.phase).toBe('streaming');
      expect(next.loadedRowCount).toBe(100);
      expect(next.estimatedTotalCount).toBe(500);
      expect(next.currentOffset).toBe(100);
    });

    it('accumulates rows across multiple chunks', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 300);
      expect(state.loadedRowCount).toBe(100);
      state = onChunkReceived(state, 100, 300);
      expect(state.loadedRowCount).toBe(200);
      expect(state.currentOffset).toBe(200);
      expect(state.phase).toBe('streaming');
    });

    it('transitions to complete when offset >= totalCount', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 100);
      expect(state.phase).toBe('complete');
      expect(state.loadedRowCount).toBe(100);
    });

    it('transitions to complete on empty chunk', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 500);
      state = onChunkReceived(state, 0, 500);
      expect(state.phase).toBe('complete');
    });

    it('sets lastRefreshAt when completing', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      expect(state.lastRefreshAt).toBe(0);
      state = onChunkReceived(state, 100, 100);
      expect(state.lastRefreshAt).toBeGreaterThan(0);
    });

    it('does not set lastRefreshAt during streaming', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 500);
      expect(state.lastRefreshAt).toBe(0);
    });
  });

  // --- onAllChunksComplete ---

  describe('onAllChunksComplete', () => {
    it('transitions to complete phase', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 200, 500);
      const next = onAllChunksComplete(state);
      expect(next.phase).toBe('complete');
      expect(next.lastRefreshAt).toBeGreaterThan(0);
    });

    it('preserves existing counts', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 300, 500);
      const next = onAllChunksComplete(state);
      expect(next.loadedRowCount).toBe(300);
      expect(next.estimatedTotalCount).toBe(500);
    });
  });

  // --- startRefresh ---

  describe('startRefresh', () => {
    it('transitions to refreshing phase', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500, estimatedTotalCount: 500 };
      const next = startRefresh(state, 5);
      expect(next.phase).toBe('refreshing');
      expect(next.queryId).toBe(5);
    });

    it('resets loadedRowCount and currentOffset', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500, currentOffset: 500 };
      const next = startRefresh(state, 5);
      expect(next.loadedRowCount).toBe(0);
      expect(next.currentOffset).toBe(0);
    });

    it('preserves estimatedTotalCount', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', estimatedTotalCount: 1000 };
      const next = startRefresh(state, 5);
      expect(next.estimatedTotalCount).toBe(1000);
    });
  });

  // --- shouldShowOverlay ---

  describe('shouldShowOverlay', () => {
    it('returns true only when initial phase with zero rows', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      expect(shouldShowOverlay(state)).toBe(true);
    });

    it('returns false once first chunk arrives', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 500);
      expect(shouldShowOverlay(state)).toBe(false);
    });

    it('returns false during idle', () => {
      const state = createInitialProgressiveState();
      expect(shouldShowOverlay(state)).toBe(false);
    });

    it('returns false during refreshing', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500 };
      state = startRefresh(state, 2);
      expect(shouldShowOverlay(state)).toBe(false);
    });

    it('returns false during complete', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500 };
      expect(shouldShowOverlay(state)).toBe(false);
    });
  });

  // --- shouldShowFooterIndicator ---

  describe('shouldShowFooterIndicator', () => {
    it('returns true during streaming', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 500);
      expect(shouldShowFooterIndicator(state)).toBe(true);
    });

    it('returns true during refreshing', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 500 };
      state = startRefresh(state, 2);
      expect(shouldShowFooterIndicator(state)).toBe(true);
    });

    it('returns false during idle', () => {
      const state = createInitialProgressiveState();
      expect(shouldShowFooterIndicator(state)).toBe(false);
    });

    it('returns false during initial', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      expect(shouldShowFooterIndicator(state)).toBe(false);
    });

    it('returns false when complete', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete' };
      expect(shouldShowFooterIndicator(state)).toBe(false);
    });
  });

  // --- getProgressMessage ---

  describe('getProgressMessage', () => {
    it('returns Loading... during initial with zero rows', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      expect(getProgressMessage(state)).toBe('Loading...');
    });

    it('returns streaming message during streaming', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 10000);
      const msg = getProgressMessage(state);
      expect(msg).toContain('100');
      expect(msg).toContain('10,000');
      expect(msg).toContain('loading...');
    });

    it('returns refreshing message during refresh', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', estimatedTotalCount: 5000 };
      state = startRefresh(state, 2);
      const msg = getProgressMessage(state);
      expect(msg).toContain('Refreshing');
      expect(msg).toContain('5,000');
    });

    it('returns complete message when done', () => {
      let state = createInitialProgressiveState();
      state = { ...state, phase: 'complete', loadedRowCount: 1000 };
      const msg = getProgressMessage(state);
      expect(msg).toContain('1,000');
      expect(msg).toContain('loaded');
    });

    it('returns empty string during idle', () => {
      const state = createInitialProgressiveState();
      expect(getProgressMessage(state)).toBe('');
    });
  });

  // --- getNextOffset ---

  describe('getNextOffset', () => {
    it('returns 0 during initial phase before any chunk', () => {
      let state = createInitialProgressiveState();
      state = startProgressiveLoad(state, 1);
      expect(getNextOffset(state)).toBe(0);
    });

    it('returns current offset during streaming', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 500);
      expect(getNextOffset(state)).toBe(100);
    });

    it('returns null when all rows loaded', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      state = startProgressiveLoad(state, 1);
      state = onChunkReceived(state, 100, 100);
      expect(getNextOffset(state)).toBeNull();
    });

    it('returns null when offset exceeds totalCount', () => {
      let state = createInitialProgressiveState();
      state = { ...state, currentOffset: 1000, estimatedTotalCount: 500, phase: 'streaming' };
      expect(getNextOffset(state)).toBeNull();
    });

    it('returns null during idle with no data', () => {
      const state = createInitialProgressiveState();
      expect(getNextOffset(state)).toBeNull();
    });
  });

  // --- Full lifecycle ---

  describe('full lifecycle', () => {
    it('idle → initial → streaming → complete', () => {
      let state = createInitialProgressiveState({ chunkSize: 100 });
      expect(state.phase).toBe('idle');

      state = startProgressiveLoad(state, 1);
      expect(state.phase).toBe('initial');
      expect(shouldShowOverlay(state)).toBe(true);
      expect(shouldShowFooterIndicator(state)).toBe(false);

      // First chunk
      state = onChunkReceived(state, 100, 300);
      expect(state.phase).toBe('streaming');
      expect(shouldShowOverlay(state)).toBe(false);
      expect(shouldShowFooterIndicator(state)).toBe(true);

      // Second chunk
      state = onChunkReceived(state, 100, 300);
      expect(state.phase).toBe('streaming');
      expect(state.loadedRowCount).toBe(200);

      // Final chunk
      state = onChunkReceived(state, 100, 300);
      expect(state.phase).toBe('complete');
      expect(state.loadedRowCount).toBe(300);
      expect(shouldShowOverlay(state)).toBe(false);
      expect(shouldShowFooterIndicator(state)).toBe(false);
    });

    it('complete → refreshing → streaming → complete', () => {
      let state = createInitialProgressiveState({ chunkSize: 200 });
      state = { ...state, phase: 'complete', loadedRowCount: 400, estimatedTotalCount: 400, currentOffset: 400 };

      state = startRefresh(state, 10);
      expect(state.phase).toBe('refreshing');
      expect(shouldShowOverlay(state)).toBe(false);
      expect(shouldShowFooterIndicator(state)).toBe(true);

      state = onChunkReceived(state, 200, 400);
      expect(state.phase).toBe('streaming');

      state = onChunkReceived(state, 200, 400);
      expect(state.phase).toBe('complete');
    });
  });
});
