/**
 * <phz-data-source-panel> — Interactive data source browser
 *
 * Connects to a DataAdapter and provides an interactive field browser
 * for report/visualization composition. Fields are classified into
 * dimensions, measures, time fields, and identifiers.
 *
 * Usage:
 *   <phz-data-source-panel
 *     .adapter=${myDataAdapter}
 *     @field-add=${(e) => handleFieldAdd(e.detail.field)}
 *     @field-remove=${(e) => handleFieldRemove(e.detail.field)}
 *     @source-change=${(e) => handleSourceChange(e.detail.sourceId)}
 *   ></phz-data-source-panel>
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { createDataSourceState, selectSource, setFieldSearch, addField, removeField, filteredDimensions, filteredMeasures, filteredTimeFields, filteredIdentifiers, } from './data-source-state.js';
import { loadSources, loadSchema, loadFieldStats } from './data-source-panel-orchestrator.js';
let PhzDataSourcePanel = class PhzDataSourcePanel extends LitElement {
    constructor() {
        super(...arguments);
        this._state = createDataSourceState();
        this._expanded = {
            time: true, dimensions: true, measures: true, identifiers: false,
        };
        this._setState = (updater) => {
            this._state = updater(this._state);
        };
    }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      height: 100%;
      overflow: hidden;
    }

    /* ── Source Picker ── */
    .source-picker {
      padding: 12px;
      border-bottom: 1px solid var(--phz-border-color, #E7E5E4);
    }
    .source-picker label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--phz-text-muted, #78716C);
      margin-bottom: 4px;
    }
    .source-select {
      width: 100%;
      padding: 6px 8px;
      font-size: 13px;
      border: 1px solid var(--phz-border-color, #E7E5E4);
      border-radius: 6px;
      background: var(--phz-surface, #fff);
      color: var(--phz-text, #1C1917);
      cursor: pointer;
    }
    .source-select:focus {
      outline: 2px solid var(--phz-color-primary, #3B82F6);
      outline-offset: -1px;
    }
    .source-meta {
      font-size: 11px;
      color: var(--phz-text-muted, #78716C);
      margin-top: 4px;
    }

    /* ── Search ── */
    .search-box {
      padding: 8px 12px;
      border-bottom: 1px solid var(--phz-border-color, #E7E5E4);
    }
    .search-input {
      width: 100%;
      padding: 6px 8px 6px 28px;
      font-size: 12px;
      border: 1px solid var(--phz-border-color, #E7E5E4);
      border-radius: 6px;
      background: var(--phz-surface, #fff) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2378716C' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") no-repeat 8px center;
      color: var(--phz-text, #1C1917);
      box-sizing: border-box;
    }
    .search-input:focus { outline: 2px solid var(--phz-color-primary, #3B82F6); outline-offset: -1px; }
    .search-input::placeholder { color: var(--phz-text-muted, #A8A29E); }

    /* ── Field Sections ── */
    .field-sections {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 8px;
    }

    .section { border-bottom: 1px solid var(--phz-border-color, #F5F5F4); }
    .section:last-child { border-bottom: none; }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      user-select: none;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--phz-text-muted, #78716C);
    }
    .section-header:hover { background: var(--phz-hover, #FAFAF9); }

    .section-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
    .section-count {
      margin-left: auto;
      font-size: 10px;
      color: var(--phz-text-muted, #D6D3D1);
      font-weight: 400;
    }
    .chevron {
      font-size: 8px;
      color: var(--phz-text-muted, #A8A29E);
      transition: transform 0.15s;
    }
    .chevron--open { transform: rotate(90deg); }

    /* ── Field Items ── */
    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px 5px 20px;
      cursor: pointer;
      font-size: 12px;
      border-radius: 0;
      transition: background 0.1s;
    }
    .field-item:hover { background: var(--phz-hover, #F5F5F4); }
    .field-item--selected { background: var(--phz-selected-bg, #EFF6FF); }
    .field-item--selected:hover { background: var(--phz-selected-bg-hover, #DBEAFE); }

    .field-icon {
      width: 18px;
      height: 18px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .field-name {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--phz-text, #1C1917);
    }

    .field-type {
      font-size: 10px;
      color: var(--phz-text-muted, #A8A29E);
      flex-shrink: 0;
    }

    .field-check {
      width: 14px;
      height: 14px;
      border: 1.5px solid var(--phz-border-color, #D6D3D1);
      border-radius: 3px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--phz-color-primary, #3B82F6);
      transition: all 0.1s;
    }
    .field-check--on {
      border-color: var(--phz-color-primary, #3B82F6);
      background: var(--phz-color-primary, #3B82F6);
      color: #fff;
    }

    /* ── Colors per category ── */
    .icon-time { background: #7C3AED; }
    .icon-dimension { background: #3B82F6; }
    .icon-measure { background: #16A34A; }
    .icon-identifier { background: #A8A29E; }

    /* ── Loading / Empty / Error ── */
    .loading, .empty, .error-msg {
      padding: 16px;
      font-size: 13px;
      color: var(--phz-text-muted, #78716C);
      text-align: center;
    }
    .error-msg { color: #DC2626; }
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid var(--phz-border-color, #E7E5E4);
      border-top-color: var(--phz-color-primary, #3B82F6);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Selected Fields Summary ── */
    .selected-summary {
      padding: 8px 12px;
      border-top: 1px solid var(--phz-border-color, #E7E5E4);
      font-size: 11px;
      color: var(--phz-text-muted, #78716C);
      background: var(--phz-surface-alt, #FAFAF9);
    }
    .selected-count {
      font-weight: 600;
      color: var(--phz-color-primary, #3B82F6);
    }
  `; }
    async connectedCallback() {
        super.connectedCallback();
        if (this.adapter) {
            await loadSources(this.adapter, this._setState);
            // Auto-select source if specified or if only one source
            const targetId = this.sourceId ?? (this._state.sources.length === 1 ? this._state.sources[0].id : undefined);
            if (targetId) {
                this._selectSource(targetId);
            }
        }
    }
    updated(changedProperties) {
        if (changedProperties.has('adapter') && this.adapter) {
            loadSources(this.adapter, this._setState);
        }
    }
    async _selectSource(sourceId) {
        this._state = selectSource(this._state, sourceId);
        this.dispatchEvent(new CustomEvent('source-change', {
            bubbles: true, composed: true,
            detail: { sourceId },
        }));
        if (this.adapter) {
            await loadSchema(this.adapter, sourceId, this._setState);
        }
    }
    _toggleSection(key) {
        this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
    }
    _handleSearch(e) {
        this._state = setFieldSearch(this._state, e.target.value);
    }
    _toggleField(field) {
        const isSelected = this._state.selectedFields.includes(field.name);
        if (isSelected) {
            this._state = removeField(this._state, field.name);
            this.dispatchEvent(new CustomEvent('field-remove', {
                bubbles: true, composed: true,
                detail: { field: field.name, metadata: field },
            }));
        }
        else {
            this._state = addField(this._state, field.name);
            this.dispatchEvent(new CustomEvent('field-add', {
                bubbles: true, composed: true,
                detail: { field: field.name, metadata: field },
            }));
            // Load stats in background for newly selected fields
            if (this.adapter && this._state.selectedSourceId) {
                loadFieldStats(this.adapter, this._state.selectedSourceId, field.name, this._setState);
            }
        }
    }
    _renderFieldSection(key, label, icon, iconClass, fields) {
        if (fields.length === 0 && this._state.fieldSearch)
            return nothing;
        const isOpen = this._expanded[key];
        return html `
      <div class="section">
        <div class="section-header"
             @click=${() => this._toggleSection(key)}
             role="button"
             aria-expanded="${isOpen}">
          <span class="chevron ${isOpen ? 'chevron--open' : ''}">&#x25B6;</span>
          <span class="section-icon">${icon}</span>
          <span>${label}</span>
          <span class="section-count">${fields.length}</span>
        </div>
        ${isOpen ? fields.map(f => this._renderFieldItem(f, iconClass)) : nothing}
      </div>
    `;
    }
    _renderFieldItem(field, iconClass) {
        const isSelected = this._state.selectedFields.includes(field.name);
        const stats = this._state.fieldStats[field.name];
        const typeLabel = field.dataType.charAt(0).toUpperCase();
        return html `
      <div class="field-item ${isSelected ? 'field-item--selected' : ''}"
           @click=${() => this._toggleField(field)}
           role="option"
           aria-selected="${isSelected}"
           title="${field.name}${stats ? ` (${stats.distinctCount} distinct, ${stats.nullCount} nulls)` : ''}">
        <span class="field-check ${isSelected ? 'field-check--on' : ''}">
          ${isSelected ? html `&#x2713;` : nothing}
        </span>
        <span class="field-icon ${iconClass}">${typeLabel}</span>
        <span class="field-name">${field.name}</span>
        <span class="field-type">${field.dataType}</span>
      </div>
    `;
    }
    render() {
        const { _state: s } = this;
        // Error state
        if (s.error) {
            return html `<div class="error-msg">${s.error}</div>`;
        }
        // Loading sources
        if (s.sourcesLoading) {
            return html `<div class="loading"><span class="loading-spinner"></span> Loading data sources...</div>`;
        }
        const selectedSource = s.sources.find(src => src.id === s.selectedSourceId);
        return html `
      <!-- Source Picker -->
      <div class="source-picker">
        <label for="source-select">Data Source</label>
        <select id="source-select" class="source-select"
                .value=${s.selectedSourceId ?? ''}
                @change=${(e) => this._selectSource(e.target.value)}>
          ${!s.selectedSourceId ? html `<option value="" disabled selected>Select a data source...</option>` : nothing}
          ${s.sources.map(src => html `
            <option value=${src.id} ?selected=${src.id === s.selectedSourceId}>${src.name}</option>
          `)}
        </select>
        ${selectedSource ? html `
          <div class="source-meta">
            ${selectedSource.fieldCount} fields${selectedSource.rowCount ? html ` &middot; ${selectedSource.rowCount.toLocaleString()} rows` : nothing}
          </div>
        ` : nothing}
      </div>

      ${!s.selectedSourceId ? html `<div class="empty">Select a data source to browse its fields</div>` : nothing}

      ${s.schemaLoading ? html `<div class="loading"><span class="loading-spinner"></span> Loading schema...</div>` : nothing}

      ${s.schema && !s.schemaLoading ? html `
        <!-- Search -->
        <div class="search-box">
          <input class="search-input"
                 type="text"
                 placeholder="Search fields..."
                 .value=${s.fieldSearch}
                 @input=${this._handleSearch}>
        </div>

        <!-- Field Sections -->
        <div class="field-sections" role="listbox" aria-label="Available fields">
          ${this._renderFieldSection('time', 'Time', '\u{1F4C5}', 'icon-time', filteredTimeFields(s))}
          ${this._renderFieldSection('dimensions', 'Dimensions', '\u{25A6}', 'icon-dimension', filteredDimensions(s))}
          ${this._renderFieldSection('measures', 'Measures', '\u{03A3}', 'icon-measure', filteredMeasures(s))}
          ${this._renderFieldSection('identifiers', 'Identifiers', '\u{1F511}', 'icon-identifier', filteredIdentifiers(s))}
        </div>

        <!-- Selected Fields Summary -->
        ${s.selectedFields.length > 0 ? html `
          <div class="selected-summary">
            <span class="selected-count">${s.selectedFields.length}</span> field${s.selectedFields.length !== 1 ? 's' : ''} selected
          </div>
        ` : nothing}
      ` : nothing}
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzDataSourcePanel.prototype, "adapter", void 0);
__decorate([
    property({ type: String, attribute: 'source-id' })
], PhzDataSourcePanel.prototype, "sourceId", void 0);
__decorate([
    state()
], PhzDataSourcePanel.prototype, "_state", void 0);
__decorate([
    state()
], PhzDataSourcePanel.prototype, "_expanded", void 0);
PhzDataSourcePanel = __decorate([
    safeCustomElement('phz-data-source-panel')
], PhzDataSourcePanel);
export { PhzDataSourcePanel };
//# sourceMappingURL=phz-data-source-panel.js.map