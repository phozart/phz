/**
 * @phozart/phz-criteria — Criteria Summary (Standalone)
 *
 * A standalone summary strip that can be placed anywhere on screen.
 * The consumer controls the message content; admin controls the styling.
 *
 * Properties:
 *  - message: string — text/HTML to display
 *  - active: boolean — switches to active color scheme (when filters applied)
 *  - layout: SummaryStripLayout — styling from admin config
 *  - visible: boolean — show/hide (defaults true)
 *
 * Events:
 *  - summary-click — dispatched on click (consumer can open drawer)
 */
import { LitElement, nothing } from 'lit';
import type { SummaryStripLayout } from '@phozart/phz-core';
export declare class PhzCriteriaSummary extends LitElement {
    static styles: import("lit").CSSResult[];
    message: string;
    active: boolean;
    layout: SummaryStripLayout;
    visible: boolean;
    private _onClick;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
}
//# sourceMappingURL=phz-criteria-summary.d.ts.map