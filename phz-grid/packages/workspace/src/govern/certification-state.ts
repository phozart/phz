/**
 * @phozart/phz-workspace — Govern > Certification State (WE-9)
 *
 * Pure functions for artifact endorsement/certification badges.
 * Endorsement levels: none < verified < certified < promoted.
 */

import type { ArtifactMeta } from '../types.js';

// ========================================================================
// Types
// ========================================================================

export interface ArtifactEndorsement {
  level: 'none' | 'verified' | 'certified' | 'promoted';
  endorsedBy?: string;
  endorsedAt?: number;
  endorsementNote?: string;
  expiresAt?: number;
}

export type EndorsementAction = 'verify' | 'certify' | 'promote' | 'revoke';

export interface CertificationState {
  endorsements: Record<string, ArtifactEndorsement>;
  pendingAction?: { artifactId: string; action: EndorsementAction; note?: string };
}

// ========================================================================
// Level ordering
// ========================================================================

const LEVEL_ORDER: Record<ArtifactEndorsement['level'], number> = {
  none: 0,
  verified: 1,
  certified: 2,
  promoted: 3,
};

// ========================================================================
// Factory
// ========================================================================

export function initialCertificationState(): CertificationState {
  return { endorsements: {} };
}

// ========================================================================
// Direct endorsement actions
// ========================================================================

function applyEndorsement(
  state: CertificationState,
  artifactId: string,
  level: ArtifactEndorsement['level'],
  endorsedBy: string,
  note?: string,
): CertificationState {
  return {
    ...state,
    endorsements: {
      ...state.endorsements,
      [artifactId]: {
        level,
        endorsedBy,
        endorsedAt: Date.now(),
        endorsementNote: note,
      },
    },
  };
}

export function verifyArtifact(
  state: CertificationState,
  artifactId: string,
  endorsedBy: string,
  note?: string,
): CertificationState {
  return applyEndorsement(state, artifactId, 'verified', endorsedBy, note);
}

export function certifyArtifact(
  state: CertificationState,
  artifactId: string,
  endorsedBy: string,
  note?: string,
): CertificationState {
  return applyEndorsement(state, artifactId, 'certified', endorsedBy, note);
}

export function promoteArtifact(
  state: CertificationState,
  artifactId: string,
  endorsedBy: string,
  note?: string,
): CertificationState {
  return applyEndorsement(state, artifactId, 'promoted', endorsedBy, note);
}

export function revokeEndorsement(
  state: CertificationState,
  artifactId: string,
): CertificationState {
  return {
    ...state,
    endorsements: {
      ...state.endorsements,
      [artifactId]: { level: 'none' },
    },
  };
}

// ========================================================================
// Pending action flow
// ========================================================================

export function startEndorsementAction(
  state: CertificationState,
  artifactId: string,
  action: EndorsementAction,
): CertificationState {
  return { ...state, pendingAction: { artifactId, action } };
}

export function commitEndorsementAction(
  state: CertificationState,
  endorsedBy: string,
  note?: string,
): CertificationState {
  if (!state.pendingAction) return state;
  const { artifactId, action } = state.pendingAction;

  let next: CertificationState;
  switch (action) {
    case 'verify':
      next = verifyArtifact(state, artifactId, endorsedBy, note);
      break;
    case 'certify':
      next = certifyArtifact(state, artifactId, endorsedBy, note);
      break;
    case 'promote':
      next = promoteArtifact(state, artifactId, endorsedBy, note);
      break;
    case 'revoke':
      next = revokeEndorsement(state, artifactId);
      break;
  }
  return { ...next, pendingAction: undefined };
}

export function cancelEndorsementAction(
  state: CertificationState,
): CertificationState {
  return { ...state, pendingAction: undefined };
}

// ========================================================================
// Sort & filter
// ========================================================================

function getLevel(
  endorsements: Record<string, ArtifactEndorsement>,
  id: string,
): number {
  return LEVEL_ORDER[endorsements[id]?.level ?? 'none'];
}

export function sortByEndorsement(
  artifacts: ArtifactMeta[],
  endorsements: Record<string, ArtifactEndorsement>,
): ArtifactMeta[] {
  return [...artifacts].sort(
    (a, b) => getLevel(endorsements, b.id) - getLevel(endorsements, a.id),
  );
}

export function filterByEndorsement(
  artifacts: ArtifactMeta[],
  endorsements: Record<string, ArtifactEndorsement>,
  minLevel: ArtifactEndorsement['level'],
): ArtifactMeta[] {
  const min = LEVEL_ORDER[minLevel];
  return artifacts.filter(a => getLevel(endorsements, a.id) >= min);
}

// ========================================================================
// Badge
// ========================================================================

export interface EndorsementBadge {
  icon: string;
  color: string;
  label: string;
}

const BADGES: Record<ArtifactEndorsement['level'], EndorsementBadge> = {
  none: { icon: '', color: '', label: '' },
  verified: { icon: 'checkmark', color: 'blue', label: 'Verified' },
  certified: { icon: 'shield', color: 'green', label: 'Certified' },
  promoted: { icon: 'star', color: 'gold', label: 'Promoted' },
};

export function getEndorsementBadge(
  level: ArtifactEndorsement['level'],
): EndorsementBadge {
  return BADGES[level];
}
