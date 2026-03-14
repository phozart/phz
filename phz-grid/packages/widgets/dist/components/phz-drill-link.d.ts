/**
 * @phozart/widgets — Drill Link
 *
 * Navigation button to a detail view.
 */
import { LitElement } from 'lit';
export declare class PhzDrillLink extends LitElement {
    static styles: import("lit").CSSResult[];
    label: string;
    targetReportId: string;
    filters?: Record<string, string>;
    openIn: 'panel' | 'modal' | 'page';
    private handleClick;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-drill-link': PhzDrillLink;
    }
}
//# sourceMappingURL=phz-drill-link.d.ts.map