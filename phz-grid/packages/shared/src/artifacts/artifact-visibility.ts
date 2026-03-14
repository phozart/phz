/**
 * @phozart/shared — ArtifactVisibility lifecycle (A-1.04)
 *
 * Manages personal/shared/published visibility states for artifacts.
 * Supports role-based sharing, ShareTarget-aware filtering, and ViewerContext.
 *
 * Extracted from workspace/navigation/artifact-visibility.ts as pure types + functions.
 */

import type { ShareTarget } from '../types/share-target.js';
import { matchesAnyShareTarget } from '../types/share-target.js';
import type { ViewerContext } from '../adapters/data-adapter.js';

// Re-export ViewerContext for consumers who import from artifacts
export type { ViewerContext };

// ========================================================================
// ArtifactType — union of all artifact kinds
// ========================================================================

export type ArtifactType =
  | 'report' | 'dashboard' | 'kpi' | 'metric'
  | 'grid-definition' | 'filter-preset'
  | 'alert-rule' | 'subscription'
  | 'filter-definition' | 'filter-rule';

// ========================================================================
// ArtifactVisibility
// ========================================================================

export type ArtifactVisibility = 'personal' | 'shared' | 'published';

export interface VisibilityMeta {
  id: string;
  type: ArtifactType;
  name: string;
  visibility: ArtifactVisibility;
  ownerId: string;
  sharedWith?: string[];
  /** Structured share targets (user, role, team) — preferred over sharedWith. */
  shareTargets?: ShareTarget[];
  description?: string;
}

export interface VisibilityGroup {
  personal: VisibilityMeta[];
  shared: VisibilityMeta[];
  published: VisibilityMeta[];
}

// ========================================================================
// Visibility check — supports both string[] roles and ShareTarget[]
// ========================================================================

export function isVisibleToViewer(
  meta: VisibilityMeta,
  viewer: ViewerContext | undefined,
): boolean {
  switch (meta.visibility) {
    case 'published':
      return true;

    case 'personal':
      if (!viewer?.userId) return false;
      return meta.ownerId === viewer.userId;

    case 'shared': {
      if (!viewer?.userId) return false;
      // Owner always sees their own shared artifacts
      if (meta.ownerId === viewer.userId) return true;

      // Check structured share targets first
      if (meta.shareTargets && meta.shareTargets.length > 0) {
        return matchesAnyShareTarget(meta.shareTargets, {
          userId: viewer.userId,
          roles: viewer.roles,
          teams: viewer.teams,
        });
      }

      // Fall back to legacy role-based check
      const sharedRoles = meta.sharedWith ?? [];
      const viewerRoles = viewer.roles ?? [];
      return sharedRoles.some(role => viewerRoles.includes(role));
    }

    default:
      return false;
  }
}

// ========================================================================
// Grouping
// ========================================================================

export function groupByVisibility(artifacts: VisibilityMeta[]): VisibilityGroup {
  const groups: VisibilityGroup = { personal: [], shared: [], published: [] };

  for (const a of artifacts) {
    const bucket = groups[a.visibility];
    if (bucket) {
      bucket.push(a);
    }
  }

  return groups;
}

// ========================================================================
// State transitions
// ========================================================================

const VALID_TRANSITIONS: Record<ArtifactVisibility, Set<ArtifactVisibility>> = {
  'personal': new Set(['shared', 'published']),
  'shared': new Set(['personal', 'published']),
  'published': new Set(['shared', 'personal']),
};

export function canTransition(
  from: ArtifactVisibility,
  to: ArtifactVisibility,
): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from]?.has(to) ?? false;
}

export function transitionVisibility(
  meta: VisibilityMeta,
  to: ArtifactVisibility,
  sharedWith?: string[],
): VisibilityMeta {
  if (!canTransition(meta.visibility, to)) return meta;

  return {
    ...meta,
    visibility: to,
    sharedWith: to === 'shared' ? (sharedWith ?? meta.sharedWith ?? []) : meta.sharedWith,
  };
}

// ========================================================================
// Duplication
// ========================================================================

let dupCounter = 0;
function generateId(): string {
  return `art_dup_${Date.now()}_${++dupCounter}`;
}

export function duplicateWithVisibility(
  meta: VisibilityMeta,
  newOwnerId: string,
): VisibilityMeta {
  return {
    ...meta,
    id: generateId(),
    name: `${meta.name} (Copy)`,
    visibility: 'personal',
    ownerId: newOwnerId,
    sharedWith: undefined,
    shareTargets: undefined,
  };
}
