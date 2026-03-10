/**
 * Auto-save Controller (L.12) — Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAutoSaveState,
  markDirty,
  markSaved,
  markConflict,
  shouldAutoSave,
  resumeDraft,
  discardDraft,
  type AutoSaveState,
  type DraftEntry,
  AUTO_SAVE_DELAY_MS,
} from '../shell/auto-save-controller.js';

describe('Auto-save Controller (L.12)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  describe('createAutoSaveState', () => {
    it('starts clean with no draft', () => {
      const state = createAutoSaveState();
      expect(state.dirty).toBe(false);
      expect(state.lastSavedAt).toBeUndefined();
      expect(state.draft).toBeUndefined();
      expect(state.conflict).toBe(false);
    });
  });

  describe('markDirty', () => {
    it('sets dirty flag and records timestamp', () => {
      const state = createAutoSaveState();
      const next = markDirty(state, { reportId: 'r1', data: 'hello' });
      expect(next.dirty).toBe(true);
      expect(next.draft).toBeDefined();
      expect(next.draft!.data).toEqual({ reportId: 'r1', data: 'hello' });
    });

    it('updates draft data on subsequent dirty calls', () => {
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      state = markDirty(state, { v: 2 });
      expect(state.draft!.data).toEqual({ v: 2 });
    });

    it('is immutable', () => {
      const state = createAutoSaveState();
      markDirty(state, { v: 1 });
      expect(state.dirty).toBe(false);
    });
  });

  describe('markSaved', () => {
    it('clears dirty and draft', () => {
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      const saved = markSaved(state);
      expect(saved.dirty).toBe(false);
      expect(saved.draft).toBeUndefined();
      expect(saved.lastSavedAt).toBeGreaterThan(0);
    });
  });

  describe('markConflict', () => {
    it('sets conflict flag', () => {
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      const conflicted = markConflict(state, 'Server version is newer');
      expect(conflicted.conflict).toBe(true);
      expect(conflicted.conflictMessage).toBe('Server version is newer');
    });
  });

  describe('shouldAutoSave', () => {
    it('returns false when not dirty', () => {
      const state = createAutoSaveState();
      expect(shouldAutoSave(state, Date.now())).toBe(false);
    });

    it('returns false when dirty but not enough time elapsed', () => {
      vi.setSystemTime(1000);
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      expect(shouldAutoSave(state, 1000 + AUTO_SAVE_DELAY_MS - 1)).toBe(false);
    });

    it('returns true when dirty and enough time elapsed', () => {
      vi.setSystemTime(1000);
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      expect(shouldAutoSave(state, 1000 + AUTO_SAVE_DELAY_MS)).toBe(true);
    });

    it('returns false when conflict is present', () => {
      vi.setSystemTime(1000);
      let state = createAutoSaveState();
      state = markDirty(state, { v: 1 });
      state = markConflict(state, 'conflict');
      expect(shouldAutoSave(state, 1000 + AUTO_SAVE_DELAY_MS + 1)).toBe(false);
    });
  });

  describe('resumeDraft / discardDraft', () => {
    it('resumeDraft returns draft data', () => {
      let state = createAutoSaveState();
      state = markDirty(state, { v: 42 });
      const draft = resumeDraft(state);
      expect(draft).toEqual({ v: 42 });
    });

    it('resumeDraft returns undefined when no draft', () => {
      const state = createAutoSaveState();
      expect(resumeDraft(state)).toBeUndefined();
    });

    it('discardDraft clears draft and dirty', () => {
      let state = createAutoSaveState();
      state = markDirty(state, { v: 42 });
      const discarded = discardDraft(state);
      expect(discarded.dirty).toBe(false);
      expect(discarded.draft).toBeUndefined();
    });
  });
});
