/**
 * @phozart/phz-grid-admin — Theme / Styling Editor
 *
 * Color scheme toggle, token editors, density presets, preview.
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
let PhzAdminTheme = class PhzAdminTheme extends LitElement {
    constructor() {
        super(...arguments);
        this.colorScheme = 'light';
        this.density = 'compact';
        this.tokens = {};
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      .density-group {
        display: flex;
        gap: 4px;
      }
      .density-btn {
        flex: 1;
        padding: 8px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        background: white;
        color: #44403C;
        text-align: center;
      }
      .density-btn--active { background: #3B82F6; color: white; border-color: #3B82F6; }
      .color-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .color-label { font-size: 12px; color: #44403C; min-width: 100px; }
      .scheme-group { display: flex; gap: 4px; margin-bottom: 16px; }
    `,
    ]; }
    handleSchemeChange(scheme) {
        this.dispatchEvent(new CustomEvent('theme-change', {
            bubbles: true, composed: true,
            detail: { property: 'colorScheme', value: scheme },
        }));
    }
    handleDensityChange(d) {
        this.dispatchEvent(new CustomEvent('theme-change', {
            bubbles: true, composed: true,
            detail: { property: 'density', value: d },
        }));
    }
    handleTokenChange(token, value) {
        this.dispatchEvent(new CustomEvent('theme-change', {
            bubbles: true, composed: true,
            detail: { property: 'token', token, value },
        }));
    }
    render() {
        const schemes = ['light', 'dark', 'auto'];
        const densities = ['comfortable', 'compact', 'dense'];
        return html `
      <div>
        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Color Scheme</h4>
          <div class="scheme-group">
            ${schemes.map(s => html `
              <button class="density-btn ${this.colorScheme === s ? 'density-btn--active' : ''}"
                      @click=${() => this.handleSchemeChange(s)}>${s}</button>
            `)}
          </div>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Density</h4>
          <div class="density-group">
            ${densities.map(d => html `
              <button class="density-btn ${this.density === d ? 'density-btn--active' : ''}"
                      @click=${() => this.handleDensityChange(d)}>${d}</button>
            `)}
          </div>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Custom Colors</h4>
          ${Object.entries(this.tokens ?? {}).map(([key, val]) => html `
            <div class="color-row">
              <span class="color-label">${key}</span>
              <input type="color" .value=${val}
                     @input=${(e) => this.handleTokenChange(key, e.target.value)}>
              <input class="phz-admin-input" style="width:80px;" .value=${val}
                     @input=${(e) => this.handleTokenChange(key, e.target.value)}>
            </div>
          `)}
        </div>

      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzAdminTheme.prototype, "colorScheme", void 0);
__decorate([
    property({ type: String })
], PhzAdminTheme.prototype, "density", void 0);
__decorate([
    property({ type: Object })
], PhzAdminTheme.prototype, "tokens", void 0);
PhzAdminTheme = __decorate([
    safeCustomElement('phz-admin-theme')
], PhzAdminTheme);
export { PhzAdminTheme };
//# sourceMappingURL=phz-admin-theme.js.map