/**
 * @phozart/phz-criteria — Chip Select
 *
 * Multi-select pill-based selector. Each option renders as a toggleable chip.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SelectionFieldOption, CriteriaSelectionMode } from '@phozart/phz-core';
import { criteriaStyles } from '../../shared-styles.js';

@customElement('phz-chip-select')
export class PhzChipSelect extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; }
  `];

  @property({ type: Array }) options: SelectionFieldOption[] = [];
  @property({ type: Array }) value: string[] = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) selectionMode: CriteriaSelectionMode | undefined = undefined;

  private get _effectiveDisabled(): boolean {
    return this.disabled || this.selectionMode === 'none';
  }

  private _toggle(optionValue: string) {
    if (this._effectiveDisabled) return;

    let newValue: string[];
    if (this.selectionMode === 'single') {
      // Radio behavior: clicking active chip deselects, clicking inactive selects only that one
      newValue = (this.value ?? []).includes(optionValue) ? [] : [optionValue];
    } else {
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
    return html`
      <div class="phz-sc-chip-sel" role="group">
        ${(this.options ?? []).map(opt => {
          const active = (this.value ?? []).includes(opt.value);
          return html`
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
}
