/**
 * T.6 — Loading progress indicator component
 * Phase transitions, auto-dismiss timer logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DashboardLoadingState } from '../types.js';
import {
  createLoadingIndicatorState,
  type LoadingIndicatorState,
} from '../layout/phz-loading-indicator.js';

describe('Loading indicator state (T.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createLoadingIndicatorState', () => {
    it('starts with idle phase and hidden', () => {
      const state = createLoadingIndicatorState();
      expect(state.getPhase()).toBe('idle');
      expect(state.isVisible()).toBe(false);
    });

    it('becomes visible on preloading', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('preloading');
      expect(state.isVisible()).toBe(true);
      expect(state.getPhase()).toBe('preloading');
    });

    it('remains visible during full-loading', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('full-loading');
      expect(state.isVisible()).toBe(true);
    });

    it('shows "Done" message on full-complete', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('preloading');
      state.setPhase('full-complete');
      expect(state.isVisible()).toBe(true);
      expect(state.getMessage()).toBe('Done');
    });

    it('auto-dismisses after 3s on full-complete', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('preloading');
      state.setPhase('full-complete');

      expect(state.isVisible()).toBe(true);

      vi.advanceTimersByTime(3000);

      expect(state.isVisible()).toBe(false);
    });

    it('supports custom message', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('preloading', 'Loading summary...');
      expect(state.getMessage()).toBe('Loading summary...');
    });

    it('tracks progress 0-100', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('preloading');
      state.setProgress(45);
      expect(state.getProgress()).toBe(45);
    });

    it('becomes visible on error', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('error', 'Load failed');
      expect(state.isVisible()).toBe(true);
      expect(state.getMessage()).toBe('Load failed');
    });

    it('notifies subscribers on phase change', () => {
      const state = createLoadingIndicatorState();
      const listener = vi.fn();
      state.subscribe(listener);

      state.setPhase('preloading');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('unsubscribe stops notifications', () => {
      const state = createLoadingIndicatorState();
      const listener = vi.fn();
      const unsub = state.subscribe(listener);
      unsub();

      state.setPhase('preloading');
      expect(listener).not.toHaveBeenCalled();
    });

    it('cancels existing auto-dismiss timer when new phase starts', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('full-complete'); // starts 3s dismiss
      vi.advanceTimersByTime(1500); // 1.5s passed

      state.setPhase('preloading'); // new load started
      vi.advanceTimersByTime(3000); // original timer would have fired

      // Should still be visible because we're in preloading phase
      expect(state.isVisible()).toBe(true);
    });

    it('destroy cleans up timers', () => {
      const state = createLoadingIndicatorState();
      state.setPhase('full-complete');
      state.destroy();

      vi.advanceTimersByTime(5000);
      // No errors thrown, timer was cleaned up
    });
  });
});
