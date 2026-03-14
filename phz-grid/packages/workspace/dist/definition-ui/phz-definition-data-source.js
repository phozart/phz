/**
 * @phozart/definitions — <phz-definition-data-source>
 *
 * Searchable data product picker with schema preview.
 * Emits `data-source-change` when a data product is selected.
 *
 * Migrated from phz-grid-admin's phz-admin-data-source with new tag name.
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
import { adminBaseStyles } from './shared-styles.js';
let PhzDefinitionDataSource = class PhzDefinitionDataSource extends LitElement {
    constructor() {
        super(...arguments);
        this.selectedDataProductId = '';
        this.dataProducts = [];
        this.schemaFields = [];
        this.searchQuery = '';
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      :host { display: block; }

      .ds-search {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 10px; border: 1px solid #D6D3D1; border-radius: 8px;
        background: white; margin-bottom: 12px;
      }
      .ds-search:focus-within {
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
      }
      .ds-search input {
        border: none; outline: none; font-size: 13px;
        background: transparent; width: 100%; color: #1C1917;
        font-family: inherit;
      }
      .ds-search input::placeholder { color: #A8A29E; }

      .ds-list { display: flex; flex-direction: column; gap: 8px; }

      .ds-card {
        padding: 12px 14px; border: 1px solid #E7E5E4; border-radius: 10px;
        cursor: pointer; transition: all 0.15s ease; background: white;
      }
      .ds-card:hover { border-color: #93C5FD; transform: translateY(-1px); }
      .ds-card--selected { border-color: #3B82F6; background: #EFF6FF; }
      .ds-card__name { font-size: 13px; font-weight: 600; color: #1C1917; margin: 0 0 4px; }
      .ds-card__desc {
        font-size: 12px; color: #78716C; margin: 0 0 6px;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ds-card__meta { display: flex; gap: 8px; align-items: center; font-size: 11px; color: #A8A29E; }
      .ds-tag { background: #F5F5F4; border-radius: 4px; padding: 1px 6px; font-size: 10px; color: #78716C; }

      .ds-empty { text-align: center; padding: 32px 16px; color: #A8A29E; font-size: 13px; }
    `,
    ]; }
    get filteredProducts() {
        if (!this.searchQuery.trim())
            return this.dataProducts;
        const q = this.searchQuery.toLowerCase();
        return this.dataProducts.filter(p => p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q))));
    }
    _selectProduct(id) {
        this.dispatchEvent(new CustomEvent('data-source-change', {
            bubbles: true, composed: true,
            detail: { dataProductId: id },
        }));
    }
    render() {
        const products = this.filteredProducts;
        return html `
      <div class="ds-search">
        <input type="text"
               placeholder="Search data sources..."
               .value=${this.searchQuery}
               @input=${(e) => { this.searchQuery = e.target.value; }} />
      </div>

      ${products.length === 0 ? html `
        <div class="ds-empty">
          ${this.dataProducts.length === 0
            ? 'No data sources available.'
            : 'No data sources match your search.'}
        </div>
      ` : html `
        <div class="ds-list">
          ${products.map(p => html `
            <div class="ds-card ${p.id === this.selectedDataProductId ? 'ds-card--selected' : ''}"
                 @click=${() => this._selectProduct(p.id)}>
              <p class="ds-card__name">${p.name}</p>
              ${p.description ? html `<p class="ds-card__desc">${p.description}</p>` : nothing}
              <div class="ds-card__meta">
                <span>${p.fieldCount} field${p.fieldCount !== 1 ? 's' : ''}</span>
                ${(p.tags ?? []).map(t => html `<span class="ds-tag">${t}</span>`)}
              </div>
            </div>
          `)}
        </div>
      `}
    `;
    }
};
__decorate([
    property({ type: String })
], PhzDefinitionDataSource.prototype, "selectedDataProductId", void 0);
__decorate([
    property({ attribute: false })
], PhzDefinitionDataSource.prototype, "dataProducts", void 0);
__decorate([
    property({ attribute: false })
], PhzDefinitionDataSource.prototype, "schemaFields", void 0);
__decorate([
    state()
], PhzDefinitionDataSource.prototype, "searchQuery", void 0);
PhzDefinitionDataSource = __decorate([
    safeCustomElement('phz-definition-data-source')
], PhzDefinitionDataSource);
export { PhzDefinitionDataSource };
//# sourceMappingURL=phz-definition-data-source.js.map