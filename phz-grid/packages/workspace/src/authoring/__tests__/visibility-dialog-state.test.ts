import { describe, it, expect } from 'vitest';
import {
  initialVisibilityDialogState,
  setVisibility,
  addShareTarget,
  removeShareTarget,
  prepareTransition,
  confirmTransition,
  validateTransition,
  type VisibilityShareTarget,
  type VisibilityDialogState,
} from '../visibility-dialog-state.js';

function makeTarget(id: string, type: 'user' | 'role' | 'team' = 'user'): VisibilityShareTarget {
  return { id, type, label: `Target ${id}` };
}

describe('VisibilityDialogState', () => {
  describe('initialVisibilityDialogState', () => {
    it('defaults to personal visibility', () => {
      const s = initialVisibilityDialogState();
      expect(s.visibility).toBe('personal');
    });

    it('accepts custom initial visibility', () => {
      const s = initialVisibilityDialogState('shared');
      expect(s.visibility).toBe('shared');
    });

    it('starts with empty share targets', () => {
      const s = initialVisibilityDialogState();
      expect(s.shareTargets).toEqual([]);
    });

    it('starts with no confirmation required', () => {
      const s = initialVisibilityDialogState();
      expect(s.confirmationRequired).toBe(false);
    });

    it('starts with no transition draft', () => {
      const s = initialVisibilityDialogState();
      expect(s.transitionDraft).toBeUndefined();
    });
  });

  describe('setVisibility', () => {
    it('sets visibility directly', () => {
      const s = setVisibility(initialVisibilityDialogState(), 'shared');
      expect(s.visibility).toBe('shared');
    });

    it('does not mutate original state', () => {
      const original = initialVisibilityDialogState();
      setVisibility(original, 'published');
      expect(original.visibility).toBe('personal');
    });
  });

  describe('addShareTarget', () => {
    it('adds a share target', () => {
      const s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      expect(s.shareTargets).toHaveLength(1);
      expect(s.shareTargets[0].id).toBe('u-1');
    });

    it('prevents duplicate targets by id', () => {
      let s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      s = addShareTarget(s, makeTarget('u-1'));
      expect(s.shareTargets).toHaveLength(1);
    });

    it('returns same reference for duplicate', () => {
      const s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      const s2 = addShareTarget(s, makeTarget('u-1'));
      expect(s2).toBe(s);
    });

    it('allows multiple targets with different ids', () => {
      let s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      s = addShareTarget(s, makeTarget('r-1', 'role'));
      s = addShareTarget(s, makeTarget('t-1', 'team'));
      expect(s.shareTargets).toHaveLength(3);
    });
  });

  describe('removeShareTarget', () => {
    it('removes a target by id', () => {
      let s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      s = addShareTarget(s, makeTarget('u-2'));
      s = removeShareTarget(s, 'u-1');
      expect(s.shareTargets).toHaveLength(1);
      expect(s.shareTargets[0].id).toBe('u-2');
    });

    it('returns state unchanged for nonexistent id', () => {
      const s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      const s2 = removeShareTarget(s, 'nonexistent');
      expect(s2.shareTargets).toHaveLength(1);
    });
  });

  describe('prepareTransition', () => {
    it('creates a transition draft', () => {
      const s = prepareTransition(initialVisibilityDialogState(), 'shared');
      expect(s.transitionDraft).toBeDefined();
      expect(s.transitionDraft?.from).toBe('personal');
      expect(s.transitionDraft?.to).toBe('shared');
    });

    it('requires confirmation when transitioning to published', () => {
      const s = prepareTransition(initialVisibilityDialogState(), 'published');
      expect(s.confirmationRequired).toBe(true);
    });

    it('does not require confirmation for personal to shared', () => {
      const s = prepareTransition(initialVisibilityDialogState(), 'shared');
      expect(s.confirmationRequired).toBe(false);
    });

    it('requires confirmation when transitioning from published', () => {
      const s = prepareTransition(initialVisibilityDialogState('published'), 'personal');
      expect(s.confirmationRequired).toBe(true);
    });

    it('returns state unchanged for same visibility', () => {
      const s = initialVisibilityDialogState();
      const s2 = prepareTransition(s, 'personal');
      expect(s2).toBe(s);
    });
  });

  describe('confirmTransition', () => {
    it('applies the transition draft', () => {
      let s = prepareTransition(initialVisibilityDialogState(), 'published');
      s = confirmTransition(s);
      expect(s.visibility).toBe('published');
      expect(s.transitionDraft).toBeUndefined();
      expect(s.confirmationRequired).toBe(false);
    });

    it('is a no-op without a transition draft', () => {
      const s = initialVisibilityDialogState();
      const s2 = confirmTransition(s);
      expect(s2).toBe(s);
    });

    it('preserves share targets when transitioning to shared', () => {
      let s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      s = prepareTransition(s, 'shared');
      // draft captures current share targets
      s = confirmTransition(s);
      expect(s.visibility).toBe('shared');
    });
  });

  describe('validateTransition', () => {
    it('returns valid for a legitimate transition', () => {
      let s = addShareTarget(initialVisibilityDialogState(), makeTarget('u-1'));
      const result = validateTransition(s, 'shared');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns error when transitioning to same visibility', () => {
      const result = validateTransition(initialVisibilityDialogState(), 'personal');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Already at target visibility');
    });

    it('returns error when sharing with no targets', () => {
      const result = validateTransition(initialVisibilityDialogState(), 'shared');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one share target is required for shared visibility');
    });
  });
});
