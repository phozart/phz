/**
 * @phozart/phz-workspace — Authoring State Machine
 *
 * Top-level state machine driving all authoring flows.
 * Pure immutable transitions — no side effects.
 */

export interface AuthoringState {
  mode: 'home' | 'creating' | 'editing-report' | 'editing-dashboard';
  artifactId?: string;
  artifactType?: 'report' | 'dashboard';
  dirty: boolean;
  publishStatus: 'draft' | 'review' | 'published';
  lastSavedAt?: number;
}

export function initialAuthoringState(): AuthoringState {
  return { mode: 'home', dirty: false, publishStatus: 'draft' };
}

export function startCreation(state: AuthoringState, type: 'report' | 'dashboard'): AuthoringState {
  return { ...state, mode: 'creating', artifactType: type, dirty: false };
}

export function openArtifact(state: AuthoringState, id: string, type: 'report' | 'dashboard'): AuthoringState {
  return {
    ...state,
    mode: type === 'report' ? 'editing-report' : 'editing-dashboard',
    artifactId: id,
    artifactType: type,
    dirty: false,
  };
}

export function markDirty(state: AuthoringState): AuthoringState {
  return { ...state, dirty: true };
}

export function markSaved(state: AuthoringState): AuthoringState {
  return { ...state, dirty: false, lastSavedAt: Date.now() };
}

export function setPublishStatus(state: AuthoringState, status: 'draft' | 'review' | 'published'): AuthoringState {
  return { ...state, publishStatus: status };
}

export function returnHome(state: AuthoringState): AuthoringState {
  return { ...state, mode: 'home', artifactId: undefined, artifactType: undefined, dirty: false };
}

export function canTransitionTo(state: AuthoringState, target: AuthoringState['mode']): boolean {
  // Guard: warn if dirty when leaving edit mode
  if (state.dirty && (target === 'home' || target === 'creating')) {
    return false;
  }
  // Can't go to editing without openArtifact
  if ((target === 'editing-report' || target === 'editing-dashboard') && state.mode === 'home') {
    return false;
  }
  return true;
}
