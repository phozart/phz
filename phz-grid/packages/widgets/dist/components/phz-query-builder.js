/**
 * @phozart/widgets — Query Builder
 *
 * Visual query construction widget for ad-hoc data exploration.
 * Select fields, add filters, choose aggregations, set sort order.
 *
 * Events:
 * - query-execute: { config: QueryConfig, results?: Record<string, unknown>[] }
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
// ── Pure logic (exported for testing) ──
export function getOperatorsForType(type) {
    switch (type) {
        case 'string':
            return ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'];
        case 'number':
            return ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between'];
        case 'boolean':
            return ['equals', 'not_equals'];
        case 'date':
            return ['equals', 'not_equals', 'before', 'after', 'between'];
        default:
            return ['equals', 'not_equals'];
    }
}
export function validateFilter(filter, fields) {
    if (!filter.field)
        return 'Field is required';
    if (!filter.operator)
        return 'Operator is required';
    const field = fields.find(f => f.name === filter.field);
    if (!field)
        return `Unknown field: ${filter.field}`;
    const validOps = getOperatorsForType(field.type);
    if (!validOps.includes(filter.operator))
        return `Invalid operator "${filter.operator}" for type ${field.type}`;
    if (!['is_empty', 'is_not_empty'].includes(filter.operator) && !filter.value) {
        return 'Value is required';
    }
    return null;
}
export function buildQuerySummary(config, fields) {
    const parts = [];
    if (config.selectedFields.length > 0) {
        const labels = config.selectedFields.map(f => {
            const field = fields.find(fd => fd.name === f);
            return field?.label ?? f;
        });
        parts.push(`SELECT ${labels.join(', ')}`);
    }
    else {
        parts.push('SELECT *');
    }
    if (config.filters.length > 0) {
        const filterParts = config.filters.map(f => `${f.field} ${f.operator} ${f.value}`);
        parts.push(`WHERE ${filterParts.join(' AND ')}`);
    }
    if (config.groupBy.length > 0) {
        parts.push(`GROUP BY ${config.groupBy.join(', ')}`);
    }
    if (config.aggregations.length > 0) {
        const aggParts = config.aggregations.map(a => `${a.fn.toUpperCase()}(${a.field})`);
        parts.push(`AGGREGATIONS: ${aggParts.join(', ')}`);
    }
    if (config.sorts.length > 0) {
        const sortParts = config.sorts.map(s => `${s.field} ${s.direction.toUpperCase()}`);
        parts.push(`ORDER BY ${sortParts.join(', ')}`);
    }
    return parts.join(' ');
}
export function applyQueryToData(data, config) {
    let result = [...data];
    for (const filter of config.filters) {
        result = result.filter(row => {
            const val = row[filter.field];
            switch (filter.operator) {
                case 'equals': return String(val) === filter.value;
                case 'not_equals': return String(val) !== filter.value;
                case 'contains': return String(val).includes(filter.value);
                case 'starts_with': return String(val).startsWith(filter.value);
                case 'ends_with': return String(val).endsWith(filter.value);
                case 'greater_than': return Number(val) > Number(filter.value);
                case 'less_than': return Number(val) < Number(filter.value);
                case 'greater_or_equal': return Number(val) >= Number(filter.value);
                case 'less_or_equal': return Number(val) <= Number(filter.value);
                case 'is_empty': return val === null || val === undefined || val === '';
                case 'is_not_empty': return val !== null && val !== undefined && val !== '';
                default: return true;
            }
        });
    }
    for (const sort of [...config.sorts].reverse()) {
        result.sort((a, b) => {
            const av = a[sort.field];
            const bv = b[sort.field];
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sort.direction === 'asc' ? cmp : -cmp;
        });
    }
    if (config.selectedFields.length > 0) {
        result = result.map(row => {
            const out = {};
            for (const f of config.selectedFields) {
                out[f] = row[f];
            }
            return out;
        });
    }
    return result;
}
const TYPE_ICONS = {
    string: 'Aa',
    number: '#',
    boolean: '?',
    date: 'D',
};
const AGG_FUNCTIONS = ['count', 'sum', 'avg', 'min', 'max'];
// ── Component ──
let PhzQueryBuilder = class PhzQueryBuilder extends LitElement {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.selectedFields = [];
        this.filters = [];
        this.aggregations = [];
        this.groupBy = [];
        this.sorts = [];
        this.results = null;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }

      .qb-layout {
        display: grid;
        grid-template-columns: 200px 1fr 280px;
        gap: 1px;
        background: #E7E5E4;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        overflow: hidden;
        min-height: 400px;
      }

      .qb-panel {
        background: white;
        padding: 16px;
        overflow-y: auto;
      }

      .qb-panel-header {
        font-size: 11px;
        font-weight: 700;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #E7E5E4;
      }

      .qb-field-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .qb-field-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        color: #1C1917;
      }

      .qb-field-item:hover { background: #FAFAF9; }
      .qb-field-item--selected { background: #EFF6FF; color: #3B82F6; font-weight: 600; }

      .qb-field-item:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: -2px;
      }

      .qb-type-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        border-radius: 4px;
        background: #F5F5F4;
        color: #78716C;
        flex-shrink: 0;
      }

      .qb-section { margin-bottom: 20px; }

      .qb-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .qb-section-title {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
      }

      .qb-add-btn {
        font-size: 11px;
        color: #3B82F6;
        border: none;
        background: none;
        cursor: pointer;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .qb-add-btn:hover { background: #EFF6FF; }
      .qb-add-btn:focus-visible { outline: 2px solid #3B82F6; outline-offset: 1px; }

      .qb-filter-row {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }

      .qb-filter-row select,
      .qb-filter-row input {
        padding: 5px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 12px;
        background: white;
        color: #1C1917;
      }

      .qb-filter-row select:focus,
      .qb-filter-row input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
      }

      .qb-remove-btn {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: none;
        color: #A8A29E;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        flex-shrink: 0;
      }
      .qb-remove-btn:hover { color: #DC2626; background: #FEF2F2; }
      .qb-remove-btn:focus-visible { outline: 2px solid #3B82F6; }

      .qb-preview {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 12px;
        line-height: 1.6;
        color: #44403C;
        background: #FAFAF9;
        padding: 12px;
        border-radius: 6px;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .qb-execute-btn {
        width: 100%;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background: #3B82F6;
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 12px;
      }
      .qb-execute-btn:hover { background: #2563EB; }
      .qb-execute-btn:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

      .qb-results {
        margin-top: 16px;
      }

      .qb-results-count {
        font-size: 12px;
        color: #78716C;
        margin-bottom: 8px;
      }

      .qb-error {
        font-size: 12px;
        color: #DC2626;
        margin-top: 4px;
      }
    `,
    ]; }
    get queryConfig() {
        return {
            selectedFields: this.selectedFields,
            filters: this.filters,
            aggregations: this.aggregations,
            groupBy: this.groupBy,
            sorts: this.sorts,
        };
    }
    toggleField(fieldName) {
        if (this.selectedFields.includes(fieldName)) {
            this.selectedFields = this.selectedFields.filter(f => f !== fieldName);
        }
        else {
            this.selectedFields = [...this.selectedFields, fieldName];
        }
    }
    addFilter() {
        this.filters = [...this.filters, { field: '', operator: '', value: '' }];
    }
    updateFilter(index, key, value) {
        this.filters = this.filters.map((f, i) => i === index ? { ...f, [key]: value } : f);
    }
    removeFilter(index) {
        this.filters = this.filters.filter((_, i) => i !== index);
    }
    addAggregation() {
        this.aggregations = [...this.aggregations, { field: '', fn: 'count' }];
    }
    updateAggregation(index, key, value) {
        this.aggregations = this.aggregations.map((a, i) => i === index ? { ...a, [key]: value } : a);
    }
    removeAggregation(index) {
        this.aggregations = this.aggregations.filter((_, i) => i !== index);
    }
    addSort() {
        this.sorts = [...this.sorts, { field: '', direction: 'asc' }];
    }
    updateSort(index, key, value) {
        this.sorts = this.sorts.map((s, i) => i === index ? { ...s, [key]: value } : s);
    }
    removeSort(index) {
        this.sorts = this.sorts.filter((_, i) => i !== index);
    }
    toggleGroupBy(fieldName) {
        if (this.groupBy.includes(fieldName)) {
            this.groupBy = this.groupBy.filter(f => f !== fieldName);
        }
        else {
            this.groupBy = [...this.groupBy, fieldName];
        }
    }
    handleExecute() {
        const config = this.queryConfig;
        let results;
        if (this.data) {
            results = applyQueryToData(this.data, config);
            this.results = results;
        }
        this.dispatchEvent(new CustomEvent('query-execute', {
            bubbles: true,
            composed: true,
            detail: { config, results },
        }));
    }
    renderFieldPicker() {
        return html `
      <div class="qb-panel" role="region" aria-label="Available fields">
        <h3 class="qb-panel-header">Fields</h3>
        <ul class="qb-field-list" role="listbox" aria-label="Select fields to include">
          ${this.fields.map(field => html `
            <li role="option" aria-selected="${this.selectedFields.includes(field.name)}">
              <button class="qb-field-item ${this.selectedFields.includes(field.name) ? 'qb-field-item--selected' : ''}"
                      @click=${() => this.toggleField(field.name)}
                      aria-pressed="${this.selectedFields.includes(field.name)}">
                <span class="qb-type-icon">${TYPE_ICONS[field.type] ?? '?'}</span>
                ${field.label ?? field.name}
              </button>
            </li>
          `)}
        </ul>
      </div>
    `;
    }
    renderConfigPanel() {
        return html `
      <div class="qb-panel" role="region" aria-label="Query configuration">
        <!-- Filters -->
        <fieldset class="qb-section">
          <div class="qb-section-header">
            <legend class="qb-section-title">Filters</legend>
            <button class="qb-add-btn" @click=${this.addFilter} aria-label="Add filter">+ Add</button>
          </div>
          ${this.filters.map((filter, i) => this.renderFilterRow(filter, i))}
        </fieldset>

        <!-- Aggregations -->
        <fieldset class="qb-section">
          <div class="qb-section-header">
            <legend class="qb-section-title">Aggregations</legend>
            <button class="qb-add-btn" @click=${this.addAggregation} aria-label="Add aggregation">+ Add</button>
          </div>
          ${this.aggregations.map((agg, i) => html `
            <div class="qb-filter-row">
              <select aria-label="Aggregation function"
                      .value=${agg.fn}
                      @change=${(e) => this.updateAggregation(i, 'fn', e.target.value)}>
                ${AGG_FUNCTIONS.map(fn => html `<option value=${fn} ?selected=${fn === agg.fn}>${fn.toUpperCase()}</option>`)}
              </select>
              <select aria-label="Aggregation field"
                      .value=${agg.field}
                      @change=${(e) => this.updateAggregation(i, 'field', e.target.value)}>
                <option value="">Select field...</option>
                ${this.fields.filter(f => f.type === 'number').map(f => html `
                  <option value=${f.name} ?selected=${f.name === agg.field}>${f.label ?? f.name}</option>
                `)}
              </select>
              <button class="qb-remove-btn" @click=${() => this.removeAggregation(i)} aria-label="Remove aggregation">x</button>
            </div>
          `)}
        </fieldset>

        <!-- Group By -->
        <fieldset class="qb-section">
          <legend class="qb-section-title">Group By</legend>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
            ${this.fields.map(field => html `
              <button class="qb-field-item ${this.groupBy.includes(field.name) ? 'qb-field-item--selected' : ''}"
                      style="padding:4px 10px;font-size:12px;"
                      @click=${() => this.toggleGroupBy(field.name)}
                      aria-pressed="${this.groupBy.includes(field.name)}"
                      aria-label="Group by ${field.label ?? field.name}">
                ${field.label ?? field.name}
              </button>
            `)}
          </div>
        </fieldset>

        <!-- Sort -->
        <fieldset class="qb-section">
          <div class="qb-section-header">
            <legend class="qb-section-title">Sort</legend>
            <button class="qb-add-btn" @click=${this.addSort} aria-label="Add sort">+ Add</button>
          </div>
          ${this.sorts.map((sort, i) => html `
            <div class="qb-filter-row">
              <select aria-label="Sort field"
                      .value=${sort.field}
                      @change=${(e) => this.updateSort(i, 'field', e.target.value)}>
                <option value="">Select field...</option>
                ${this.fields.map(f => html `
                  <option value=${f.name} ?selected=${f.name === sort.field}>${f.label ?? f.name}</option>
                `)}
              </select>
              <select aria-label="Sort direction"
                      .value=${sort.direction}
                      @change=${(e) => this.updateSort(i, 'direction', e.target.value)}>
                <option value="asc" ?selected=${sort.direction === 'asc'}>ASC</option>
                <option value="desc" ?selected=${sort.direction === 'desc'}>DESC</option>
              </select>
              <button class="qb-remove-btn" @click=${() => this.removeSort(i)} aria-label="Remove sort">x</button>
            </div>
          `)}
        </fieldset>
      </div>
    `;
    }
    renderFilterRow(filter, index) {
        const field = this.fields.find(f => f.name === filter.field);
        const operators = field ? getOperatorsForType(field.type) : [];
        const error = filter.field && filter.operator ? validateFilter(filter, this.fields) : null;
        return html `
      <div class="qb-filter-row" role="group" aria-label="Filter ${index + 1}">
        <select aria-label="Filter field"
                .value=${filter.field}
                @change=${(e) => this.updateFilter(index, 'field', e.target.value)}>
          <option value="">Select field...</option>
          ${this.fields.map(f => html `
            <option value=${f.name} ?selected=${f.name === filter.field}>${f.label ?? f.name}</option>
          `)}
        </select>
        <select aria-label="Filter operator"
                .value=${filter.operator}
                @change=${(e) => this.updateFilter(index, 'operator', e.target.value)}>
          <option value="">Operator...</option>
          ${operators.map(op => html `
            <option value=${op} ?selected=${op === filter.operator}>${op.replace(/_/g, ' ')}</option>
          `)}
        </select>
        ${!['is_empty', 'is_not_empty'].includes(filter.operator) ? html `
          <input type="text"
                 aria-label="Filter value"
                 placeholder="Value..."
                 .value=${filter.value}
                 @input=${(e) => this.updateFilter(index, 'value', e.target.value)}>
        ` : nothing}
        <button class="qb-remove-btn" @click=${() => this.removeFilter(index)} aria-label="Remove filter">x</button>
      </div>
      ${error ? html `<div class="qb-error" role="alert">${error}</div>` : nothing}
    `;
    }
    renderPreviewPanel() {
        const summary = buildQuerySummary(this.queryConfig, this.fields);
        return html `
      <div class="qb-panel" role="region" aria-label="Query preview">
        <h3 class="qb-panel-header">Preview</h3>
        <div class="qb-preview" aria-live="polite">${summary}</div>
        <button class="qb-execute-btn" @click=${this.handleExecute}>Execute Query</button>

        ${this.results ? html `
          <div class="qb-results">
            <p class="qb-results-count">${this.results.length} row${this.results.length !== 1 ? 's' : ''} returned</p>
            ${this.results.length > 0 ? html `
              <table class="phz-w-table" aria-label="Query results">
                <thead>
                  <tr>${Object.keys(this.results[0]).map(k => html `<th>${k}</th>`)}</tr>
                </thead>
                <tbody>
                  ${this.results.slice(0, 50).map(row => html `
                    <tr>${Object.values(row).map(v => html `<td>${String(v ?? '')}</td>`)}</tr>
                  `)}
                </tbody>
              </table>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
    }
    render() {
        return html `
      <div class="qb-layout" role="application" aria-label="Query Builder">
        ${this.renderFieldPicker()}
        ${this.renderConfigPanel()}
        ${this.renderPreviewPanel()}
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzQueryBuilder.prototype, "fields", void 0);
__decorate([
    property({ attribute: false })
], PhzQueryBuilder.prototype, "data", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "selectedFields", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "filters", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "aggregations", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "groupBy", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "sorts", void 0);
__decorate([
    state()
], PhzQueryBuilder.prototype, "results", void 0);
PhzQueryBuilder = __decorate([
    customElement('phz-query-builder')
], PhzQueryBuilder);
export { PhzQueryBuilder };
//# sourceMappingURL=phz-query-builder.js.map