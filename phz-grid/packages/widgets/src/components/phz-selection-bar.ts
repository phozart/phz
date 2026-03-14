/**
 * @phozart/widgets — Selection Bar
 *
 * Global filter bar that scopes all widgets. Renders selection fields as dropdowns, chips, etc.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { SelectionContext, SelectionFieldDef, SelectionChange } from '@phozart/core';

@customElement('phz-selection-bar')
export class PhzSelectionBar extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }

      .selection-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #FAFAF9;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        flex-wrap: wrap;
      }

      .selection-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .selection-field__label {
        font-size: 11px;
        font-weight: 600;
        color: #78716C;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .selection-field__select {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 13px;
        background: white;
        color: #1C1917;
        min-width: 140px;
      }

      .selection-field__input {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 13px;
        background: white;
        color: #1C1917;
        min-width: 140px;
      }

      .chip-group {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .chip {
        padding: 4px 12px;
        border: 1px solid #D6D3D1;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        background: white;
        color: #44403C;
        transition: all 0.15s ease;
      }

      .chip:hover { background: #F5F5F4; }
      .chip--active { background: #3B82F6; color: white; border-color: #3B82F6; }
      .chip--locked { opacity: 0.6; cursor: not-allowed; }
    `,
  ];

  @property({ type: Array }) fields: SelectionFieldDef[] = [];
  @property({ type: Object }) selectionContext: SelectionContext = {};
  @property({ type: String }) persistTo: 'url' | 'storage' | 'none' = 'none';

  private emitChange(field: string, oldValue: string | string[] | null, newValue: string | string[] | null) {
    const change: SelectionChange = { field, oldValue, newValue };
    this.dispatchEvent(new CustomEvent('selection-change', {
      bubbles: true, composed: true,
      detail: change,
    }));
  }

  private handleSingleSelect(field: SelectionFieldDef, e: Event) {
    if (field.locked) return;
    const select = e.target as HTMLSelectElement;
    const oldValue = (this.selectionContext[field.id] as string) ?? null;
    this.emitChange(field.id, oldValue, select.value || null);
  }

  private handleMultiSelect(field: SelectionFieldDef, e: Event) {
    if (field.locked) return;
    const select = e.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(o => o.value);
    const oldValue = (this.selectionContext[field.id] as string[]) ?? null;
    this.emitChange(field.id, oldValue, selected);
  }

  private handleChipToggle(field: SelectionFieldDef, value: string) {
    if (field.locked) return;
    const current = (this.selectionContext[field.id] as string[]) ?? [];
    const isActive = current.includes(value);
    const newValue = isActive
      ? current.filter(v => v !== value)
      : [...current, value];
    this.emitChange(field.id, current, newValue);
  }

  private handleTextInput(field: SelectionFieldDef, e: Event) {
    if (field.locked) return;
    const input = e.target as HTMLInputElement;
    const oldValue = (this.selectionContext[field.id] as string) ?? null;
    this.emitChange(field.id, oldValue, input.value || null);
  }

  private renderField(field: SelectionFieldDef) {
    const currentValue = this.selectionContext[field.id];

    switch (field.type) {
      case 'single_select':
      case 'period_picker':
        return html`
          <div class="selection-field">
            <label class="selection-field__label">${field.label}</label>
            <select class="selection-field__select"
                    ?disabled=${field.locked}
                    @change=${(e: Event) => this.handleSingleSelect(field, e)}
                    aria-label=${field.label}>
              ${field.allowAll ? html`<option value="">All</option>` : nothing}
              ${(field.options ?? []).map(opt => html`
                <option value=${opt.value} ?selected=${currentValue === opt.value}>
                  ${opt.label}
                </option>
              `)}
            </select>
          </div>
        `;

      case 'multi_select':
        return html`
          <div class="selection-field">
            <label class="selection-field__label">${field.label}</label>
            <select class="selection-field__select" multiple
                    ?disabled=${field.locked}
                    @change=${(e: Event) => this.handleMultiSelect(field, e)}
                    aria-label=${field.label}>
              ${(field.options ?? []).map(opt => {
                const selected = Array.isArray(currentValue) && currentValue.includes(opt.value);
                return html`
                  <option value=${opt.value} ?selected=${selected}>
                    ${opt.label}
                  </option>
                `;
              })}
            </select>
          </div>
        `;

      case 'chip_group':
        return html`
          <div class="selection-field">
            <label class="selection-field__label">${field.label}</label>
            <div class="chip-group" role="group" aria-label=${field.label}>
              ${(field.options ?? []).map(opt => {
                const isActive = Array.isArray(currentValue) && currentValue.includes(opt.value);
                return html`
                  <button class="chip ${isActive ? 'chip--active' : ''} ${field.locked ? 'chip--locked' : ''}"
                          @click=${() => this.handleChipToggle(field, opt.value)}
                          ?disabled=${field.locked}
                          aria-pressed=${isActive}>
                    ${opt.label}
                  </button>
                `;
              })}
            </div>
          </div>
        `;

      case 'text':
        return html`
          <div class="selection-field">
            <label class="selection-field__label">${field.label}</label>
            <input class="selection-field__input"
                   type="text"
                   .value=${(currentValue as string) ?? ''}
                   ?disabled=${field.locked}
                   @input=${(e: Event) => this.handleTextInput(field, e)}
                   aria-label=${field.label}
                   placeholder="Type to filter...">
          </div>
        `;

      default:
        return nothing;
    }
  }

  render() {
    if (this.fields.length === 0) return nothing;

    return html`
      <div class="selection-bar" role="toolbar" aria-label="Selection Filters">
        ${this.fields.map(field => this.renderField(field))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-selection-bar': PhzSelectionBar;
  }
}
