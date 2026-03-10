/**
 * <phz-workspace-drawer> — Right-side overlay drawer
 *
 * Renders the active drawer panel (hierarchies, connectors, alerts, etc.)
 * with a header and close button.
 *
 * Events:
 *   close — drawer close requested
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { icon } from '../styles/icons.js';
import { getAdapterBindings, forwardAdaptersToElement } from '../shell/adapter-forwarding.js';
import { DRAWER_PANELS } from '../workspace-config.js';
let PhzWorkspaceDrawer = class PhzWorkspaceDrawer extends LitElement {
    constructor() {
        super(...arguments);
        this.panel = null;
        this.width = 360;
        this._elementCache = new Map();
    }
    static { this.TAG = 'phz-workspace-drawer'; }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      background: var(--bg-base, #FEFDFB);
      flex-shrink: 0;
      z-index: 90;
      overflow: hidden;
    }

    :host([hidden]) { display: none; }

    .header {
      height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 10px;
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      flex-shrink: 0;
    }

    .header__icon {
      display: flex;
      align-items: center;
    }

    .header__icon svg { display: block; }

    .header__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1C1917);
      flex: 1;
    }

    .close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-muted, #78716C);
      cursor: pointer;
      border-radius: 6px;
    }

    .close:hover {
      background: var(--bg-muted, #F5F5F4);
      color: var(--text-primary, #1C1917);
    }

    .close:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .content {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }

    /* ── Empty State ── */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px;
      text-align: center;
    }

    .empty__icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted, #F5F5F4);
      border-radius: 12px;
    }

    .empty__icon svg { display: block; }

    .empty__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1C1917);
      margin: 12px 0 4px;
    }

    .empty__desc {
      font-size: 13px;
      color: var(--text-muted, #78716C);
      margin: 0;
    }

    @media (max-width: 768px) {
      :host {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 300px;
      }
    }
  `; }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._elementCache.clear();
    }
    _handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }
    _renderContent(panel, drawer) {
        const isRegistered = typeof customElements !== 'undefined' && customElements.get(panel.tag);
        if (!isRegistered) {
            return html `
        <div class="empty">
          <div class="empty__icon">${unsafeHTML(icon(panel.emptyIcon, 24, '#78716C'))}</div>
          <h2 class="empty__title">${panel.label}</h2>
          <p class="empty__desc">${panel.emptyMessage}</p>
        </div>
      `;
        }
        const cacheKey = `drawer:${drawer}`;
        let el = this._elementCache.get(cacheKey);
        if (!el) {
            el = document.createElement(panel.tag);
            this._elementCache.set(cacheKey, el);
        }
        forwardAdaptersToElement(el, getAdapterBindings(drawer, {
            dataAdapter: this.dataAdapter,
            workspaceAdapter: this.adapter,
        }));
        return el;
    }
    render() {
        if (!this.panel)
            return nothing;
        const desc = DRAWER_PANELS[this.panel];
        return html `
      <div class="header">
        <span class="header__icon">
          ${unsafeHTML(icon(desc.emptyIcon, 18, 'var(--primary-500, #3B82F6)'))}
        </span>
        <span class="header__title">${desc.label}</span>
        <button class="close"
                aria-label="Close ${desc.label}"
                @click=${this._handleClose}>
          ${unsafeHTML(icon('close', 16, 'currentColor'))}
        </button>
      </div>
      <div class="content">
        ${this._renderContent(desc, this.panel)}
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzWorkspaceDrawer.prototype, "panel", void 0);
__decorate([
    property({ type: Number })
], PhzWorkspaceDrawer.prototype, "width", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceDrawer.prototype, "adapter", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceDrawer.prototype, "dataAdapter", void 0);
PhzWorkspaceDrawer = __decorate([
    safeCustomElement('phz-workspace-drawer')
], PhzWorkspaceDrawer);
export { PhzWorkspaceDrawer };
//# sourceMappingURL=phz-workspace-drawer.js.map