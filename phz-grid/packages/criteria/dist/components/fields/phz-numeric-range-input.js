/**
 * @phozart/criteria — Numeric Range Input
 *
 * Min/Max inputs with optional dual-thumb slider and unit label.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { criteriaStyles } from '../../shared-styles.js';
let PhzNumericRangeInput = class PhzNumericRangeInput extends LitElement {
    constructor() {
        super(...arguments);
        this.config = {};
        this.value = null;
        this.disabled = false;
    }
    static { this.styles = [criteriaStyles, css `
    .phz-sc-nri { display: flex; flex-direction: column; gap: 6px; }
    .phz-sc-nri-slider-row { display: flex; gap: 4px; }
    .phz-sc-nri-slider-row input[type="range"] { flex: 1; }
  `]; }
    _fireChange(min, max) {
        this.dispatchEvent(new CustomEvent('range-change', {
            detail: { value: { min, max } },
            bubbles: true, composed: true,
        }));
    }
    _onMinInput(e) {
        const input = e.target;
        const min = Number(input.value);
        const max = this.value?.max ?? this.config.max ?? 100;
        this._fireChange(min, max);
    }
    _onMaxInput(e) {
        const input = e.target;
        const max = Number(input.value);
        const min = this.value?.min ?? this.config.min ?? 0;
        this._fireChange(min, max);
    }
    _onMinSlider(e) {
        const input = e.target;
        const min = Number(input.value);
        const max = this.value?.max ?? this.config.max ?? 100;
        this._fireChange(Math.min(min, max), max);
    }
    _onMaxSlider(e) {
        const input = e.target;
        const max = Number(input.value);
        const min = this.value?.min ?? this.config.min ?? 0;
        this._fireChange(min, Math.max(min, max));
    }
    render() {
        const cfgMin = this.config.min ?? 0;
        const cfgMax = this.config.max ?? 100;
        const step = this.config.step ?? 1;
        const curMin = this.value?.min ?? cfgMin;
        const curMax = this.value?.max ?? cfgMax;
        const unit = this.config.unit ?? '';
        const showSlider = this.config.showSlider !== false;
        return html `
      <div class="phz-sc-nri">
        <div class="phz-sc-range-row">
          <input
            type="number"
            class="phz-sc-range-input"
            .value=${String(curMin)}
            min=${cfgMin} max=${cfgMax} step=${step}
            ?disabled=${this.disabled}
            @change=${this._onMinInput}
            aria-label="Minimum value"
          />
          <span class="phz-sc-range-sep">–</span>
          <input
            type="number"
            class="phz-sc-range-input"
            .value=${String(curMax)}
            min=${cfgMin} max=${cfgMax} step=${step}
            ?disabled=${this.disabled}
            @change=${this._onMaxInput}
            aria-label="Maximum value"
          />
          ${unit ? html `<span class="phz-sc-range-unit">${unit}</span>` : nothing}
        </div>
        ${showSlider ? html `
          <div class="phz-sc-nri-slider-row">
            <input
              type="range"
              class="phz-sc-slider"
              .value=${String(curMin)}
              min=${cfgMin} max=${cfgMax} step=${step}
              ?disabled=${this.disabled}
              @input=${this._onMinSlider}
              aria-label="Minimum slider"
            />
            <input
              type="range"
              class="phz-sc-slider"
              .value=${String(curMax)}
              min=${cfgMin} max=${cfgMax} step=${step}
              ?disabled=${this.disabled}
              @input=${this._onMaxSlider}
              aria-label="Maximum slider"
            />
          </div>
        ` : nothing}
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzNumericRangeInput.prototype, "config", void 0);
__decorate([
    property({ type: Object })
], PhzNumericRangeInput.prototype, "value", void 0);
__decorate([
    property({ type: Boolean })
], PhzNumericRangeInput.prototype, "disabled", void 0);
PhzNumericRangeInput = __decorate([
    customElement('phz-numeric-range-input')
], PhzNumericRangeInput);
export { PhzNumericRangeInput };
//# sourceMappingURL=phz-numeric-range-input.js.map