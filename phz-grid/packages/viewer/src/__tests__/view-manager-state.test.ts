/**
 * Tests for view-manager-state.ts — View Manager Screen State
 */
import { describe, it, expect } from 'vitest';
import {
  createViewManagerState,
  openViewManager,
  closeViewManager,
  setViews,
  setActiveView,
  setDirty,
  startRename,
  updateRenameName,
  finishRename,
  cancelRename,
} from '../screens/view-manager-state.js';
import type { ViewManagerState } from '../screens/view-manager-state.js';
import type { ViewsSummary } from '@phozart/core';

const makeView = (id: string, name: string, isDefault = false): ViewsSummary => ({
  id,
  name,
  isDefault,
  isActive: false,
  updatedAt: '2026-01-01T00:00:00Z',
});

const sampleViews: ViewsSummary[] = [
  makeView('v1', 'Default View', true),
  makeView('v2', 'Compact Layout'),
  makeView('v3', 'Wide Columns'),
];

describe('view-manager-state', () => {
  // ── Factory ──────────────────────────────────────────────────────────

  describe('createViewManagerState', () => {
    it('initializes with open:false, empty views, null activeViewId, dirty:false', () => {
      const state = createViewManagerState();
      expect(state.open).toBe(false);
      expect(state.views).toEqual([]);
      expect(state.activeViewId).toBeNull();
      expect(state.dirty).toBe(false);
      expect(state.renamingViewId).toBeNull();
      expect(state.renameValue).toBe('');
    });
  });

  // ── Open / Close ─────────────────────────────────────────────────────

  describe('openViewManager', () => {
    it('sets open to true', () => {
      const state = createViewManagerState();
      const next = openViewManager(state);
      expect(next.open).toBe(true);
    });
  });

  describe('closeViewManager', () => {
    it('sets open to false', () => {
      const state = openViewManager(createViewManagerState());
      const next = closeViewManager(state);
      expect(next.open).toBe(false);
    });

    it('also cancels any active rename', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = openViewManager(state);
      state = startRename(state, 'v1');
      expect(state.renamingViewId).toBe('v1');

      const next = closeViewManager(state);
      expect(next.open).toBe(false);
      expect(next.renamingViewId).toBeNull();
      expect(next.renameValue).toBe('');
    });
  });

  // ── Views List ───────────────────────────────────────────────────────

  describe('setViews', () => {
    it('populates the views array', () => {
      const state = createViewManagerState();
      const next = setViews(state, sampleViews);
      expect(next.views).toHaveLength(3);
      expect(next.views[0].name).toBe('Default View');
      expect(next.views[2].name).toBe('Wide Columns');
    });
  });

  // ── Active View ──────────────────────────────────────────────────────

  describe('setActiveView', () => {
    it('updates activeViewId', () => {
      const state = createViewManagerState();
      const next = setActiveView(state, 'v2');
      expect(next.activeViewId).toBe('v2');
    });

    it('setActiveView(null) clears active', () => {
      let state = createViewManagerState();
      state = setActiveView(state, 'v2');
      const next = setActiveView(state, null);
      expect(next.activeViewId).toBeNull();
    });
  });

  // ── Dirty Flag ───────────────────────────────────────────────────────

  describe('setDirty', () => {
    it('setDirty(true) marks dirty', () => {
      const state = createViewManagerState();
      const next = setDirty(state, true);
      expect(next.dirty).toBe(true);
    });

    it('setDirty(false) clears dirty', () => {
      let state = createViewManagerState();
      state = setDirty(state, true);
      const next = setDirty(state, false);
      expect(next.dirty).toBe(false);
    });
  });

  // ── Rename Workflow ──────────────────────────────────────────────────

  describe('startRename', () => {
    it('sets renamingViewId and copies view name to renameValue', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      const next = startRename(state, 'v2');
      expect(next.renamingViewId).toBe('v2');
      expect(next.renameValue).toBe('Compact Layout');
    });

    it('with unknown view id returns same reference (no-op)', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      const next = startRename(state, 'unknown-id');
      expect(next).toBe(state);
      expect(next.renamingViewId).toBeNull();
      expect(next.renameValue).toBe('');
    });
  });

  describe('updateRenameName', () => {
    it('updates renameValue', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = startRename(state, 'v1');
      const next = updateRenameName(state, 'New Name');
      expect(next.renameValue).toBe('New Name');
    });
  });

  describe('finishRename', () => {
    it('returns new state + viewId + newName', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = startRename(state, 'v2');
      state = updateRenameName(state, 'Updated Layout');

      const result = finishRename(state);
      expect(result.viewId).toBe('v2');
      expect(result.newName).toBe('Updated Layout');
    });

    it('clears renamingViewId and renameValue', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = startRename(state, 'v2');
      state = updateRenameName(state, 'Updated Layout');

      const result = finishRename(state);
      expect(result.state.renamingViewId).toBeNull();
      expect(result.state.renameValue).toBe('');
    });

    it('with empty renameValue returns original state (no rename)', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = startRename(state, 'v2');
      state = updateRenameName(state, '   ');

      const result = finishRename(state);
      expect(result.viewId).toBeNull();
      expect(result.newName).toBe('');
      // State still clears the rename fields
      expect(result.state.renamingViewId).toBeNull();
      expect(result.state.renameValue).toBe('');
    });
  });

  describe('cancelRename', () => {
    it('clears renamingViewId and renameValue', () => {
      let state = createViewManagerState();
      state = setViews(state, sampleViews);
      state = startRename(state, 'v1');
      state = updateRenameName(state, 'Partially typed');

      const next = cancelRename(state);
      expect(next.renamingViewId).toBeNull();
      expect(next.renameValue).toBe('');
    });

    it('when not renaming is safe (no-op)', () => {
      const state = createViewManagerState();
      const next = cancelRename(state);
      expect(next.renamingViewId).toBeNull();
      expect(next.renameValue).toBe('');
    });
  });

  // ── Immutability ─────────────────────────────────────────────────────

  describe('immutability', () => {
    it('all functions return new state objects', () => {
      const s0 = createViewManagerState();
      const s1 = openViewManager(s0);
      const s2 = closeViewManager(s1);
      const s3 = setViews(s0, sampleViews);
      const s4 = setActiveView(s0, 'v1');
      const s5 = setDirty(s0, true);
      const s6 = startRename(s3, 'v1');
      const s7 = updateRenameName(s6, 'test');
      const s8 = cancelRename(s6);

      // Each should be a distinct object reference
      expect(s0).not.toBe(s1);
      expect(s1).not.toBe(s2);
      expect(s0).not.toBe(s3);
      expect(s0).not.toBe(s4);
      expect(s0).not.toBe(s5);
      expect(s3).not.toBe(s6);
      expect(s6).not.toBe(s7);
      expect(s6).not.toBe(s8);

      // finishRename also returns new state
      const s9 = startRename(s3, 'v2');
      const result = finishRename(s9);
      expect(result.state).not.toBe(s9);
    });
  });
});
