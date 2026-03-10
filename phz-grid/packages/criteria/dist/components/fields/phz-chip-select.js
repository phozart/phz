/**
 * @phozart/phz-criteria — Chip Select
 *
 * Multi-select pill-based selector. Each option renders as a toggleable chip.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { criteriaStyles } from '../../shared-styles.js';
let PhzChipSelect = class PhzChipSelect extends LitElement {
    constructor() {
        super(...arguments);
        this.options = [];
        this.value = [];
        this.disabled = false;
        this.selectionMode = undefined;
    }
    static { this.styles = [criteriaStyles, css `
    :host { display: block; }
  `]; }
    get _effectiveDisabled() {
        return this.disabled || this.selectionMode === 'none';
    }
    _toggle(optionValue) {
        if (this._effectiveDisabled)
            return;
        let newValue;
        if (this.selectionMode === 'single') {
            // Radio behavior: clicking active chip deselects, clicking inactive selects only that one
            newValue = (this.value ?? []).includes(optionValue) ? [] : [optionValue];
        }
        else {
            newValue = (this.value ?? []).includes(optionValue)
                ? (this.value ?? []).filter(v => v !== optionValue)
                : [...(this.value ?? []), optionValue];
        }
        this.dispatchEvent(new CustomEvent('chip-change', {
            detail: { value: newValue },
            bubbles: true, composed: true,
        }));
    }
    render() {
        const isDisabled = this._effectiveDisabled;
        return html `
      <div class="phz-sc-chip-sel" role="group">
        ${(this.options ?? []).map(opt => {
            const active = (this.value ?? []).includes(opt.value);
            return html `
            <button
              class="phz-sc-chip-sel-item ${active ? 'phz-sc-chip-sel-item--active' : ''} ${isDisabled ? 'phz-sc-chip-sel-item--disabled' : ''}"
              @click=${() => this._toggle(opt.value)}
              aria-pressed=${active ? 'true' : 'false'}
              ?disabled=${isDisabled}
            >${opt.label}</button>
          `;
        })}
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzChipSelect.prototype, "options", void 0);
__decorate([
    property({ type: Array })
], PhzChipSelect.prototype, "value", void 0);
__decorate([
    property({ type: Boolean })
], PhzChipSelect.prototype, "disabled", void 0);
__decorate([
    property({ type: String })
], PhzChipSelect.prototype, "selectionMode", void 0);
PhzChipSelect = __decorate([
    customElement('phz-chip-select')
], PhzChipSelect);
export { PhzChipSelect };
//# sourceMappingURL=phz-chip-select.js.map