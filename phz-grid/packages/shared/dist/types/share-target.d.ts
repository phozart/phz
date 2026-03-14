/**
 * @phozart/shared — ShareTarget (A-1.06)
 *
 * Represents the target audience when sharing an artifact.
 * ShareTarget is a discriminated union covering individual users,
 * roles, teams, and public (everyone) sharing modes.
 */
export interface ShareTargetUser {
    type: 'user';
    userId: string;
    displayName?: string;
}
export interface ShareTargetRole {
    type: 'role';
    roleName: string;
    displayName?: string;
}
export interface ShareTargetTeam {
    type: 'team';
    teamId: string;
    displayName?: string;
}
export interface ShareTargetEveryone {
    type: 'everyone';
}
export type ShareTarget = ShareTargetUser | ShareTargetRole | ShareTargetTeam | ShareTargetEveryone;
export declare function isUserTarget(target: ShareTarget): target is ShareTargetUser;
export declare function isRoleTarget(target: ShareTarget): target is ShareTargetRole;
export declare function isTeamTarget(target: ShareTarget): target is ShareTargetTeam;
export declare function isEveryoneTarget(target: ShareTarget): target is ShareTargetEveryone;
/**
 * Check if a viewer matches a share target.
 */
export declare function matchesShareTarget(target: ShareTarget, viewer: {
    userId?: string;
    roles?: string[];
    teams?: string[];
}): boolean;
/**
 * Check if a viewer matches any of the given share targets.
 */
export declare function matchesAnyShareTarget(targets: ShareTarget[], viewer: {
    userId?: string;
    roles?: string[];
    teams?: string[];
}): boolean;
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
export declare function isSharedWith(targets: ShareTarget[], viewerUserId: string, viewerRoles?: string[], viewerTeams?: string[]): boolean;
//# sourceMappingURL=share-target.d.ts.map