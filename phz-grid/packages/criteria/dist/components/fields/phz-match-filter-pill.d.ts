/**
 * @phozart/criteria — Match Filter Pill
 *
 * Tri-state pill that cycles: all → matching → non-matching → all.
 * Used alongside tree selects to filter which items are shown.
 */
import { LitElement } from 'lit';
import type { MatchFilterState } from '@phozart/core';
export declare class PhzMatchFilterPill extends LitElement {
    static styles: import("lit").CSSResult[];
    label: string;
    state: MatchFilterState;
    private _cycle;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-match-filter-pill.d.ts.map