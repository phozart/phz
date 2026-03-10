/**
 * @phozart/phz-editor — <phz-measure-palette> (B-2.07)
 *
 * Measure registry palette component. Displays measures and KPIs
 * with search, category filtering, and drag-to-widget support.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createMeasurePaletteState, searchMeasures, setActiveTab, selectPaletteItem, } from '../authoring/measure-palette-state.js';
let PhzMeasurePalette = class PhzMeasurePalette extends LitElement {
    constructor() {
        super(...arguments);
        this.measures = [];
        this.kpis = [];
        this._state = createMeasurePaletteState([], []);
    }
    static { this.styles = css `
    :host { display: block; }
    .palette-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .tabs {
      display: flex;
      gap: 4px;
    }
    .tab {
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      background: var(--phz-surface, #ffffff);
    }
    .tab[data-active] {
      background: var(--phz-primary, #3b82f6);
      color: white;
      border-color: var(--phz-primary, #3b82f6);
    }
    input[type="search"] {
      width: 100%;
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .palette-item {
      padding: 8px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      cursor: grab;
      font-size: 13px;
    }
    .palette-item:hover {
      background: var(--phz-surface-hover, #f3f4f6);
    }
    .palette-item[data-selected] {
      outline: 2px solid var(--phz-primary, #3b82f6);
    }
    .item-name { font-weight: 600; }
    .item-meta {
      font-size: 11px;
      color: var(--phz-text-secondary, #6b7280);
    }
  `; }
    willUpdate(changed) {
        if (changed.has('measures') || changed.has('kpis')) {
            this._state = createMeasurePaletteState(this.measures, this.kpis);
        }
    }
    /** Get the current palette state. */
    getState() {
        return this._state;
    }
    _onSearch(e) {
        const input = e.target;
        this._state = searchMeasures(this._state, input.value);
    }
    _onTabChange(tab) {
        this._state = setActiveTab(this._state, tab);
    }
    _onItemClick(id, type) {
        this._state = selectPaletteItem(this._state, id, type);
        this.dispatchEvent(new CustomEvent('item-select', {
            detail: { id, type },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const items = this._state.activeTab === 'measures'
            ? this._state.filteredMeasures
            : this._state.filteredKPIs;
        return html `
      <div class="palette-header">
        <div class="tabs" role="tablist">
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'measures'}
            aria-selected=${this._state.activeTab === 'measures'}
            @click=${() => this._onTabChange('measures')}
          >Measures (${this._state.filteredMeasures.length})</button>
          <button
            class="tab"
            role="tab"
            ?data-active=${this._state.activeTab === 'kpis'}
            aria-selected=${this._state.activeTab === 'kpis'}
            @click=${() => this._onTabChange('kpis')}
          >KPIs (${this._state.filteredKPIs.length})</button>
        </div>
        <input
          type="search"
          placeholder="Search..."
          .value=${this._state.searchQuery}
          @input=${this._onSearch}
          aria-label="Search measures and KPIs"
        />
      </div>

      <div class="item-list" role="listbox" aria-label=${this._state.activeTab}>
        ${items.map(item => html `
          <div
            class="palette-item"
            role="option"
            tabindex="0"
            ?data-selected=${this._state.selectedItemId === item.id}
            aria-selected=${this._state.selectedItemId === item.id}
            @click=${() => this._onItemClick(item.id, this._state.activeTab === 'measures' ? 'measure' : 'kpi')}
            @keydown=${(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                this._onItemClick(item.id, this._state.activeTab === 'measures' ? 'measure' : 'kpi');
            }
        }}
            draggable="true"
            @dragstart=${(e) => {
            e.dataTransfer?.setData('application/json', JSON.stringify({
                id: item.id,
                type: this._state.activeTab === 'measures' ? 'measure' : 'kpi',
            }));
        }}
          >
            <div class="item-name">${item.name}</div>
            ${item.description
            ? html `<div class="item-meta">${item.description}</div>`
            : nothing}
          </div>
        `)}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzMeasurePalette.prototype, "measures", void 0);
__decorate([
    property({ type: Array })
], PhzMeasurePalette.prototype, "kpis", void 0);
__decorate([
    state()
], PhzMeasurePalette.prototype, "_state", void 0);
PhzMeasurePalette = __decorate([
    customElement('phz-measure-palette')
], PhzMeasurePalette);
export { PhzMeasurePalette };
//# sourceMappingURL=phz-measure-palette.js.map