/**
 * @phozart/engine-admin — Parameter Form
 *
 * Slide-over form for creating/editing dashboard parameters.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type { ParameterDef, ParameterType } from '@phozart/engine';
import { parameterId } from '@phozart/engine';

const PARAM_TYPES: Array<{ value: ParameterType; label: string }> = [
  { value: 'number', label: 'Number' },
  { value: 'string', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
];

@safeCustomElement('phz-parameter-form')
export class PhzParameterForm extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      :host { display: block; }

      .segmented {
        display: flex; gap: 2px; background: #E7E5E4; border-radius: 6px; padding: 2px; margin-bottom: 4px;
      }
      .seg-btn {
        flex: 1; padding: 5px 4px; font-size: 11px; font-weight: 600;
        border: none; border-radius: 4px; cursor: pointer; background: none;
        color: #78716C; font-family: inherit; text-align: center;
      }
      .seg-btn--active { background: white; color: #1C1917; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

      .option-row {
        display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
      }
      .option-input { flex: 1; }
      .remove-option {
        border: none; background: none; color: #DC2626; cursor: pointer; font-size: 14px;
      }

      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
    `,
  ];

  @property({ type: Object }) parameter?: ParameterDef;
  @property({ type: Boolean }) isEdit = false;

  @state() private _name = '';
  @state() private _type: ParameterType = 'number';
  @state() private _defaultValue: unknown = 0;
  @state() private _options: Array<{ label: string; value: unknown }> = [];
  @state() private _min?: number;
  @state() private _max?: number;
  @state() private _step?: number;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('parameter') && this.parameter) {
      this._name = this.parameter.name;
      this._type = this.parameter.type;
      this._defaultValue = this.parameter.defaultValue;
      this._options = this.parameter.options ? [...this.parameter.options] : [];
      this._min = this.parameter.min;
      this._max = this.parameter.max;
      this._step = this.parameter.step;
    }
  }

  private _handleSave() {
    const id = this.isEdit && this.parameter
      ? this.parameter.id
      : parameterId(this._name.toLowerCase().replace(/\s+/g, '_'));

    const param: ParameterDef = {
      id,
      name: this._name,
      type: this._type,
      defaultValue: this._defaultValue,
      ...(this._type === 'select' ? { options: this._options } : {}),
      ...(this._type === 'number' && this._min !== undefined ? { min: this._min } : {}),
      ...(this._type === 'number' && this._max !== undefined ? { max: this._max } : {}),
      ...(this._type === 'number' && this._step !== undefined ? { step: this._step } : {}),
    };

    this.dispatchEvent(new CustomEvent('parameter-save', {
      bubbles: true, composed: true,
      detail: { parameter: param, isEdit: this.isEdit },
    }));
  }

  private _handleCancel() {
    this.dispatchEvent(new CustomEvent('parameter-cancel', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="phz-ea-field">
        <label class="phz-ea-label">Name</label>
        <input class="phz-ea-input" .value=${this._name}
          @input=${(e: Event) => { this._name = (e.target as HTMLInputElement).value; }}
          placeholder="e.g. Target %">
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Type</label>
        <div class="segmented">
          ${PARAM_TYPES.map(t => html`
            <button class="seg-btn ${this._type === t.value ? 'seg-btn--active' : ''}"
              @click=${() => { this._type = t.value; }}>${t.label}</button>
          `)}
        </div>
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Default Value</label>
        ${this._type === 'boolean' ? html`
          <div class="segmented" style="max-width:160px;">
            <button class="seg-btn ${this._defaultValue === true ? 'seg-btn--active' : ''}"
              @click=${() => { this._defaultValue = true; }}>True</button>
            <button class="seg-btn ${this._defaultValue === false ? 'seg-btn--active' : ''}"
              @click=${() => { this._defaultValue = false; }}>False</button>
          </div>
        ` : this._type === 'select' ? html`
          <select class="phz-ea-select" @change=${(e: Event) => { this._defaultValue = (e.target as HTMLSelectElement).value; }}>
            ${this._options.map(o => html`
              <option value=${String(o.value)} ?selected=${this._defaultValue === o.value}>${o.label}</option>
            `)}
          </select>
        ` : html`
          <input class="phz-ea-input"
            type=${this._type === 'number' ? 'number' : this._type === 'date' ? 'date' : 'text'}
            .value=${String(this._defaultValue ?? '')}
            @input=${(e: Event) => {
              const val = (e.target as HTMLInputElement).value;
              this._defaultValue = this._type === 'number' ? Number(val) : val;
            }}>
        `}
      </div>

      ${this._type === 'number' ? html`
        <div class="phz-ea-field">
          <label class="phz-ea-label">Range (optional)</label>
          <div style="display:flex;gap:8px;">
            <input class="phz-ea-input" type="number" placeholder="Min" style="flex:1;"
              .value=${this._min !== undefined ? String(this._min) : ''}
              @input=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._min = v ? Number(v) : undefined; }}>
            <input class="phz-ea-input" type="number" placeholder="Max" style="flex:1;"
              .value=${this._max !== undefined ? String(this._max) : ''}
              @input=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._max = v ? Number(v) : undefined; }}>
            <input class="phz-ea-input" type="number" placeholder="Step" style="flex:1;"
              .value=${this._step !== undefined ? String(this._step) : ''}
              @input=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._step = v ? Number(v) : undefined; }}>
          </div>
        </div>
      ` : nothing}

      ${this._type === 'select' ? html`
        <div class="phz-ea-field">
          <label class="phz-ea-label">Options</label>
          ${this._options.map((opt, i) => html`
            <div class="option-row">
              <input class="phz-ea-input option-input" .value=${opt.label} placeholder="Label"
                @input=${(e: Event) => { this._options = this._options.map((o, j) => j === i ? { ...o, label: (e.target as HTMLInputElement).value } : o); }}>
              <input class="phz-ea-input option-input" .value=${String(opt.value)} placeholder="Value"
                @input=${(e: Event) => { this._options = this._options.map((o, j) => j === i ? { ...o, value: (e.target as HTMLInputElement).value } : o); }}>
              <button class="remove-option" @click=${() => { this._options = this._options.filter((_, j) => j !== i); }}>&times;</button>
            </div>
          `)}
          <button class="phz-ea-btn" @click=${() => { this._options = [...this._options, { label: '', value: '' }]; }}
            style="font-size:12px;">+ Add Option</button>
        </div>
      ` : nothing}

      <div class="actions">
        <button class="phz-ea-btn" @click=${this._handleCancel}>Cancel</button>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this._handleSave}
          ?disabled=${!this._name}>${this.isEdit ? 'Update' : 'Create'}</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-parameter-form': PhzParameterForm; }
}
