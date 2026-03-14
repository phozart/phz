/**
 * @phozart/editor — <phz-editor-explorer> (B-2.10)
 *
 * Visual query explorer component with save-to-artifact capability.
 * Users drag fields into dimension/measure/filter zones to build
 * ad-hoc queries, preview results, and optionally save as reports
 * or dashboard widgets.
 */
import { LitElement } from 'lit';
import type { ExplorerState } from '../screens/explorer-state.js';
export declare class PhzEditorExplorer extends LitElement {
    static styles: import("lit").CSSResult;
    dataSourceId: string;
    fields: string[];
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current explorer state. */
    getState(): ExplorerState;
    private _onSaveAs;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-explorer': PhzEditorExplorer;
    }
}
//# sourceMappingURL=phz-editor-explorer.d.ts.map