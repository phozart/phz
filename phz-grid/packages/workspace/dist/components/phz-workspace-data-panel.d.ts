/**
 * <phz-workspace-data-panel> — Collapsible side panel (data source browser)
 *
 * Shows the field browser (phz-data-source-panel). Only visible for
 * non-authoring views (catalog, data-sources) — authoring editors
 * have their own integrated data panels.
 *
 * Events:
 *   toggle — panel collapsed/expanded
 *   tab-change — { tab: DataPanelTab }
 */
import { LitElement, nothing } from 'lit';
import type { DataPanelTab, WorkspaceView } from '../shell/unified-workspace-state.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { DataAdapter } from '../data-adapter.js';
export declare class PhzWorkspaceDataPanel extends LitElement {
    static readonly TAG = "phz-workspace-data-panel";
    static styles: import("lit").CSSResult;
    collapsed: boolean;
    activeTab: DataPanelTab;
    availableTabs: DataPanelTab[];
    view?: WorkspaceView;
    adapter?: WorkspaceAdapter;
    dataAdapter?: DataAdapter;
    private _panelCache;
    disconnectedCallback(): void;
    private _handleToggle;
    private _handleTabClick;
    private _renderContent;
    private _renderDataContent;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace-data-panel': PhzWorkspaceDataPanel;
    }
}
//# sourceMappingURL=phz-workspace-data-panel.d.ts.map