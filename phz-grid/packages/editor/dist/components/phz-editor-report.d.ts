/**
 * @phozart/editor — <phz-editor-report> (B-2.09)
 *
 * Report editing component. Provides column configuration,
 * filter management, sort setup, and preview mode.
 */
import { LitElement } from 'lit';
import type { ReportEditState } from '../screens/report-state.js';
export declare class PhzEditorReport extends LitElement {
    static styles: import("lit").CSSResult;
    reportId: string;
    editMode: boolean;
    private _state;
    willUpdate(changed: Map<PropertyKey, unknown>): void;
    /** Get the current report state. */
    getState(): ReportEditState;
    private _onTitleChange;
    private _onTogglePreview;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-editor-report': PhzEditorReport;
    }
}
//# sourceMappingURL=phz-editor-report.d.ts.map