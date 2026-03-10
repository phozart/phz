/**
 * <phz-workspace-selector-bar> — Artifact selector and back navigation
 *
 * Shows the current artifact icon + label, back button, dirty indicator,
 * and a recent artifacts dropdown.
 *
 * Events:
 *   back — back navigation requested
 *   recent-select — { id, type, name } — recent artifact clicked
 *   toggle-data-panel — data panel expand/collapse requested
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { icon } from '../styles/icons.js';
import { VIEW_TYPE_ICON } from '../workspace-config.js';
let PhzWorkspaceSelectorBar = class PhzWorkspaceSelectorBar extends LitElement {
    constructor() {
        super(...arguments);
        this.canGoBack = false;
        this.isDirty = false;
        this.dataPanelCollapsed = false;
        this.recentArtifacts = [];
        this._dropdownOpen = false;
        this._bodyClickHandler = () => {
            this._dropdownOpen = false;
        };
    }
    static { this.TAG = 'phz-workspace-selector-bar'; }
    static { this.styles = css `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      height: 44px;
      background: var(--bg-subtle, #FAF9F7);
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      padding: 0 12px;
      gap: 8px;
      flex-shrink: 0;
    }

    .back {
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
      flex-shrink: 0;
    }

    .back:hover {
      background: var(--bg-muted, #F5F5F4);
      color: var(--text-primary, #1C1917);
    }

    .back:disabled { opacity: 0.3; cursor: default; }

    .back:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .icon {
      display: flex;
      align-items: center;
      color: var(--text-muted, #78716C);
      flex-shrink: 0;
    }

    .icon svg { display: block; }

    .label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1C1917);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .dirty {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--warning-500, #F59E0B);
      flex-shrink: 0;
    }

    .sep {
      width: 1px;
      height: 20px;
      background: var(--border-default, #E7E5E4);
      flex-shrink: 0;
    }

    .dropdown-btn {
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
      flex-shrink: 0;
    }

    .dropdown-btn:hover {
      background: var(--bg-muted, #F5F5F4);
      color: var(--text-primary, #1C1917);
    }

    .dropdown-btn:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .expand-btn {
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
      flex-shrink: 0;
    }

    .expand-btn:hover {
      background: var(--bg-muted, #F5F5F4);
      color: var(--text-primary, #1C1917);
    }

    /* ── Recent Dropdown ── */
    .recent {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: var(--bg-base, #FEFDFB);
      border: 1px solid var(--border-default, #E7E5E4);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      z-index: 200;
      min-width: 260px;
      max-width: 360px;
      padding: 4px;
    }

    .recent__header {
      padding: 8px 12px 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted, #78716C);
    }

    .recent__item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: none;
      background: transparent;
      color: var(--text-primary, #1C1917);
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      width: 100%;
      text-align: left;
    }

    .recent__item:hover {
      background: var(--bg-muted, #F5F5F4);
    }

    .recent__item:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .recent__item svg { display: block; flex-shrink: 0; }

    .recent__empty {
      padding: 16px 12px;
      font-size: 12px;
      color: var(--text-muted, #78716C);
      text-align: center;
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._bodyClickHandler);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._bodyClickHandler);
    }
    _handleBack() {
        this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
    }
    _handleToggleDropdown(e) {
        e.stopPropagation();
        this._dropdownOpen = !this._dropdownOpen;
    }
    _handleRecentSelect(artifact) {
        this._dropdownOpen = false;
        this.dispatchEvent(new CustomEvent('recent-select', {
            bubbles: true, composed: true,
            detail: { id: artifact.id, type: artifact.type, name: artifact.name },
        }));
    }
    _handleToggleDataPanel() {
        this.dispatchEvent(new CustomEvent('toggle-data-panel', { bubbles: true, composed: true }));
    }
    render() {
        const view = this.view;
        if (!view)
            return nothing;
        const hasRecents = this.recentArtifacts.length > 0;
        return html `
      ${this.dataPanelCollapsed ? html `
        <button class="expand-btn"
                title="Show data panel"
                aria-label="Expand data panel"
                @click=${this._handleToggleDataPanel}>
          ${unsafeHTML(icon('sidebarExpand', 14, 'currentColor'))}
        </button>
        <div class="sep"></div>
      ` : nothing}

      <button class="back"
              title="Back"
              aria-label="Navigate back"
              ?disabled=${!this.canGoBack}
              @click=${this._handleBack}>
        ${unsafeHTML(icon('arrowLeft', 16, 'currentColor'))}
      </button>

      <span class="icon">
        ${unsafeHTML(icon(VIEW_TYPE_ICON[view.type] ?? 'catalog', 16, 'currentColor'))}
      </span>
      <span class="label">${view.label}</span>

      ${this.isDirty ? html `<span class="dirty" title="Unsaved changes"></span>` : nothing}

      ${hasRecents ? html `
        <div class="sep"></div>
        <div style="position: relative; display: inline-flex;">
          <button class="dropdown-btn"
                  title="Recent artifacts"
                  aria-label="Recent artifacts"
                  aria-haspopup="true"
                  aria-expanded="${this._dropdownOpen ? 'true' : 'false'}"
                  @click=${(e) => this._handleToggleDropdown(e)}>
            ${unsafeHTML(icon('chevronDown', 14, 'currentColor'))}
          </button>

          ${this._dropdownOpen ? html `
            <div class="recent"
                 @click=${(e) => e.stopPropagation()}
                 @keydown=${(e) => {
            if (e.key === 'Escape')
                this._dropdownOpen = false;
        }}>
              <div class="recent__header">Recent</div>
              ${this.recentArtifacts.map(artifact => html `
                <button class="recent__item"
                        @click=${() => this._handleRecentSelect(artifact)}>
                  ${unsafeHTML(icon(VIEW_TYPE_ICON[artifact.type] ?? 'catalog', 14, 'currentColor'))}
                  ${artifact.name}
                </button>
              `)}
            </div>
          ` : nothing}
        </div>
      ` : nothing}
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzWorkspaceSelectorBar.prototype, "view", void 0);
__decorate([
    property({ type: Boolean })
], PhzWorkspaceSelectorBar.prototype, "canGoBack", void 0);
__decorate([
    property({ type: Boolean })
], PhzWorkspaceSelectorBar.prototype, "isDirty", void 0);
__decorate([
    property({ type: Boolean })
], PhzWorkspaceSelectorBar.prototype, "dataPanelCollapsed", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceSelectorBar.prototype, "recentArtifacts", void 0);
__decorate([
    state()
], PhzWorkspaceSelectorBar.prototype, "_dropdownOpen", void 0);
PhzWorkspaceSelectorBar = __decorate([
    safeCustomElement('phz-workspace-selector-bar')
], PhzWorkspaceSelectorBar);
export { PhzWorkspaceSelectorBar };
//# sourceMappingURL=phz-workspace-selector-bar.js.map