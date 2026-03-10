/**
 * <phz-workspace-selector-bar> — Artifact selector and back navigation
 *
 * Shows the current artifact icon + label, back button, dirty indicator,
 * and a recent artifacts dropdown.
 *
 * Events:
 *   back — back navigation requested
 *   recent-select — { id, type, name } — recent artifact clicked
 *   toggle-data-panel — data panel expand/collapse requested
 */
import { LitElement, nothing } from 'lit';
import type { WorkspaceView, RecentArtifact } from '../shell/unified-workspace-state.js';
export declare class PhzWorkspaceSelectorBar extends LitElement {
    static readonly TAG = "phz-workspace-selector-bar";
    static styles: import("lit").CSSResult;
    view?: WorkspaceView;
    canGoBack: boolean;
    isDirty: boolean;
    dataPanelCollapsed: boolean;
    recentArtifacts: RecentArtifact[];
    private _dropdownOpen;
    private _bodyClickHandler;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _handleBack;
    private _handleToggleDropdown;
    private _handleRecentSelect;
    private _handleToggleDataPanel;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace-selector-bar': PhzWorkspaceSelectorBar;
    }
}
//# sourceMappingURL=phz-workspace-selector-bar.d.ts.map