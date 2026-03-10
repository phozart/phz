/**
 * Workspace Configuration — shared constants for workspace sub-components.
 *
 * Panel descriptors, icon mappings, and navbar items used across
 * phz-workspace-navbar, phz-workspace-drawer, and the shell.
 */

import type { DrawerPanel, WorkspaceViewType } from './shell/unified-workspace-state.js';
import type { IconName } from './styles/icons.js';

// ---------------------------------------------------------------------------
// Panel Descriptors (view type → component tag)
// ---------------------------------------------------------------------------

export interface PanelDescriptor {
  tag: string;
  label: string;
  emptyIcon: IconName;
  emptyMessage: string;
}

export const VIEW_PANELS: Record<string, PanelDescriptor> = {
  catalog: {
    tag: 'phz-catalog-browser', label: 'Catalog',
    emptyIcon: 'catalog', emptyMessage: 'Browse and manage your artifacts',
  },
  explore: {
    tag: 'phz-data-workbench', label: 'Explore',
    emptyIcon: 'explore', emptyMessage: 'Interactive data workbench — drag fields to build visualizations',
  },
  'data-sources': {
    tag: 'phz-data-source-panel', label: 'Data Sources',
    emptyIcon: 'sourceDatabase', emptyMessage: 'Connect and manage data sources',
  },
  report: {
    tag: 'phz-report-editor', label: 'Report',
    emptyIcon: 'report', emptyMessage: 'Configure and design reports',
  },
  dashboard: {
    tag: 'phz-dashboard-editor', label: 'Dashboard',
    emptyIcon: 'dashboard', emptyMessage: 'Build dashboards with drag-and-drop',
  },
};

export const DRAWER_PANELS: Record<DrawerPanel, PanelDescriptor> = {
  hierarchies: {
    tag: 'phz-hierarchy-editor', label: 'Hierarchies',
    emptyIcon: 'drillThrough', emptyMessage: 'Define drill hierarchies',
  },
  connectors: {
    tag: 'phz-connection-editor', label: 'Connectors',
    emptyIcon: 'sourceUrl', emptyMessage: 'Configure remote data connectors',
  },
  alerts: {
    tag: 'phz-alert-rule-designer', label: 'Alerts',
    emptyIcon: 'alertRule', emptyMessage: 'Set up threshold alerts',
  },
  permissions: {
    tag: 'phz-permissions-panel', label: 'Permissions',
    emptyIcon: 'lock', emptyMessage: 'Manage access and sharing',
  },
  lineage: {
    tag: 'phz-lineage-viewer', label: 'Lineage',
    emptyIcon: 'lineage', emptyMessage: 'Trace data dependencies',
  },
  preferences: {
    tag: 'phz-workspace-preferences', label: 'Preferences',
    emptyIcon: 'settings', emptyMessage: 'Workspace preferences',
  },
};

// ---------------------------------------------------------------------------
// Icon Mapping
// ---------------------------------------------------------------------------

export const VIEW_TYPE_ICON: Record<WorkspaceViewType, IconName> = {
  catalog: 'catalog',
  explore: 'explore',
  'data-sources': 'sourceDatabase',
  report: 'report',
  dashboard: 'dashboard',
};

// ---------------------------------------------------------------------------
// Navbar Items
// ---------------------------------------------------------------------------

export interface NavbarItem {
  id: string;
  icon: IconName;
  label: string;
  action: 'view' | 'drawer' | 'create';
  viewType?: WorkspaceViewType;
  drawerPanel?: DrawerPanel;
  section?: 'GOVERN';
}

export const NAV_ITEMS: NavbarItem[] = [
  { id: 'catalog', icon: 'catalog', label: 'Catalog', action: 'view', viewType: 'catalog' },
];

export const NAV_CREATE: NavbarItem = {
  id: 'create', icon: 'addCircle', label: 'New', action: 'create',
};

export const NAV_TOOLS: NavbarItem[] = [
  { id: 'hierarchies', icon: 'drillThrough', label: 'Hierarchies', action: 'drawer', drawerPanel: 'hierarchies' },
  { id: 'connectors', icon: 'sourceUrl', label: 'Connectors', action: 'drawer', drawerPanel: 'connectors' },
  { id: 'alerts', icon: 'alertRule', label: 'Alerts', action: 'drawer', drawerPanel: 'alerts', section: 'GOVERN' },
  { id: 'permissions', icon: 'lock', label: 'Permissions', action: 'drawer', drawerPanel: 'permissions', section: 'GOVERN' },
  { id: 'lineage', icon: 'lineage', label: 'Lineage', action: 'drawer', drawerPanel: 'lineage', section: 'GOVERN' },
  { id: 'preferences', icon: 'settings', label: 'Preferences', action: 'drawer', drawerPanel: 'preferences' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map legacy panel IDs (from active-panel attribute) to view types. */
export function legacyPanelToViewType(id: string): WorkspaceViewType | undefined {
  if (id === 'catalog' || id === 'explore' || id === 'data-sources') return id;
  if (id === 'reports' || id === 'authoring-report') return 'report';
  if (id === 'dashboards' || id === 'authoring-dashboard') return 'dashboard';
  return undefined;
}
