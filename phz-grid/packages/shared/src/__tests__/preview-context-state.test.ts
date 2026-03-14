/**
 * Tests for Preview Context State (C-2.11)
 */
import { describe, it, expect } from 'vitest';
import {
  createPreviewContextState,
  enablePreview,
  disablePreview,
  selectRole,
  setCustomUserId,
  setAvailableRoles,
  getEffectiveContext,
} from '../coordination/preview-context-state.js';
import type { ViewerContext } from '@phozart/shared/adapters';

describe('createPreviewContextState', () => {
  it('creates default state', () => {
    const state = createPreviewContextState();
    expect(state.enabled).toBe(false);
    expect(state.previewContext).toBeNull();
    expect(state.availableRoles).toEqual([]);
    expect(state.selectedRole).toBeNull();
    expect(state.customUserId).toBe('');
  });

  it('accepts overrides', () => {
    const state = createPreviewContextState({
      availableRoles: ['admin', 'viewer'],
    });
    expect(state.availableRoles).toEqual(['admin', 'viewer']);
  });
});

describe('enablePreview', () => {
  it('enables preview with a context', () => {
    const state = createPreviewContextState();
    const context: ViewerContext = {
      userId: 'user_1',
      roles: ['viewer'],
    };
    const next = enablePreview(state, context);
    expect(next.enabled).toBe(true);
    expect(next.previewContext).toEqual(context);
    expect(next.selectedRole).toBe('viewer');
    expect(next.customUserId).toBe('user_1');
  });

  it('uses first role from context', () => {
    const state = createPreviewContextState();
    const context: ViewerContext = {
      roles: ['admin', 'viewer'],
    };
    const next = enablePreview(state, context);
    expect(next.selectedRole).toBe('admin');
  });

  it('keeps existing selectedRole when context has no roles', () => {
    const state = createPreviewContextState({ selectedRole: 'author' });
    const context: ViewerContext = { userId: 'u1' };
    const next = enablePreview(state, context);
    expect(next.selectedRole).toBe('author');
  });

  it('keeps existing customUserId when context has no userId', () => {
    const state = createPreviewContextState({ customUserId: 'existing' });
    const context: ViewerContext = { roles: ['viewer'] };
    const next = enablePreview(state, context);
    expect(next.customUserId).toBe('existing');
  });
});

describe('disablePreview', () => {
  it('disables preview and clears context', () => {
    let state = createPreviewContextState();
    state = enablePreview(state, { userId: 'u1', roles: ['viewer'] });
    state = disablePreview(state);
    expect(state.enabled).toBe(false);
    expect(state.previewContext).toBeNull();
  });

  it('preserves selectedRole and customUserId', () => {
    let state = createPreviewContextState();
    state = enablePreview(state, { userId: 'u1', roles: ['viewer'] });
    state = disablePreview(state);
    expect(state.selectedRole).toBe('viewer');
    expect(state.customUserId).toBe('u1');
  });
});

describe('selectRole', () => {
  it('sets the selected role', () => {
    const state = createPreviewContextState();
    const next = selectRole(state, 'admin');
    expect(next.selectedRole).toBe('admin');
  });

  it('updates preview context when preview is enabled', () => {
    let state = createPreviewContextState();
    state = enablePreview(state, { userId: 'u1', roles: ['viewer'] });
    state = selectRole(state, 'admin');
    expect(state.previewContext!.roles).toEqual(['admin']);
  });

  it('does not modify context when preview is disabled', () => {
    const state = createPreviewContextState();
    const next = selectRole(state, 'admin');
    expect(next.previewContext).toBeNull();
  });
});

describe('setCustomUserId', () => {
  it('sets the custom user ID', () => {
    const state = createPreviewContextState();
    const next = setCustomUserId(state, 'custom_user');
    expect(next.customUserId).toBe('custom_user');
  });

  it('updates preview context when preview is enabled', () => {
    let state = createPreviewContextState();
    state = enablePreview(state, { userId: 'u1', roles: ['viewer'] });
    state = setCustomUserId(state, 'impersonated_user');
    expect(state.previewContext!.userId).toBe('impersonated_user');
  });

  it('does not modify context when preview is disabled', () => {
    const state = createPreviewContextState();
    const next = setCustomUserId(state, 'u2');
    expect(next.previewContext).toBeNull();
  });
});

describe('setAvailableRoles', () => {
  it('sets available roles', () => {
    const state = createPreviewContextState();
    const next = setAvailableRoles(state, ['admin', 'author', 'viewer']);
    expect(next.availableRoles).toEqual(['admin', 'author', 'viewer']);
  });
});

describe('getEffectiveContext', () => {
  it('returns null when preview is disabled', () => {
    const state = createPreviewContextState();
    expect(getEffectiveContext(state)).toBeNull();
  });

  it('returns the preview context when enabled', () => {
    let state = createPreviewContextState();
    const context: ViewerContext = { userId: 'u1', roles: ['viewer'] };
    state = enablePreview(state, context);
    expect(getEffectiveContext(state)).toEqual(context);
  });

  it('returns updated context after role change', () => {
    let state = createPreviewContextState();
    state = enablePreview(state, { userId: 'u1', roles: ['viewer'] });
    state = selectRole(state, 'admin');
    const effective = getEffectiveContext(state);
    expect(effective!.roles).toEqual(['admin']);
  });
});
