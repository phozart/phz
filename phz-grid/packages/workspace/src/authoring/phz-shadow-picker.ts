/**
 * @phozart/phz-workspace — Shadow Picker Micro-Component
 *
 * 4-option visual selector (none/sm/md/lg) showing card previews.
 * Fires 'shadow-changed' event with { detail: { shadow: string } }.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';

export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';

export const SHADOW_VALUES: Record<ShadowLevel, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

@safeCustomElement('phz-shadow-picker')
export class PhzShadowPicker extends LitElement {
  @property({ type: String }) value: ShadowLevel = 'sm';
  @property({ type: String }) label = 'Shadow';

  static styles = css`
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
  `;

  private _select(level: ShadowLevel): void {
    this.value = level;
    this.dispatchEvent(new CustomEvent('shadow-changed', {
      detail: { shadow: level },
      bubbles: true, composed: true,
    }));
  }

  override render() {
    return html`
      <div class="label">${this.label}</div>
      <div class="options" role="radiogroup" aria-label="${this.label}">
        ${(Object.keys(SHADOW_VALUES) as ShadowLevel[]).map(level => html`
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
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-shadow-picker': PhzShadowPicker;
  }
}
