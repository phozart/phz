/**
 * @phozart/phz-criteria — Criteria Field
 *
 * Individual criterion renderer. Switch-renders based on fieldDef.type.
 */

import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type {
  SelectionFieldDef,
  SelectionFieldOption,
  DateRangeValue,
  NumericRangeValue,
  PresenceState,
} from '@phozart/phz-core';
import { criteriaStyles } from '../shared-styles.js';

// Ensure sub-components are registered
import './fields/phz-date-range-picker.js';
import './fields/phz-numeric-range-input.js';
import './fields/phz-tree-select.js';
import './fields/phz-searchable-dropdown.js';
import './fields/phz-field-presence-filter.js';

@customElement('phz-criteria-field')
export class PhzCriteriaField extends LitElement {
  static styles = [criteriaStyles];

  @property({ type: Object }) fieldDef!: SelectionFieldDef;
  @property({ attribute: false }) value: string | string[] | null = null;
  @property({ type: Array }) filteredOptions: SelectionFieldOption[] = [];
  @property({ type: Boolean }) locked = false;

  private _fire(newValue: string | string[] | null) {
    this.dispatchEvent(new CustomEvent('field-change', {
      detail: { fieldId: this.fieldDef.id, value: newValue },
      bubbles: true, composed: true,
    }));
  }

  private _onSelectChange(e: Event) {
    this._fire((e.target as HTMLSelectElement).value || null);
  }

  private _onMultiSelectToggle(optionValue: string) {
    const current = Array.isArray(this.value) ? this.value : [];
    const newVal = current.includes(optionValue)
      ? current.filter(v => v !== optionValue)
      : [...current, optionValue];
    this._fire(newVal.length > 0 ? newVal : null);
  }

  private _onChipToggle(optionValue: string) {
    this._onMultiSelectToggle(optionValue);
  }

  private _onTextInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this._fire(val || null);
  }

  private _onDateRangeChange(e: CustomEvent<{ value: DateRangeValue | null }>) {
    this._fire(e.detail.value ? JSON.stringify(e.detail.value) : null);
  }

  private _onNumericRangeChange(e: CustomEvent<{ value: NumericRangeValue }>) {
    this._fire(JSON.stringify(e.detail.value));
  }

  private _onTreeChange(e: CustomEvent<{ value: string[] }>) {
    this._fire(e.detail.value.length > 0 ? e.detail.value : null);
  }

  private _onSearchSelect(e: CustomEvent<{ value: string }>) {
    this._fire(e.detail.value);
  }

  private _onPresenceChange(e: CustomEvent<{ filters: Record<string, PresenceState> }>) {
    this._fire(JSON.stringify(e.detail.filters));
  }

  private _renderField() {
    const fd = this.fieldDef;
    const isLocked = this.locked || !!fd.lockedValue;
    const options = this.filteredOptions.length > 0 ? this.filteredOptions : (fd.options ?? []);

    if (isLocked) {
      const display = Array.isArray(this.value) ? this.value.join(', ') : (this.value ?? '');
      return html`<span class="phz-sc-locked-badge"><svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><rect x="48" y="120" width="160" height="112" rx="8"/><path d="M80 120 V80 a48 48 0 0 1 96 0 v40"/></svg> ${display}</span>`;
    }

    switch (fd.type) {
      case 'single_select':
        return html`
          <select class="phz-sc-select" @change=${this._onSelectChange}>
            ${fd.allowAll !== false ? html`<option value="">All</option>` : nothing}
            ${options.map(o => html`
              <option value=${o.value} ?selected=${this.value === o.value}>${o.label}</option>
            `)}
          </select>
        `;

      case 'multi_select':
        return html`
          <div class="phz-sc-chips">
            ${options.map(o => {
              const selected = Array.isArray(this.value) && this.value.includes(o.value);
              return html`
                <button
                  class="phz-sc-chip ${selected ? 'phz-sc-chip--selected' : ''}"
                  @click=${() => this._onMultiSelectToggle(o.value)}
                >${o.label}</button>
              `;
            })}
          </div>
        `;

      case 'chip_group':
        return html`
          <div class="phz-sc-chips">
            ${options.map(o => {
              const selected = Array.isArray(this.value) && this.value.includes(o.value);
              return html`
                <button
                  class="phz-sc-chip ${selected ? 'phz-sc-chip--selected' : ''}"
                  @click=${() => this._onChipToggle(o.value)}
                >${o.label}</button>
              `;
            })}
          </div>
        `;

      case 'text':
        return html`
          <input
            class="phz-sc-input"
            type="text"
            .value=${this.value ?? ''}
            placeholder=${fd.placeholder ?? ''}
            @input=${this._onTextInput}
          />
        `;

      case 'period_picker':
        return html`
          <input
            class="phz-sc-input"
            type="month"
            .value=${this.value ?? ''}
            @change=${this._onSelectChange}
          />
        `;

      case 'date_range': {
        let dateVal: DateRangeValue | null = null;
        if (typeof this.value === 'string' && this.value) {
          try { dateVal = JSON.parse(this.value); } catch { /* ignore */ }
        }
        return html`
          <phz-date-range-picker
            .config=${fd.dateRangeConfig ?? {}}
            .value=${dateVal}
            @range-change=${this._onDateRangeChange}
          ></phz-date-range-picker>
        `;
      }

      case 'numeric_range': {
        let numVal: NumericRangeValue | null = null;
        if (typeof this.value === 'string' && this.value) {
          try { numVal = JSON.parse(this.value); } catch { /* ignore */ }
        }
        return html`
          <phz-numeric-range-input
            .config=${fd.numericRangeConfig ?? {}}
            .value=${numVal}
            @range-change=${this._onNumericRangeChange}
          ></phz-numeric-range-input>
        `;
      }

      case 'tree_select':
        return html`
          <phz-tree-select
            .nodes=${fd.treeOptions ?? []}
            .value=${Array.isArray(this.value) ? this.value : []}
            @tree-change=${this._onTreeChange}
          ></phz-tree-select>
        `;

      case 'search': {
        const searchVal = Array.isArray(this.value) ? this.value.join(' ') : (this.value ?? '');
        const searchPlaceholder = fd.searchConfig?.multiValue
          ? 'Space-separated values...'
          : (fd.placeholder ?? 'Search...');
        return html`
          <input
            class="phz-sc-input"
            type="text"
            .value=${searchVal}
            placeholder=${searchPlaceholder}
            @input=${this._onTextInput}
          />
        `;
      }

      case 'field_presence': {
        const presenceFields = fd.fieldPresenceConfig?.fields ?? [];
        let presenceVal: Record<string, PresenceState> = {};
        if (typeof this.value === 'string' && this.value) {
          try { presenceVal = JSON.parse(this.value); } catch { /* ignore */ }
        }
        return html`
          <phz-field-presence-filter
            .fields=${presenceFields}
            .value=${presenceVal}
            .label=${fd.label}
            ?compact=${fd.fieldPresenceConfig?.compact ?? false}
            @presence-change=${this._onPresenceChange}
          ></phz-field-presence-filter>
        `;
      }

      default:
        return html`<span>Unsupported type: ${fd.type}</span>`;
    }
  }

  render() {
    const fd = this.fieldDef;
    if (!fd) return nothing;

    return html`
      <div class="phz-sc-field">
        <label class="phz-sc-field-label ${fd.required ? 'phz-sc-field-label--required' : ''}">${fd.label}</label>
        ${this._renderField()}
      </div>
    `;
  }
}
