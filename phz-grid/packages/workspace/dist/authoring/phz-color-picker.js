/**
 * @phozart/phz-workspace — Color Picker Micro-Component
 *
 * 19-color swatch grid from design tokens + custom hex input.
 * Fires 'color-changed' event with { detail: { color: string } }.
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
export const SWATCH_COLORS = [
    '#1C1917', '#44403C', '#78716C', '#A8A29E', '#D6D3D1',
    '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#16A34A',
    '#059669', '#0D9488', '#0891B2', '#2563EB', '#4F46E5',
    '#7C3AED', '#9333EA', '#DB2777', '#FFFFFF',
];
let PhzColorPicker = class PhzColorPicker extends LitElement {
    constructor() {
        super(...arguments);
        this.value = '#1C1917';
        this.label = 'Color';
    }
    static { this.styles = css `
    :host { display: block; }
    .label { font-size: 12px; color: var(--phz-text-secondary, #6b7280); margin-bottom: 4px; }
    .swatches { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 8px; }
    .swatch {
      width: 24px; height: 24px; border-radius: 4px; border: 2px solid transparent;
      cursor: pointer; transition: border-color 0.15s;
    }
    .swatch:hover { border-color: var(--phz-primary, #2563eb); }
    .swatch.selected { border-color: var(--phz-primary, #2563eb); }
    .swatch[data-color="#FFFFFF"] { border: 1px solid #d1d5db; }
    .hex-input {
      width: 100%; padding: 4px 8px; border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px; font-size: 12px; font-family: monospace; box-sizing: border-box;
    }
  `; }
    _selectColor(color) {
        this.value = color;
        this.dispatchEvent(new CustomEvent('color-changed', {
            detail: { color },
            bubbles: true, composed: true,
        }));
    }
    _onHexInput(e) {
        const input = e.target;
        const hex = input.value.trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
            this._selectColor(hex);
        }
    }
    render() {
        return html `
      <div class="label">${this.label}</div>
      <div class="swatches" role="listbox" aria-label="${this.label}">
        ${SWATCH_COLORS.map(color => html `
          <button class="swatch ${this.value === color ? 'selected' : ''}"
            style="background: ${color}"
            data-color="${color}"
            role="option"
            aria-selected="${this.value === color}"
            aria-label="${color}"
            @click=${() => this._selectColor(color)}>
          </button>
        `)}
      </div>
      <input class="hex-input" type="text" .value=${this.value}
        @change=${this._onHexInput} aria-label="Hex color value" placeholder="#000000" />
    `;
    }
};
__decorate([
    property({ type: String })
], PhzColorPicker.prototype, "value", void 0);
__decorate([
    property({ type: String })
], PhzColorPicker.prototype, "label", void 0);
PhzColorPicker = __decorate([
    safeCustomElement('phz-color-picker')
], PhzColorPicker);
export { PhzColorPicker };
//# sourceMappingURL=phz-color-picker.js.map