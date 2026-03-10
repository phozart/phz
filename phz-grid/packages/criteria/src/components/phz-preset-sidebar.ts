/**
 * @phozart/phz-criteria — Preset Sidebar
 *
 * Vertical list of saved presets grouped by scope (Shared, Personal).
 * Used inside the expanded modal sidebar.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SelectionPreset } from '@phozart/phz-core';
import { criteriaStyles } from '../shared-styles.js';

@customElement('phz-preset-sidebar')
export class PhzPresetSidebar extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; }
  `];

  @property({ type: Array }) presets: SelectionPreset[] = [];
  @property() activePresetId: string | null = null;

  private _select(preset: SelectionPreset) {
    this.dispatchEvent(new CustomEvent('preset-select', {
      detail: { preset },
      bubbles: true, composed: true,
    }));
  }

  render() {
    const shared = (this.presets ?? []).filter(p => p.scope === 'shared');
    const personal = (this.presets ?? []).filter(p => p.scope === 'personal');

    return html`
      <div class="phz-sc-preset-sb">
        ${shared.length > 0 ? html`
          <div class="phz-sc-preset-sb-group">Shared</div>
          ${shared.map(p => html`
            <button
              class="phz-sc-preset-sb-item ${p.id === this.activePresetId ? 'phz-sc-preset-sb-item--active' : ''}"
              @click=${() => this._select(p)}
            >
              ${p.name}
              <span class="phz-sc-preset-badge phz-sc-preset-badge--shared">shared</span>
            </button>
          `)}
        ` : nothing}
        ${personal.length > 0 ? html`
          <div class="phz-sc-preset-sb-group">Personal</div>
          ${personal.map(p => html`
            <button
              class="phz-sc-preset-sb-item ${p.id === this.activePresetId ? 'phz-sc-preset-sb-item--active' : ''}"
              @click=${() => this._select(p)}
            >
              ${p.name}
              <span class="phz-sc-preset-badge phz-sc-preset-badge--personal">personal</span>
            </button>
          `)}
        ` : nothing}
        ${(this.presets ?? []).length === 0 ? html`
          <div style="padding: 16px; font-size: 12px; color: #A8A29E; text-align: center;">No saved presets</div>
        ` : nothing}
      </div>
    `;
  }
}
