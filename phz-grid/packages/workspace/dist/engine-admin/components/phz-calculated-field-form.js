/**
 * @phozart/engine-admin — Calculated Field Form
 *
 * Slide-over form for creating/editing calculated fields with expression builder.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import { calculatedFieldId, evaluateRowExpression } from '@phozart/engine';
import './phz-expression-builder.js';
const OUTPUT_TYPES = [
    { value: 'number', label: 'Number' },
    { value: 'string', label: 'Text' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
];
let PhzCalculatedFieldForm = class PhzCalculatedFieldForm extends LitElement {
    constructor() {
        super(...arguments);
        this.isEdit = false;
        this.fields = [];
        this.parameters = [];
        this.calculatedFields = [];
        this.previewData = [];
        this._name = '';
        this._outputType = 'number';
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; }

      .segmented {
        display: flex; gap: 2px; background: #E7E5E4; border-radius: 6px; padding: 2px; margin-bottom: 4px;
      }
      .seg-btn {
        flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 600;
        border: none; border-radius: 4px; cursor: pointer; background: none;
        color: #78716C; font-family: inherit; text-align: center;
      }
      .seg-btn--active { background: white; color: #1C1917; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }

      .preview {
        margin-top: 12px; padding: 10px; background: #F5F5F4; border-radius: 6px;
        border: 1px solid #E7E5E4;
      }
      .preview-title {
        font-size: 10px; font-weight: 700; color: #78716C; text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 6px;
      }
      .preview-row {
        display: flex; justify-content: space-between; padding: 3px 0;
        font-size: 12px; border-bottom: 1px solid #E7E5E4;
      }
      .preview-row:last-child { border-bottom: none; }
      .preview-input { color: #78716C; }
      .preview-result { font-weight: 600; color: #1C1917; }

      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
    `,
    ]; }
    willUpdate(changed) {
        if (changed.has('calculatedField') && this.calculatedField) {
            this._name = this.calculatedField.name;
            this._outputType = this.calculatedField.outputType;
            this._expression = this.calculatedField.expression;
        }
    }
    _handleExpressionChange(e) {
        this._expression = e.detail.expression;
    }
    _getPreviewResults() {
        if (!this._expression || this.previewData.length === 0)
            return [];
        return this.previewData.slice(0, 3).map(row => ({
            row,
            result: evaluateRowExpression(this._expression, { row, params: {}, calculatedValues: {} }),
        }));
    }
    _handleSave() {
        if (!this._name || !this._expression)
            return;
        const id = this.isEdit && this.calculatedField
            ? this.calculatedField.id
            : calculatedFieldId(this._name.toLowerCase().replace(/\s+/g, '_'));
        const calc = {
            id,
            name: this._name,
            outputType: this._outputType,
            expression: this._expression,
        };
        this.dispatchEvent(new CustomEvent('calculated-field-save', {
            bubbles: true, composed: true,
            detail: { calculatedField: calc, isEdit: this.isEdit },
        }));
    }
    _handleCancel() {
        this.dispatchEvent(new CustomEvent('calculated-field-cancel', { bubbles: true, composed: true }));
    }
    render() {
        const previews = this._getPreviewResults();
        return html `
      <div class="phz-ea-field">
        <label class="phz-ea-label">Name</label>
        <input class="phz-ea-input" .value=${this._name}
          @input=${(e) => { this._name = e.target.value; }}
          placeholder="e.g. performance_score">
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Output Type</label>
        <div class="segmented">
          ${OUTPUT_TYPES.map(t => html `
            <button class="seg-btn ${this._outputType === t.value ? 'seg-btn--active' : ''}"
              @click=${() => { this._outputType = t.value; }}>${t.label}</button>
          `)}
        </div>
      </div>

      <div class="phz-ea-field">
        <label class="phz-ea-label">Expression</label>
        <phz-expression-builder
          .expression=${this._expression}
          .fields=${this.fields}
          .parameters=${this.parameters}
          .calculatedFields=${this.calculatedFields}
          .metrics=${[]}
          level="row"
          @expression-change=${this._handleExpressionChange}
        ></phz-expression-builder>
      </div>

      ${previews.length > 0 ? html `
        <div class="preview">
          <div class="preview-title">Live Preview (first 3 rows)</div>
          ${previews.map(({ row, result }) => html `
            <div class="preview-row">
              <span class="preview-input">${JSON.stringify(row).substring(0, 40)}...</span>
              <span class="preview-result">${result !== null && result !== undefined ? String(result) : 'null'}</span>
            </div>
          `)}
        </div>
      ` : nothing}

      <div class="actions">
        <button class="phz-ea-btn" @click=${this._handleCancel}>Cancel</button>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this._handleSave}
          ?disabled=${!this._name || !this._expression}>${this.isEdit ? 'Update' : 'Create'}</button>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzCalculatedFieldForm.prototype, "calculatedField", void 0);
__decorate([
    property({ type: Boolean })
], PhzCalculatedFieldForm.prototype, "isEdit", void 0);
__decorate([
    property({ type: Array })
], PhzCalculatedFieldForm.prototype, "fields", void 0);
__decorate([
    property({ type: Array })
], PhzCalculatedFieldForm.prototype, "parameters", void 0);
__decorate([
    property({ type: Array })
], PhzCalculatedFieldForm.prototype, "calculatedFields", void 0);
__decorate([
    property({ type: Array })
], PhzCalculatedFieldForm.prototype, "previewData", void 0);
__decorate([
    state()
], PhzCalculatedFieldForm.prototype, "_name", void 0);
__decorate([
    state()
], PhzCalculatedFieldForm.prototype, "_outputType", void 0);
__decorate([
    state()
], PhzCalculatedFieldForm.prototype, "_expression", void 0);
PhzCalculatedFieldForm = __decorate([
    safeCustomElement('phz-calculated-field-form')
], PhzCalculatedFieldForm);
export { PhzCalculatedFieldForm };
//# sourceMappingURL=phz-calculated-field-form.js.map