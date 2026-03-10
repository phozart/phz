import { LitElement, nothing } from 'lit';
import type { SaveState } from '../save-controller.js';
export declare class PhzSaveIndicator extends LitElement {
    static styles: import("lit").CSSResult;
    state: SaveState;
    errorMessage: string;
    private handleRetry;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-save-indicator': PhzSaveIndicator;
    }
}
//# sourceMappingURL=phz-save-indicator.d.ts.map