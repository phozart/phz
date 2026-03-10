/**
 * @phozart/phz-engine-admin — Global Filter Bar
 *
 * Horizontal bar with per-filter dropdowns, multi-selects, date ranges, and text searches.
 * Auto-populates filter options from unique data values.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
let PhzGlobalFilterBar = class PhzGlobalFilterBar extends LitElement {
    constructor() {
        super(...arguments);
        this.filters = [];
        this.data = [];
        this.fields = [];
        this.activeValues = {};
        this.showAddPicker = false;
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

      .filter-bar {
        display: flex; align-items: center; gap: 8px; padding: 8px 16px;
        background: #FAFAF9; border-bottom: 1px solid #E7E5E4;
        overflow-x: auto; flex-wrap: wrap;
      }

      .filter-bar-label {
        font-size: 10px; font-weight: 700; color: #A8A29E; text-transform: uppercase;
        letter-spacing: 0.06em; white-space: nowrap; flex-shrink: 0;
      }

      .filter-item {
        display: flex; align-items: center; gap: 4px;
        background: white; border: 1px solid #D6D3D1; border-radius: 6px;
        padding: 3px 8px; font-size: 12px; position: relative;
      }
      .filter-item--active { border-color: #3B82F6; background: #EFF6FF; }

      .filter-label {
        font-size: 11px; font-weight: 600; color: #44403C; white-space: nowrap;
      }

      .filter-control select,
      .filter-control input {
        padding: 3px 6px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 11px; font-family: inherit; background: white; min-width: 100px;
      }
      .filter-control select:focus,
      .filter-control input:focus { outline: none; border-color: #3B82F6; }

      .filter-remove {
        width: 18px; height: 18px; border-radius: 3px; border: none;
        background: none; color: #A8A29E; cursor: pointer; font-size: 14px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .filter-remove:hover { background: #FEF2F2; color: #DC2626; }

      .filter-add {
        display: flex; align-items: center; gap: 4px; padding: 4px 10px;
        border: 1px dashed #D6D3D1; border-radius: 6px; background: white;
        font-size: 11px; font-weight: 600; color: #3B82F6; cursor: pointer;
        font-family: inherit; transition: all 0.15s; white-space: nowrap;
      }
      .filter-add:hover { border-color: #3B82F6; background: #EFF6FF; }

      .clear-all {
        padding: 4px 10px; border: 1px solid #D6D3D1; border-radius: 6px;
        background: white; font-size: 11px; font-weight: 600; color: #78716C;
        cursor: pointer; font-family: inherit; white-space: nowrap;
      }
      .clear-all:hover { background: #FEF2F2; color: #DC2626; border-color: #FCA5A5; }

      .add-picker {
        background: white; border: 1px solid #D6D3D1; border-radius: 6px;
        padding: 8px; display: flex; flex-direction: column; gap: 4px;
        min-width: 140px;
      }
      .add-picker select {
        padding: 5px 8px; border: 1px solid #D6D3D1; border-radius: 4px;
        font-size: 12px; font-family: inherit; background: white;
      }

      .multi-select-list {
        display: flex; flex-direction: column; gap: 2px;
        max-height: 120px; overflow-y: auto;
        border: 1px solid #D6D3D1; border-radius: 4px;
        padding: 4px;
      }
      .multi-select-item {
        display: flex; align-items: center; gap: 4px;
        font-size: 11px; padding: 2px 4px; cursor: pointer;
      }
      .multi-select-item:hover { background: #F5F5F4; border-radius: 3px; }
      .multi-select-item input { accent-color: #3B82F6; }
    `,
    ]; }
    getUniqueValues(fieldKey) {
        const seen = new Set();
        for (const row of this.data) {
            const val = row[fieldKey];
            if (val !== null && val !== undefined)
                seen.add(String(val));
        }
        return Array.from(seen).sort();
    }
    detectFilterType(fieldKey) {
        if (!this.data.length)
            return 'text-search';
        const sample = this.data[0][fieldKey];
        if (typeof sample === 'number')
            return 'number-range';
        const uniques = this.getUniqueValues(fieldKey);
        if (uniques.length <= 20)
            return 'select';
        return 'text-search';
    }
    handleFilterChange(filterId, value) {
        this.activeValues = { ...this.activeValues, [filterId]: value };
        this.emitChange();
    }
    handleMultiSelectChange(filterId, option, checked) {
        const current = this.activeValues[filterId] ?? [];
        const updated = checked ? [...current, option] : current.filter(v => v !== option);
        this.activeValues = { ...this.activeValues, [filterId]: updated.length > 0 ? updated : undefined };
        this.emitChange();
    }
    addFilter(fieldKey) {
        const filterType = this.detectFilterType(fieldKey);
        const field = this.fields.find(f => f.name === fieldKey);
        const newFilter = {
            id: `gf-${Date.now()}`,
            label: field?.name ?? fieldKey,
            fieldKey,
            filterType,
        };
        this.filters = [...this.filters, newFilter];
        this.showAddPicker = false;
        this.emitChange();
    }
    removeFilter(filterId) {
        this.filters = this.filters.filter(f => f.id !== filterId);
        const { [filterId]: _, ...rest } = this.activeValues;
        this.activeValues = rest;
        this.emitChange();
    }
    clearAll() {
        this.activeValues = {};
        this.emitChange();
    }
    emitChange() {
        this.dispatchEvent(new CustomEvent('filter-change', {
            bubbles: true, composed: true,
            detail: {
                filters: [...this.filters],
                activeValues: { ...this.activeValues },
            },
        }));
    }
    renderFilterControl(filter) {
        const value = this.activeValues[filter.id];
        const uniqueValues = this.getUniqueValues(filter.fieldKey);
        const hasValue = value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
        switch (filter.filterType) {
            case 'select':
                return html `
          <div class="filter-control">
            <select .value=${value ?? ''} @change=${(e) => this.handleFilterChange(filter.id, e.target.value || undefined)}>
              <option value="">All</option>
              ${uniqueValues.map(v => html `<option value=${v} ?selected=${value === v}>${v}</option>`)}
            </select>
          </div>
        `;
            case 'multi-select':
                return html `
          <div class="filter-control">
            <button style="font-size:11px;padding:3px 8px;border:1px solid #D6D3D1;border-radius:4px;background:white;cursor:pointer;font-family:inherit;"
                    @click=${() => { this.expandedMultiSelect = this.expandedMultiSelect === filter.id ? undefined : filter.id; }}>
              ${Array.isArray(value) && value.length > 0 ? `${value.length} selected` : 'Select...'}
            </button>
            ${this.expandedMultiSelect === filter.id ? html `
              <div class="multi-select-list" style="position:absolute;top:100%;left:0;z-index:10;background:white;">
                ${uniqueValues.map(v => html `
                  <label class="multi-select-item">
                    <input type="checkbox" ?checked=${Array.isArray(value) && value.includes(v)}
                           @change=${(e) => this.handleMultiSelectChange(filter.id, v, e.target.checked)}>
                    ${v}
                  </label>
                `)}
              </div>
            ` : nothing}
          </div>
        `;
            case 'text-search':
                return html `
          <div class="filter-control">
            <input type="text" placeholder="Search..." .value=${value ?? ''}
                   @input=${(e) => this.handleFilterChange(filter.id, e.target.value || undefined)}>
          </div>
        `;
            case 'number-range':
                return html `
          <div class="filter-control" style="display:flex;gap:4px;">
            <input type="number" placeholder="Min" style="width:60px;"
                   .value=${String(value?.min ?? '')}
                   @input=${(e) => {
                    const min = parseFloat(e.target.value);
                    const current = value ?? {};
                    this.handleFilterChange(filter.id, { ...current, min: isNaN(min) ? undefined : min });
                }}>
            <input type="number" placeholder="Max" style="width:60px;"
                   .value=${String(value?.max ?? '')}
                   @input=${(e) => {
                    const max = parseFloat(e.target.value);
                    const current = value ?? {};
                    this.handleFilterChange(filter.id, { ...current, max: isNaN(max) ? undefined : max });
                }}>
          </div>
        `;
            case 'date-range':
                return html `
          <div class="filter-control" style="display:flex;gap:4px;">
            <input type="date" .value=${String(value?.from ?? '')}
                   @input=${(e) => {
                    const current = value ?? {};
                    this.handleFilterChange(filter.id, { ...current, from: e.target.value || undefined });
                }}>
            <input type="date" .value=${String(value?.to ?? '')}
                   @input=${(e) => {
                    const current = value ?? {};
                    this.handleFilterChange(filter.id, { ...current, to: e.target.value || undefined });
                }}>
          </div>
        `;
            default:
                return nothing;
        }
    }
    render() {
        const usedFields = new Set(this.filters.map(f => f.fieldKey));
        const availableFields = this.fields.filter(f => !usedFields.has(f.name));
        const hasActiveValues = Object.values(this.activeValues).some(v => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
        return html `
      <div class="filter-bar" role="toolbar" aria-label="Global filters">
        <span class="filter-bar-label">Filters</span>

        ${this.filters.map(f => {
            const hasValue = this.activeValues[f.id] !== undefined && this.activeValues[f.id] !== '';
            return html `
            <div class="filter-item ${hasValue ? 'filter-item--active' : ''}">
              <span class="filter-label">${f.label}</span>
              ${this.renderFilterControl(f)}
              <button class="filter-remove" @click=${() => this.removeFilter(f.id)} title="Remove filter">&times;</button>
            </div>
          `;
        })}

        ${this.showAddPicker ? html `
          <div class="add-picker">
            <select @change=${(e) => {
            const val = e.target.value;
            if (val)
                this.addFilter(val);
        }}>
              <option value="">Pick field...</option>
              ${availableFields.map(f => html `<option value=${f.name}>${f.name} (${f.type})</option>`)}
            </select>
          </div>
        ` : html `
          <button class="filter-add" @click=${() => { this.showAddPicker = true; }} ?disabled=${availableFields.length === 0}>
            + Add Filter
          </button>
        `}

        ${hasActiveValues ? html `
          <button class="clear-all" @click=${this.clearAll}>Clear All</button>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzGlobalFilterBar.prototype, "filters", void 0);
__decorate([
    property({ type: Array })
], PhzGlobalFilterBar.prototype, "data", void 0);
__decorate([
    property({ type: Array })
], PhzGlobalFilterBar.prototype, "fields", void 0);
__decorate([
    state()
], PhzGlobalFilterBar.prototype, "activeValues", void 0);
__decorate([
    state()
], PhzGlobalFilterBar.prototype, "showAddPicker", void 0);
__decorate([
    state()
], PhzGlobalFilterBar.prototype, "expandedMultiSelect", void 0);
PhzGlobalFilterBar = __decorate([
    safeCustomElement('phz-global-filter-bar')
], PhzGlobalFilterBar);
export { PhzGlobalFilterBar };
//# sourceMappingURL=phz-global-filter-bar.js.map