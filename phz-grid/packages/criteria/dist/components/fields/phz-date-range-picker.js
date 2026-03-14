/**
 * @phozart/criteria — Date Range Picker
 *
 * Two-zone date selector:
 *   Zone 1: Quick presets (grouped list) — one-click selection
 *   Zone 2: Custom selection with granularity tabs (Day/Week/Month/Quarter/Year)
 *
 * Supports: fiscal calendar, week configuration, comparison periods, timezone display.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { resolveBuiltinPreset, resolveComparisonPeriod, getAvailablePresets, formatDateRangeDisplay, getWeekStart, getISOWeekNumber, getSequentialWeekNumber, getFiscalQuarterBounds, DATE_PRESET_GROUP_LABELS, } from '@phozart/engine';
import { criteriaStyles } from '../../shared-styles.js';
const DAY_HEADERS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_HEADERS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ALL_GRANULARITIES = ['day', 'week', 'month', 'quarter', 'year'];
function pad2(n) { return n < 10 ? '0' + n : String(n); }
function toISO(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
let PhzDateRangePicker = class PhzDateRangePicker extends LitElement {
    constructor() {
        super(...arguments);
        this.config = {};
        this.value = null;
        this.disabled = false;
        /** Render the panel inline (always open, no popup/backdrop). Useful for previews. */
        this.inline = false;
        this._open = false;
        this._granularity = 'day';
        this._viewYear = new Date().getFullYear();
        this._viewMonth = new Date().getMonth();
        this._selecting = 'start';
        this._tempStart = null;
        this._tempEnd = null;
        this._showComparison = false;
        this._compType = 'previous_period';
        this._panelStyle = '';
    }
    static { this.styles = [criteriaStyles, css `
    :host { position: relative; display: block; }

    .phz-sc-dp-trigger {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px; border: 1px solid #D6D3D1; border-radius: 8px;
      font-size: 13px; cursor: pointer; background: #FFFFFF; color: #1C1917;
      min-width: 200px; width: 100%; text-align: left;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    .phz-sc-dp-trigger:hover { border-color: #A8A29E; }
    .phz-sc-dp-trigger:focus { border-color: #2563EB; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .phz-sc-dp-trigger:disabled { background: #F5F5F4; color: #A8A29E; cursor: not-allowed; }
    .phz-sc-dp-trigger-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .phz-sc-dp-trigger-icon { color: #78716C; flex-shrink: 0; display: flex; }
    .phz-sc-dp-trigger-clear {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 50%;
      background: #F5F5F4; border: none; cursor: pointer;
      color: #78716C; font-size: 10px; flex-shrink: 0;
      font-family: inherit;
    }
    .phz-sc-dp-trigger-clear:hover { background: #E7E5E4; color: #1C1917; }

    .phz-sc-dp-backdrop {
      position: fixed; inset: 0; z-index: 1009;
    }

    /* Inline mode — panel rendered in flow, no fixed positioning */
    .phz-sc-dp-panel--inline {
      position: static;
      z-index: auto;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(28,25,23,0.06);
      display: flex;
      overflow: hidden;
      margin-top: 8px;
    }
  `]; }
    // --- Config helpers ---
    get _weekStart() { return this.config.weekStartDay ?? 'monday'; }
    get _fiscal() { return this.config.fiscalYearStartMonth ?? 1; }
    get _weekNumbering() { return this.config.weekNumbering ?? 'iso'; }
    get _minDate() { return this.config.minDate; }
    get _maxDate() { return this.config.maxDate; }
    /** Check if a date string (YYYY-MM-DD) is within the allowed min/max range */
    _isDateDisabled(dateStr) {
        if (this._minDate && dateStr < this._minDate)
            return true;
        if (this._maxDate && dateStr > this._maxDate)
            return true;
        return false;
    }
    /** Check if a period (start-end) is entirely outside the allowed range */
    _isPeriodDisabled(startStr, endStr) {
        if (this._minDate && endStr < this._minDate)
            return true;
        if (this._maxDate && startStr > this._maxDate)
            return true;
        return false;
    }
    get _granularities() {
        return this.config.availableGranularities ?? ALL_GRANULARITIES;
    }
    get _presets() {
        return getAvailablePresets(this.config);
    }
    get _groupedPresets() {
        const map = new Map();
        for (const p of this._presets) {
            if (!map.has(p.group))
                map.set(p.group, []);
            map.get(p.group).push(p);
        }
        return map;
    }
    // --- Open/Close ---
    _toggle() {
        if (this.disabled)
            return;
        if (this._open) {
            this._open = false;
            return;
        }
        this._open = true;
        this._selecting = 'start';
        this._tempStart = this.value?.startDate ?? null;
        this._tempEnd = this.value?.endDate ?? null;
        this._showComparison = !!(this.value?.comparisonStartDate);
        if (this.value?.startDate) {
            const d = new Date(this.value.startDate);
            this._viewYear = d.getFullYear();
            this._viewMonth = d.getMonth();
        }
        else {
            const now = new Date();
            this._viewYear = now.getFullYear();
            this._viewMonth = now.getMonth();
        }
        // Default granularity to first available
        if (!this._granularities.includes(this._granularity)) {
            this._granularity = this._granularities[0] ?? 'day';
        }
        // Calculate fixed position from trigger's viewport rect
        this._positionPanel();
    }
    _positionPanel() {
        this.updateComplete.then(() => {
            const trigger = this.renderRoot.querySelector('.phz-sc-dp-trigger');
            if (!trigger)
                return;
            const rect = trigger.getBoundingClientRect();
            const panelWidth = 540;
            const panelHeight = 400;
            let top = rect.bottom + 4;
            let left = rect.left;
            // If panel would overflow right edge, shift left
            if (left + panelWidth > window.innerWidth) {
                left = window.innerWidth - panelWidth - 16;
            }
            // If panel would overflow bottom, open above
            if (top + panelHeight > window.innerHeight) {
                top = rect.top - panelHeight - 4;
            }
            // Ensure minimum bounds
            if (left < 8)
                left = 8;
            if (top < 8)
                top = 8;
            this._panelStyle = `top:${top}px;left:${left}px`;
        });
    }
    _close() { this._open = false; }
    _clear(e) {
        e.stopPropagation();
        this._fireChange(null);
    }
    // --- Preset selection ---
    _selectPreset(presetId) {
        const range = resolveBuiltinPreset(presetId, undefined, {
            fiscalYearStartMonth: this._fiscal,
            weekStartDay: this._weekStart,
        });
        if (this._showComparison && this.config.comparisonEnabled) {
            const comp = resolveComparisonPeriod(range, this._compType);
            range.comparisonStartDate = comp.startDate;
            range.comparisonEndDate = comp.endDate;
            range.comparisonType = this._compType;
        }
        this._fireChange(range);
    }
    // --- Custom date selection ---
    _selectDay(year, month, day) {
        const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
        if (this._selecting === 'start') {
            this._tempStart = dateStr;
            this._tempEnd = null;
            this._selecting = 'end';
        }
        else {
            let s = this._tempStart;
            let e = dateStr;
            if (e < s) {
                [s, e] = [e, s];
            }
            this._confirmCustomRange(s, e, 'day');
        }
        this.requestUpdate();
    }
    _selectWeek(weekStartDate) {
        const s = toISO(weekStartDate);
        const end = new Date(weekStartDate);
        end.setDate(end.getDate() + 6);
        const e = toISO(end);
        if (this._selecting === 'start') {
            this._tempStart = s;
            this._tempEnd = e;
            this._selecting = 'end';
            this.requestUpdate();
        }
        else {
            let rs = this._tempStart;
            let re = e;
            if (re < rs) {
                rs = s;
                re = this._tempEnd ?? e;
            }
            else {
                rs = this._tempStart;
            }
            this._confirmCustomRange(rs, re, 'week');
        }
    }
    _selectMonth(year, month) {
        const s = `${year}-${pad2(month + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0);
        const e = toISO(lastDay);
        if (this._selecting === 'start') {
            this._tempStart = s;
            this._tempEnd = e;
            this._selecting = 'end';
            this.requestUpdate();
        }
        else {
            let rs = this._tempStart;
            let re = e;
            if (s < rs) {
                rs = s;
                re = this._tempEnd ?? e;
            }
            this._confirmCustomRange(rs, re, 'month');
        }
    }
    _selectQuarter(year, quarter) {
        const bounds = getFiscalQuarterBounds(year, quarter, this._fiscal);
        const s = toISO(bounds.start);
        const e = toISO(bounds.end);
        if (this._selecting === 'start') {
            this._tempStart = s;
            this._tempEnd = e;
            this._selecting = 'end';
            this.requestUpdate();
        }
        else {
            let rs = this._tempStart;
            let re = e;
            if (s < rs) {
                rs = s;
                re = this._tempEnd ?? e;
            }
            this._confirmCustomRange(rs, re, 'quarter');
        }
    }
    _selectYear(year) {
        // For fiscal years
        const fsm = this._fiscal - 1;
        const s = toISO(new Date(year, fsm, 1));
        const endDate = new Date(year + 1, fsm, 0); // last day before next fiscal year start
        const e = toISO(endDate);
        if (this._selecting === 'start') {
            this._tempStart = s;
            this._tempEnd = e;
            this._selecting = 'end';
            this.requestUpdate();
        }
        else {
            let rs = this._tempStart;
            let re = e;
            if (s < rs) {
                rs = s;
                re = this._tempEnd ?? e;
            }
            this._confirmCustomRange(rs, re, 'year');
        }
    }
    _confirmCustomRange(start, end, granularity) {
        const range = {
            startDate: start,
            endDate: end,
            granularity,
            isDynamic: false,
        };
        if (this._showComparison && this.config.comparisonEnabled) {
            const comp = resolveComparisonPeriod(range, this._compType);
            range.comparisonStartDate = comp.startDate;
            range.comparisonEndDate = comp.endDate;
            range.comparisonType = this._compType;
        }
        this._tempStart = start;
        this._tempEnd = end;
        this._fireChange(range);
        this._selecting = 'start';
    }
    _fireChange(range) {
        this.value = range;
        this.dispatchEvent(new CustomEvent('date-range-change', {
            detail: { value: range },
            bubbles: true, composed: true,
        }));
    }
    // --- Navigation ---
    _prevMonth() {
        if (this._viewMonth === 0) {
            this._viewMonth = 11;
            this._viewYear--;
        }
        else
            this._viewMonth--;
        this.requestUpdate();
    }
    _nextMonth() {
        if (this._viewMonth === 11) {
            this._viewMonth = 0;
            this._viewYear++;
        }
        else
            this._viewMonth++;
        this.requestUpdate();
    }
    _prevYear() { this._viewYear--; this.requestUpdate(); }
    _nextYear() { this._viewYear++; this.requestUpdate(); }
    // --- Calendar helpers ---
    _getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
    _getFirstDayOffset(y, m) {
        const day = new Date(y, m, 1).getDay(); // 0=Sun
        if (this._weekStart === 'monday')
            return (day + 6) % 7;
        return day;
    }
    _isInRange(dateStr) {
        const s = this._tempStart ?? this.value?.startDate;
        const e = this._tempEnd ?? this.value?.endDate;
        if (!s || !e)
            return false;
        return dateStr > s && dateStr < e;
    }
    _isSelected(dateStr) {
        const s = this._tempStart ?? this.value?.startDate;
        const e = this._tempEnd ?? this.value?.endDate;
        return dateStr === s || dateStr === e;
    }
    // --- Render: Trigger ---
    _renderTrigger() {
        let displayText = 'Select date range...';
        if (this._open && this._tempStart) {
            // Show live selection while picker is open
            displayText = this._tempEnd
                ? `${this._tempStart} – ${this._tempEnd}`
                : `${this._tempStart} – ...`;
        }
        else if (this.value) {
            displayText = formatDateRangeDisplay(this.value);
            if (this.value.comparisonStartDate && this.value.comparisonEndDate) {
                const compRange = { startDate: this.value.comparisonStartDate, endDate: this.value.comparisonEndDate };
                displayText += ` vs ${formatDateRangeDisplay(compRange)}`;
            }
        }
        return html `
      <button
        class="phz-sc-dp-trigger"
        @click=${this._toggle}
        ?disabled=${this.disabled}
        aria-haspopup="dialog"
        aria-expanded=${this._open}
      >
        <span class="phz-sc-dp-trigger-icon">
          <svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><rect x="40" y="48" width="176" height="176" rx="8"/><line x1="176" y1="24" x2="176" y2="72"/><line x1="80" y1="24" x2="80" y2="72"/><line x1="40" y1="104" x2="216" y2="104"/></svg>
        </span>
        <span class="phz-sc-dp-trigger-text">${displayText}</span>
        ${this.value ? html `<button class="phz-sc-dp-trigger-clear" @click=${this._clear} title="Clear" aria-label="Clear date selection">&times;</button>` : nothing}
      </button>
    `;
    }
    // --- Render: Zone 1 (Presets) ---
    _renderPresets() {
        const grouped = this._groupedPresets;
        if (grouped.size === 0)
            return nothing;
        const activePresetId = this.value?.presetId;
        return html `
      <div class="phz-sc-dp-zone1">
        ${Array.from(grouped.entries()).map(([group, presets]) => html `
          <div class="phz-sc-dp-group-label">${DATE_PRESET_GROUP_LABELS[group]}</div>
          ${presets.map(p => html `
            <button
              class="phz-sc-dp-preset-btn ${activePresetId === p.id ? 'phz-sc-dp-preset-btn--active' : ''}"
              @click=${() => this._selectPreset(p.id)}
            >${p.label}</button>
          `)}
        `)}
      </div>
    `;
    }
    // --- Render: Zone 2 (Custom) ---
    _renderCustomZone() {
        const grans = this._granularities;
        return html `
      <div class="phz-sc-dp-zone2">
        ${grans.length > 1 ? html `
          <div class="phz-sc-dp-gran-tabs">
            ${grans.map(g => html `
              <button
                class="phz-sc-dp-gran-tab ${this._granularity === g ? 'phz-sc-dp-gran-tab--active' : ''}"
                @click=${() => { this._granularity = g; this._selecting = 'start'; this._tempStart = null; this._tempEnd = null; }}
              >${g.charAt(0).toUpperCase() + g.slice(1)}</button>
            `)}
          </div>
        ` : nothing}

        ${this._granularity === 'day' ? this._renderDayCalendar() : nothing}
        ${this._granularity === 'week' ? this._renderWeekCalendar() : nothing}
        ${this._granularity === 'month' ? this._renderMonthGrid() : nothing}
        ${this._granularity === 'quarter' ? this._renderQuarterGrid() : nothing}
        ${this._granularity === 'year' ? this._renderYearGrid() : nothing}

        ${this.config.comparisonEnabled ? this._renderComparison() : nothing}
      </div>
    `;
    }
    // --- Day Calendar ---
    _renderDayCalendar() {
        const y = this._viewYear;
        const m = this._viewMonth;
        const days = this._getDaysInMonth(y, m);
        const firstDayOffset = this._getFirstDayOffset(y, m);
        const monthName = MONTH_SHORT[m];
        const todayStr = toISO(new Date());
        const dayHeaders = this._weekStart === 'monday' ? DAY_HEADERS_MON : DAY_HEADERS_SUN;
        const cells = [];
        for (let i = 0; i < firstDayOffset; i++) {
            cells.push(html `<div class="phz-sc-calendar-day phz-sc-calendar-day--other-month"></div>`);
        }
        for (let d = 1; d <= days; d++) {
            const dateStr = `${y}-${pad2(m + 1)}-${pad2(d)}`;
            const isToday = dateStr === todayStr;
            const disabled = this._isDateDisabled(dateStr);
            const classes = ['phz-sc-calendar-day'];
            if (disabled)
                classes.push('phz-sc-calendar-day--disabled');
            else if (this._isSelected(dateStr))
                classes.push('phz-sc-calendar-day--selected');
            else if (this._isInRange(dateStr))
                classes.push('phz-sc-calendar-day--in-range');
            if (isToday)
                classes.push('phz-sc-calendar-day--today');
            cells.push(html `
        <div class=${classes.join(' ')} @click=${disabled ? undefined : () => this._selectDay(y, m, d)}>${d}</div>
      `);
        }
        return html `
      <div class="phz-sc-calendar">
        <div class="phz-sc-calendar-header">
          <button class="phz-sc-calendar-nav" @click=${this._prevMonth} aria-label="Previous month">&lsaquo;</button>
          <span class="phz-sc-calendar-title">${monthName} ${y}</span>
          <button class="phz-sc-calendar-nav" @click=${this._nextMonth} aria-label="Next month">&rsaquo;</button>
        </div>
        <div class="phz-sc-calendar-grid">
          ${dayHeaders.map(d => html `<div class="phz-sc-calendar-day-header">${d}</div>`)}
          ${cells}
        </div>
      </div>
    `;
    }
    // --- Week Calendar ---
    _renderWeekCalendar() {
        const y = this._viewYear;
        const m = this._viewMonth;
        const days = this._getDaysInMonth(y, m);
        const firstDayOffset = this._getFirstDayOffset(y, m);
        const monthName = MONTH_SHORT[m];
        const dayHeaders = this._weekStart === 'monday' ? DAY_HEADERS_MON : DAY_HEADERS_SUN;
        const todayStr = toISO(new Date());
        // Build all day cells with padding
        const allDays = [];
        for (let i = 0; i < firstDayOffset; i++)
            allDays.push(null);
        for (let d = 1; d <= days; d++)
            allDays.push(d);
        while (allDays.length % 7 !== 0)
            allDays.push(null);
        // Group into weeks of 7
        const weeks = [];
        for (let i = 0; i < allDays.length; i += 7) {
            weeks.push(allDays.slice(i, i + 7));
        }
        return html `
      <div class="phz-sc-calendar">
        <div class="phz-sc-calendar-header">
          <button class="phz-sc-calendar-nav" @click=${this._prevMonth} aria-label="Previous month">&lsaquo;</button>
          <span class="phz-sc-calendar-title">${monthName} ${y}</span>
          <button class="phz-sc-calendar-nav" @click=${this._nextMonth} aria-label="Next month">&rsaquo;</button>
        </div>
        <div class="phz-sc-calendar-grid phz-sc-calendar-grid--weeks">
          <div class="phz-sc-calendar-day-header" style="font-size:9px">W</div>
          ${dayHeaders.map(d => html `<div class="phz-sc-calendar-day-header">${d}</div>`)}
          ${weeks.map(week => {
            // Find the first real day in this week to compute week number
            const firstRealDay = week.find(d => d !== null);
            if (!firstRealDay)
                return nothing;
            const weekDate = new Date(y, m, firstRealDay);
            const wStart = getWeekStart(weekDate, this._weekStart);
            const weekNum = this._weekNumbering === 'iso'
                ? getISOWeekNumber(weekDate)
                : getSequentialWeekNumber(weekDate);
            // Check if this week is selected
            const weekStartStr = toISO(wStart);
            const weekEndDate = new Date(wStart);
            weekEndDate.setDate(weekEndDate.getDate() + 6);
            const weekEndStr = toISO(weekEndDate);
            const weekDisabled = this._isPeriodDisabled(weekStartStr, weekEndStr);
            const isSelectedWeek = this._tempStart === weekStartStr || this.value?.startDate === weekStartStr;
            const isInRangeWeek = this._tempStart && this._tempEnd &&
                weekStartStr >= this._tempStart && weekEndStr <= this._tempEnd;
            return html `
              <div class="phz-sc-calendar-week-num">${weekNum}</div>
              ${week.map(day => {
                if (day === null)
                    return html `<div class="phz-sc-calendar-day phz-sc-calendar-day--other-month"></div>`;
                const dateStr = `${y}-${pad2(m + 1)}-${pad2(day)}`;
                const isToday = dateStr === todayStr;
                const classes = ['phz-sc-calendar-day'];
                if (weekDisabled)
                    classes.push('phz-sc-calendar-day--disabled');
                else if (isSelectedWeek)
                    classes.push('phz-sc-calendar-day--selected');
                else if (isInRangeWeek)
                    classes.push('phz-sc-calendar-day--in-range');
                if (isToday)
                    classes.push('phz-sc-calendar-day--today');
                return html `<div class=${classes.join(' ')} @click=${weekDisabled ? undefined : () => this._selectWeek(wStart)}>${day}</div>`;
            })}
            `;
        })}
        </div>
      </div>
    `;
    }
    // --- Month Grid ---
    _renderMonthGrid() {
        const y = this._viewYear;
        return html `
      <div>
        <div class="phz-sc-calendar-header">
          <button class="phz-sc-calendar-nav" @click=${this._prevYear} aria-label="Previous year">&lsaquo;</button>
          <span class="phz-sc-calendar-title">${y}</span>
          <button class="phz-sc-calendar-nav" @click=${this._nextYear} aria-label="Next year">&rsaquo;</button>
        </div>
        <div class="phz-sc-dp-period-grid phz-sc-dp-period-grid--months">
          ${MONTH_SHORT.map((name, idx) => {
            const startStr = `${y}-${pad2(idx + 1)}-01`;
            const endDate = new Date(y, idx + 1, 0);
            const endStr = toISO(endDate);
            const disabled = this._isPeriodDisabled(startStr, endStr);
            const isSelected = this._isSelected(startStr) || (this.value?.startDate?.startsWith(`${y}-${pad2(idx + 1)}`) ?? false);
            const inRange = this._tempStart && this._tempEnd && startStr >= this._tempStart && endStr <= this._tempEnd;
            const classes = ['phz-sc-dp-period-cell'];
            if (disabled)
                classes.push('phz-sc-dp-period-cell--disabled');
            else if (isSelected)
                classes.push('phz-sc-dp-period-cell--selected');
            else if (inRange)
                classes.push('phz-sc-dp-period-cell--in-range');
            return html `
              <button class=${classes.join(' ')} ?disabled=${disabled} @click=${disabled ? undefined : () => this._selectMonth(y, idx)}>${name}</button>
            `;
        })}
        </div>
      </div>
    `;
    }
    // --- Quarter Grid ---
    _renderQuarterGrid() {
        const y = this._viewYear;
        const quarters = [1, 2, 3, 4];
        const fsm = this._fiscal;
        // Quarter labels adjusted for fiscal
        const getQuarterLabel = (q) => {
            const bounds = getFiscalQuarterBounds(y, q, fsm);
            const startM = MONTH_SHORT[bounds.start.getMonth()];
            const endM = MONTH_SHORT[bounds.end.getMonth()];
            return `Q${q} (${startM} – ${endM})`;
        };
        return html `
      <div>
        <div class="phz-sc-calendar-header">
          <button class="phz-sc-calendar-nav" @click=${this._prevYear} aria-label="Previous year">&lsaquo;</button>
          <span class="phz-sc-calendar-title">${fsm === 1 ? y : `FY ${y}/${y + 1}`}</span>
          <button class="phz-sc-calendar-nav" @click=${this._nextYear} aria-label="Next year">&rsaquo;</button>
        </div>
        <div class="phz-sc-dp-period-grid phz-sc-dp-period-grid--quarters">
          ${quarters.map(q => {
            const bounds = getFiscalQuarterBounds(y, q, fsm);
            const startStr = toISO(bounds.start);
            const endStr = toISO(bounds.end);
            const disabled = this._isPeriodDisabled(startStr, endStr);
            const isSelected = this.value?.startDate === startStr;
            const classes = ['phz-sc-dp-period-cell'];
            if (disabled)
                classes.push('phz-sc-dp-period-cell--disabled');
            else if (isSelected)
                classes.push('phz-sc-dp-period-cell--selected');
            return html `
              <button class=${classes.join(' ')} ?disabled=${disabled} @click=${disabled ? undefined : () => this._selectQuarter(y, q)}>
                ${getQuarterLabel(q)}
              </button>
            `;
        })}
        </div>
      </div>
    `;
    }
    // --- Year Grid ---
    _renderYearGrid() {
        const baseYear = this._viewYear;
        const startYear = baseYear - 3;
        const years = Array.from({ length: 8 }, (_, i) => startYear + i);
        const fsm = this._fiscal;
        return html `
      <div>
        <div class="phz-sc-calendar-header">
          <button class="phz-sc-calendar-nav" @click=${() => { this._viewYear -= 8; this.requestUpdate(); }} aria-label="Previous years">&lsaquo;</button>
          <span class="phz-sc-calendar-title">${startYear} – ${startYear + 7}</span>
          <button class="phz-sc-calendar-nav" @click=${() => { this._viewYear += 8; this.requestUpdate(); }} aria-label="Next years">&rsaquo;</button>
        </div>
        <div class="phz-sc-dp-period-grid phz-sc-dp-period-grid--years">
          ${years.map(yr => {
            const label = fsm === 1 ? `${yr}` : `FY${yr}`;
            const fyStart = new Date(yr, fsm - 1, 1);
            const startStr = toISO(fyStart);
            const fyEnd = new Date(yr + 1, fsm - 1, 0);
            const endStr = toISO(fyEnd);
            const disabled = this._isPeriodDisabled(startStr, endStr);
            const isSelected = this.value?.startDate === startStr;
            const classes = ['phz-sc-dp-period-cell'];
            if (disabled)
                classes.push('phz-sc-dp-period-cell--disabled');
            else if (isSelected)
                classes.push('phz-sc-dp-period-cell--selected');
            return html `
              <button class=${classes.join(' ')} ?disabled=${disabled} @click=${disabled ? undefined : () => this._selectYear(yr)}>${label}</button>
            `;
        })}
        </div>
      </div>
    `;
    }
    // --- Comparison ---
    _renderComparison() {
        return html `
      <div class="phz-sc-dp-comparison">
        <div class="phz-sc-dp-comp-toggle">
          <label class="phz-sc-toggle-switch" style="width:32px; height:18px">
            <input type="checkbox" .checked=${this._showComparison}
              @change=${(e) => { this._showComparison = e.target.checked; }} />
            <span class="phz-sc-toggle-track" style="border-radius:9px"></span>
          </label>
          <span class="phz-sc-dp-comp-label">Compare</span>
        </div>
        ${this._showComparison ? html `
          <div class="phz-sc-dp-comp-buttons">
            <button
              class="phz-sc-chip ${this._compType === 'previous_period' ? 'phz-sc-chip--selected' : ''}"
              @click=${() => { this._compType = 'previous_period'; }}
            >Previous period</button>
            <button
              class="phz-sc-chip ${this._compType === 'same_period_last_year' ? 'phz-sc-chip--selected' : ''}"
              @click=${() => { this._compType = 'same_period_last_year'; }}
            >Same period last year</button>
          </div>
        ` : nothing}
      </div>
    `;
    }
    // --- Main render ---
    render() {
        if (this.inline) {
            // Inline mode: always show panel in flow, no trigger/backdrop
            return html `
        ${this._renderTrigger()}
        <div class="phz-sc-dp-panel--inline" role="region" aria-label="Date range picker">
          ${this._renderPresets()}
          ${this._renderCustomZone()}
        </div>
      `;
        }
        return html `
      ${this._renderTrigger()}
      ${this._open ? html `
        <div class="phz-sc-dp-backdrop" @click=${this._close}></div>
        <div class="phz-sc-dp-panel" style=${this._panelStyle} role="dialog" aria-label="Date range picker">
          ${this._renderPresets()}
          ${this._renderCustomZone()}
        </div>
      ` : nothing}
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzDateRangePicker.prototype, "config", void 0);
__decorate([
    property({ type: Object })
], PhzDateRangePicker.prototype, "value", void 0);
__decorate([
    property({ type: Boolean })
], PhzDateRangePicker.prototype, "disabled", void 0);
__decorate([
    property({ type: Boolean })
], PhzDateRangePicker.prototype, "inline", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_open", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_granularity", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_viewYear", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_viewMonth", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_selecting", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_tempStart", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_tempEnd", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_showComparison", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_compType", void 0);
__decorate([
    state()
], PhzDateRangePicker.prototype, "_panelStyle", void 0);
PhzDateRangePicker = __decorate([
    customElement('phz-date-range-picker')
], PhzDateRangePicker);
export { PhzDateRangePicker };
//# sourceMappingURL=phz-date-range-picker.js.map