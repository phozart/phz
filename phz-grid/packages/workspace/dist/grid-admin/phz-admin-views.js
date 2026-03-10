/**
 * @phozart/phz-grid-admin — <phz-admin-views>
 *
 * Full CRUD management tab for saved views within the grid admin panel.
 * Lists views, allows rename, delete, set default.
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
import { adminBaseStyles } from './shared-styles.js';
let PhzAdminViews = class PhzAdminViews extends LitElement {
    constructor() {
        super(...arguments);
        this.views = [];
        this._renamingId = null;
        this._renameValue = '';
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      :host { display: block; }

      .views-list {
        display: flex; flex-direction: column; gap: 8px;
      }

      .view-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px; border: 1px solid #E7E5E4; border-radius: 8px;
        background: #FAFAF9;
      }
      .view-row.active { border-color: #F59E0B; background: #FEF3C7; }

      .view-name { flex: 1; font-size: 14px; font-weight: 500; }

      .view-actions { display: flex; gap: 4px; }

      .action-btn {
        padding: 4px 8px; border: 1px solid #D6D3D1; border-radius: 6px;
        background: white; cursor: pointer; font-size: 12px;
        color: #57534E; transition: all 0.15s ease;
      }
      .action-btn:hover { background: #F5F5F4; color: #1C1917; }
      .action-btn.danger:hover { background: #FEE2E2; color: #DC2626; border-color: #FCA5A5; }

      .default-badge {
        font-size: 11px; font-weight: 600; color: #92400E;
        background: #FEF3C7; padding: 2px 8px; border-radius: 4px;
      }

      .empty-state {
        text-align: center; padding: 32px; color: #78716C;
        font-size: 14px;
      }

      .section-header {
        font-size: 14px; font-weight: 600; color: #1C1917;
        margin-bottom: 16px;
      }
    `,
    ]; }
    render() {
        return html `
      <div class="section-header">Saved Views</div>
      ${(this.views ?? []).length === 0
            ? html `<div class="empty-state">No saved views. Save a view from the grid toolbar.</div>`
            : html `
          <div class="views-list" role="list" aria-label="Saved views">
            ${(this.views ?? []).map(v => this._renderViewRow(v))}
          </div>
        `}
    `;
    }
    _renderViewRow(view) {
        const isRenaming = this._renamingId === view.id;
        return html `
      <div class="view-row ${view.isActive ? 'active' : ''}" role="listitem">
        ${isRenaming
            ? html `
            <input
              type="text"
              .value=${this._renameValue}
              @input=${(e) => { this._renameValue = e.target.value; }}
              @keydown=${(e) => {
                if (e.key === 'Enter')
                    this._confirmRename(view.id);
                if (e.key === 'Escape') {
                    this._renamingId = null;
                }
            }}
              @blur=${() => this._confirmRename(view.id)}
              style="flex: 1; font-size: 14px; padding: 4px 8px; border: 1px solid #D6D3D1; border-radius: 4px;"
            />
          `
            : html `<span class="view-name">${view.name}</span>`}
        ${view.isDefault ? html `<span class="default-badge">Default</span>` : nothing}
        <div class="view-actions">
          ${!isRenaming ? html `
            <button class="action-btn" @click=${() => this._startRename(view)} title="Rename">Rename</button>
            <button class="action-btn" @click=${() => this._setDefault(view)} title="Set as default">
              ${view.isDefault ? 'Unset Default' : 'Set Default'}
            </button>
            <button class="action-btn danger" @click=${() => this._deleteView(view)} title="Delete">Delete</button>
          ` : nothing}
        </div>
      </div>
    `;
    }
    _startRename(view) {
        this._renamingId = view.id;
        this._renameValue = view.name;
    }
    _confirmRename(id) {
        if (this._renameValue.trim()) {
            this.dispatchEvent(new CustomEvent('view-rename', {
                detail: { viewId: id, name: this._renameValue.trim() },
                bubbles: true, composed: true,
            }));
        }
        this._renamingId = null;
    }
    _setDefault(view) {
        this.dispatchEvent(new CustomEvent('view-set-default', {
            detail: { viewId: view.isDefault ? null : view.id },
            bubbles: true, composed: true,
        }));
    }
    _deleteView(view) {
        this.dispatchEvent(new CustomEvent('view-delete', {
            detail: { viewId: view.id },
            bubbles: true, composed: true,
        }));
    }
};
__decorate([
    property({ attribute: false })
], PhzAdminViews.prototype, "views", void 0);
__decorate([
    state()
], PhzAdminViews.prototype, "_renamingId", void 0);
__decorate([
    state()
], PhzAdminViews.prototype, "_renameValue", void 0);
PhzAdminViews = __decorate([
    safeCustomElement('phz-admin-views')
], PhzAdminViews);
export { PhzAdminViews };
//# sourceMappingURL=phz-admin-views.js.map