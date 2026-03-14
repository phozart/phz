/**
 * @phozart/editor — <phz-editor-catalog> (B-2.04)
 *
 * Catalog screen component for the editor. Displays artifacts
 * with search, filtering, sorting, and creation actions.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createCatalogState, searchCatalog, filterCatalogByType, openCreateDialog, } from '../screens/catalog-state.js';
let PhzEditorCatalog = class PhzEditorCatalog extends LitElement {
    constructor() {
        super(...arguments);
        this.items = [];
        this._state = createCatalogState();
    }
    static { this.styles = css `
    :host { display: block; }
    .catalog-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .catalog-card {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .catalog-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-meta {
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
    }
    input[type="search"] {
      flex: 1;
      padding: 6px 12px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 14px;
    }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
    }
  `; }
    willUpdate(changed) {
        if (changed.has('items')) {
            this._state = createCatalogState(this.items);
        }
    }
    /** Get the current catalog state. */
    getState() {
        return this._state;
    }
    _onSearch(e) {
        const input = e.target;
        this._state = searchCatalog(this._state, input.value);
    }
    _onTypeFilter(type) {
        this._state = filterCatalogByType(this._state, type);
    }
    _onCardClick(item) {
        this.dispatchEvent(new CustomEvent('artifact-select', {
            detail: { id: item.id, type: item.type },
            bubbles: true,
            composed: true,
        }));
    }
    _onCreate(type) {
        this._state = openCreateDialog(this._state, type);
        this.dispatchEvent(new CustomEvent('create-artifact', {
            detail: { type },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="catalog-header">
        <input
          type="search"
          placeholder="Search artifacts..."
          .value=${this._state.searchQuery}
          @input=${this._onSearch}
          aria-label="Search artifacts"
        />
        <button @click=${() => this._onCreate('dashboard')}>New Dashboard</button>
        <button @click=${() => this._onCreate('report')}>New Report</button>
      </div>

      ${this._state.loading
            ? html `<div role="status" aria-label="Loading">Loading...</div>`
            : nothing}

      <div class="catalog-grid" role="list">
        ${this._state.filteredItems.map(item => html `
          <div
            class="catalog-card"
            role="listitem"
            tabindex="0"
            @click=${() => this._onCardClick(item)}
            @keydown=${(e) => {
            if (e.key === 'Enter' || e.key === ' ')
                this._onCardClick(item);
        }}
          >
            <div class="card-title">${item.name}</div>
            <div class="card-meta">${item.type} &middot; ${item.visibility}</div>
            ${item.description
            ? html `<div class="card-meta">${item.description}</div>`
            : nothing}
          </div>
        `)}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzEditorCatalog.prototype, "items", void 0);
__decorate([
    state()
], PhzEditorCatalog.prototype, "_state", void 0);
PhzEditorCatalog = __decorate([
    customElement('phz-editor-catalog')
], PhzEditorCatalog);
export { PhzEditorCatalog };
//# sourceMappingURL=phz-editor-catalog.js.map