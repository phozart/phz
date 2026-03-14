/**
 * @phozart/grid-creator — <phz-creator-review>
 *
 * Review & Create summary panel. Shows draft state before committing.
 */
import { LitElement } from 'lit';
import type { ReviewSummary } from './wizard-state.js';
export declare class PhzCreatorReview extends LitElement {
    static styles: import("lit").CSSResult;
    summary: ReviewSummary | null;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-creator-review': PhzCreatorReview;
    }
}
//# sourceMappingURL=phz-creator-review.d.ts.map