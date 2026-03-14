/**
 * @phozart/grid — <phz-filter-popover>
 *
 * Excel-like filter popover with:
 *  - Value checklist with counts
 *  - Search/filter of values
 *  - Select All / (Blanks) support
 *  - Day-of-week filter (date columns)
 *  - Hierarchical date grouping (year > month > individual dates)
 *  - Conditional filter section (operator + value)
 *  - Apply / Clear action buttons
 */
import { LitElement, type TemplateResult, type PropertyValues } from 'lit';
import type { FilterOperator } from '@phozart/core';
export interface FilterValueEntry {
    value: unknown;
    displayText: string;
    count: number;
    checked: boolean;
}
export interface DatePartFilter {
    type: 'dateDayOfWeek';
    values: number[];
}
export interface FilterApplyEvent {
    field: string;
    selectedValues: unknown[];
    customFilter?: {
        operator: FilterOperator;
        value: unknown;
        logic?: 'and' | 'or';
        operator2?: FilterOperator;
        value2?: unknown;
    };
    datePartFilters?: DatePartFilter[];
}
export declare class PhzFilterPopover extends LitElement {
    open: boolean;
    field: string;
    columnType: string;
    anchorRect: DOMRect | null;
    values: FilterValueEntry[];
    private searchQuery;
    private filteredValues;
    private showCustomFilter;
    private customOperator;
    private customValue;
    private customLogic;
    private customOperator2;
    private customValue2;
    private posX;
    private posY;
    private sidePanelLeft;
    private selectedDays;
    private expandedYears;
    private expandedMonths;
    private showDatePanel;
    private focusedValueIndex;
    private cleanup;
    private previousFocusElement;
    /** Guards against infinite update loop: tracks the last values array set by applySearch */
    private _lastInternalValues;
    private static readonly DAY_NAMES;
    private static readonly MONTH_NAMES;
    private isDateColumn;
    static styles: import("lit").CSSResult;
    updated(changed: PropertyValues): void;
    private extractDateParts;
    private parseDate;
    show(field: string, anchorRect: DOMRect, values: FilterValueEntry[], columnType?: string): void;
    hide(): void;
    /** Get all focusable elements within the popover for focus trapping */
    private getFocusableElements;
    /** Handle keyboard events within the popover for value list navigation */
    private handlePopoverKeydown;
    private positionPopover;
    private addListeners;
    private removeListeners;
    /** Snapshot of checked state before search began — restored when search is cleared */
    private preSearchChecked;
    private applySearch;
    private onSearchInput;
    private toggleValue;
    private toggleSelectAll;
    private toggleGroupCheck;
    private toggleYearExpand;
    private toggleMonthExpand;
    private handleClear;
    private handleApply;
    private getOperatorsForType;
    private getActiveDatePartCount;
    /** Highlight matching portion of text with <mark> */
    private highlightMatch;
    private renderDatePartChips;
    private renderGroupedDateList;
    private renderDateSidePanel;
    protected render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-filter-popover': PhzFilterPopover;
    }
}
//# sourceMappingURL=phz-filter-popover.d.ts.map