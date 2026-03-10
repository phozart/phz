/**
 * @phozart/phz-shared — ShareTarget (A-1.06)
 *
 * Represents the target audience when sharing an artifact.
 * ShareTarget is a discriminated union covering individual users,
 * roles, teams, and public (everyone) sharing modes.
 */
// ========================================================================
// Type guards
// ========================================================================
export function isUserTarget(target) {
    return target.type === 'user';
}
export function isRoleTarget(target) {
    return target.type === 'role';
}
export function isTeamTarget(target) {
    return target.type === 'team';
}
export function isEveryoneTarget(target) {
    return target.type === 'everyone';
}
// ========================================================================
// matchesShareTarget — check if a viewer matches a single share target
// ========================================================================
/**
 * Check if a viewer matches a share target.
 */
export function matchesShareTarget(target, viewer) {
    switch (target.type) {
        case 'everyone':
            return true;
        case 'user':
            return viewer.userId === target.userId;
        case 'role':
            return viewer.roles?.includes(target.roleName) ?? false;
        case 'team':
            return viewer.teams?.includes(target.teamId) ?? false;
        default:
            return false;
    }
}
// ========================================================================
// matchesAnyShareTarget — check if a viewer matches any target
// ========================================================================
/**
 * Check if a viewer matches any of the given share targets.
 */
export function matchesAnyShareTarget(targets, viewer) {
    return targets.some(target => matchesShareTarget(target, viewer));
}
// ========================================================================
// isSharedWith — convenience alias (v15 spec name)
// ========================================================================
/**
 * Pure function that returns true if the given viewer (identified by
 * userId, roles, and teams) matches at least one of the provided
 * share targets.
 *
 * - 'everyone' targets always match.
 * - 'user' targets match when viewerUserId equals the target userId.
 * - 'role' targets match when the viewer's roles include the target roleName.
 * - 'team' targets match when the viewer's teams include the target teamId.
 */
export function isSharedWith(targets, viewerUserId, viewerRoles, viewerTeams) {
    if (targets.length === 0)
        return false;
    return matchesAnyShareTarget(targets, {
        userId: viewerUserId,
        roles: viewerRoles,
        teams: viewerTeams,
    });
}
//# sourceMappingURL=share-target.js.map