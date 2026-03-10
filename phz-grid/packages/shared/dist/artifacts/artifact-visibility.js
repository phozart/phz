/**
 * @phozart/phz-shared — ArtifactVisibility lifecycle (A-1.04)
 *
 * Manages personal/shared/published visibility states for artifacts.
 * Supports role-based sharing, ShareTarget-aware filtering, and ViewerContext.
 *
 * Extracted from workspace/navigation/artifact-visibility.ts as pure types + functions.
 */
import { matchesAnyShareTarget } from '../types/share-target.js';
// ========================================================================
// Visibility check — supports both string[] roles and ShareTarget[]
// ========================================================================
export function isVisibleToViewer(meta, viewer) {
    switch (meta.visibility) {
        case 'published':
            return true;
        case 'personal':
            if (!viewer?.userId)
                return false;
            return meta.ownerId === viewer.userId;
        case 'shared': {
            if (!viewer?.userId)
                return false;
            // Owner always sees their own shared artifacts
            if (meta.ownerId === viewer.userId)
                return true;
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
export function groupByVisibility(artifacts) {
    const groups = { personal: [], shared: [], published: [] };
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
const VALID_TRANSITIONS = {
    'personal': new Set(['shared', 'published']),
    'shared': new Set(['personal', 'published']),
    'published': new Set(['shared', 'personal']),
};
export function canTransition(from, to) {
    if (from === to)
        return false;
    return VALID_TRANSITIONS[from]?.has(to) ?? false;
}
export function transitionVisibility(meta, to, sharedWith) {
    if (!canTransition(meta.visibility, to))
        return meta;
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
function generateId() {
    return `art_dup_${Date.now()}_${++dupCounter}`;
}
export function duplicateWithVisibility(meta, newOwnerId) {
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
//# sourceMappingURL=artifact-visibility.js.map