/**
 * <phz-workspace-data-panel> — Collapsible side panel (data source browser)
 *
 * Shows the field browser (phz-data-source-panel). Only visible for
 * non-authoring views (catalog, data-sources) — authoring editors
 * have their own integrated data panels.
 *
 * Events:
 *   toggle — panel collapsed/expanded
 *   tab-change — { tab: DataPanelTab }
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
const SUB_TAB_LABELS = {
    data: 'Data',
};
let PhzWorkspaceDataPanel = class PhzWorkspaceDataPanel extends LitElement {
    constructor() {
        super(...arguments);
        this.collapsed = false;
        this.activeTab = 'data';
        this.availableTabs = ['data'];
        this._panelCache = new Map();
    }
    static { this.TAG = 'phz-workspace-data-panel'; }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      background: var(--bg-base, #FEFDFB);
      flex-shrink: 0;
      overflow: hidden;
      transition: width 0.2s ease;
    }

    :host([collapsed]) { width: 0 !important; }

    .header {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      gap: 8px;
      flex-shrink: 0;
    }

    .header__title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted, #78716C);
      flex: 1;
    }

    .header__toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--text-muted, #78716C);
      cursor: pointer;
      border-radius: 4px;
    }

    .header__toggle:hover {
      background: var(--bg-muted, #F5F5F4);
      color: var(--text-primary, #1C1917);
    }

    /* ── Sub-Tabs ── */
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      flex-shrink: 0;
      background: var(--bg-subtle, #FAF9F7);
    }

    .tab {
      flex: 1;
      padding: 8px 4px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #57534E);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      text-align: center;
      position: relative;
    }

    .tab:hover {
      color: var(--text-primary, #1C1917);
      background: var(--bg-muted, #F5F5F4);
    }

    .tab--active { color: var(--primary-600, #2563EB); }

    .tab--active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 4px;
      right: 4px;
      height: 2px;
      background: var(--primary-500, #3B82F6);
    }

    .tab:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .content {
      flex: 1;
      overflow: auto;
    }

    /* ── Empty State ── */
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 12px;
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

    .empty__desc {
      font-size: 13px;
      color: var(--text-muted, #78716C);
      margin: 8px 0 0;
    }

    .empty__title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1C1917);
      margin: 0 0 4px;
    }

    @media (max-width: 768px) {
      :host { display: none; }
    }
  `; }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._panelCache.clear();
    }
    _handleToggle() {
        this.dispatchEvent(new CustomEvent('toggle', { bubbles: true, composed: true }));
    }
    _handleTabClick(tab) {
        this.dispatchEvent(new CustomEvent('tab-change', {
            bubbles: true, composed: true,
            detail: { tab },
        }));
    }
    _renderContent() {
        return this._renderDataContent();
    }
    _renderDataContent() {
        const tag = 'phz-data-source-panel';
        const isRegistered = typeof customElements !== 'undefined' && customElements.get(tag);
        if (!isRegistered) {
            return html `
        <div class="empty">
          <div class="empty__icon">${unsafeHTML(icon('sourceDatabase', 24, '#78716C'))}</div>
          <p class="empty__desc">Connect a data source to browse fields</p>
        </div>
      `;
        }
        let el = this._panelCache.get('__data__');
        if (!el) {
            el = document.createElement(tag);
            this._panelCache.set('__data__', el);
        }
        if (this.dataAdapter) {
            el.adapter = this.dataAdapter;
        }
        return el;
    }
    render() {
        if (this.collapsed)
            return nothing;
        const showSubTabs = this.availableTabs.length > 1;
        return html `
      <div class="header">
        <span class="header__title">
          ${showSubTabs ? SUB_TAB_LABELS[this.activeTab] : 'Data'}
        </span>
        <button class="header__toggle"
                title="Collapse data panel"
                aria-label="Collapse data panel"
                @click=${this._handleToggle}>
          ${unsafeHTML(icon('sidebarCollapse', 14, 'currentColor'))}
        </button>
      </div>

      ${showSubTabs ? html `
        <div class="tabs" role="tablist" aria-label="Data panel sections">
          ${this.availableTabs.map(tab => html `
            <button class="tab ${this.activeTab === tab ? 'tab--active' : ''}"
                    role="tab"
                    id="ws-dpanel-tab-${tab}"
                    aria-controls="ws-dpanel-content"
                    aria-selected="${this.activeTab === tab ? 'true' : 'false'}"
                    @click=${() => this._handleTabClick(tab)}>
              ${SUB_TAB_LABELS[tab]}
            </button>
          `)}
        </div>
      ` : nothing}

      <div class="content"
           role="${showSubTabs ? 'tabpanel' : nothing}"
           id="${showSubTabs ? 'ws-dpanel-content' : nothing}"
           aria-labelledby="${showSubTabs ? `ws-dpanel-tab-${this.activeTab}` : nothing}">
        ${this._renderContent()}
      </div>
    `;
    }
};
__decorate([
    property({ type: Boolean, reflect: true })
], PhzWorkspaceDataPanel.prototype, "collapsed", void 0);
__decorate([
    property({ type: String })
], PhzWorkspaceDataPanel.prototype, "activeTab", void 0);
__decorate([
    property({ type: Array })
], PhzWorkspaceDataPanel.prototype, "availableTabs", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceDataPanel.prototype, "view", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceDataPanel.prototype, "adapter", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceDataPanel.prototype, "dataAdapter", void 0);
PhzWorkspaceDataPanel = __decorate([
    safeCustomElement('phz-workspace-data-panel')
], PhzWorkspaceDataPanel);
export { PhzWorkspaceDataPanel };
//# sourceMappingURL=phz-workspace-data-panel.js.map