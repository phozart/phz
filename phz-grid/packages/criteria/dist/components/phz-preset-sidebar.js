/**
 * @phozart/phz-criteria — Preset Sidebar
 *
 * Vertical list of saved presets grouped by scope (Shared, Personal).
 * Used inside the expanded modal sidebar.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { criteriaStyles } from '../shared-styles.js';
let PhzPresetSidebar = class PhzPresetSidebar extends LitElement {
    constructor() {
        super(...arguments);
        this.presets = [];
        this.activePresetId = null;
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; }
  `]; }
    _select(preset) {
        this.dispatchEvent(new CustomEvent('preset-select', {
            detail: { preset },
            bubbles: true, composed: true,
        }));
    }
    render() {
        const shared = (this.presets ?? []).filter(p => p.scope === 'shared');
        const personal = (this.presets ?? []).filter(p => p.scope === 'personal');
        return html `
      <div class="phz-sc-preset-sb">
        ${shared.length > 0 ? html `
          <div class="phz-sc-preset-sb-group">Shared</div>
          ${shared.map(p => html `
            <button
              class="phz-sc-preset-sb-item ${p.id === this.activePresetId ? 'phz-sc-preset-sb-item--active' : ''}"
              @click=${() => this._select(p)}
            >
              ${p.name}
              <span class="phz-sc-preset-badge phz-sc-preset-badge--shared">shared</span>
            </button>
          `)}
        ` : nothing}
        ${personal.length > 0 ? html `
          <div class="phz-sc-preset-sb-group">Personal</div>
          ${personal.map(p => html `
            <button
              class="phz-sc-preset-sb-item ${p.id === this.activePresetId ? 'phz-sc-preset-sb-item--active' : ''}"
              @click=${() => this._select(p)}
            >
              ${p.name}
              <span class="phz-sc-preset-badge phz-sc-preset-badge--personal">personal</span>
            </button>
          `)}
        ` : nothing}
        ${(this.presets ?? []).length === 0 ? html `
          <div style="padding: 16px; font-size: 12px; color: #A8A29E; text-align: center;">No saved presets</div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzPresetSidebar.prototype, "presets", void 0);
__decorate([
    property()
], PhzPresetSidebar.prototype, "activePresetId", void 0);
PhzPresetSidebar = __decorate([
    customElement('phz-preset-sidebar')
], PhzPresetSidebar);
export { PhzPresetSidebar };
//# sourceMappingURL=phz-preset-sidebar.js.map