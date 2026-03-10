/**
 * Workspace Configuration — shared constants for workspace sub-components.
 *
 * Panel descriptors, icon mappings, and navbar items used across
 * phz-workspace-navbar, phz-workspace-drawer, and the shell.
 */
import type { DrawerPanel, WorkspaceViewType } from './shell/unified-workspace-state.js';
import type { IconName } from './styles/icons.js';
export interface PanelDescriptor {
    tag: string;
    label: string;
    emptyIcon: IconName;
    emptyMessage: string;
}
export declare const VIEW_PANELS: Record<string, PanelDescriptor>;
export declare const DRAWER_PANELS: Record<DrawerPanel, PanelDescriptor>;
export declare const VIEW_TYPE_ICON: Record<WorkspaceViewType, IconName>;
export interface NavbarItem {
    id: string;
    icon: IconName;
    label: string;
    action: 'view' | 'drawer' | 'create';
    viewType?: WorkspaceViewType;
    drawerPanel?: DrawerPanel;
    section?: 'GOVERN';
}
export declare const NAV_ITEMS: NavbarItem[];
export declare const NAV_CREATE: NavbarItem;
export declare const NAV_TOOLS: NavbarItem[];
/** Map legacy panel IDs (from active-panel attribute) to view types. */
export declare function legacyPanelToViewType(id: string): WorkspaceViewType | undefined;
//# sourceMappingURL=workspace-config.d.ts.map