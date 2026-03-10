/**
 * @phozart/phz-widgets -- Dashboard Themes
 *
 * Theme system with light, dark, and high-contrast built-in themes.
 * Applies CSS custom properties for surface, text, border, accent,
 * status colors, and chart palettes.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from './shared-styles.js';
// -- Built-in themes --
export const lightTheme = {
    name: 'light',
    tokens: {
        surface: '#FFFFFF',
        surfaceAlt: '#FAFAF9',
        text: '#1C1917',
        textMuted: '#78716C',
        border: '#E7E5E4',
        accent: '#3B82F6',
        success: '#16A34A',
        warning: '#D97706',
        critical: '#DC2626',
        chartPalette: ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#EAB308', '#6366F1', '#10B981'],
    },
};
export const darkTheme = {
    name: 'dark',
    tokens: {
        surface: '#1C1917',
        surfaceAlt: '#292524',
        text: '#FAFAF9',
        textMuted: '#A8A29E',
        border: '#44403C',
        accent: '#60A5FA',
        success: '#4ADE80',
        warning: '#FBBF24',
        critical: '#F87171',
        chartPalette: ['#60A5FA', '#A78BFA', '#F472B6', '#FB923C', '#2DD4BF', '#FACC15', '#818CF8', '#34D399'],
    },
};
export const highContrastTheme = {
    name: 'high-contrast',
    tokens: {
        surface: '#FFFFFF',
        surfaceAlt: '#F5F5F5',
        text: '#000000',
        textMuted: '#333333',
        border: '#000000',
        accent: '#0000EE',
        success: '#006600',
        warning: '#CC6600',
        critical: '#CC0000',
        chartPalette: ['#0000EE', '#6600CC', '#CC0066', '#CC6600', '#006666', '#666600', '#3333CC', '#006633'],
    },
};
// -- Theme application --
export function applyTheme(element, theme) {
    const { tokens } = theme;
    element.style.setProperty('--phz-surface', tokens.surface);
    element.style.setProperty('--phz-surface-alt', tokens.surfaceAlt);
    element.style.setProperty('--phz-text', tokens.text);
    element.style.setProperty('--phz-text-muted', tokens.textMuted);
    element.style.setProperty('--phz-border', tokens.border);
    element.style.setProperty('--phz-accent', tokens.accent);
    element.style.setProperty('--phz-success', tokens.success);
    element.style.setProperty('--phz-warning', tokens.warning);
    element.style.setProperty('--phz-critical', tokens.critical);
    tokens.chartPalette.forEach((color, i) => {
        element.style.setProperty(`--phz-chart-${i}`, color);
    });
}
export function detectSystemTheme() {
    if (typeof globalThis.matchMedia !== 'function')
        return 'light';
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
export function resolveTheme(name) {
    switch (name) {
        case 'dark': return darkTheme;
        case 'high-contrast': return highContrastTheme;
        case 'system': return detectSystemTheme() === 'dark' ? darkTheme : lightTheme;
        default: return lightTheme;
    }
}
// -- Theme Switcher Component --
let PhzThemeSwitcher = class PhzThemeSwitcher extends LitElement {
    constructor() {
        super(...arguments);
        this.selected = 'light';
        this._onSystemChange = () => {
            if (this.selected === 'system') {
                this._emitThemeChange('system');
            }
        };
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: inline-block; }

      .switcher {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      label {
        font-size: 12px;
        font-weight: 600;
        color: var(--phz-text-muted, #78716C);
      }

      select {
        padding: 4px 8px;
        border: 1px solid var(--phz-border, #D6D3D1);
        border-radius: 6px;
        font-size: 12px;
        background: var(--phz-surface, white);
        color: var(--phz-text, #1C1917);
        cursor: pointer;
      }

      select:focus-visible {
        outline: 2px solid var(--phz-accent, #3B82F6);
        outline-offset: 2px;
      }

      @media (forced-colors: active) {
        select {
          border: 2px solid ButtonText;
          forced-color-adjust: none;
        }
      }
    `,
    ]; }
    connectedCallback() {
        super.connectedCallback();
        if (this.selected === 'system') {
            this._watchSystem();
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._unwatchSystem();
    }
    _watchSystem() {
        if (typeof globalThis.matchMedia !== 'function')
            return;
        this._systemListener = globalThis.matchMedia('(prefers-color-scheme: dark)');
        this._systemListener.addEventListener('change', this._onSystemChange);
    }
    _unwatchSystem() {
        if (this._systemListener) {
            this._systemListener.removeEventListener('change', this._onSystemChange);
            this._systemListener = undefined;
        }
    }
    _onSelect(e) {
        const value = e.target.value;
        this.selected = value;
        if (value === 'system') {
            this._watchSystem();
        }
        else {
            this._unwatchSystem();
        }
        this._emitThemeChange(value);
    }
    _emitThemeChange(themeName) {
        const theme = resolveTheme(themeName);
        this.dispatchEvent(new CustomEvent('theme-change', {
            detail: { theme, themeName },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="switcher">
        <label for="theme-select" id="theme-label">Theme</label>
        <select id="theme-select"
                aria-labelledby="theme-label"
                .value=${this.selected}
                @change=${this._onSelect}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High Contrast</option>
          <option value="system">System</option>
        </select>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzThemeSwitcher.prototype, "selected", void 0);
__decorate([
    state()
], PhzThemeSwitcher.prototype, "_systemListener", void 0);
PhzThemeSwitcher = __decorate([
    customElement('phz-theme-switcher')
], PhzThemeSwitcher);
export { PhzThemeSwitcher };
//# sourceMappingURL=themes.js.map