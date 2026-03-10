/**
 * S.6 — Role-Specific Shell Variants
 *
 * Pure functions to configure the workspace shell based on WorkspaceRole.
 * Admin sees all sections, Author loses GOVERN.
 *
 * v15 (A-2.11): 'viewer' removed from WorkspaceRole. The viewer experience
 * is now handled at the application layer (e.g., embedded read-only dashboards).
 * A runtime deprecation fallback accepts 'viewer' and returns an empty config
 * with a console warning to ease migration.
 */
export type WorkspaceRole = 'admin' | 'author';
/**
 * @deprecated The 'viewer' role was removed in v15. Use application-layer
 * access control for read-only experiences. This type is kept only for
 * migration compatibility and will be removed in v16.
 */
export type LegacyWorkspaceRole = 'admin' | 'author' | 'viewer';
export declare function isValidRole(role: string): role is WorkspaceRole;
/**
 * Returns true for 'admin', 'author', and the deprecated 'viewer'.
 * Use `isValidRole()` for the current role set.
 *
 * @deprecated Will be removed in v16.
 */
export declare function isLegacyRole(role: string): role is LegacyWorkspaceRole;
export type SidebarSection = 'CONTENT' | 'DATA' | 'GOVERN';
export type FilterMode = 'full' | 'limited' | 'readonly';
export type CatalogMode = 'full' | 'card';
export interface ShellConfig {
    sidebarSections: SidebarSection[];
    showSidebar: boolean;
    canPublish: boolean;
    canSetAlert: boolean;
    filterMode: FilterMode;
    catalogMode: CatalogMode;
    presetOnly: boolean;
}
export declare function getShellConfig(role: WorkspaceRole | LegacyWorkspaceRole): ShellConfig;
export interface RoleNavItem {
    id: string;
    label: string;
    icon: string;
    section: SidebarSection;
}
export declare function getNavItemsForRole(role: WorkspaceRole | LegacyWorkspaceRole): RoleNavItem[];
//# sourceMappingURL=shell-roles.d.ts.map