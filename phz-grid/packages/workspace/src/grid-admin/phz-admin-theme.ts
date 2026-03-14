/**
 * @phozart/grid-admin — Theme / Styling Editor
 *
 * Color scheme toggle, token editors, density presets, preview.
 */

import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';

type Density = 'comfortable' | 'compact' | 'dense';
type ColorScheme = 'light' | 'dark' | 'auto';

@safeCustomElement('phz-admin-theme')
export class PhzAdminTheme extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
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
  ];

  @property({ type: String }) colorScheme: ColorScheme = 'light';
  @property({ type: String }) density: Density = 'compact';
  @property({ type: Object }) tokens: Record<string, string> = {};

  private handleSchemeChange(scheme: ColorScheme) {
    this.dispatchEvent(new CustomEvent('theme-change', {
      bubbles: true, composed: true,
      detail: { property: 'colorScheme', value: scheme },
    }));
  }

  private handleDensityChange(d: Density) {
    this.dispatchEvent(new CustomEvent('theme-change', {
      bubbles: true, composed: true,
      detail: { property: 'density', value: d },
    }));
  }

  private handleTokenChange(token: string, value: string) {
    this.dispatchEvent(new CustomEvent('theme-change', {
      bubbles: true, composed: true,
      detail: { property: 'token', token, value },
    }));
  }

  render() {
    const schemes: ColorScheme[] = ['light', 'dark', 'auto'];
    const densities: Density[] = ['comfortable', 'compact', 'dense'];

    return html`
      <div>
        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Color Scheme</h4>
          <div class="scheme-group">
            ${schemes.map(s => html`
              <button class="density-btn ${this.colorScheme === s ? 'density-btn--active' : ''}"
                      @click=${() => this.handleSchemeChange(s)}>${s}</button>
            `)}
          </div>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Density</h4>
          <div class="density-group">
            ${densities.map(d => html`
              <button class="density-btn ${this.density === d ? 'density-btn--active' : ''}"
                      @click=${() => this.handleDensityChange(d)}>${d}</button>
            `)}
          </div>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Custom Colors</h4>
          ${Object.entries(this.tokens ?? {}).map(([key, val]) => html`
            <div class="color-row">
              <span class="color-label">${key}</span>
              <input type="color" .value=${val}
                     @input=${(e: Event) => this.handleTokenChange(key, (e.target as HTMLInputElement).value)}>
              <input class="phz-admin-input" style="width:80px;" .value=${val}
                     @input=${(e: Event) => this.handleTokenChange(key, (e.target as HTMLInputElement).value)}>
            </div>
          `)}
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-admin-theme': PhzAdminTheme; }
}
