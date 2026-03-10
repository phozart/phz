/**
 * @phozart/phz-criteria — Date Range Picker
 *
 * Two-zone date selector:
 *   Zone 1: Quick presets (grouped list) — one-click selection
 *   Zone 2: Custom selection with granularity tabs (Day/Week/Month/Quarter/Year)
 *
 * Supports: fiscal calendar, week configuration, comparison periods, timezone display.
 */
import { LitElement } from 'lit';
import type { DateRangeFieldConfig, DateRangeValue } from '@phozart/phz-core';
export declare class PhzDateRangePicker extends LitElement {
    static styles: import("lit").CSSResult[];
    config: DateRangeFieldConfig;
    value: DateRangeValue | null;
    disabled: boolean;
    /** Render the panel inline (always open, no popup/backdrop). Useful for previews. */
    inline: boolean;
    private _open;
    private _granularity;
    private _viewYear;
    private _viewMonth;
    private _selecting;
    private _tempStart;
    private _tempEnd;
    private _showComparison;
    private _compType;
    private _panelStyle;
    private get _weekStart();
    private get _fiscal();
    private get _weekNumbering();
    private get _minDate();
    private get _maxDate();
    /** Check if a date string (YYYY-MM-DD) is within the allowed min/max range */
    private _isDateDisabled;
    /** Check if a period (start-end) is entirely outside the allowed range */
    private _isPeriodDisabled;
    private get _granularities();
    private get _presets();
    private get _groupedPresets();
    private _toggle;
    private _positionPanel;
    private _close;
    private _clear;
    private _selectPreset;
    private _selectDay;
    private _selectWeek;
    private _selectMonth;
    private _selectQuarter;
    private _selectYear;
    private _confirmCustomRange;
    private _fireChange;
    private _prevMonth;
    private _nextMonth;
    private _prevYear;
    private _nextYear;
    private _getDaysInMonth;
    private _getFirstDayOffset;
    private _isInRange;
    private _isSelected;
    private _renderTrigger;
    private _renderPresets;
    private _renderCustomZone;
    private _renderDayCalendar;
    private _renderWeekCalendar;
    private _renderMonthGrid;
    private _renderQuarterGrid;
    private _renderYearGrid;
    private _renderComparison;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-date-range-picker.d.ts.map