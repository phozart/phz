/**
 * @phozart/phz-grid — <phz-view-switcher>
 *
 * Dropdown UI for switching between saved grid views.
 * Renders in the toolbar area. Shows active view name, dirty indicator,
 * and a dropdown list of available views.
 */

import { LitElement, html, css, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ViewsSummary } from '@phozart/phz-core';
import { forcedColorsCSS } from '../a11y/forced-colors-adapter.js';

@customElement('phz-view-switcher')
export class PhzViewSwitcher extends LitElement {
  static styles = [
    unsafeCSS(forcedColorsCSS),
    css`
      :host { display: inline-flex; align-items: center; position: relative; }

      .view-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 12px; border-radius: 6px; border: 1px solid var(--phz-border, #D6D3D1);
        background: var(--phz-surface, #FAFAF9); color: var(--phz-text, #1C1917);
        font-size: 13px; cursor: pointer; min-height: 32px;
        transition: all 0.15s ease;
      }
      .view-btn:hover { background: var(--phz-surface-hover, #F5F5F4); }

      .dirty-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--phz-warning, #F59E0B);
        border: 1px solid var(--phz-warning, #F59E0B);
      }

      .dropdown {
        position: absolute; top: 100%; left: 0; z-index: 100;
        min-width: 200px; max-height: 300px; overflow-y: auto;
        background: white; border: 1px solid #E7E5E4; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-top: 4px;
        padding: 4px;
      }

      .view-item {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 12px; border-radius: 6px; cursor: pointer;
        font-size: 13px; border: none; background: none;
        width: 100%; text-align: left; color: #1C1917;
      }
      .view-item:hover { background: #F5F5F4; }
      .view-item.active { background: #FEF3C7; font-weight: 600; }
      .view-item .default-badge {
        font-size: 10px; color: #78716C; margin-left: auto;
      }

      .no-views { padding: 12px; color: #78716C; font-size: 13px; text-align: center; }
    `,
  ];

  @property({ attribute: false })
  views: ViewsSummary[] = [];

  @property({ type: Boolean, attribute: 'is-dirty' })
  isDirty: boolean = false;

  @property({ type: String, attribute: 'active-view-name' })
  activeViewName: string = '';

  @state()
  private _open = false;

  render() {
    return html`
      <button
        class="view-btn"
        @click=${this._toggle}
        aria-haspopup="listbox"
        aria-expanded=${this._open}
      >
        ${this.activeViewName || 'Views'}
        ${this.isDirty ? html`<span class="dirty-dot" title="Unsaved changes">*</span>` : nothing}
        <span aria-hidden="true">▾</span>
      </button>
      ${this._open ? this._renderDropdown() : nothing}
    `;
  }

  private _renderDropdown() {
    if (this.views.length === 0) {
      return html`<div class="dropdown" role="listbox"><div class="no-views">No saved views</div></div>`;
    }

    return html`
      <div class="dropdown" role="listbox" aria-label="Saved views">
        ${this.views.map(
          v => html`
            <button
              class="view-item ${v.isActive ? 'active' : ''}"
              role="option"
              aria-selected=${v.isActive}
              aria-current=${v.isActive ? 'true' : 'false'}
              @click=${() => this._selectView(v.id)}
            >
              ${v.name}
              ${v.isDefault ? html`<span class="default-badge">default</span>` : nothing}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _toggle() {
    this._open = !this._open;
  }

  private _selectView(id: string) {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent('view-select', { detail: { viewId: id }, bubbles: true, composed: true }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-view-switcher': PhzViewSwitcher;
  }
}
