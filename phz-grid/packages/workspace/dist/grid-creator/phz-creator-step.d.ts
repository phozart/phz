/**
 * @phozart/grid-creator — <phz-creator-step>
 *
 * Step indicator with horizontal numbered circles and connectors.
 * Highlights current, completed, and upcoming steps.
 */
import { LitElement } from 'lit';
export declare class PhzCreatorStep extends LitElement {
    static styles: import("lit").CSSResult;
    currentStep: number;
    totalSteps: number;
    completedSteps: Set<number>;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-creator-step': PhzCreatorStep;
    }
}
//# sourceMappingURL=phz-creator-step.d.ts.map