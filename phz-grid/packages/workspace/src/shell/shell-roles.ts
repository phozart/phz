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

// ========================================================================
// WorkspaceRole
// ========================================================================

export type WorkspaceRole = 'admin' | 'author';

/**
 * @deprecated The 'viewer' role was removed in v15. Use application-layer
 * access control for read-only experiences. This type is kept only for
 * migration compatibility and will be removed in v16.
 */
export type LegacyWorkspaceRole = 'admin' | 'author' | 'viewer';

const VALID_ROLES = new Set<string>(['admin', 'author']);

/**
 * @deprecated 'viewer' was removed in v15 — see LegacyWorkspaceRole.
 */
const LEGACY_ROLES = new Set<string>(['admin', 'author', 'viewer']);

export function isValidRole(role: string): role is WorkspaceRole {
  return VALID_ROLES.has(role);
}

/**
 * Returns true for 'admin', 'author', and the deprecated 'viewer'.
 * Use `isValidRole()` for the current role set.
 *
 * @deprecated Will be removed in v16.
 */
export function isLegacyRole(role: string): role is LegacyWorkspaceRole {
  return LEGACY_ROLES.has(role);
}

// ========================================================================
// Shell Configuration
// ========================================================================

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

/** Empty config returned for the deprecated 'viewer' role. */
const VIEWER_FALLBACK_CONFIG: ShellConfig = {
  sidebarSections: [],
  showSidebar: false,
  canPublish: false,
  canSetAlert: false,
  filterMode: 'readonly',
  catalogMode: 'card',
  presetOnly: true,
};

let viewerWarned = false;

function warnViewerDeprecated(): void {
  if (!viewerWarned) {
    viewerWarned = true;
    console.warn(
      '[@phozart/phz-workspace] WorkspaceRole "viewer" is deprecated and was removed in v15. ' +
      'Use application-layer access control for read-only experiences. ' +
      'This fallback will be removed in v16.',
    );
  }
}

export function getShellConfig(role: WorkspaceRole | LegacyWorkspaceRole): ShellConfig {
  switch (role) {
    case 'admin':
      return {
        sidebarSections: ['CONTENT', 'DATA', 'GOVERN'],
        showSidebar: true,
        canPublish: true,
        canSetAlert: true,
        filterMode: 'full',
        catalogMode: 'full',
        presetOnly: false,
      };
    case 'author':
      return {
        sidebarSections: ['CONTENT', 'DATA'],
        showSidebar: true,
        canPublish: false,
        canSetAlert: false,
        filterMode: 'limited',
        catalogMode: 'full',
        presetOnly: false,
      };
    case 'viewer':
      warnViewerDeprecated();
      return { ...VIEWER_FALLBACK_CONFIG };
  }
}

// ========================================================================
// Role-Filtered Nav Items
// ========================================================================

export interface RoleNavItem {
  id: string;
  label: string;
  icon: string;
  section: SidebarSection;
}

const ALL_NAV_ITEMS: RoleNavItem[] = [
  { id: 'catalog', label: 'Catalog', icon: 'catalog', section: 'CONTENT' },
  { id: 'explore', label: 'Explore', icon: 'explore', section: 'CONTENT' },
  { id: 'dashboards', label: 'Dashboards', icon: 'dashboard', section: 'CONTENT' },
  { id: 'reports', label: 'Reports', icon: 'report', section: 'CONTENT' },
  { id: 'data-sources', label: 'Data Sources', icon: 'data', section: 'DATA' },
  { id: 'hierarchies', label: 'Hierarchies', icon: 'hierarchy', section: 'DATA' },
  { id: 'connectors', label: 'Connectors', icon: 'connector', section: 'DATA' },
  { id: 'alerts', label: 'Alerts', icon: 'alert', section: 'GOVERN' },
  { id: 'permissions', label: 'Permissions', icon: 'lock', section: 'GOVERN' },
  { id: 'lineage', label: 'Lineage', icon: 'lineage', section: 'GOVERN' },
];

export function getNavItemsForRole(role: WorkspaceRole | LegacyWorkspaceRole): RoleNavItem[] {
  const config = getShellConfig(role);
  if (!config.showSidebar) {
    return ALL_NAV_ITEMS.filter(item => item.id === 'catalog' || item.id === 'dashboards');
  }
  const sections = new Set(config.sidebarSections);
  return ALL_NAV_ITEMS.filter(item => sections.has(item.section));
}
