/**
 * <phz-workspace> — Unified single-view workspace component
 *
 * Slim orchestrator shell. Owns the UnifiedWorkspaceState and delegates
 * rendering to vertical-slice sub-components:
 *
 * Layout (top → bottom):
 * ┌─ header (56px dark frame) ───────────────────────────────────────┐
 * ├─ phz-workspace-navbar (40px horizontal sub-nav) ─────────────────┤
 * ├─ phz-workspace-selector-bar (44px artifact + back) ──────────────┤
 * ├─ body ────────────────────────────────────────────────────────────┤
 * │  ┌─ data-panel ─┬─ content (scroll) ─┬─ drawer (optional) ─┐    │
 * │  │ Data/Filters/ │ View component     │ Hierarchies/etc.   │    │
 * │  │ Settings tabs │                    │                    │    │
 * │  └──────────────┴────────────────────┴────────────────────┘    │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import '@phozart/workspace/all';
 *   <phz-workspace .adapter=${adapter} workspace-role="admin"></phz-workspace>
 */
import { LitElement } from 'lit';
import type { WorkspaceAdapter } from './workspace-adapter.js';
import type { DataAdapter } from './data-adapter.js';
import type { WorkspaceRole } from './shell/shell-roles.js';
import { type WorkspaceViewType } from './shell/unified-workspace-state.js';
import './components/phz-workspace-navbar.js';
import './components/phz-workspace-data-panel.js';
import './components/phz-workspace-drawer.js';
import './components/phz-workspace-selector-bar.js';
export declare class PhzWorkspace extends LitElement {
    static readonly TAG = "phz-workspace";
    static styles: import("lit").CSSResult;
    adapter?: WorkspaceAdapter;
    dataAdapter?: DataAdapter;
    workspaceRole: WorkspaceRole;
    title: string;
    /** @deprecated Use navigateTo() instead. Kept for backward compat. */
    activePanel: string;
    private _ws;
    private _mobileNavOpen;
    private _panelCache;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _openFromLegacyPanel;
    private _handleNavSelect;
    private _handleDrawerToggle;
    private _handleDrawerClose;
    private _handleCreateNew;
    private _handleBack;
    private _handleRecentSelect;
    private _handleToggleDataPanel;
    private _handleDataPanelTabChange;
    private _emitViewChange;
    /** Navigate to an artifact view. */
    navigateTo(type: WorkspaceViewType, label: string, artifactId?: string): void;
    /** Mark the current view as having unsaved changes. */
    setDirty(dirty: boolean): void;
    private _renderViewContent;
    private _renderViewElement;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace': PhzWorkspace;
    }
}
//# sourceMappingURL=phz-workspace.d.ts.map