/**
 * @phozart/criteria — Expanded Modal
 *
 * Near-full-screen modal with backdrop. Two-column layout:
 * sidebar (240px, for presets) | main content (tree/filter).
 * Escape key closes, focus trap.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';
const iconX = html `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
let PhzExpandedModal = class PhzExpandedModal extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.modalTitle = '';
        this._keydownHandler = (e) => {
            if (e.key === 'Escape' && this.open) {
                this._close();
            }
        };
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: contents; }
  `]; }
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this._keydownHandler);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._keydownHandler);
    }
    updated(changed) {
        if (changed.has('open') && this.open) {
            requestAnimationFrame(() => {
                const focusable = this._panel?.querySelector('button, [tabindex], input, select');
                focusable?.focus();
            });
        }
    }
    _close() {
        this.dispatchEvent(new CustomEvent('modal-close', {
            bubbles: true, composed: true,
        }));
    }
    render() {
        if (!this.open)
            return nothing;
        return html `
      <div class="phz-sc-modal-backdrop" @click=${this._close}>
        <div class="phz-sc-modal-panel" @click=${(e) => e.stopPropagation()}>
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
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzExpandedModal.prototype, "open", void 0);
__decorate([
    property()
], PhzExpandedModal.prototype, "modalTitle", void 0);
__decorate([
    query('.phz-sc-modal-panel')
], PhzExpandedModal.prototype, "_panel", void 0);
PhzExpandedModal = __decorate([
    customElement('phz-expanded-modal')
], PhzExpandedModal);
export { PhzExpandedModal };
//# sourceMappingURL=phz-expanded-modal.js.map