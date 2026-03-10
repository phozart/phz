/**
 * <phz-workspace-drawer> — Right-side overlay drawer
 *
 * Renders the active drawer panel (hierarchies, connectors, alerts, etc.)
 * with a header and close button.
 *
 * Events:
 *   close — drawer close requested
 */
import { LitElement, nothing } from 'lit';
import type { DrawerPanel } from '../shell/unified-workspace-state.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { DataAdapter } from '../data-adapter.js';
export declare class PhzWorkspaceDrawer extends LitElement {
    static readonly TAG = "phz-workspace-drawer";
    static styles: import("lit").CSSResult;
    panel: DrawerPanel | null;
    width: number;
    adapter?: WorkspaceAdapter;
    dataAdapter?: DataAdapter;
    private _elementCache;
    disconnectedCallback(): void;
    private _handleClose;
    private _renderContent;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-workspace-drawer': PhzWorkspaceDrawer;
    }
}
//# sourceMappingURL=phz-workspace-drawer.d.ts.map