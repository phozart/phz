/**
 * @phozart/phz-engine-admin — Slide-Over Panel
 *
 * Reusable right-side slide-over panel (380px, backdrop, Escape close, focus trap).
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
let PhzSlideOver = class PhzSlideOver extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this.heading = '';
    }
    static { this.styles = css `
    :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 999;
      opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
    }
    .backdrop--open { opacity: 1; pointer-events: auto; }

    .panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 380px; max-width: 90vw; background: white; z-index: 1000;
      transform: translateX(100%); transition: transform 0.3s ease-out;
      display: flex; flex-direction: column;
      box-shadow: -4px 0 20px rgba(0,0,0,0.08);
    }
    .panel--open { transform: translateX(0); }

    .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #E7E5E4;
    }
    .header-title { font-size: 14px; font-weight: 700; color: #1C1917; }
    .close-btn {
      width: 28px; height: 28px; border: none; background: none;
      font-size: 18px; color: #78716C; cursor: pointer;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { background: #F5F5F4; color: #1C1917; }

    .body { flex: 1; overflow-y: auto; padding: 16px 20px; }

    /* ── Touch targets ── */
    .close-btn { width: 44px; height: 44px; }

    /* ── Full-screen below 576px ── */
    @media (max-width: 576px) {
      .panel {
        width: 100%; max-width: 100%;
      }
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        this._onKeyDown = this._onKeyDown.bind(this);
        document.addEventListener('keydown', this._onKeyDown);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._onKeyDown);
    }
    _onKeyDown(e) {
        if (e.key === 'Escape' && this.open) {
            this._close();
        }
    }
    _close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('slide-close', { bubbles: true, composed: true }));
    }
    render() {
        return html `
      <div class="backdrop ${this.open ? 'backdrop--open' : ''}"
           @click=${this._close}></div>
      <div class="panel ${this.open ? 'panel--open' : ''}"
           role="dialog" aria-label=${this.heading}>
        <div class="header">
          <span class="header-title">${this.heading}</span>
          <button class="close-btn" @click=${this._close} aria-label="Close">&times;</button>
        </div>
        <div class="body">
          <slot></slot>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzSlideOver.prototype, "open", void 0);
__decorate([
    property({ type: String })
], PhzSlideOver.prototype, "heading", void 0);
PhzSlideOver = __decorate([
    safeCustomElement('phz-slide-over')
], PhzSlideOver);
export { PhzSlideOver };
//# sourceMappingURL=phz-slide-over.js.map