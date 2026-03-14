/**
 * @phozart/engine-admin — Data Product Browser
 *
 * Two-panel: searchable product list (left) + schema inspector (right).
 * Embeddable component.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type { DataProductDef, DataProductField } from '@phozart/engine';

@safeCustomElement('phz-data-browser')
export class PhzDataBrowser extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      .browser { display: grid; grid-template-columns: 280px 1fr; min-height: 400px; border: 1px solid #E7E5E4; border-radius: 8px; overflow: hidden; }
      .product-list-panel { border-right: 1px solid #E7E5E4; padding: 12px; overflow-y: auto; }
      .schema-panel { padding: 16px; overflow-y: auto; }
      .schema-field { display: grid; grid-template-columns: 1fr 80px; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F5F5F4; font-size: 13px; }
      .schema-field-name { font-weight: 500; color: #1C1917; }
      .schema-field-type { font-size: 11px; color: #78716C; background: #F5F5F4; padding: 2px 8px; border-radius: 4px; text-align: center; }
      .product-meta { font-size: 12px; color: #78716C; margin-bottom: 12px; }
    `,
  ];

  @property({ type: Array }) products: DataProductDef[] = [];
  @state() private selectedId?: string;
  @state() private searchQuery: string = '';

  private get filteredProducts(): DataProductDef[] {
    if (!this.searchQuery) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  private get selectedProduct(): DataProductDef | undefined {
    return this.products.find(p => p.id === this.selectedId);
  }

  render() {
    const selected = this.selectedProduct;

    return html`
      <div class="browser">
        <div class="product-list-panel">
          <input class="phz-ea-search" type="text" placeholder="Search products..."
                 .value=${this.searchQuery}
                 @input=${(e: Event) => { this.searchQuery = (e.target as HTMLInputElement).value; }}>
          <ul class="phz-ea-list">
            ${this.filteredProducts.map(p => html`
              <li class="phz-ea-list-item ${this.selectedId === p.id ? 'phz-ea-list-item--active' : ''}"
                  @click=${() => { this.selectedId = p.id; this.dispatchEvent(new CustomEvent('product-select', { bubbles: true, composed: true, detail: { productId: p.id } })); }}>
                ${p.name}
              </li>
            `)}
          </ul>
        </div>

        <div class="schema-panel">
          ${selected ? html`
            <h3 style="margin: 0 0 4px; font-size: 16px;">${selected.name}</h3>
            ${selected.description ? html`<p class="product-meta">${selected.description}</p>` : nothing}
            ${selected.owner ? html`<p class="product-meta">Owner: ${selected.owner}</p>` : nothing}
            <h4 class="phz-ea-panel-header">Schema (${selected.schema.fields.length} fields)</h4>
            ${selected.schema.fields.map((f: DataProductField) => html`
              <div class="schema-field">
                <span class="schema-field-name">${f.name}</span>
                <span class="schema-field-type">${f.type}</span>
              </div>
            `)}
          ` : html`<p style="color: #78716C; font-size: 13px;">Select a data product to inspect its schema</p>`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-data-browser': PhzDataBrowser; }
}
