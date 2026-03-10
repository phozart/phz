/**
 * Tests for ShareTarget types and helpers.
 */
import {
  isUserTarget,
  isRoleTarget,
  isTeamTarget,
  isEveryoneTarget,
  matchesShareTarget,
  matchesAnyShareTarget,
  isSharedWith,
} from '@phozart/phz-shared/types';
import type { ShareTarget } from '@phozart/phz-shared/types';

// ========================================================================
// Type guards
// ========================================================================

describe('isUserTarget', () => {
  it('returns true for user targets', () => {
    const target: ShareTarget = { type: 'user', userId: 'u1' };
    expect(isUserTarget(target)).toBe(true);
  });

  it('returns false for non-user targets', () => {
    expect(isUserTarget({ type: 'role', roleName: 'admin' })).toBe(false);
    expect(isUserTarget({ type: 'team', teamId: 't1' })).toBe(false);
    expect(isUserTarget({ type: 'everyone' })).toBe(false);
  });
});

describe('isRoleTarget', () => {
  it('returns true for role targets', () => {
    const target: ShareTarget = { type: 'role', roleName: 'admin' };
    expect(isRoleTarget(target)).toBe(true);
  });

  it('returns false for non-role targets', () => {
    expect(isRoleTarget({ type: 'user', userId: 'u1' })).toBe(false);
    expect(isRoleTarget({ type: 'team', teamId: 't1' })).toBe(false);
    expect(isRoleTarget({ type: 'everyone' })).toBe(false);
  });
});

describe('isTeamTarget', () => {
  it('returns true for team targets', () => {
    const target: ShareTarget = { type: 'team', teamId: 't1' };
    expect(isTeamTarget(target)).toBe(true);
  });

  it('returns false for non-team targets', () => {
    expect(isTeamTarget({ type: 'user', userId: 'u1' })).toBe(false);
    expect(isTeamTarget({ type: 'role', roleName: 'admin' })).toBe(false);
    expect(isTeamTarget({ type: 'everyone' })).toBe(false);
  });
});

describe('isEveryoneTarget', () => {
  it('returns true for everyone targets', () => {
    const target: ShareTarget = { type: 'everyone' };
    expect(isEveryoneTarget(target)).toBe(true);
  });

  it('returns false for non-everyone targets', () => {
    expect(isEveryoneTarget({ type: 'user', userId: 'u1' })).toBe(false);
    expect(isEveryoneTarget({ type: 'role', roleName: 'admin' })).toBe(false);
    expect(isEveryoneTarget({ type: 'team', teamId: 't1' })).toBe(false);
  });
});

// ========================================================================
// matchesShareTarget
// ========================================================================

describe('matchesShareTarget', () => {
  it('matches everyone target for any viewer', () => {
    expect(matchesShareTarget({ type: 'everyone' }, {})).toBe(true);
    expect(matchesShareTarget({ type: 'everyone' }, { userId: 'u1' })).toBe(true);
  });

  it('matches user target when userId matches', () => {
    const target: ShareTarget = { type: 'user', userId: 'u1' };
    expect(matchesShareTarget(target, { userId: 'u1' })).toBe(true);
  });

  it('does not match user target when userId differs', () => {
    const target: ShareTarget = { type: 'user', userId: 'u1' };
    expect(matchesShareTarget(target, { userId: 'u2' })).toBe(false);
  });

  it('does not match user target when no userId provided', () => {
    const target: ShareTarget = { type: 'user', userId: 'u1' };
    expect(matchesShareTarget(target, {})).toBe(false);
  });

  it('matches role target when viewer has the role', () => {
    const target: ShareTarget = { type: 'role', roleName: 'admin' };
    expect(matchesShareTarget(target, { roles: ['admin', 'user'] })).toBe(true);
  });

  it('does not match role target when viewer lacks the role', () => {
    const target: ShareTarget = { type: 'role', roleName: 'admin' };
    expect(matchesShareTarget(target, { roles: ['user'] })).toBe(false);
  });

  it('does not match role target when no roles provided', () => {
    const target: ShareTarget = { type: 'role', roleName: 'admin' };
    expect(matchesShareTarget(target, {})).toBe(false);
  });

  it('matches team target when viewer is on the team', () => {
    const target: ShareTarget = { type: 'team', teamId: 't1' };
    expect(matchesShareTarget(target, { teams: ['t1', 't2'] })).toBe(true);
  });

  it('does not match team target when viewer is not on the team', () => {
    const target: ShareTarget = { type: 'team', teamId: 't1' };
    expect(matchesShareTarget(target, { teams: ['t3'] })).toBe(false);
  });

  it('does not match team target when no teams provided', () => {
    const target: ShareTarget = { type: 'team', teamId: 't1' };
    expect(matchesShareTarget(target, {})).toBe(false);
  });
});

// ========================================================================
// matchesAnyShareTarget
// ========================================================================

describe('matchesAnyShareTarget', () => {
  it('returns true if any target matches', () => {
    const targets: ShareTarget[] = [
      { type: 'user', userId: 'u1' },
      { type: 'role', roleName: 'editor' },
    ];
    expect(matchesAnyShareTarget(targets, { roles: ['editor'] })).toBe(true);
  });

  it('returns false if no targets match', () => {
    const targets: ShareTarget[] = [
      { type: 'user', userId: 'u1' },
      { type: 'role', roleName: 'editor' },
    ];
    expect(matchesAnyShareTarget(targets, { userId: 'u2', roles: ['viewer'] })).toBe(false);
  });

  it('returns false for empty targets array', () => {
    expect(matchesAnyShareTarget([], { userId: 'u1' })).toBe(false);
  });
});

// ========================================================================
// isSharedWith
// ========================================================================

describe('isSharedWith', () => {
  it('returns false for empty targets', () => {
    expect(isSharedWith([], 'u1')).toBe(false);
  });

  it('matches user target', () => {
    const targets: ShareTarget[] = [{ type: 'user', userId: 'u1' }];
    expect(isSharedWith(targets, 'u1')).toBe(true);
    expect(isSharedWith(targets, 'u2')).toBe(false);
  });

  it('matches role target via viewerRoles', () => {
    const targets: ShareTarget[] = [{ type: 'role', roleName: 'admin' }];
    expect(isSharedWith(targets, 'u1', ['admin'])).toBe(true);
    expect(isSharedWith(targets, 'u1', ['viewer'])).toBe(false);
    expect(isSharedWith(targets, 'u1')).toBe(false);
  });

  it('matches team target via viewerTeams', () => {
    const targets: ShareTarget[] = [{ type: 'team', teamId: 't1' }];
    expect(isSharedWith(targets, 'u1', [], ['t1'])).toBe(true);
    expect(isSharedWith(targets, 'u1', [], ['t2'])).toBe(false);
    expect(isSharedWith(targets, 'u1')).toBe(false);
  });

  it('matches everyone target for any user', () => {
    const targets: ShareTarget[] = [{ type: 'everyone' }];
    expect(isSharedWith(targets, 'u1')).toBe(true);
  });

  it('matches with multiple targets where only one matches', () => {
    const targets: ShareTarget[] = [
      { type: 'user', userId: 'u99' },
      { type: 'role', roleName: 'manager' },
    ];
    expect(isSharedWith(targets, 'u1', ['manager'])).toBe(true);
  });
});
