/**
 * @phozart/phz-criteria — Filter Section
 *
 * Collapsible section with chevron, count badge, required asterisk.
 * Lazy mount: slot content only rendered after first expand.
 */
import { LitElement } from 'lit';
export declare class PhzFilterSection extends LitElement {
    static styles: import("lit").CSSResult[];
    label: string;
    expanded: boolean;
    count: number;
    required: boolean;
    private _everExpanded;
    private _toggle;
    updated(changed: Map<string, unknown>): void;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-filter-section.d.ts.map