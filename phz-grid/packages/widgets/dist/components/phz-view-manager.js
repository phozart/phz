/**
 * @phozart/phz-widgets — View Manager
 *
 * User saved view CRUD: save, load, rename, delete, set as default.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
let PhzViewManager = class PhzViewManager extends LitElement {
    constructor() {
        super(...arguments);
        this.views = [];
        this.sourceType = '';
        this.sourceId = '';
        this.isRenaming = false;
        this.renameValue = '';
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }

      .view-manager {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .view-select {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 13px;
        background: white;
        color: #1C1917;
        min-width: 160px;
      }

      .view-btn {
        padding: 6px 12px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        background: white;
        color: #44403C;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .view-btn:hover { background: #FAFAF9; }
      .view-btn--primary { background: #3B82F6; color: white; border-color: #3B82F6; }
      .view-btn--primary:hover { background: #2563EB; }
      .view-btn--danger { color: #DC2626; }
      .view-btn--danger:hover { background: #FEF2F2; }

      .view-default-badge {
        font-size: 10px;
        background: #F0FDF4;
        color: #16A34A;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 600;
      }
    `,
    ]; }
    handleViewChange(e) {
        const select = e.target;
        this.dispatchEvent(new CustomEvent('view-load', {
            bubbles: true, composed: true,
            detail: { viewId: select.value },
        }));
    }
    handleSave() {
        this.dispatchEvent(new CustomEvent('view-save', {
            bubbles: true, composed: true,
            detail: { sourceType: this.sourceType, sourceId: this.sourceId },
        }));
    }
    handleDelete() {
        if (!this.activeViewId)
            return;
        this.dispatchEvent(new CustomEvent('view-delete', {
            bubbles: true, composed: true,
            detail: { viewId: this.activeViewId },
        }));
    }
    handleSetDefault() {
        if (!this.activeViewId)
            return;
        this.dispatchEvent(new CustomEvent('view-set-default', {
            bubbles: true, composed: true,
            detail: { viewId: this.activeViewId },
        }));
    }
    render() {
        return html `
      <div class="view-manager" role="toolbar" aria-label="View Manager">
        <select class="view-select"
                .value=${this.activeViewId ?? ''}
                @change=${this.handleViewChange}
                aria-label="Select view">
          <option value="">Default View</option>
          ${this.views.map(v => html `
            <option value=${v.id}>
              ${v.name ?? `View ${v.id}`}
              ${v.isDefault ? ' (Default)' : ''}
            </option>
          `)}
        </select>

        <button class="view-btn view-btn--primary" @click=${this.handleSave}
                aria-label="Save current view">
          Save
        </button>

        ${this.activeViewId ? html `
          <button class="view-btn" @click=${this.handleSetDefault}
                  aria-label="Set as default view">
            Set Default
          </button>
          <button class="view-btn view-btn--danger" @click=${this.handleDelete}
                  aria-label="Delete view">
            Delete
          </button>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzViewManager.prototype, "views", void 0);
__decorate([
    property({ type: String })
], PhzViewManager.prototype, "activeViewId", void 0);
__decorate([
    property({ type: String })
], PhzViewManager.prototype, "sourceType", void 0);
__decorate([
    property({ type: String })
], PhzViewManager.prototype, "sourceId", void 0);
__decorate([
    state()
], PhzViewManager.prototype, "isRenaming", void 0);
__decorate([
    state()
], PhzViewManager.prototype, "renameValue", void 0);
PhzViewManager = __decorate([
    customElement('phz-view-manager')
], PhzViewManager);
export { PhzViewManager };
//# sourceMappingURL=phz-view-manager.js.map