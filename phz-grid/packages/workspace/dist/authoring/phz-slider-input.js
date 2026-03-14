/**
 * @phozart/workspace — Slider Input Micro-Component
 *
 * Range input with numeric readout and label.
 * Fires 'value-changed' event with { detail: { value: number } }.
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
let PhzSliderInput = class PhzSliderInput extends LitElement {
    constructor() {
        super(...arguments);
        this.value = 0;
        this.min = 0;
        this.max = 100;
        this.step = 1;
        this.label = '';
        this.suffix = '';
    }
    static { this.styles = css `
    :host { display: block; }
    .container { display: flex; align-items: center; gap: 8px; }
    .label { font-size: 12px; color: var(--phz-text-secondary, #6b7280); margin-bottom: 4px; }
    input[type="range"] {
      flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
      background: var(--phz-border, #d1d5db); border-radius: 2px; outline: none;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      border-radius: 50%; background: var(--phz-primary, #2563eb); cursor: pointer;
    }
    .readout {
      min-width: 40px; text-align: right; font-size: 12px;
      color: var(--phz-text-primary, #1c1917); font-variant-numeric: tabular-nums;
    }
  `; }
    _onChange(e) {
        const val = Number(e.target.value);
        this.value = val;
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: val },
            bubbles: true, composed: true,
        }));
    }
    render() {
        return html `
      ${this.label ? html `<div class="label">${this.label}</div>` : ''}
      <div class="container">
        <input type="range" .value=${String(this.value)}
          min="${this.min}" max="${this.max}" step="${this.step}"
          @input=${this._onChange} aria-label="${this.label}" />
        <span class="readout">${this.value}${this.suffix}</span>
      </div>
    `;
    }
};
__decorate([
    property({ type: Number })
], PhzSliderInput.prototype, "value", void 0);
__decorate([
    property({ type: Number })
], PhzSliderInput.prototype, "min", void 0);
__decorate([
    property({ type: Number })
], PhzSliderInput.prototype, "max", void 0);
__decorate([
    property({ type: Number })
], PhzSliderInput.prototype, "step", void 0);
__decorate([
    property({ type: String })
], PhzSliderInput.prototype, "label", void 0);
__decorate([
    property({ type: String })
], PhzSliderInput.prototype, "suffix", void 0);
PhzSliderInput = __decorate([
    safeCustomElement('phz-slider-input')
], PhzSliderInput);
export { PhzSliderInput };
//# sourceMappingURL=phz-slider-input.js.map