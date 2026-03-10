/**
 * @phozart/phz-criteria — Numeric Range Input
 *
 * Min/Max inputs with optional dual-thumb slider and unit label.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { NumericRangeFieldConfig, NumericRangeValue } from '@phozart/phz-core';
import { criteriaStyles } from '../../shared-styles.js';

@customElement('phz-numeric-range-input')
export class PhzNumericRangeInput extends LitElement {
  static styles = [criteriaStyles, css`
    .phz-sc-nri { display: flex; flex-direction: column; gap: 6px; }
    .phz-sc-nri-slider-row { display: flex; gap: 4px; }
    .phz-sc-nri-slider-row input[type="range"] { flex: 1; }
  `];

  @property({ type: Object }) config: NumericRangeFieldConfig = {};
  @property({ type: Object }) value: NumericRangeValue | null = null;
  @property({ type: Boolean }) disabled = false;

  private _fireChange(min: number, max: number) {
    this.dispatchEvent(new CustomEvent('range-change', {
      detail: { value: { min, max } },
      bubbles: true, composed: true,
    }));
  }

  private _onMinInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const min = Number(input.value);
    const max = this.value?.max ?? this.config.max ?? 100;
    this._fireChange(min, max);
  }

  private _onMaxInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const max = Number(input.value);
    const min = this.value?.min ?? this.config.min ?? 0;
    this._fireChange(min, max);
  }

  private _onMinSlider(e: Event) {
    const input = e.target as HTMLInputElement;
    const min = Number(input.value);
    const max = this.value?.max ?? this.config.max ?? 100;
    this._fireChange(Math.min(min, max), max);
  }

  private _onMaxSlider(e: Event) {
    const input = e.target as HTMLInputElement;
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

    return html`
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
          ${unit ? html`<span class="phz-sc-range-unit">${unit}</span>` : nothing}
        </div>
        ${showSlider ? html`
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
}
