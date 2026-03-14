/**
 * @phozart/workspace — Variant Picker
 *
 * Lit component for displaying widget variant cards.
 * Emits 'variant-select' when a variant is chosen.
 */

import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { WidgetVariant } from '../types.js';

// --- Pure utility functions (testable without DOM) ---

export function filterVariants(variants: WidgetVariant[], query: string): WidgetVariant[] {
  if (!query.trim()) return variants;
  const q = query.toLowerCase();
  return variants.filter(v =>
    v.name.toLowerCase().includes(q) ||
    v.description.toLowerCase().includes(q),
  );
}

export function sortVariantsByName(variants: WidgetVariant[]): WidgetVariant[] {
  return [...variants].sort((a, b) => a.name.localeCompare(b.name));
}

// --- Lit Component ---

@safeCustomElement('phz-variant-picker')
export class PhzVariantPicker extends LitElement {
  static override styles = css`
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
  `;

  @property({ type: Array }) variants: WidgetVariant[] = [];
  @property({ type: String }) selectedId?: string;
  @state() private _searchQuery = '';

  override render() {
    const filtered = filterVariants(this.variants, this._searchQuery);
    return html`
      <div class="variant-grid" role="listbox" aria-label="Widget variants">
        ${filtered.map(v => html`
          <div
            class="variant-card"
            role="option"
            tabindex="0"
            aria-selected="${this.selectedId === v.id}"
            @click="${() => this._select(v)}"
            @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._select(v); } }}"
          >
            <div class="variant-name">${v.name}</div>
            <div class="variant-desc">${v.description}</div>
          </div>
        `)}
      </div>
    `;
  }

  private _select(variant: WidgetVariant) {
    this.dispatchEvent(new CustomEvent('variant-select', {
      detail: { variant },
      bubbles: true,
      composed: true,
    }));
  }
}
