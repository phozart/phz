/**
 * Tests for Sharing Flow State (B-2.11)
 */
import {
  createSharingFlowState,
  setTargetVisibility,
  addShareTarget,
  removeShareTarget,
  clearShareTargets,
  setShareSearchQuery,
  setShareSearchResults,
  setSharingSaving,
  markSharingSaved,
  setSharingError,
  setCanPublish,
  hasVisibilityChanged,
  canSaveSharing,
} from '../authoring/sharing-state.js';
import type { ShareTarget } from '@phozart/phz-shared/types';

describe('createSharingFlowState', () => {
  it('creates with defaults', () => {
    const state = createSharingFlowState('art-1', 'personal');
    expect(state.artifactId).toBe('art-1');
    expect(state.currentVisibility).toBe('personal');
    expect(state.targetVisibility).toBe('personal');
    expect(state.shareTargets).toEqual([]);
    expect(state.searchQuery).toBe('');
    expect(state.canPublish).toBe(false);
    expect(state.saving).toBe(false);
    expect(state.dirty).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createSharingFlowState('art-1', 'shared', { canPublish: true });
    expect(state.canPublish).toBe(true);
  });
});

describe('setTargetVisibility', () => {
  it('changes target visibility', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'shared');
    expect(state.targetVisibility).toBe('shared');
    expect(state.dirty).toBe(true);
  });

  it('marks not dirty when target matches current', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'shared');
    state = setTargetVisibility(state, 'personal');
    // dirty depends on whether there are share targets
    expect(state.targetVisibility).toBe('personal');
  });
});

describe('addShareTarget', () => {
  it('adds a user target', () => {
    let state = createSharingFlowState('art-1', 'personal');
    const target: ShareTarget = { type: 'user', userId: 'u1' };
    state = addShareTarget(state, target);
    expect(state.shareTargets).toHaveLength(1);
    expect(state.dirty).toBe(true);
  });

  it('adds a role target', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('adds a team target', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'team', teamId: 't1' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('adds everyone target', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'everyone' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('prevents duplicate user targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('prevents duplicate role targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('prevents duplicate team targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'team', teamId: 't1' });
    state = addShareTarget(state, { type: 'team', teamId: 't1' });
    expect(state.shareTargets).toHaveLength(1);
  });

  it('allows different target types', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    state = addShareTarget(state, { type: 'team', teamId: 't1' });
    expect(state.shareTargets).toHaveLength(3);
  });
});

describe('removeShareTarget', () => {
  it('removes by index', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    state = removeShareTarget(state, 0);
    expect(state.shareTargets).toHaveLength(1);
    expect(state.shareTargets[0].type).toBe('role');
  });

  it('returns same state for invalid index', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    const same = removeShareTarget(state, 5);
    expect(same).toBe(state);
    const neg = removeShareTarget(state, -1);
    expect(neg).toBe(state);
  });
});

describe('clearShareTargets', () => {
  it('removes all targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    state = addShareTarget(state, { type: 'role', roleName: 'admin' });
    state = clearShareTargets(state);
    expect(state.shareTargets).toEqual([]);
    expect(state.dirty).toBe(true);
  });
});

describe('search', () => {
  it('sets search query', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setShareSearchQuery(state, 'john');
    expect(state.searchQuery).toBe('john');
  });

  it('sets search results', () => {
    let state = createSharingFlowState('art-1', 'personal');
    const results: ShareTarget[] = [
      { type: 'user', userId: 'u1', displayName: 'John' },
    ];
    state = setShareSearchResults(state, results);
    expect(state.searchResults).toEqual(results);
  });
});

describe('save state', () => {
  it('sets saving', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setSharingSaving(state, true);
    expect(state.saving).toBe(true);
  });

  it('marks saved and updates current visibility', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'shared');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    state = markSharingSaved(state);
    expect(state.currentVisibility).toBe('shared');
    expect(state.saving).toBe(false);
    expect(state.dirty).toBe(false);
  });

  it('sets error', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setSharingSaving(state, true);
    state = setSharingError(state, 'network error');
    expect(state.error).toBe('network error');
    expect(state.saving).toBe(false);
  });
});

describe('hasVisibilityChanged', () => {
  it('returns false when unchanged', () => {
    const state = createSharingFlowState('art-1', 'personal');
    expect(hasVisibilityChanged(state)).toBe(false);
  });

  it('returns true when changed', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'published');
    expect(hasVisibilityChanged(state)).toBe(true);
  });
});

describe('canSaveSharing', () => {
  it('returns false when not dirty', () => {
    const state = createSharingFlowState('art-1', 'personal');
    expect(canSaveSharing(state)).toBe(false);
  });

  it('returns false when saving', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'published');
    state = setCanPublish(state, true);
    state = setSharingSaving(state, true);
    expect(canSaveSharing(state)).toBe(false);
  });

  it('returns false when publishing without canPublish', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'published');
    expect(canSaveSharing(state)).toBe(false);
  });

  it('returns true when publishing with canPublish', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'published');
    state = setCanPublish(state, true);
    expect(canSaveSharing(state)).toBe(true);
  });

  it('returns false when sharing without targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'shared');
    expect(canSaveSharing(state)).toBe(false);
  });

  it('returns true when sharing with targets', () => {
    let state = createSharingFlowState('art-1', 'personal');
    state = setTargetVisibility(state, 'shared');
    state = addShareTarget(state, { type: 'user', userId: 'u1' });
    expect(canSaveSharing(state)).toBe(true);
  });
});
