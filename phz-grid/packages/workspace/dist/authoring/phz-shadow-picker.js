/**
 * @phozart/phz-workspace — Shadow Picker Micro-Component
 *
 * 4-option visual selector (none/sm/md/lg) showing card previews.
 * Fires 'shadow-changed' event with { detail: { shadow: string } }.
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
export const SHADOW_VALUES = {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
};
let PhzShadowPicker = class PhzShadowPicker extends LitElement {
    constructor() {
        super(...arguments);
        this.value = 'sm';
        this.label = 'Shadow';
    }
    static { this.styles = css `
    :host { display: block; }
    .label { font-size: 12px; color: var(--phz-text-secondary, #6b7280); margin-bottom: 4px; }
    .options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .option {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 8px; border: 2px solid transparent; border-radius: 6px;
      cursor: pointer; background: none;
    }
    .option:hover { border-color: var(--phz-border, #d1d5db); }
    .option.selected { border-color: var(--phz-primary, #2563eb); }
    .preview {
      width: 32px; height: 24px; background: #fff; border-radius: 4px;
    }
    .option-label { font-size: 11px; color: var(--phz-text-secondary, #6b7280); }
  `; }
    _select(level) {
        this.value = level;
        this.dispatchEvent(new CustomEvent('shadow-changed', {
            detail: { shadow: level },
            bubbles: true, composed: true,
        }));
    }
    render() {
        return html `
      <div class="label">${this.label}</div>
      <div class="options" role="radiogroup" aria-label="${this.label}">
        ${Object.keys(SHADOW_VALUES).map(level => html `
          <button class="option ${this.value === level ? 'selected' : ''}"
            role="radio" aria-checked="${this.value === level}"
            @click=${() => this._select(level)}>
            <div class="preview" style="box-shadow: ${SHADOW_VALUES[level]}"></div>
            <span class="option-label">${level}</span>
          </button>
        `)}
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzShadowPicker.prototype, "value", void 0);
__decorate([
    property({ type: String })
], PhzShadowPicker.prototype, "label", void 0);
PhzShadowPicker = __decorate([
    safeCustomElement('phz-shadow-picker')
], PhzShadowPicker);
export { PhzShadowPicker };
//# sourceMappingURL=phz-shadow-picker.js.map