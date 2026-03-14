/**
 * @phozart/criteria — Criteria Bar
 *
 * Compact horizontal bar showing: "Filters" button with count badge,
 * pinned filter tags, active filter summary tags, and "Clear all".
 *
 * Supports two mutually exclusive bar modes via FilterBarLayout.barMode:
 * - 'button' (default): Filters button with badge, tags, clear all
 * - 'summary': Clickable text summary of active filters, opens drawer on click
 *
 * Button mode layout options:
 * - barDisplayMode: full (tags visible) or compact (button only)
 * - buttonContent: icon-only, icon-text, text-only
 * - buttonLabel: custom text (default "Filters")
 * - buttonBgColor / buttonTextColor: button colors
 * - containerBgColor / containerBorderColor: bar container colors
 * - buttonOnly: hide the container, show only the button
 */
import { LitElement } from 'lit';
import type { CriteriaConfig, SelectionContext, FilterBarLayout } from '@phozart/core';
export declare class PhzCriteriaBar extends LitElement {
    static styles: import("lit").CSSResult[];
    config: CriteriaConfig;
    selectionContext: SelectionContext;
    layout: FilterBarLayout;
    private get _ly();
    private _getActiveFields;
    private _getPinnedFields;
    private _formatValue;
    private _openDrawer;
    private _clearAll;
    private _removeFilter;
    private _getSummaryFields;
    private _buildSummaryText;
    private _getSL;
    private _renderSummaryBar;
    private _renderFilterButton;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-criteria-bar.d.ts.map