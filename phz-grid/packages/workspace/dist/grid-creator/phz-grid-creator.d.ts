/**
 * @phozart/phz-grid-creator — <phz-grid-creator>
 *
 * Main wizard modal for creating new grids/reports.
 * 5 steps: Report Identity -> Data Source -> Column Selection -> Configuration -> Review & Create
 *
 * Slot-based rendering — only the current step's component is in the DOM.
 * Draft state lives in the wizard — not committed until "Create" click.
 * Output event: grid-definition-create with CreatePayload.
 */
import { LitElement, nothing } from 'lit';
import './phz-creator-step.js';
import './phz-creator-review.js';
export declare class PhzGridCreator extends LitElement {
    static styles: import("lit").CSSResult;
    open: boolean;
    private _state;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
    private _renderCurrentStep;
    private _next;
    private _prev;
    private _cancel;
    private _create;
    private _onBackdropClick;
    private _onKeydown;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-grid-creator': PhzGridCreator;
    }
}
//# sourceMappingURL=phz-grid-creator.d.ts.map