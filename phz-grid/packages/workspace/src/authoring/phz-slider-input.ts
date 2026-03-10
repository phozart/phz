/**
 * @phozart/phz-workspace — Slider Input Micro-Component
 *
 * Range input with numeric readout and label.
 * Fires 'value-changed' event with { detail: { value: number } }.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';

@safeCustomElement('phz-slider-input')
export class PhzSliderInput extends LitElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: String }) label = '';
  @property({ type: String }) suffix = '';

  static styles = css`
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
  `;

  private _onChange(e: Event): void {
    const val = Number((e.target as HTMLInputElement).value);
    this.value = val;
    this.dispatchEvent(new CustomEvent('value-changed', {
      detail: { value: val },
      bubbles: true, composed: true,
    }));
  }

  override render() {
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : ''}
      <div class="container">
        <input type="range" .value=${String(this.value)}
          min="${this.min}" max="${this.max}" step="${this.step}"
          @input=${this._onChange} aria-label="${this.label}" />
        <span class="readout">${this.value}${this.suffix}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-slider-input': PhzSliderInput;
  }
}
