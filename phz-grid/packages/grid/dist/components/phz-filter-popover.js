var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PhzFilterPopover_1;
/**
 * @phozart/phz-grid — <phz-filter-popover>
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
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
let PhzFilterPopover = class PhzFilterPopover extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.field = '';
        this.columnType = 'string';
        this.anchorRect = null;
        this.values = [];
        this.searchQuery = '';
        this.filteredValues = [];
        this.showCustomFilter = false;
        this.customOperator = 'contains';
        this.customValue = '';
        this.customLogic = 'and';
        this.customOperator2 = 'contains';
        this.customValue2 = '';
        this.posX = 0;
        this.posY = 0;
        this.sidePanelLeft = true;
        this.selectedDays = new Set();
        this.expandedYears = new Set();
        this.expandedMonths = new Set();
        this.showDatePanel = false;
        this.focusedValueIndex = -1;
        this.cleanup = null;
        this.previousFocusElement = null;
        /** Guards against infinite update loop: tracks the last values array set by applySearch */
        this._lastInternalValues = null;
        /** Snapshot of checked state before search began — restored when search is cleared */
        this.preSearchChecked = null;
    }
    static { PhzFilterPopover_1 = this; }
    static { this.DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; }
    static { this.MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; }
    isDateColumn() {
        return this.columnType === 'date' || this.columnType === 'datetime';
    }
    static { this.styles = css `
    :host {
      position: fixed;
      top: 0; left: 0;
      width: 0; height: 0;
      z-index: 10001;
      pointer-events: none;
      overflow: visible;
    }

    :host([open]) {
      pointer-events: auto;
    }

    .phz-filter {
      position: fixed;
      width: 300px;
      max-height: min(560px, calc(100vh - 40px));
      background: var(--phz-popover-bg, #FEFDFB);
      border: 1px solid var(--phz-popover-border, #E7E5E4);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
      font-family: var(--phz-font-family-base, system-ui, -apple-system, sans-serif);
      font-size: 0.8125rem;
      color: #1C1917;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: scale(0.96);
      transition: opacity 200ms cubic-bezier(0.0, 0.0, 0.2, 1),
                  transform 200ms cubic-bezier(0.0, 0.0, 0.2, 1);
      overflow: hidden;
    }

    :host([open]) .phz-filter {
      opacity: 1;
      transform: scale(1);
    }

    /* Search — above checkbox list */
    .phz-filter__search {
      padding: 8px 10px 4px;
      flex-shrink: 0;
    }

    .phz-filter__search-input {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-family: inherit;
      background: #FFFFFF;
      color: #1C1917;
      outline: none;
      box-sizing: border-box;
      transition: border-color 150ms ease;
    }

    .phz-filter__search-input:focus {
      border-color: var(--phz-color-primary, #3B82F6);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
    }

    .phz-filter__search-input::placeholder {
      color: #A8A29E;
    }

    /* Options section — conditional filter, date options */
    .phz-filter__options {
      flex-shrink: 0;
      border-bottom: 1px solid #E7E5E4;
    }

    /* Scrollable value list — search + checkboxes */
    .phz-filter__body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    /* ── Date-part chips (compact inline rows) ── */
    .phz-filter__dp {
      padding: 8px 10px;
      border-bottom: 1px solid #E7E5E4;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .phz-filter__dp-row {
      display: flex;
      align-items: center;
      gap: 3px;
      flex-wrap: wrap;
    }

    .phz-filter__dp-label {
      font-size: 0.5625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #78716C;
      width: 28px;
      flex-shrink: 0;
    }

    .phz-filter__dp-chip {
      font-size: 0.625rem;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #D6D3D1;
      background: #FFFFFF;
      color: #44403C;
      cursor: pointer;
      user-select: none;
      transition: all 100ms;
      font-family: inherit;
      line-height: 1.2;
    }

    .phz-filter__dp-chip:hover {
      border-color: #78716C;
    }

    .phz-filter__dp-chip--active {
      background: #1C1917;
      color: #FEFDFB;
      border-color: #1C1917;
    }

    .phz-filter__dp-clear {
      font-size: 0.5625rem;
      color: #A8A29E;
      cursor: pointer;
      border: none;
      background: none;
      padding: 0 2px;
      font-family: inherit;
      text-decoration: underline;
      margin-left: 2px;
    }

    .phz-filter__dp-clear:hover {
      color: #57534E;
    }

    /* ── Advanced Date Filter side panel ── */
    .phz-filter__date-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      cursor: pointer;
      color: #57534E;
      font-size: 0.75rem;
      transition: background 100ms ease;
    }

    .phz-filter__date-trigger:hover {
      background: rgba(59, 130, 246, 0.06);
    }

    .phz-filter__date-trigger-icon {
      display: flex;
      align-items: center;
    }

    .phz-filter__date-trigger-badge {
      margin-left: auto;
      font-size: 0.625rem;
      background: var(--phz-color-primary, #3B82F6);
      color: white;
      border-radius: 8px;
      padding: 1px 6px;
      font-weight: 600;
    }

    .phz-filter__side-panel {
      position: fixed;
      width: 260px;
      max-height: min(560px, calc(100vh - 40px));
      background: var(--phz-popover-bg, #FEFDFB);
      border: 1px solid var(--phz-popover-border, #E7E5E4);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06);
      font-family: var(--phz-font-family-base, system-ui, -apple-system, sans-serif);
      font-size: 0.8125rem;
      color: #1C1917;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 200ms cubic-bezier(0.0, 0.0, 0.2, 1),
                  transform 200ms cubic-bezier(0.0, 0.0, 0.2, 1);
      overflow: hidden;
      pointer-events: none;
    }

    .phz-filter__side-panel--open {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .phz-filter__side-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #E7E5E4;
      font-weight: 600;
      font-size: 0.75rem;
      color: #1C1917;
    }

    .phz-filter__side-close {
      border: none;
      background: none;
      cursor: pointer;
      color: #A8A29E;
      font-size: 14px;
      padding: 0;
      line-height: 1;
      font-family: inherit;
      transition: color 150ms;
    }

    .phz-filter__side-close:hover {
      color: #1C1917;
    }

    .phz-filter__side-body {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    /* ── Select All ── */
    .phz-filter__select-all {
      border-bottom: 1px solid #F5F5F4;
      font-weight: 500;
    }

    /* ── Value list items ── */
    .phz-filter__item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 100ms ease;
    }

    .phz-filter__item:hover {
      background: rgba(59, 130, 246, 0.06);
    }

    .phz-filter__checkbox {
      width: 15px;
      height: 15px;
      border: 1.5px solid #D6D3D1;
      border-radius: 3px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms ease;
      background: #FFFFFF;
    }

    .phz-filter__checkbox--checked {
      background: var(--phz-color-primary, #3B82F6);
      border-color: var(--phz-color-primary, #3B82F6);
      color: white;
    }

    .phz-filter__checkbox-icon {
      font-size: 10px;
      line-height: 1;
    }

    .phz-filter__item-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.75rem;
    }

    .phz-filter__item-label mark {
      background: rgba(59, 130, 246, 0.15);
      color: inherit;
      font-weight: 600;
      border-radius: 2px;
      padding: 0 1px;
    }

    .phz-filter__search-hint {
      margin-top: 5px;
      font-size: 0.6875rem;
      color: #78716C;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .phz-filter__search-hint-count {
      font-weight: 600;
      color: var(--phz-color-primary, #3B82F6);
    }

    .phz-filter__item-count {
      font-size: 0.625rem;
      color: #A8A29E;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    /* ── Tree structure for grouped dates ── */
    .phz-filter__tree-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 100ms;
    }

    .phz-filter__tree-row:hover {
      background: rgba(59, 130, 246, 0.06);
    }

    .phz-filter__tree-arrow {
      font-size: 8px;
      color: #78716C;
      width: 10px;
      text-align: center;
      transition: transform 150ms;
      flex-shrink: 0;
    }

    .phz-filter__tree-arrow--open {
      transform: rotate(90deg);
    }

    .phz-filter__tree-label {
      flex: 1;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .phz-filter__tree-month {
      padding-left: 18px;
    }

    .phz-filter__tree-month .phz-filter__tree-label {
      font-weight: 400;
    }

    .phz-filter__tree-leaf {
      padding-left: 36px;
    }

    .phz-filter__tree-leaf .phz-filter__item-label {
      font-size: 0.6875rem;
    }

    .phz-filter__values-section {
      padding: 4px 6px;
    }

    /* ── Conditional filter ── */
    .phz-filter__custom-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      cursor: pointer;
      color: #57534E;
      font-size: 0.75rem;
      transition: background 100ms ease;
    }

    .phz-filter__custom-toggle:hover {
      background: rgba(59, 130, 246, 0.06);
    }

    .phz-filter__custom-toggle-arrow {
      transition: transform 200ms ease;
      font-size: 9px;
    }

    .phz-filter__custom-toggle-arrow--open {
      transform: rotate(90deg);
    }

    .phz-filter__custom {
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .phz-filter__custom-row {
      display: flex;
      gap: 6px;
    }

    .phz-filter__custom select,
    .phz-filter__custom input {
      padding: 5px 7px;
      border: 1px solid #D6D3D1;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-family: inherit;
      background: #FFFFFF;
      color: #1C1917;
      outline: none;
      box-sizing: border-box;
    }

    .phz-filter__custom select:focus,
    .phz-filter__custom input:focus {
      border-color: var(--phz-color-primary, #3B82F6);
    }

    .phz-filter__custom select {
      flex: 0 0 auto;
      min-width: 90px;
    }

    .phz-filter__custom input {
      flex: 1;
      min-width: 0;
    }

    .phz-filter__logic-toggle {
      display: flex;
      gap: 4px;
      padding: 2px;
      background: #F5F5F4;
      border-radius: 6px;
      width: fit-content;
    }

    .phz-filter__logic-btn {
      padding: 3px 10px;
      border: none;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-family: inherit;
      cursor: pointer;
      background: transparent;
      color: #57534E;
      transition: all 150ms ease;
    }

    .phz-filter__logic-btn--active {
      background: #FFFFFF;
      color: #1C1917;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }

    /* ── Actions — pinned bottom ── */
    .phz-filter__actions {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      border-top: 1px solid #E7E5E4;
      flex-shrink: 0;
    }

    .phz-filter__btn {
      padding: 6px 14px;
      border: none;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 150ms ease;
      font-weight: 500;
    }

    .phz-filter__btn--clear {
      background: transparent;
      color: #57534E;
    }

    .phz-filter__btn--clear:hover {
      background: #F5F5F4;
      color: #1C1917;
    }

    .phz-filter__btn--apply {
      background: var(--phz-color-primary, #3B82F6);
      color: white;
      flex: 1;
    }

    .phz-filter__btn--apply:hover {
      background: #2563EB;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-filter,
      .phz-filter__custom-toggle-arrow,
      .phz-filter__tree-arrow,
      .phz-filter__side-panel {
        transition: none;
      }
    }
  `; }
    updated(changed) {
        if (changed.has('open')) {
            if (this.open) {
                this.positionPopover();
                this.searchQuery = '';
                this.preSearchChecked = null;
                this._lastInternalValues = null;
                this.filteredValues = [...this.values];
                this.showCustomFilter = false;
                this.selectedDays = new Set();
                this.expandedYears = new Set();
                this.expandedMonths = new Set();
                this.showDatePanel = false;
                if (this.isDateColumn()) {
                    this.extractDateParts();
                }
                this.addListeners();
            }
            else {
                this.removeListeners();
            }
        }
        if (changed.has('values') && this.open && this.values !== this._lastInternalValues) {
            this.applySearch();
        }
    }
    extractDateParts() {
        // Extract unique years for auto-expanding the grouped date tree
        const years = new Set();
        for (const entry of this.values) {
            const d = this.parseDate(entry.value);
            if (d)
                years.add(d.getFullYear());
        }
        // Auto-expand years if few
        if (years.size <= 3) {
            this.expandedYears = new Set(years);
        }
    }
    parseDate(value) {
        if (value instanceof Date)
            return isNaN(value.getTime()) ? null : value;
        if (typeof value === 'string' || typeof value === 'number') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }
    show(field, anchorRect, values, columnType) {
        this.previousFocusElement = (typeof document !== 'undefined' ? document.activeElement : null) ?? null;
        this.field = field;
        this.anchorRect = anchorRect;
        this.values = values;
        if (columnType)
            this.columnType = columnType;
        this.focusedValueIndex = -1;
        this.open = true;
        // Move focus into popover after render
        this.updateComplete.then(() => {
            const first = this.getFocusableElements()[0];
            if (first)
                first.focus();
        });
    }
    hide() {
        this.open = false;
        this.showCustomFilter = false;
        this.showDatePanel = false;
        this.dispatchEvent(new CustomEvent('filter-close', { bubbles: true, composed: true }));
        // Restore focus to the element that was focused before popover opened
        if (this.previousFocusElement) {
            this.previousFocusElement.focus();
            this.previousFocusElement = null;
        }
    }
    /** Get all focusable elements within the popover for focus trapping */
    getFocusableElements() {
        const root = this.renderRoot ?? this.shadowRoot;
        if (!root)
            return [];
        return Array.from(root.querySelectorAll('input, button, select, [tabindex]:not([tabindex="-1"]), [role="option"]')).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }
    /** Handle keyboard events within the popover for value list navigation */
    handlePopoverKeydown(e) {
        const count = this.filteredValues.length;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedValueIndex = count === 0 ? -1 :
                    this.focusedValueIndex < count - 1 ? this.focusedValueIndex + 1 : 0;
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusedValueIndex = count === 0 ? -1 :
                    this.focusedValueIndex > 0 ? this.focusedValueIndex - 1 : count - 1;
                break;
            case 'Enter':
            case ' ':
                if (this.focusedValueIndex >= 0 && this.focusedValueIndex < count) {
                    e.preventDefault();
                    this.toggleValue(this.filteredValues[this.focusedValueIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                this.hide();
                break;
            case 'Tab': {
                // Focus trap: wrap around within the popover
                const focusable = this.getFocusableElements();
                if (focusable.length === 0)
                    break;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
                break;
            }
        }
    }
    positionPopover() {
        if (!this.anchorRect)
            return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const popWidth = 300;
        const sidePanelWidth = 268; // 260 + 8 gap
        const popHeight = 480;
        let x = this.anchorRect.left;
        let y = this.anchorRect.bottom + 4;
        if (x + popWidth > vw)
            x = vw - popWidth - 8;
        if (y + popHeight > vh)
            y = this.anchorRect.top - popHeight - 4;
        if (x < 4)
            x = 4;
        if (y < 4)
            y = 4;
        this.posX = x;
        this.posY = y;
        // Side panel goes right if space, otherwise left
        this.sidePanelLeft = (x + popWidth + sidePanelWidth) > vw;
    }
    addListeners() {
        const onClickOutside = (e) => {
            const path = e.composedPath();
            if (!path.includes(this)) {
                this.hide();
            }
        };
        const onKeydown = (e) => {
            this.handlePopoverKeydown(e);
        };
        const onScroll = () => {
            this.hide();
        };
        requestAnimationFrame(() => {
            document.addEventListener('mousedown', onClickOutside, true);
            document.addEventListener('keydown', onKeydown, true);
            // Close on any scroll — grid container, page, or any ancestor
            window.addEventListener('scroll', onScroll, true);
        });
        this.cleanup = () => {
            document.removeEventListener('mousedown', onClickOutside, true);
            document.removeEventListener('keydown', onKeydown, true);
            window.removeEventListener('scroll', onScroll, true);
        };
    }
    removeListeners() {
        this.cleanup?.();
        this.cleanup = null;
    }
    applySearch() {
        const q = this.searchQuery.toLowerCase();
        if (!q) {
            // Restore pre-search checked state when search is cleared
            if (this.preSearchChecked) {
                this.values = this.values.map(v => ({
                    ...v,
                    checked: this.preSearchChecked.get(v.value) ?? v.checked,
                }));
                this.preSearchChecked = null;
            }
            this.filteredValues = [...this.values];
        }
        else {
            // Excel-like: check only matching values, uncheck everything else
            this.values = this.values.map(v => ({
                ...v,
                checked: v.displayText.toLowerCase().includes(q),
            }));
            this.filteredValues = this.values.filter(v => v.displayText.toLowerCase().includes(q));
        }
        // Track reference so updated() won't re-trigger applySearch for internal changes
        this._lastInternalValues = this.values;
    }
    onSearchInput(e) {
        const newQuery = e.target.value;
        // Snapshot checked state when search first begins
        if (!this.searchQuery && newQuery && !this.preSearchChecked) {
            this.preSearchChecked = new Map(this.values.map(v => [v.value, v.checked]));
        }
        this.searchQuery = newQuery;
        this.applySearch();
    }
    toggleValue(entry) {
        const idx = this.values.findIndex(v => v.value === entry.value);
        if (idx >= 0) {
            this.values = this.values.map((v, i) => i === idx ? { ...v, checked: !v.checked } : v);
            this.applySearch();
        }
    }
    toggleSelectAll() {
        const allChecked = this.values.every(v => v.checked);
        this.values = this.values.map(v => ({ ...v, checked: !allChecked }));
        this.applySearch();
    }
    toggleGroupCheck(entries) {
        const allChecked = entries.every(e => e.checked);
        const targetChecked = !allChecked;
        const entryValues = new Set(entries.map(e => e.value));
        this.values = this.values.map(v => entryValues.has(v.value) ? { ...v, checked: targetChecked } : v);
        this.applySearch();
    }
    toggleYearExpand(year) {
        const next = new Set(this.expandedYears);
        if (next.has(year))
            next.delete(year);
        else
            next.add(year);
        this.expandedYears = next;
    }
    toggleMonthExpand(key) {
        const next = new Set(this.expandedMonths);
        if (next.has(key))
            next.delete(key);
        else
            next.add(key);
        this.expandedMonths = next;
    }
    handleClear() {
        this.dispatchEvent(new CustomEvent('filter-apply', {
            detail: { field: this.field, selectedValues: [] },
            bubbles: true,
            composed: true,
        }));
        this.hide();
    }
    handleApply() {
        const selectedValues = this.values
            .filter(v => v.checked)
            .map(v => v.value);
        const detail = { field: this.field, selectedValues };
        if (this.showCustomFilter && this.customValue) {
            detail.customFilter = {
                operator: this.customOperator,
                value: this.customValue,
            };
            if (this.customValue2) {
                detail.customFilter.logic = this.customLogic;
                detail.customFilter.operator2 = this.customOperator2;
                detail.customFilter.value2 = this.customValue2;
            }
        }
        // Date-part filters (day of week only)
        if (this.selectedDays.size > 0) {
            detail.datePartFilters = [{ type: 'dateDayOfWeek', values: [...this.selectedDays] }];
        }
        this.dispatchEvent(new CustomEvent('filter-apply', {
            detail,
            bubbles: true,
            composed: true,
        }));
        this.hide();
    }
    getOperatorsForType() {
        const ct = this.isDateColumn() ? 'date' : this.columnType;
        switch (ct) {
            case 'number':
                return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not equals' },
                    { value: 'greaterThan', label: 'Greater than' },
                    { value: 'greaterThanOrEqual', label: 'Greater or equal' },
                    { value: 'lessThan', label: 'Less than' },
                    { value: 'lessThanOrEqual', label: 'Less or equal' },
                    { value: 'between', label: 'Between' },
                ];
            case 'date':
                return [
                    { value: 'equals', label: 'On' },
                    { value: 'greaterThan', label: 'After' },
                    { value: 'lessThan', label: 'Before' },
                    { value: 'between', label: 'Between' },
                ];
            default:
                return [
                    { value: 'equals', label: 'Equals' },
                    { value: 'notEquals', label: 'Not equals' },
                    { value: 'contains', label: 'Contains' },
                    { value: 'notContains', label: 'Does not contain' },
                    { value: 'startsWith', label: 'Starts with' },
                    { value: 'endsWith', label: 'Ends with' },
                ];
        }
    }
    getActiveDatePartCount() {
        return this.selectedDays.size > 0 ? 1 : 0;
    }
    /** Highlight matching portion of text with <mark> */
    highlightMatch(text) {
        const q = this.searchQuery.toLowerCase();
        if (!q)
            return html `${text}`;
        const idx = text.toLowerCase().indexOf(q);
        if (idx < 0)
            return html `${text}`;
        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + q.length);
        const after = text.slice(idx + q.length);
        return html `${before}<mark>${match}</mark>${after}`;
    }
    // ─── Render helpers ───
    renderDatePartChips() {
        return html `
      <div class="phz-filter__dp">
        <!-- Day of Week -->
        <div class="phz-filter__dp-row">
          <span class="phz-filter__dp-label">Day</span>
          ${PhzFilterPopover_1.DAY_NAMES.map((name, i) => html `
            <button
              class="phz-filter__dp-chip ${this.selectedDays.has(i) ? 'phz-filter__dp-chip--active' : ''}"
              @click="${() => { const s = new Set(this.selectedDays); if (s.has(i))
            s.delete(i);
        else
            s.add(i); this.selectedDays = s; }}"
            >${name}</button>
          `)}
          ${this.selectedDays.size > 0 ? html `<button class="phz-filter__dp-clear" @click="${() => { this.selectedDays = new Set(); }}">x</button>` : nothing}
        </div>
      </div>
    `;
    }
    renderGroupedDateList() {
        // Build year → month → entries tree from filtered values
        const yearMap = new Map();
        const nonDateEntries = [];
        for (const entry of this.filteredValues) {
            const d = this.parseDate(entry.value);
            if (!d) {
                nonDateEntries.push(entry);
                continue;
            }
            const year = d.getFullYear();
            const month = d.getMonth();
            if (!yearMap.has(year))
                yearMap.set(year, new Map());
            const monthMap = yearMap.get(year);
            if (!monthMap.has(month))
                monthMap.set(month, []);
            monthMap.get(month).push(entry);
        }
        const years = [...yearMap.keys()].sort((a, b) => b - a);
        return html `
      ${years.map(year => {
            const yearExpanded = this.expandedYears.has(year);
            const monthMap = yearMap.get(year);
            const allYearEntries = [...monthMap.values()].flat();
            const yearAllChecked = allYearEntries.every(e => e.checked);
            const yearSomeChecked = allYearEntries.some(e => e.checked) && !yearAllChecked;
            const yearCount = allYearEntries.reduce((s, e) => s + e.count, 0);
            const months = [...monthMap.keys()].sort((a, b) => a - b);
            return html `
          <div class="phz-filter__tree-row"
               @click="${() => this.toggleYearExpand(year)}">
            <span class="phz-filter__tree-arrow ${yearExpanded ? 'phz-filter__tree-arrow--open' : ''}">\u25B8</span>
            <div class="phz-filter__checkbox ${yearAllChecked ? 'phz-filter__checkbox--checked' : ''}"
                 @click="${(e) => { e.stopPropagation(); this.toggleGroupCheck(allYearEntries); }}">
              ${yearAllChecked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` :
                yearSomeChecked ? html `<span class="phz-filter__checkbox-icon">\u2500</span>` : nothing}
            </div>
            <span class="phz-filter__tree-label">${year}</span>
            <span class="phz-filter__item-count">${yearCount}</span>
          </div>

          ${yearExpanded ? months.map(month => {
                const monthEntries = monthMap.get(month);
                const monthKey = `${year}-${month}`;
                const monthExpanded = this.expandedMonths.has(monthKey);
                const monthAllChecked = monthEntries.every(e => e.checked);
                const monthSomeChecked = monthEntries.some(e => e.checked) && !monthAllChecked;
                const monthCount = monthEntries.reduce((s, e) => s + e.count, 0);
                return html `
              <div class="phz-filter__tree-row phz-filter__tree-month"
                   @click="${() => this.toggleMonthExpand(monthKey)}">
                <span class="phz-filter__tree-arrow ${monthExpanded ? 'phz-filter__tree-arrow--open' : ''}">\u25B8</span>
                <div class="phz-filter__checkbox ${monthAllChecked ? 'phz-filter__checkbox--checked' : ''}"
                     @click="${(e) => { e.stopPropagation(); this.toggleGroupCheck(monthEntries); }}">
                  ${monthAllChecked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` :
                    monthSomeChecked ? html `<span class="phz-filter__checkbox-icon">\u2500</span>` : nothing}
                </div>
                <span class="phz-filter__tree-label">${PhzFilterPopover_1.MONTH_NAMES[month]} ${year}</span>
                <span class="phz-filter__item-count">${monthCount}</span>
              </div>

              ${monthExpanded ? monthEntries.map(entry => html `
                <div class="phz-filter__item phz-filter__tree-leaf" role="option"
                     aria-selected="${entry.checked}"
                     @click="${() => this.toggleValue(entry)}">
                  <div class="phz-filter__checkbox ${entry.checked ? 'phz-filter__checkbox--checked' : ''}">
                    ${entry.checked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` : nothing}
                  </div>
                  <span class="phz-filter__item-label">${entry.displayText}</span>
                  <span class="phz-filter__item-count">${entry.count}</span>
                </div>
              `) : nothing}
            `;
            }) : nothing}
        `;
        })}

      ${nonDateEntries.map(entry => html `
        <div class="phz-filter__item" role="option"
             aria-selected="${entry.checked}"
             @click="${() => this.toggleValue(entry)}">
          <div class="phz-filter__checkbox ${entry.checked ? 'phz-filter__checkbox--checked' : ''}">
            ${entry.checked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` : nothing}
          </div>
          <span class="phz-filter__item-label">${entry.displayText}</span>
          <span class="phz-filter__item-count">${entry.count}</span>
        </div>
      `)}
    `;
    }
    renderDateSidePanel() {
        const sidePanelX = this.sidePanelLeft
            ? this.posX - 268
            : this.posX + 308;
        return html `
      <div class="phz-filter__side-panel ${this.showDatePanel ? 'phz-filter__side-panel--open' : ''}"
           style="left: ${sidePanelX}px; top: ${this.posY}px;">
        <div class="phz-filter__side-header">
          <span>Day Filter</span>
          <button class="phz-filter__side-close"
                  @click="${() => { this.showDatePanel = false; }}"
                  aria-label="Close day filter panel">\u2715</button>
        </div>
        <div class="phz-filter__side-body">
          ${this.renderDatePartChips()}
        </div>
      </div>
    `;
    }
    // ─── Main render ───
    render() {
        if (!this.open)
            return html ``;
        const allChecked = this.values.length > 0 && this.values.every(v => v.checked);
        const someChecked = this.values.some(v => v.checked) && !allChecked;
        const operators = this.getOperatorsForType();
        const totalCount = this.values.reduce((s, v) => s + v.count, 0);
        const isDate = this.isDateColumn();
        const datePartCount = isDate ? this.getActiveDatePartCount() : 0;
        return html `
      <div class="phz-filter" role="dialog" aria-modal="true" aria-label="Filter ${this.field}" style="left: ${this.posX}px; top: ${this.posY}px;">
        <!-- Options section — conditional filter & date options (pinned top) -->
        <div class="phz-filter__options">
          <!-- Conditional Filter Toggle -->
          <div class="phz-filter__custom-toggle" @click="${() => { this.showCustomFilter = !this.showCustomFilter; }}">
            <span class="phz-filter__custom-toggle-arrow ${this.showCustomFilter ? 'phz-filter__custom-toggle-arrow--open' : ''}"
                  aria-hidden="true">\u25B8</span>
            <span>Conditional Filter...</span>
          </div>

          <!-- Conditional Filter Section -->
          ${this.showCustomFilter ? html `
            <div class="phz-filter__custom">
              <div class="phz-filter__custom-row">
                <select
                  .value="${this.customOperator}"
                  @change="${(e) => { this.customOperator = e.target.value; }}"
                >
                  ${operators.map(op => html `<option value="${op.value}">${op.label}</option>`)}
                </select>
                <input
                  type="${this.columnType === 'number' ? 'number' : this.isDateColumn() ? 'date' : 'text'}"
                  placeholder="Value"
                  .value="${this.customValue}"
                  @input="${(e) => { this.customValue = e.target.value; }}"
                />
              </div>

              <div class="phz-filter__logic-toggle">
                <button
                  class="phz-filter__logic-btn ${this.customLogic === 'and' ? 'phz-filter__logic-btn--active' : ''}"
                  @click="${() => { this.customLogic = 'and'; }}"
                >AND</button>
                <button
                  class="phz-filter__logic-btn ${this.customLogic === 'or' ? 'phz-filter__logic-btn--active' : ''}"
                  @click="${() => { this.customLogic = 'or'; }}"
                >OR</button>
              </div>

              <div class="phz-filter__custom-row">
                <select
                  .value="${this.customOperator2}"
                  @change="${(e) => { this.customOperator2 = e.target.value; }}"
                >
                  ${operators.map(op => html `<option value="${op.value}">${op.label}</option>`)}
                </select>
                <input
                  type="${this.columnType === 'number' ? 'number' : this.isDateColumn() ? 'date' : 'text'}"
                  placeholder="Value"
                  .value="${this.customValue2}"
                  @input="${(e) => { this.customValue2 = e.target.value; }}"
                />
              </div>
            </div>
          ` : nothing}

          <!-- Day Filter trigger (date columns only) -->
          ${isDate ? html `
            <div class="phz-filter__date-trigger"
                 @click="${() => { this.showDatePanel = !this.showDatePanel; }}">
              <span class="phz-filter__date-trigger-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="12" height="11" rx="1.5"/>
                  <path d="M2 6.5h12"/>
                  <path d="M5.5 1.5v3"/>
                  <path d="M10.5 1.5v3"/>
                </svg>
              </span>
              <span>Day Filter</span>
              ${datePartCount > 0 ? html `<span class="phz-filter__date-trigger-badge">${datePartCount}</span>` : nothing}
            </div>
          ` : nothing}
        </div>

        <!-- Search + Value list (scrollable) -->
        <div class="phz-filter__body">
          <!-- Search — directly above checkboxes -->
          <div class="phz-filter__search">
            <input
              class="phz-filter__search-input"
              type="text"
              placeholder="Search values..."
              .value="${this.searchQuery}"
              @input="${this.onSearchInput}"
            />
            ${this.searchQuery ? html `
              <div class="phz-filter__search-hint">
                <span><span class="phz-filter__search-hint-count">${this.filteredValues.length}</span> of ${this.values.length} values</span>
                <span>Only checked values will be applied</span>
              </div>
            ` : nothing}
          </div>

          <!-- Select All -->
          <div class="phz-filter__item phz-filter__select-all" @click="${this.toggleSelectAll}">
            <div class="phz-filter__checkbox ${allChecked ? 'phz-filter__checkbox--checked' : ''}"
                 aria-checked="${allChecked}">
              ${allChecked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` :
            someChecked ? html `<span class="phz-filter__checkbox-icon">\u2500</span>` : nothing}
            </div>
            <span class="phz-filter__item-label">(Select All)</span>
            <span class="phz-filter__item-count">${totalCount}</span>
          </div>

          <!-- Value List -->
          <div class="phz-filter__values-section" role="listbox" aria-label="Filter values" aria-multiselectable="true">
            ${isDate ? this.renderGroupedDateList() : this.filteredValues.map(entry => html `
              <div class="phz-filter__item" role="option"
                   aria-selected="${entry.checked}"
                   @click="${() => this.toggleValue(entry)}">
                <div class="phz-filter__checkbox ${entry.checked ? 'phz-filter__checkbox--checked' : ''}">
                  ${entry.checked ? html `<span class="phz-filter__checkbox-icon">\u2713</span>` : nothing}
                </div>
                <span class="phz-filter__item-label">${this.highlightMatch(entry.displayText)}</span>
                <span class="phz-filter__item-count">${entry.count}</span>
              </div>
            `)}
          </div>
        </div>

        <!-- Actions — pinned bottom -->
        <div class="phz-filter__actions">
          <button class="phz-filter__btn phz-filter__btn--clear" @click="${this.handleClear}">Clear</button>
          <button class="phz-filter__btn phz-filter__btn--apply" @click="${this.handleApply}">Apply</button>
        </div>
      </div>

      <!-- Day Filter side panel -->
      ${isDate ? this.renderDateSidePanel() : nothing}
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFilterPopover.prototype, "open", void 0);
__decorate([
    property({ type: String })
], PhzFilterPopover.prototype, "field", void 0);
__decorate([
    property({ type: String })
], PhzFilterPopover.prototype, "columnType", void 0);
__decorate([
    property({ attribute: false })
], PhzFilterPopover.prototype, "anchorRect", void 0);
__decorate([
    property({ attribute: false })
], PhzFilterPopover.prototype, "values", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "searchQuery", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "filteredValues", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "showCustomFilter", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "customOperator", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "customValue", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "customLogic", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "customOperator2", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "customValue2", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "posX", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "posY", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "sidePanelLeft", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "selectedDays", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "expandedYears", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "expandedMonths", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "showDatePanel", void 0);
__decorate([
    state()
], PhzFilterPopover.prototype, "focusedValueIndex", void 0);
PhzFilterPopover = PhzFilterPopover_1 = __decorate([
    customElement('phz-filter-popover')
], PhzFilterPopover);
export { PhzFilterPopover };
//# sourceMappingURL=phz-filter-popover.js.map