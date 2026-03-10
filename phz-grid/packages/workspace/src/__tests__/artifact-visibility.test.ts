/**
 * Sprint V.4 — ArtifactVisibility lifecycle
 *
 * Tests: personal/shared/published states, grouping, duplication,
 * ViewerContext filtering.
 */

import { describe, it, expect } from 'vitest';
import {
  isVisibleToViewer,
  groupByVisibility,
  canTransition,
  transitionVisibility,
  duplicateWithVisibility,
  type ArtifactVisibility,
  type VisibilityMeta,
} from '../navigation/artifact-visibility.js';
import type { ViewerContext } from '../types.js';

function makeMeta(overrides?: Partial<VisibilityMeta>): VisibilityMeta {
  return {
    id: 'art-1',
    type: 'report',
    name: 'Test',
    visibility: 'personal',
    ownerId: 'user-1',
    ...overrides,
  };
}

describe('ArtifactVisibility (V.4)', () => {
  describe('isVisibleToViewer', () => {
    it('personal artifact is visible to owner', () => {
      const meta = makeMeta({ visibility: 'personal', ownerId: 'user-1' });
      const viewer: ViewerContext = { userId: 'user-1' };
      expect(isVisibleToViewer(meta, viewer)).toBe(true);
    });

    it('personal artifact is NOT visible to other users', () => {
      const meta = makeMeta({ visibility: 'personal', ownerId: 'user-1' });
      const viewer: ViewerContext = { userId: 'user-2' };
      expect(isVisibleToViewer(meta, viewer)).toBe(false);
    });

    it('shared artifact is visible to users with matching role', () => {
      const meta = makeMeta({ visibility: 'shared', sharedWith: ['analysts'] });
      const viewer: ViewerContext = { userId: 'user-2', roles: ['analysts'] };
      expect(isVisibleToViewer(meta, viewer)).toBe(true);
    });

    it('shared artifact is NOT visible to users without matching role', () => {
      const meta = makeMeta({ visibility: 'shared', sharedWith: ['analysts'] });
      const viewer: ViewerContext = { userId: 'user-2', roles: ['viewers'] };
      expect(isVisibleToViewer(meta, viewer)).toBe(false);
    });

    it('shared artifact is visible to owner regardless of roles', () => {
      const meta = makeMeta({ visibility: 'shared', ownerId: 'user-1', sharedWith: ['analysts'] });
      const viewer: ViewerContext = { userId: 'user-1', roles: [] };
      expect(isVisibleToViewer(meta, viewer)).toBe(true);
    });

    it('published artifact is visible to everyone', () => {
      const meta = makeMeta({ visibility: 'published' });
      const viewer: ViewerContext = { userId: 'user-any' };
      expect(isVisibleToViewer(meta, viewer)).toBe(true);
    });

    it('published artifact is visible even without viewer context', () => {
      const meta = makeMeta({ visibility: 'published' });
      expect(isVisibleToViewer(meta, undefined)).toBe(true);
    });

    it('personal artifact requires viewer context', () => {
      const meta = makeMeta({ visibility: 'personal' });
      expect(isVisibleToViewer(meta, undefined)).toBe(false);
    });
  });

  describe('groupByVisibility', () => {
    it('groups artifacts by visibility', () => {
      const artifacts = [
        makeMeta({ id: '1', visibility: 'personal' }),
        makeMeta({ id: '2', visibility: 'shared' }),
        makeMeta({ id: '3', visibility: 'published' }),
        makeMeta({ id: '4', visibility: 'personal' }),
      ];
      const groups = groupByVisibility(artifacts);
      expect(groups.personal).toHaveLength(2);
      expect(groups.shared).toHaveLength(1);
      expect(groups.published).toHaveLength(1);
    });

    it('handles empty array', () => {
      const groups = groupByVisibility([]);
      expect(groups.personal).toEqual([]);
      expect(groups.shared).toEqual([]);
      expect(groups.published).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('allows personal -> shared', () => {
      expect(canTransition('personal', 'shared')).toBe(true);
    });

    it('allows personal -> published', () => {
      expect(canTransition('personal', 'published')).toBe(true);
    });

    it('allows shared -> published', () => {
      expect(canTransition('shared', 'published')).toBe(true);
    });

    it('allows published -> shared (unpublish)', () => {
      expect(canTransition('published', 'shared')).toBe(true);
    });

    it('allows shared -> personal (restrict)', () => {
      expect(canTransition('shared', 'personal')).toBe(true);
    });

    it('disallows same-state transition', () => {
      expect(canTransition('personal', 'personal')).toBe(false);
    });
  });

  describe('transitionVisibility', () => {
    it('transitions personal to shared with recipients', () => {
      const meta = makeMeta({ visibility: 'personal' });
      const updated = transitionVisibility(meta, 'shared', ['analysts']);
      expect(updated.visibility).toBe('shared');
      expect(updated.sharedWith).toEqual(['analysts']);
    });

    it('transitions shared to published', () => {
      const meta = makeMeta({ visibility: 'shared', sharedWith: ['analysts'] });
      const updated = transitionVisibility(meta, 'published');
      expect(updated.visibility).toBe('published');
    });

    it('returns unchanged if transition not allowed', () => {
      const meta = makeMeta({ visibility: 'personal' });
      const updated = transitionVisibility(meta, 'personal');
      expect(updated).toEqual(meta);
    });
  });

  describe('duplicateWithVisibility', () => {
    it('creates a copy with personal visibility', () => {
      const meta = makeMeta({ visibility: 'published', ownerId: 'user-1' });
      const dup = duplicateWithVisibility(meta, 'user-2');
      expect(dup.id).not.toBe(meta.id);
      expect(dup.visibility).toBe('personal');
      expect(dup.ownerId).toBe('user-2');
      expect(dup.name).toContain('Copy');
    });
  });
});
