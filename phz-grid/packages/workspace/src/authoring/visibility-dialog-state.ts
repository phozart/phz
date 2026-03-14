/**
 * @phozart/workspace — Visibility Dialog State
 *
 * Pure functions for managing the publish/share visibility dialog.
 * Handles visibility transitions (personal -> shared -> published),
 * share target management, and confirmation workflows.
 */

import type { ArtifactVisibility } from '@phozart/shared/artifacts';

export interface VisibilityShareTarget {
  id: string;
  type: 'user' | 'role' | 'team';
  label: string;
}

export interface VisibilityTransitionDraft {
  from: ArtifactVisibility;
  to: ArtifactVisibility;
  shareTargets: VisibilityShareTarget[];
}

export interface VisibilityDialogState {
  visibility: ArtifactVisibility;
  shareTargets: VisibilityShareTarget[];
  confirmationRequired: boolean;
  transitionDraft?: VisibilityTransitionDraft;
}

export function initialVisibilityDialogState(
  visibility: ArtifactVisibility = 'personal',
): VisibilityDialogState {
  return {
    visibility,
    shareTargets: [],
    confirmationRequired: false,
  };
}

export function setVisibility(
  state: VisibilityDialogState,
  visibility: ArtifactVisibility,
): VisibilityDialogState {
  return { ...state, visibility };
}

export function addShareTarget(
  state: VisibilityDialogState,
  target: VisibilityShareTarget,
): VisibilityDialogState {
  if (state.shareTargets.some(t => t.id === target.id)) return state;
  return { ...state, shareTargets: [...state.shareTargets, target] };
}

export function removeShareTarget(
  state: VisibilityDialogState,
  targetId: string,
): VisibilityDialogState {
  return {
    ...state,
    shareTargets: state.shareTargets.filter(t => t.id !== targetId),
  };
}

export function prepareTransition(
  state: VisibilityDialogState,
  to: ArtifactVisibility,
): VisibilityDialogState {
  if (state.visibility === to) return state;
  // Transition to published or from shared/published requires confirmation
  const requiresConfirmation = to === 'published' || state.visibility === 'published';
  return {
    ...state,
    confirmationRequired: requiresConfirmation,
    transitionDraft: {
      from: state.visibility,
      to,
      shareTargets: to === 'shared' ? [...state.shareTargets] : [],
    },
  };
}

export function confirmTransition(state: VisibilityDialogState): VisibilityDialogState {
  if (!state.transitionDraft) return state;
  return {
    ...state,
    visibility: state.transitionDraft.to,
    shareTargets: state.transitionDraft.to === 'shared'
      ? state.transitionDraft.shareTargets
      : state.shareTargets,
    confirmationRequired: false,
    transitionDraft: undefined,
  };
}

export interface VisibilityValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTransition(
  state: VisibilityDialogState,
  to: ArtifactVisibility,
): VisibilityValidationResult {
  const errors: string[] = [];
  if (state.visibility === to) {
    errors.push('Already at target visibility');
  }
  if (to === 'shared' && state.shareTargets.length === 0) {
    errors.push('At least one share target is required for shared visibility');
  }
  return { valid: errors.length === 0, errors };
}
