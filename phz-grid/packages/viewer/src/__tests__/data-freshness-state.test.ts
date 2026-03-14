/**
 * Tests for data-freshness-state.ts — Data Freshness Indicator (UX-013)
 */
import { describe, it, expect } from 'vitest';
import {
  createDataFreshnessState,
  recordRefresh,
  computeFreshnessLevel,
  getFreshnessAge,
  formatFreshnessLabel,
  setFreshnessThresholds,
  enableAutoRefresh,
  disableAutoRefresh,
  isRefreshDue,
} from '../screens/data-freshness-state.js';
import type { DataFreshnessState, FreshnessLevel } from '../screens/data-freshness-state.js';

describe('data-freshness-state', () => {
  // ── Factory ──────────────────────────────────────────────────────────

  describe('createDataFreshnessState', () => {
    it('initializes with sensible defaults', () => {
      const state = createDataFreshnessState();
      expect(state.lastRefreshed).toBeNull();
      expect(state.freshThresholdMs).toBe(60_000);
      expect(state.staleThresholdMs).toBe(300_000);
      expect(state.autoRefreshEnabled).toBe(false);
      expect(state.autoRefreshIntervalMs).toBe(60_000);
    });

    it('accepts partial overrides', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 1000,
        freshThresholdMs: 30_000,
        staleThresholdMs: 120_000,
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 45_000,
      });
      expect(state.lastRefreshed).toBe(1000);
      expect(state.freshThresholdMs).toBe(30_000);
      expect(state.staleThresholdMs).toBe(120_000);
      expect(state.autoRefreshEnabled).toBe(true);
      expect(state.autoRefreshIntervalMs).toBe(45_000);
    });
  });

  // ── recordRefresh ────────────────────────────────────────────────────

  describe('recordRefresh', () => {
    it('sets lastRefreshed to the given timestamp', () => {
      const state = createDataFreshnessState();
      const next = recordRefresh(state, 5000);
      expect(next.lastRefreshed).toBe(5000);
    });

    it('overwrites a previous lastRefreshed value', () => {
      const state = createDataFreshnessState({ lastRefreshed: 1000 });
      const next = recordRefresh(state, 9999);
      expect(next.lastRefreshed).toBe(9999);
    });
  });

  // ── computeFreshnessLevel ────────────────────────────────────────────

  describe('computeFreshnessLevel', () => {
    it('returns "unknown" when lastRefreshed is null', () => {
      const state = createDataFreshnessState();
      expect(computeFreshnessLevel(state, 100_000)).toBe('unknown');
    });

    it('returns "fresh" when elapsed < freshThresholdMs', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0, freshThresholdMs: 60_000 });
      expect(computeFreshnessLevel(state, 30_000)).toBe('fresh');
    });

    it('returns "aging" when elapsed >= freshThresholdMs and < staleThresholdMs', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        freshThresholdMs: 60_000,
        staleThresholdMs: 300_000,
      });
      expect(computeFreshnessLevel(state, 120_000)).toBe('aging');
    });

    it('returns "stale" when elapsed >= staleThresholdMs', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        freshThresholdMs: 60_000,
        staleThresholdMs: 300_000,
      });
      expect(computeFreshnessLevel(state, 500_000)).toBe('stale');
    });

    // Boundary tests
    it('returns "aging" when elapsed is exactly at freshThresholdMs', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        freshThresholdMs: 60_000,
        staleThresholdMs: 300_000,
      });
      // Exactly at the threshold boundary: not fresh anymore
      expect(computeFreshnessLevel(state, 60_000)).toBe('aging');
    });

    it('returns "stale" when elapsed is exactly at staleThresholdMs', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        freshThresholdMs: 60_000,
        staleThresholdMs: 300_000,
      });
      expect(computeFreshnessLevel(state, 300_000)).toBe('stale');
    });
  });

  // ── getFreshnessAge ──────────────────────────────────────────────────

  describe('getFreshnessAge', () => {
    it('returns null when never refreshed', () => {
      const state = createDataFreshnessState();
      expect(getFreshnessAge(state, 100_000)).toBeNull();
    });

    it('returns correct elapsed time in ms', () => {
      const state = createDataFreshnessState({ lastRefreshed: 10_000 });
      expect(getFreshnessAge(state, 25_000)).toBe(15_000);
    });

    it('returns 0 when now equals lastRefreshed', () => {
      const state = createDataFreshnessState({ lastRefreshed: 5000 });
      expect(getFreshnessAge(state, 5000)).toBe(0);
    });
  });

  // ── formatFreshnessLabel ─────────────────────────────────────────────

  describe('formatFreshnessLabel', () => {
    it('returns "Never refreshed" when lastRefreshed is null', () => {
      const state = createDataFreshnessState();
      expect(formatFreshnessLabel(state, 100_000)).toBe('Never refreshed');
    });

    it('returns "Just now" when elapsed < 10s', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      expect(formatFreshnessLabel(state, 5_000)).toBe('Just now');
    });

    it('returns "Just now" when elapsed is exactly 0', () => {
      const state = createDataFreshnessState({ lastRefreshed: 1000 });
      expect(formatFreshnessLabel(state, 1000)).toBe('Just now');
    });

    it('returns "Xs ago" when elapsed >= 10s and < 60s', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      expect(formatFreshnessLabel(state, 45_000)).toBe('45s ago');
    });

    it('returns "10s ago" at exactly 10 seconds', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      expect(formatFreshnessLabel(state, 10_000)).toBe('10s ago');
    });

    it('returns "Xm ago" when elapsed >= 60s and < 60min', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      expect(formatFreshnessLabel(state, 3 * 60_000)).toBe('3m ago');
    });

    it('returns "1m ago" at exactly 60 seconds', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      expect(formatFreshnessLabel(state, 60_000)).toBe('1m ago');
    });

    it('returns "Xh Ym ago" when elapsed >= 60min', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      // 1h 30m = 90 * 60_000 = 5_400_000
      expect(formatFreshnessLabel(state, 5_400_000)).toBe('1h 30m ago');
    });

    it('returns "Xh 0m ago" when minutes are exactly 0', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      // 2h exactly = 120 * 60_000 = 7_200_000
      expect(formatFreshnessLabel(state, 7_200_000)).toBe('2h 0m ago');
    });

    it('uses Math.floor for time unit conversions', () => {
      const state = createDataFreshnessState({ lastRefreshed: 0 });
      // 59.9 seconds = 59_900ms -> should show "59s ago" not "60s ago"
      expect(formatFreshnessLabel(state, 59_900)).toBe('59s ago');
      // 119.9 seconds = 119_900ms -> should show "1m ago" (floor of 119.9/60 = 1)
      expect(formatFreshnessLabel(state, 119_900)).toBe('1m ago');
    });
  });

  // ── setFreshnessThresholds ───────────────────────────────────────────

  describe('setFreshnessThresholds', () => {
    it('updates both threshold values', () => {
      const state = createDataFreshnessState();
      const next = setFreshnessThresholds(state, 30_000, 120_000);
      expect(next.freshThresholdMs).toBe(30_000);
      expect(next.staleThresholdMs).toBe(120_000);
    });

    it('does not alter other state properties', () => {
      const state = createDataFreshnessState({ lastRefreshed: 5000, autoRefreshEnabled: true });
      const next = setFreshnessThresholds(state, 10_000, 50_000);
      expect(next.lastRefreshed).toBe(5000);
      expect(next.autoRefreshEnabled).toBe(true);
      expect(next.autoRefreshIntervalMs).toBe(60_000);
    });
  });

  // ── enableAutoRefresh / disableAutoRefresh ───────────────────────────

  describe('enableAutoRefresh', () => {
    it('enables auto-refresh with default interval', () => {
      const state = createDataFreshnessState();
      const next = enableAutoRefresh(state);
      expect(next.autoRefreshEnabled).toBe(true);
      expect(next.autoRefreshIntervalMs).toBe(60_000);
    });

    it('enables auto-refresh with custom interval', () => {
      const state = createDataFreshnessState();
      const next = enableAutoRefresh(state, 30_000);
      expect(next.autoRefreshEnabled).toBe(true);
      expect(next.autoRefreshIntervalMs).toBe(30_000);
    });

    it('re-enable without interval preserves previously configured interval', () => {
      let state = createDataFreshnessState();
      state = enableAutoRefresh(state, 30_000);
      state = disableAutoRefresh(state);
      expect(state.autoRefreshIntervalMs).toBe(30_000);

      const next = enableAutoRefresh(state);
      expect(next.autoRefreshEnabled).toBe(true);
      expect(next.autoRefreshIntervalMs).toBe(30_000);
    });
  });

  describe('disableAutoRefresh', () => {
    it('disables auto-refresh', () => {
      const state = createDataFreshnessState({ autoRefreshEnabled: true });
      const next = disableAutoRefresh(state);
      expect(next.autoRefreshEnabled).toBe(false);
    });

    it('preserves the interval setting', () => {
      const state = createDataFreshnessState({
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 45_000,
      });
      const next = disableAutoRefresh(state);
      expect(next.autoRefreshIntervalMs).toBe(45_000);
    });
  });

  // ── isRefreshDue ─────────────────────────────────────────────────────

  describe('isRefreshDue', () => {
    it('returns false when auto-refresh is disabled', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        autoRefreshEnabled: false,
        autoRefreshIntervalMs: 60_000,
      });
      // Even though enough time has passed, auto-refresh is off
      expect(isRefreshDue(state, 999_999)).toBe(false);
    });

    it('returns false when not enough time has elapsed', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 60_000,
      });
      expect(isRefreshDue(state, 30_000)).toBe(false);
    });

    it('returns true when enough time has elapsed', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 60_000,
      });
      expect(isRefreshDue(state, 60_000)).toBe(true);
    });

    it('returns true when more than interval has elapsed', () => {
      const state = createDataFreshnessState({
        lastRefreshed: 0,
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 60_000,
      });
      expect(isRefreshDue(state, 120_000)).toBe(true);
    });

    it('returns true when never refreshed and auto-refresh is enabled', () => {
      const state = createDataFreshnessState({
        autoRefreshEnabled: true,
        autoRefreshIntervalMs: 60_000,
      });
      // lastRefreshed is null — data was never loaded, so a refresh is due
      expect(isRefreshDue(state, 100)).toBe(true);
    });
  });

  // ── Immutability ─────────────────────────────────────────────────────

  describe('immutability', () => {
    it('all mutation functions return new state objects', () => {
      const s0 = createDataFreshnessState();
      const s1 = recordRefresh(s0, 1000);
      const s2 = setFreshnessThresholds(s0, 10_000, 50_000);
      const s3 = enableAutoRefresh(s0);
      const s4 = enableAutoRefresh(s0, 30_000);
      const s5 = disableAutoRefresh(enableAutoRefresh(s0));

      expect(s0).not.toBe(s1);
      expect(s0).not.toBe(s2);
      expect(s0).not.toBe(s3);
      expect(s0).not.toBe(s4);
      expect(s3).not.toBe(s5);

      // Original state should remain unchanged
      expect(s0.lastRefreshed).toBeNull();
      expect(s0.freshThresholdMs).toBe(60_000);
      expect(s0.staleThresholdMs).toBe(300_000);
      expect(s0.autoRefreshEnabled).toBe(false);
    });
  });
});
