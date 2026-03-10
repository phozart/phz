/**
 * @phozart/phz-criteria — Expanded Modal
 *
 * Near-full-screen modal with backdrop. Two-column layout:
 * sidebar (240px, for presets) | main content (tree/filter).
 * Escape key closes, focus trap.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';

const iconX = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

@customElement('phz-expanded-modal')
export class PhzExpandedModal extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: contents; }
  `];

  @property({ type: Boolean, reflect: true }) open = false;
  @property() modalTitle = '';

  @query('.phz-sc-modal-panel') private _panel?: HTMLElement;

  private _keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) {
      this._close();
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._keydownHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._keydownHandler);
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('open') && this.open) {
      requestAnimationFrame(() => {
        const focusable = this._panel?.querySelector<HTMLElement>('button, [tabindex], input, select');
        focusable?.focus();
      });
    }
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('modal-close', {
      bubbles: true, composed: true,
    }));
  }

  render() {
    if (!this.open) return nothing;

    return html`
      <div class="phz-sc-modal-backdrop" @click=${this._close}>
        <div class="phz-sc-modal-panel" @click=${(e: Event) => e.stopPropagation()}>
          <div class="phz-sc-modal-sidebar">
            <slot name="sidebar"></slot>
          </div>
          <div class="phz-sc-modal-main">
            <div class="phz-sc-modal-header">
              <span class="phz-sc-modal-title">${this.modalTitle}</span>
              <button class="phz-sc-modal-close" @click=${this._close} aria-label="Close">
                ${iconX}
              </button>
            </div>
            <div class="phz-sc-modal-body">
              <slot></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
