var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-viewer — <phz-filter-bar> Custom Element
 *
 * Filter bar for dashboards and reports. Shows active filters,
 * preset selection, and filter value editing.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createFilterBarState, setFilterDefs, openFilter, closeFilter, setFilterValue, clearFilterValue, clearAllFilters, setPresets, toggleFilterBarCollapsed, getActiveFilterCount, hasFilterValue, } from '../screens/filter-bar-state.js';
// ========================================================================
// <phz-filter-bar>
// ========================================================================
let PhzFilterBar = class PhzFilterBar extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.filters = [];
        this.presets = [];
        this.collapsed = false;
        // --- Internal state ---
        this._filterBarState = createFilterBarState();
    }
    static { this.styles = css `
    :host {
      display: block;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border-default, #e2e8f0);
      background: var(--phz-bg-surface, #ffffff);
    }

    .filter-bar-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-bar-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--phz-text-secondary, #64748b);
      flex-shrink: 0;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 16px;
      font-size: 13px;
      cursor: pointer;
      background: var(--phz-bg-surface, #ffffff);
      transition: background 0.15s, border-color 0.15s;
    }

    .filter-chip:hover {
      border-color: var(--phz-border-hover, #94a3b8);
    }

    .filter-chip[data-active] {
      background: var(--phz-bg-highlight, #eff6ff);
      border-color: var(--phz-color-primary, #3b82f6);
    }

    .filter-chip-clear {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      color: var(--phz-text-secondary, #64748b);
      padding: 0;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .filter-actions button {
      padding: 4px 10px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      background: var(--phz-bg-surface, #ffffff);
      cursor: pointer;
      font-size: 12px;
    }

    .preset-select {
      padding: 4px 8px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      font-size: 13px;
    }

    :host([collapsed]) .filter-chips {
      display: none;
    }
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('filters')) {
            this._filterBarState = setFilterDefs(this._filterBarState, this.filters);
        }
        if (changed.has('presets')) {
            this._filterBarState = setPresets(this._filterBarState, this.presets);
        }
        if (changed.has('collapsed')) {
            this._filterBarState = { ...this._filterBarState, collapsed: this.collapsed };
        }
    }
    // --- Public API ---
    getFilterBarState() {
        return this._filterBarState;
    }
    setFilterVal(filterValue) {
        this._filterBarState = setFilterValue(this._filterBarState, filterValue);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('filter-change', {
            bubbles: true, composed: true,
            detail: { filterValue },
        }));
    }
    clearFilter(filterId) {
        this._filterBarState = clearFilterValue(this._filterBarState, filterId);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('filter-clear', {
            bubbles: true, composed: true,
            detail: { filterId },
        }));
    }
    clearAll() {
        this._filterBarState = clearAllFilters(this._filterBarState);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('filter-clear-all', { bubbles: true, composed: true }));
    }
    // --- Rendering ---
    render() {
        const s = this._filterBarState;
        const count = getActiveFilterCount(s);
        return html `
      <div class="filter-bar-row">
        <span class="filter-bar-label">
          Filters${count > 0 ? ` (${count})` : ''}
        </span>

        <div class="filter-chips">
          ${s.filters.map(f => html `
            <button
              class="filter-chip"
              ?data-active=${hasFilterValue(s, f.id)}
              @click=${() => this._handleChipClick(f)}
              aria-label="Filter: ${f.label}"
            >
              ${f.label}
              ${hasFilterValue(s, f.id) ? html `
                <button
                  class="filter-chip-clear"
                  @click=${(e) => {
            e.stopPropagation();
            this.clearFilter(f.id);
        }}
                  aria-label="Clear ${f.label}"
                >&times;</button>
              ` : nothing}
            </button>
          `)}
        </div>

        <div class="filter-actions">
          ${count > 0 ? html `
            <button @click=${this._handleClearAll} aria-label="Clear all filters">Clear All</button>
          ` : nothing}
          <button @click=${this._handleToggleCollapse} aria-label="Toggle filter bar">
            ${s.collapsed ? 'Show Filters' : 'Hide'}
          </button>
        </div>
      </div>
    `;
    }
    // --- Event handlers ---
    _handleChipClick(filter) {
        if (this._filterBarState.activeFilterId === filter.id) {
            this._filterBarState = closeFilter(this._filterBarState);
        }
        else {
            this._filterBarState = openFilter(this._filterBarState, filter.id);
        }
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('filter-open', {
            bubbles: true, composed: true,
            detail: { filterId: filter.id, filterDef: filter },
        }));
    }
    _handleClearAll() {
        this.clearAll();
    }
    _handleToggleCollapse() {
        this._filterBarState = toggleFilterBarCollapsed(this._filterBarState);
        this.collapsed = this._filterBarState.collapsed;
        this.requestUpdate();
    }
};
__decorate([
    property({ attribute: false })
], PhzFilterBar.prototype, "filters", void 0);
__decorate([
    property({ attribute: false })
], PhzFilterBar.prototype, "presets", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzFilterBar.prototype, "collapsed", void 0);
__decorate([
    state()
], PhzFilterBar.prototype, "_filterBarState", void 0);
PhzFilterBar = __decorate([
    customElement('phz-filter-bar')
], PhzFilterBar);
export { PhzFilterBar };
//# sourceMappingURL=phz-filter-bar.js.map