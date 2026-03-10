/**
 * @phozart/phz-editor — <phz-editor-config-panel> (B-2.08)
 *
 * Constrained widget configuration panel. Authors configure
 * widgets by selecting from pre-approved measures and fields.
 */
import { LitElement } from 'lit';
import type { ConfigPanelState, FieldConstraint } from '../authoring/config-panel-state.js';
export declare class PhzEditorConfigPanel extends LitElement {
    static styles: import("lit").CSSResult;
    widgetType: string;
    widgetId: string;
    allowedFields: FieldConstraint[];
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current config panel state. */
    getState(): ConfigPanelState;
    private _onFieldChange;
    private _onApply;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-config-panel': PhzEditorConfigPanel;
    }
}
//# sourceMappingURL=phz-config-panel.d.ts.map