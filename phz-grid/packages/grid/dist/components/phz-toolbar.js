var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * <phz-toolbar> — Standalone Toolbar Web Component
 *
 * Can be used:
 * 1. Embedded inside <phz-grid> (default when showToolbar=true)
 * 2. Standalone anywhere on the page, wired via `.grid` property
 * 3. Standalone with manual event handling (no .grid reference)
 *
 * Events (all bubble + composed):
 *   toolbar-search         → { query: string }
 *   toolbar-filter-remove  → { field: string }
 *   toolbar-density-change → { density: Density }
 *   toolbar-export-csv     → { includeFormatting, includeGroupHeaders }
 *   toolbar-export-excel   → { includeFormatting, includeGroupHeaders }
 *   toolbar-columns-open   → {}
 *   toolbar-column-chooser-open → {}
 *   toolbar-auto-size      → {}
 *   toolbar-generate-dashboard → { dataMode: 'filtered' | 'full' }
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
let PhzToolbar = class PhzToolbar extends LitElement {
    constructor() {
        // --- Public properties (IN) ---
        super(...arguments);
        this.searchQuery = '';
        this.activeFilters = new Map();
        this.columns = [];
        this.density = 'compact';
        this.showExport = true;
        this.showDensityToggle = true;
        this.showColumnEditor = true;
        this.exportIncludeFormatting = false;
        this.exportIncludeGroupHeaders = true;
        this.showGenerateDashboard = false;
        /** Show "Admin Settings" entry in the options menu (admin users only). */
        this.showAdminSettings = false;
        this.grid = null;
        this.slim = true;
        // --- Internal state ---
        this.exportDropdownOpen = false;
        this.optionsMenuOpen = false;
        // --- Dropdown positioning & dismiss ---
        this._dropdownStyle = '';
        this._dropdownCleanup = null;
        // --- Auto-wire ---
        this._gridListeners = [];
    }
    _positionDropdown(triggerSelector) {
        const trigger = this.shadowRoot?.querySelector(triggerSelector);
        if (!trigger)
            return;
        const rect = trigger.getBoundingClientRect();
        const dropdownWidth = 220; // min-width + padding estimate
        let left = rect.right - dropdownWidth;
        if (left < 8)
            left = 8;
        // Prefer opening below the button
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
            // Open below
            this._dropdownStyle = `top: ${rect.bottom + 4}px; left: ${left}px;`;
        }
        else {
            // Open above
            this._dropdownStyle = `bottom: ${window.innerHeight - rect.top + 4}px; left: ${left}px;`;
        }
    }
    _addDropdownListeners() {
        if (this._dropdownCleanup)
            return;
        const onClickOutside = (e) => {
            const path = e.composedPath();
            if (!path.includes(this)) {
                this.exportDropdownOpen = false;
                this.optionsMenuOpen = false;
            }
        };
        const onKeydown = (e) => {
            if (e.key === 'Escape') {
                this.exportDropdownOpen = false;
                this.optionsMenuOpen = false;
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKeydown);
        this._dropdownCleanup = () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKeydown);
        };
    }
    _removeDropdownListeners() {
        this._dropdownCleanup?.();
        this._dropdownCleanup = null;
    }
    updated(changed) {
        if (changed.has('grid')) {
            this._detachGridListeners();
            if (this.grid) {
                this._attachGridListeners();
            }
        }
        // Manage dropdown dismiss listeners
        if (changed.has('exportDropdownOpen') || changed.has('optionsMenuOpen')) {
            if (this.exportDropdownOpen || this.optionsMenuOpen) {
                this._addDropdownListeners();
            }
            else {
                this._removeDropdownListeners();
            }
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._detachGridListeners();
        this._removeDropdownListeners();
    }
    _attachGridListeners() {
        if (!this.grid)
            return;
        const onFilterChange = () => {
            const g = this.grid;
            if (g?.activeFilters) {
                this.activeFilters = new Map(g.activeFilters);
            }
        };
        const onStateChange = () => {
            const g = this.grid;
            if (g) {
                if (g.searchQuery !== undefined)
                    this.searchQuery = g.searchQuery;
                if (g.density !== undefined)
                    this.density = g.density;
                if (g.columns !== undefined)
                    this.columns = g.columns;
            }
        };
        this.grid.addEventListener('filter-change', onFilterChange);
        this.grid.addEventListener('state-change', onStateChange);
        this._gridListeners.push({ type: 'filter-change', handler: onFilterChange }, { type: 'state-change', handler: onStateChange });
        // Initial sync
        onStateChange();
        onFilterChange();
    }
    _detachGridListeners() {
        if (!this.grid)
            return;
        for (const { type, handler } of this._gridListeners) {
            this.grid.removeEventListener(type, handler);
        }
        this._gridListeners = [];
    }
    // --- Event dispatchers ---
    _emit(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true,
        }));
    }
    _handleSearch(e) {
        const query = e.target.value;
        this.searchQuery = query;
        this._emit('toolbar-search', { query });
        // Auto-wire
        if (this.grid) {
            this.grid.searchQuery = query;
            this.grid.currentPage = 0;
        }
    }
    _clearSearch() {
        this.searchQuery = '';
        this._emit('toolbar-search', { query: '' });
        if (this.grid) {
            this.grid.searchQuery = '';
            this.grid.currentPage = 0;
        }
    }
    _removeFilter(field) {
        this._emit('toolbar-filter-remove', { field });
        if (this.grid) {
            this.grid.gridApi?.removeFilter(field);
        }
    }
    _setDensity(d) {
        this.density = d;
        this._emit('toolbar-density-change', { density: d });
        if (this.grid) {
            this.grid.density = d;
            this.grid.setAttribute('density', d);
        }
    }
    _exportCSV() {
        const detail = {
            includeFormatting: this.exportIncludeFormatting,
            includeGroupHeaders: this.exportIncludeGroupHeaders,
        };
        this._emit('toolbar-export-csv', detail);
        if (this.grid) {
            this.grid.exportCSV?.(detail);
        }
        this.exportDropdownOpen = false;
        this.optionsMenuOpen = false;
    }
    _exportExcel() {
        const detail = {
            includeFormatting: this.exportIncludeFormatting,
            includeGroupHeaders: this.exportIncludeGroupHeaders,
        };
        this._emit('toolbar-export-excel', detail);
        if (this.grid) {
            this.grid.exportExcel?.(detail);
        }
        this.exportDropdownOpen = false;
        this.optionsMenuOpen = false;
    }
    _openColumns() {
        this._emit('toolbar-columns-open', {});
        if (this.grid) {
            const chooser = this.grid.columnChooser;
            if (chooser) {
                chooser.columnChooserOpen ? chooser.close() : chooser.open();
            }
        }
        this.optionsMenuOpen = false;
    }
    _openColumnChooser() {
        this._emit('toolbar-column-chooser-open', {});
        if (this.grid) {
            this.grid.columnChooserOpen = true;
        }
        this.optionsMenuOpen = false;
    }
    _autoSize() {
        this._emit('toolbar-auto-size', {});
        if (this.grid) {
            this.grid.autoSizeAllColumns?.();
        }
        this.optionsMenuOpen = false;
    }
    _generateDashboard(dataMode) {
        this._emit('toolbar-generate-dashboard', { dataMode });
        this.optionsMenuOpen = false;
    }
    _openAdminSettings() {
        this._emit('toolbar-admin-settings', {});
        this.optionsMenuOpen = false;
    }
    // --- Styles ---
    static { this.styles = css `
    :host {
      display: block;
      contain: style;
      font-family: var(--phz-font-family-base, 'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif);
      --_toolbar-pad-v: 4px;
      --_toolbar-pad-h: 16px;
      --_toolbar-gap: 4px;
    }

    /* Non-slim fallback */
    :host(:not([slim])) {
      --_toolbar-pad-v: 12px;
      --_toolbar-pad-h: 24px;
      --_toolbar-gap: 8px;
    }

    * { box-sizing: border-box; }

    .phz-toolbar {
      padding: var(--_toolbar-pad-v) var(--_toolbar-pad-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--phz-grid-border, #E7E5E4);
      background: transparent;
      flex-wrap: wrap;
      gap: var(--_toolbar-gap);
    }

    .phz-toolbar__left { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .phz-toolbar__right { display: flex; align-items: center; gap: 4px; }

    /* Search box */
    .phz-search {
      display: var(--phz-toolbar-search-display, flex);
      align-items: center; gap: 6px;
      padding: 3px 8px;
      background: white; border-radius: 6px;
      border: 1px solid #E7E5E4; min-width: 160px;
    }
    .phz-search:focus-within {
      border-color: var(--phz-color-primary, #3B82F6);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
    }
    .phz-search__icon { color: #A8A29E; flex-shrink: 0; }
    .phz-search__input {
      border: none; outline: none; font-size: 12px;
      background: transparent; width: 100%; color: #1C1917;
      font-family: inherit;
    }
    .phz-search__input::placeholder { color: #A8A29E; }
    .phz-search__clear {
      background: none; border: none; cursor: pointer; color: #A8A29E;
      padding: 0; display: flex;
    }

    /* Non-slim search */
    :host(:not([slim])) .phz-search {
      padding: 6px 12px; min-width: 220px; border-radius: 10px; gap: 8px;
    }
    :host(:not([slim])) .phz-search__input { font-size: 13px; }

    /* Filter tag chips */
    .phz-filter-tag {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 6px;
      background: #EFF6FF; color: #3B82F6; border-radius: 4px;
      font-size: 11px; font-weight: 500;
    }
    .phz-filter-tag__close {
      background: none; border: none; cursor: pointer; color: #3B82F6;
      padding: 0; margin-left: 1px; display: flex;
    }

    /* Non-slim filter tags */
    :host(:not([slim])) .phz-filter-tag {
      padding: 4px 10px; border-radius: 8px; font-size: 12px; gap: 4px;
    }

    /* Density toggle */
    .phz-density-toggle {
      display: var(--phz-toolbar-density-display, flex);
      border-radius: 6px; border: 1px solid #E7E5E4;
      overflow: hidden; background: white;
    }
    .phz-density-btn {
      padding: 3px 8px; font-size: 10px; font-weight: 500;
      border: none; cursor: pointer;
      background: transparent; color: #78716C;
      text-transform: capitalize; transition: all 150ms ease;
      font-family: inherit;
    }
    .phz-density-btn--active {
      background: #1C1917; color: white;
    }

    /* Non-slim density */
    :host(:not([slim])) .phz-density-toggle { border-radius: 8px; }
    :host(:not([slim])) .phz-density-btn { padding: 5px 10px; font-size: 11px; }

    /* Toolbar buttons */
    .phz-toolbar-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 3px 6px;
      background: white; border: 1px solid #E7E5E4; border-radius: 4px;
      cursor: pointer; font-size: 11px; color: #57534E;
      font-family: inherit; transition: all 100ms;
      position: relative;
    }
    .phz-toolbar-btn:hover { background: #F5F5F4; }
    .phz-toolbar-btn__icon { color: #A8A29E; flex-shrink: 0; }
    .phz-toolbar-btn__label { display: none; }

    /* Non-slim toolbar buttons */
    :host(:not([slim])) .phz-toolbar-btn {
      padding: 6px 10px; border-radius: 8px; font-size: 12px; gap: 5px;
    }
    :host(:not([slim])) .phz-toolbar-btn__label { display: inline; }

    /* Export & options containers */
    .phz-toolbar__export { display: var(--phz-toolbar-export-display, block); position: relative; }
    .phz-toolbar__options { position: relative; }

    /* Dropdown panel (shared for export and options) — fixed positioning to escape overflow:hidden */
    .phz-dropdown {
      position: fixed; z-index: 10000;
      background: var(--phz-popover-bg, #FEFDFB);
      border: 1px solid #E7E5E4; border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      padding: 8px; min-width: 200px;
      max-height: 80vh; overflow-y: auto;
    }

    .phz-dropdown__section { padding: 4px 4px; }
    .phz-dropdown__label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: #A8A29E; padding: 2px 8px;
    }

    .phz-dropdown__btn {
      display: block; width: 100%; text-align: left;
      padding: 7px 12px; border: none; background: none;
      font-size: 13px; font-family: inherit; color: #1C1917;
      border-radius: 6px; cursor: pointer;
    }
    .phz-dropdown__btn:hover {
      background: rgba(59, 130, 246, 0.08);
    }

    .phz-export-csv-btn { display: var(--phz-export-csv-display, block); }
    .phz-export-excel-btn { display: var(--phz-export-excel-display, block); }

    .phz-export-options { padding: 4px 4px 0; }
    .phz-export-option {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 8px; font-size: 12px; color: #44403C; cursor: pointer;
      border-radius: 4px;
    }
    .phz-export-option:hover { background: #F5F5F4; }
    .phz-export-option input { accent-color: #3B82F6; width: 13px; height: 13px; cursor: pointer; }

    .phz-divider { height: 1px; background: #E7E5E4; margin: 4px 0; }

    /* Options (3-dot) button */
    .phz-options-btn {
      width: 28px; height: 28px;
      background: transparent; border: 1px solid #E7E5E4;
      border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 100ms;
    }
    .phz-options-btn:hover { background: #F5F5F4; }

    :host(:not([slim])) .phz-options-btn { width: 32px; height: 32px; border-radius: 8px; }

    /* Slots */
    ::slotted(*) { display: flex; align-items: center; }
  `; }
    // --- SVG Icons (inline, same as grid) ---
    svgSearch() {
        return html `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#A8A29E" stroke-width="1.5"/><path d="M11 11L14 14" stroke="#A8A29E" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    }
    svgClose() {
        return html `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    }
    svgExport() {
        return html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V9M7 2L4 5M7 2L10 5" stroke="#A8A29E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10V11.5C2 12 2.5 12.5 3 12.5H11C11.5 12.5 12 12 12 11.5V10" stroke="#A8A29E" stroke-width="1.3" stroke-linecap="round"/></svg>`;
    }
    svgMoreVertical() {
        return html `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="#78716C"/><circle cx="8" cy="8" r="1.5" fill="#78716C"/><circle cx="8" cy="13" r="1.5" fill="#78716C"/></svg>`;
    }
    svgColumns() {
        return html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="4" height="10" rx="1" stroke="#A8A29E" stroke-width="1.3"/><rect x="7" y="2" width="4" height="10" rx="1" stroke="#A8A29E" stroke-width="1.3" fill="none"/></svg>`;
    }
    svgDashboard() {
        return html `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="#A8A29E" stroke-width="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="#A8A29E" stroke-width="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="#A8A29E" stroke-width="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="#A8A29E" stroke-width="1.3"/></svg>`;
    }
    // --- Render ---
    render() {
        return html `
      <div class="phz-toolbar" part="toolbar">
        <div class="phz-toolbar__left">
          <!-- Search -->
          <div class="phz-search" part="search">
            <span class="phz-search__icon">${this.svgSearch()}</span>
            <input
              class="phz-search__input"
              type="text"
              placeholder="Search all columns..."
              .value="${this.searchQuery}"
              @input="${this._handleSearch}"
            />
            ${this.searchQuery ? html `
              <button class="phz-search__clear" @click="${this._clearSearch}">
                ${this.svgClose()}
              </button>
            ` : nothing}
          </div>

          <!-- Active filter tags -->
          <div part="filter-tags">
            ${Array.from(this.activeFilters.entries()).map(([field, info]) => {
            const col = this.columns.find(c => c.field === field);
            const label = col?.header ?? field;
            const valStr = Array.isArray(info.value) ? info.value.join(', ') : String(info.value);
            return html `
                <span class="phz-filter-tag">
                  ${label}: ${valStr}
                  <button class="phz-filter-tag__close" @click="${() => this._removeFilter(field)}">
                    ${this.svgClose()}
                  </button>
                </span>
              `;
        })}
          </div>

          <slot name="left"></slot>
        </div>

        <div class="phz-toolbar__right">
          <slot name="right"></slot>

          <!-- Export -->
          ${this.showExport ? html `
            <div class="phz-toolbar__export" part="export">
              <button class="phz-toolbar-btn" @click="${() => { this.optionsMenuOpen = false; this.exportDropdownOpen = !this.exportDropdownOpen; if (this.exportDropdownOpen)
            this._positionDropdown('.phz-toolbar__export .phz-toolbar-btn'); }}">
                <span class="phz-toolbar-btn__icon">${this.svgExport()}</span>
                <span class="phz-toolbar-btn__label">Export</span>
              </button>
              ${this.exportDropdownOpen ? html `
                <div class="phz-dropdown" style="${this._dropdownStyle}">
                  <div class="phz-export-options">
                    <label class="phz-export-option">
                      <input type="checkbox" .checked="${this.exportIncludeFormatting}"
                             @change="${(e) => { this.exportIncludeFormatting = e.target.checked; }}">
                      Include formatting
                    </label>
                    <label class="phz-export-option">
                      <input type="checkbox" .checked="${this.exportIncludeGroupHeaders}"
                             @change="${(e) => { this.exportIncludeGroupHeaders = e.target.checked; }}">
                      Include group headers
                    </label>
                  </div>
                  <div class="phz-divider"></div>
                  <button class="phz-dropdown__btn phz-export-csv-btn" @click="${this._exportCSV}">Download CSV</button>
                  <button class="phz-dropdown__btn phz-export-excel-btn" @click="${this._exportExcel}">Download Excel</button>
                </div>
              ` : nothing}
            </div>
          ` : nothing}

          <!-- Options (3-dot) menu — always visible -->
          <div class="phz-toolbar__options" part="options">
              <button class="phz-options-btn" @click="${() => { this.exportDropdownOpen = false; this.optionsMenuOpen = !this.optionsMenuOpen; if (this.optionsMenuOpen)
            this._positionDropdown('.phz-toolbar__options .phz-options-btn'); }}" aria-label="Grid options">
                ${this.svgMoreVertical()}
              </button>
              ${this.optionsMenuOpen ? html `
                <div class="phz-dropdown" style="${this._dropdownStyle}">
                  ${this.showDensityToggle ? html `
                    <div class="phz-dropdown__section">
                      <div class="phz-dropdown__label">Density</div>
                      <div class="phz-density-toggle" style="margin: 4px 0 8px;">
                        ${['comfortable', 'compact', 'dense'].map(d => html `
                          <button
                            class="phz-density-btn ${this.density === d ? 'phz-density-btn--active' : ''}"
                            @click="${() => this._setDensity(d)}"
                          >${d}</button>
                        `)}
                      </div>
                    </div>
                  ` : nothing}
                  ${this.showColumnEditor ? html `
                    <button class="phz-dropdown__btn" @click="${this._openColumns}">
                      ${this.svgColumns()} Columns
                    </button>
                    <button class="phz-dropdown__btn" @click="${this._openColumnChooser}">
                      Column Profiles...
                    </button>
                  ` : nothing}
                  <div class="phz-divider"></div>
                  <div class="phz-export-options" style="padding: 0 4px 4px;">
                    <label class="phz-export-option">
                      <input type="checkbox" .checked="${this.exportIncludeFormatting}"
                             @change="${(e) => { this.exportIncludeFormatting = e.target.checked; }}">
                      Include formatting
                    </label>
                    <label class="phz-export-option">
                      <input type="checkbox" .checked="${this.exportIncludeGroupHeaders}"
                             @change="${(e) => { this.exportIncludeGroupHeaders = e.target.checked; }}">
                      Include group headers
                    </label>
                  </div>
                  <button class="phz-dropdown__btn phz-export-csv-btn" @click="${this._exportCSV}">Download CSV</button>
                  <button class="phz-dropdown__btn phz-export-excel-btn" @click="${this._exportExcel}">Download Excel</button>
                  <div class="phz-divider"></div>
                  <button class="phz-dropdown__btn" @click="${this._autoSize}">Auto-size Columns</button>
                  ${this.showGenerateDashboard ? html `
                    <div class="phz-divider"></div>
                    <div class="phz-dropdown__section">
                      <div class="phz-dropdown__label">${this.svgDashboard()} Dashboard</div>
                    </div>
                    <button class="phz-dropdown__btn" @click="${() => this._generateDashboard('filtered')}">Dashboard from Filtered Data</button>
                    <button class="phz-dropdown__btn" @click="${() => this._generateDashboard('full')}">Dashboard from Full Data</button>
                  ` : nothing}
                  ${this.showAdminSettings ? html `
                    <div class="phz-divider"></div>
                    <button class="phz-dropdown__btn" @click="${this._openAdminSettings}">Admin Settings\u2026</button>
                  ` : nothing}
                </div>
              ` : nothing}
          </div>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzToolbar.prototype, "searchQuery", void 0);
__decorate([
    property({ attribute: false })
], PhzToolbar.prototype, "activeFilters", void 0);
__decorate([
    property({ attribute: false })
], PhzToolbar.prototype, "columns", void 0);
__decorate([
    property({ type: String, reflect: true })
], PhzToolbar.prototype, "density", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-export' })
], PhzToolbar.prototype, "showExport", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-density-toggle' })
], PhzToolbar.prototype, "showDensityToggle", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-column-editor' })
], PhzToolbar.prototype, "showColumnEditor", void 0);
__decorate([
    property({ type: Boolean, attribute: 'export-include-formatting' })
], PhzToolbar.prototype, "exportIncludeFormatting", void 0);
__decorate([
    property({ type: Boolean, attribute: 'export-include-group-headers' })
], PhzToolbar.prototype, "exportIncludeGroupHeaders", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-generate-dashboard' })
], PhzToolbar.prototype, "showGenerateDashboard", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-admin-settings' })
], PhzToolbar.prototype, "showAdminSettings", void 0);
__decorate([
    property({ attribute: false })
], PhzToolbar.prototype, "grid", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzToolbar.prototype, "slim", void 0);
__decorate([
    state()
], PhzToolbar.prototype, "exportDropdownOpen", void 0);
__decorate([
    state()
], PhzToolbar.prototype, "optionsMenuOpen", void 0);
__decorate([
    state()
], PhzToolbar.prototype, "_dropdownStyle", void 0);
PhzToolbar = __decorate([
    customElement('phz-toolbar')
], PhzToolbar);
export { PhzToolbar };
//# sourceMappingURL=phz-toolbar.js.map