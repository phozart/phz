/**
 * @phozart/phz-workspace — Variant Picker
 *
 * Lit component for displaying widget variant cards.
 * Emits 'variant-select' when a variant is chosen.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
// --- Pure utility functions (testable without DOM) ---
export function filterVariants(variants, query) {
    if (!query.trim())
        return variants;
    const q = query.toLowerCase();
    return variants.filter(v => v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q));
}
export function sortVariantsByName(variants) {
    return [...variants].sort((a, b) => a.name.localeCompare(b.name));
}
// --- Lit Component ---
let PhzVariantPicker = class PhzVariantPicker extends LitElement {
    constructor() {
        super(...arguments);
        this.variants = [];
        this._searchQuery = '';
    }
    static { this.styles = css `
    :host { display: block; }
    .variant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .variant-card {
      border: 1px solid var(--phz-border-color, #e0e0e0);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .variant-card:hover,
    .variant-card:focus-visible { border-color: var(--phz-accent-color, #1976d2); outline: none; }
    .variant-card[aria-selected="true"] {
      border-color: var(--phz-accent-color, #1976d2);
      background: var(--phz-accent-bg, rgba(25, 118, 210, 0.08));
    }
    .variant-name { font-weight: 600; margin-bottom: 4px; }
    .variant-desc { font-size: 0.85em; color: var(--phz-text-secondary, #666); }
  `; }
    render() {
        const filtered = filterVariants(this.variants, this._searchQuery);
        return html `
      <div class="variant-grid" role="listbox" aria-label="Widget variants">
        ${filtered.map(v => html `
          <div
            class="variant-card"
            role="option"
            tabindex="0"
            aria-selected="${this.selectedId === v.id}"
            @click="${() => this._select(v)}"
            @keydown="${(e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._select(v);
        } }}"
          >
            <div class="variant-name">${v.name}</div>
            <div class="variant-desc">${v.description}</div>
          </div>
        `)}
      </div>
    `;
    }
    _select(variant) {
        this.dispatchEvent(new CustomEvent('variant-select', {
            detail: { variant },
            bubbles: true,
            composed: true,
        }));
    }
};
__decorate([
    property({ type: Array })
], PhzVariantPicker.prototype, "variants", void 0);
__decorate([
    property({ type: String })
], PhzVariantPicker.prototype, "selectedId", void 0);
__decorate([
    state()
], PhzVariantPicker.prototype, "_searchQuery", void 0);
PhzVariantPicker = __decorate([
    safeCustomElement('phz-variant-picker')
], PhzVariantPicker);
export { PhzVariantPicker };
//# sourceMappingURL=phz-variant-picker.js.map