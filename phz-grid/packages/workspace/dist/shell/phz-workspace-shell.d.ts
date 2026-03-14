/**
 * @phozart/workspace — WorkspaceShell
 *
 * Root shell component: dark header bar, sidebar with SVG icons and section headers,
 * content area with slot-based panel routing. Role-aware navigation.
 */
import { LitElement } from 'lit';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import { type NavItem } from './shell-utils.js';
import { type WorkspaceRole } from './shell-roles.js';
export declare class PhzWorkspaceShell extends LitElement {
    static readonly TAG = "phz-workspace-shell";
    static styles: import("lit").CSSResult;
    adapter?: WorkspaceAdapter;
    role: WorkspaceRole;
    title: string;
    /** Override default nav items. If not set, role-based items are used. */
    navItems?: NavItem[];
    /** Save status indicator: idle, dirty, saving, saved, error. */
    saveStatus: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
    /** Whether undo action is available. */
    canUndo: boolean;
    /** Whether redo action is available. */
    canRedo: boolean;
    private activePanel;
    private _mobileNavOpen;
    private _breadcrumbState;
    private getResolvedNavItems;
    private _emitUndo;
    private _emitRedo;
    private _getSaveLabel;
    private handleNavClick;
    private _handleBreadcrumbClick;
    private renderNavIcon;
    private renderSidebar;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace-shell': PhzWorkspaceShell;
    }
}
//# sourceMappingURL=phz-workspace-shell.d.ts.map