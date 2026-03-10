/**
 * Preview-as Viewer Context Simulation (L.19) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createPreviewAsState,
  setPreviewContext,
  clearPreviewContext,
  type PreviewAsState,
} from '../shell/preview-as-utils.js';
import type { ViewerContext } from '../types.js';

describe('Preview-as Utils (L.19)', () => {
  describe('createPreviewAsState', () => {
    it('starts inactive with no context', () => {
      const state = createPreviewAsState();
      expect(state.active).toBe(false);
      expect(state.context).toBeUndefined();
      expect(state.recentContexts).toEqual([]);
    });
  });

  describe('setPreviewContext', () => {
    it('sets the context and activates preview', () => {
      const state = createPreviewAsState();
      const ctx: ViewerContext = { userId: 'user-1', roles: ['admin'] };
      const next = setPreviewContext(state, ctx);
      expect(next.active).toBe(true);
      expect(next.context).toEqual(ctx);
    });

    it('adds context to recentContexts', () => {
      const state = createPreviewAsState();
      const ctx: ViewerContext = { userId: 'user-1' };
      const next = setPreviewContext(state, ctx);
      expect(next.recentContexts).toHaveLength(1);
      expect(next.recentContexts[0]).toEqual(ctx);
    });

    it('limits recentContexts to max 5', () => {
      let state = createPreviewAsState();
      for (let i = 0; i < 7; i++) {
        state = setPreviewContext(state, { userId: `user-${i}` });
      }
      expect(state.recentContexts).toHaveLength(5);
      // Most recent should be last
      expect(state.recentContexts[state.recentContexts.length - 1].userId).toBe('user-6');
    });

    it('does not duplicate existing context in recents', () => {
      let state = createPreviewAsState();
      const ctx: ViewerContext = { userId: 'user-1' };
      state = setPreviewContext(state, ctx);
      state = setPreviewContext(state, { userId: 'user-2' });
      state = setPreviewContext(state, ctx); // same as first
      // Should not have duplicates — or at least keep most recent at end
      const matchingEntries = state.recentContexts.filter(c => c.userId === 'user-1');
      expect(matchingEntries.length).toBeLessThanOrEqual(1);
    });

    it('is immutable', () => {
      const state = createPreviewAsState();
      const next = setPreviewContext(state, { userId: 'u1' });
      expect(state.active).toBe(false);
      expect(state.context).toBeUndefined();
      expect(next.active).toBe(true);
    });
  });

  describe('clearPreviewContext', () => {
    it('deactivates preview and clears context', () => {
      let state = createPreviewAsState();
      state = setPreviewContext(state, { userId: 'u1' });
      const cleared = clearPreviewContext(state);
      expect(cleared.active).toBe(false);
      expect(cleared.context).toBeUndefined();
    });

    it('preserves recentContexts', () => {
      let state = createPreviewAsState();
      state = setPreviewContext(state, { userId: 'u1' });
      state = setPreviewContext(state, { userId: 'u2' });
      const cleared = clearPreviewContext(state);
      expect(cleared.recentContexts).toHaveLength(2);
    });

    it('is immutable', () => {
      let state = createPreviewAsState();
      state = setPreviewContext(state, { userId: 'u1' });
      const cleared = clearPreviewContext(state);
      expect(state.active).toBe(true);
      expect(cleared.active).toBe(false);
    });
  });
});
