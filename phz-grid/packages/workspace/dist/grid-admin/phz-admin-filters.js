/**
 * @phozart/phz-grid-admin — Filter Preset Manager
 *
 * Manage filter presets: create, apply, duplicate, delete.
 * Embeddable component.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
let PhzAdminFilters = class PhzAdminFilters extends LitElement {
    constructor() {
        super(...arguments);
        this.presets = {};
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      .preset-list { display: flex; flex-direction: column; gap: 8px; }
      .preset-item {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 12px;
        box-shadow: var(--phz-admin-shadow-sm);
        background: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .preset-item:hover { transform: translateY(-2px); box-shadow: var(--phz-admin-shadow-md); }
      .preset-name { font-size: 13px; font-weight: 500; color: #1C1917; }
      .preset-count { font-size: 12px; color: #78716C; }
      .preset-actions { display: flex; gap: 4px; }
    `,
    ]; }
    handleApply(name) {
        this.dispatchEvent(new CustomEvent('preset-apply', {
            bubbles: true, composed: true, detail: { name },
        }));
    }
    handleDelete(name) {
        this.dispatchEvent(new CustomEvent('presets-change', {
            bubbles: true, composed: true, detail: { action: 'delete', name },
        }));
    }
    handleDuplicate(name) {
        this.dispatchEvent(new CustomEvent('presets-change', {
            bubbles: true, composed: true, detail: { action: 'duplicate', name },
        }));
    }
    handleAdd() {
        this.dispatchEvent(new CustomEvent('presets-change', {
            bubbles: true, composed: true, detail: { action: 'add' },
        }));
    }
    render() {
        const entries = Object.entries(this.presets);
        return html `
      <div>
        <div class="preset-list" role="list">
          ${entries.map(([name, preset]) => html `
            <div class="preset-item ${this.activePreset === name ? 'phz-admin-list-item--active' : ''}"
                 role="listitem">
              <div>
                <span class="preset-name">${preset.name}</span>
                <span class="preset-count">${preset.filters.length} filter${preset.filters.length !== 1 ? 's' : ''}</span>
              </div>
              <div class="preset-actions">
                <button class="phz-admin-btn" @click=${() => this.handleApply(name)}>Apply</button>
                <button class="phz-admin-btn" @click=${() => this.handleDuplicate(name)}>Duplicate</button>
                <button class="phz-admin-btn phz-admin-btn--danger" @click=${() => this.handleDelete(name)}>Delete</button>
              </div>
            </div>
          `)}
        </div>
        <button class="phz-admin-btn phz-admin-btn--primary" style="margin-top: 8px;" @click=${this.handleAdd}>
          + New Preset
        </button>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzAdminFilters.prototype, "presets", void 0);
__decorate([
    property({ type: String })
], PhzAdminFilters.prototype, "activePreset", void 0);
PhzAdminFilters = __decorate([
    safeCustomElement('phz-admin-filters')
], PhzAdminFilters);
export { PhzAdminFilters };
//# sourceMappingURL=phz-admin-filters.js.map