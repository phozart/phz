/**
 * <phz-workspace-navbar> — Horizontal sub-navigation bar
 *
 * Replaces the vertical icon rail with a horizontal bar below the header.
 * Contains navigation items, a create (+) button, and tool/drawer toggles.
 *
 * Events:
 *   nav-select  — { viewType, label, icon }
 *   drawer-toggle — { panel: DrawerPanel }
 *   create-new — (no detail) — opens a new blank artifact workspace
 */
import { LitElement } from 'lit';
import { type WorkspaceRole } from '../shell/shell-roles.js';
import type { WorkspaceViewType, DrawerPanel } from '../shell/unified-workspace-state.js';
export declare class PhzWorkspaceNavbar extends LitElement {
    static readonly TAG = "phz-workspace-navbar";
    static styles: import("lit").CSSResult;
    activeViewType: WorkspaceViewType;
    activeDrawer: DrawerPanel | null;
    workspaceRole: WorkspaceRole;
    private _getVisibleTools;
    private _handleNavClick;
    private _handleCreateNew;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace-navbar': PhzWorkspaceNavbar;
    }
}
//# sourceMappingURL=phz-workspace-navbar.d.ts.map