/**
 * @phozart/phz-engine-admin — Metric Form
 *
 * Slide-over form for creating/editing metrics.
 * Two tabs: Simple (field + aggregation) and Composite (expression builder).
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import { metricId } from '@phozart/phz-engine';
import './phz-expression-builder.js';
const AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max', 'first', 'last'];
let PhzMetricForm = class PhzMetricForm extends LitElement {
    constructor() {
        super(...arguments);
        this.isEdit = false;
        this.fields = [];
        this.parameters = [];
        this.calculatedFields = [];
        this.metrics = [];
        this._name = '';
        this._mode = 'simple';
        this._field = '';
        this._aggregation = 'avg';
        this._format = { type: 'number', decimals: 1 };
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      :host { display: block; }

      .tabs {
        display: flex; border-bottom: 2px solid #E7E5E4; margin-bottom: 14px;
      }
      .tab {
        padding: 8px 16px; font-size: 12px; font-weight: 600; color: #78716C;
        cursor: pointer; border: none; background: none;
        border-bottom: 2px solid transparent; margin-bottom: -2px; font-family: inherit;
      }
      .tab:hover { color: #44403C; }
      .tab--active { color: #3B82F6; border-bottom-color: #3B82F6; }

      .format-group {
        margin-top: 16px; padding-top: 12px; border-top: 1px solid #E7E5E4;
      }
      .format-title {
        font-size: 11px; font-weight: 700; color: #78716C; text-transform: uppercase;
        letter-spacing: 0.06em; margin-bottom: 8px;
      }
      .format-row { display: flex; gap: 8px; margin-bottom: 8px; }

      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
    `,
    ]; }
    willUpdate(changed) {
        if (changed.has('metric') && this.metric) {
            this._name = this.metric.name;
            this._format = this.metric.format ?? { type: 'number', decimals: 1 };
            if (this.metric.formula.type === 'simple') {
                this._mode = 'simple';
                this._field = this.metric.formula.field;
                this._aggregation = this.metric.formula.aggregation;
            }
            else if (this.metric.formula.type === 'expression') {
                this._mode = 'expression';
                this._expression = this.metric.formula.expression;
            }
        }
    }
    _handleExpressionChange(e) {
        this._expression = e.detail.expression;
    }
    _handleSave() {
        if (!this._name)
            return;
        const id = this.isEdit && this.metric
            ? this.metric.id
            : metricId(this._name.toLowerCase().replace(/\s+/g, '_'));
        const formula = this._mode === 'simple'
            ? { type: 'simple', field: this._field, aggregation: this._aggregation }
            : { type: 'expression', expression: this._expression };
        const metric = {
            id,
            name: this._name,
            dataProductId: 'default',
            formula,
            format: this._format,
        };
        this.dispatchEvent(new CustomEvent('metric-save', {
            bubbles: true, composed: true,
            detail: { metric, isEdit: this.isEdit },
        }));
    }
    _handleCancel() {
        this.dispatchEvent(new CustomEvent('metric-cancel', { bubbles: true, composed: true }));
    }
    render() {
        const numericFields = this.fields.filter(f => f.type === 'number');
        return html `
      <div class="phz-ea-field">
        <label class="phz-ea-label">Name</label>
        <input class="phz-ea-input" .value=${this._name}
          @input=${(e) => { this._name = e.target.value; }}
          placeholder="e.g. Average Salary">
      </div>

      <div class="tabs">
        <button class="tab ${this._mode === 'simple' ? 'tab--active' : ''}"
          @click=${() => { this._mode = 'simple'; }}>Simple</button>
        <button class="tab ${this._mode === 'expression' ? 'tab--active' : ''}"
          @click=${() => { this._mode = 'expression'; }}>Composite</button>
      </div>

      ${this._mode === 'simple' ? html `
        <div class="phz-ea-field">
          <label class="phz-ea-label">Field</label>
          <select class="phz-ea-select" .value=${this._field}
            @change=${(e) => { this._field = e.target.value; }}>
            <option value="">-- Select Field --</option>
            ${numericFields.map(f => html `<option value=${f.name} ?selected=${this._field === f.name}>${f.label ?? f.name}</option>`)}
          </select>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Aggregation</label>
          <select class="phz-ea-select" .value=${this._aggregation}
            @change=${(e) => { this._aggregation = e.target.value; }}>
            ${AGGREGATIONS.map(a => html `<option value=${a} ?selected=${this._aggregation === a}>${a.charAt(0).toUpperCase() + a.slice(1)}</option>`)}
          </select>
        </div>
      ` : html `
        <div class="phz-ea-field">
          <label class="phz-ea-label">Expression</label>
          <phz-expression-builder
            .expression=${this._expression}
            .fields=${this.fields}
            .parameters=${this.parameters}
            .calculatedFields=${this.calculatedFields}
            .metrics=${this.metrics.filter(m => !this.metric || m.id !== this.metric.id)}
            level="metric"
            @expression-change=${this._handleExpressionChange}
          ></phz-expression-builder>
        </div>
      `}

      <div class="format-group">
        <div class="format-title">Format</div>
        <div class="format-row">
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">Type</label>
            <select class="phz-ea-select" .value=${this._format.type}
              @change=${(e) => { this._format = { ...this._format, type: e.target.value }; }}>
              <option value="number">Number</option>
              <option value="currency">Currency</option>
              <option value="percent">Percent</option>
            </select>
          </div>
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">Decimals</label>
            <input class="phz-ea-input" type="number" min="0" max="6"
              .value=${String(this._format.decimals ?? 1)}
              @input=${(e) => { this._format = { ...this._format, decimals: Number(e.target.value) }; }}>
          </div>
        </div>
        <div class="format-row">
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">Prefix</label>
            <input class="phz-ea-input" .value=${this._format.prefix ?? ''}
              @input=${(e) => { this._format = { ...this._format, prefix: e.target.value || undefined }; }}
              placeholder="e.g. $">
          </div>
          <div class="phz-ea-field" style="flex:1;">
            <label class="phz-ea-label">Suffix</label>
            <input class="phz-ea-input" .value=${this._format.suffix ?? ''}
              @input=${(e) => { this._format = { ...this._format, suffix: e.target.value || undefined }; }}
              placeholder="e.g. %">
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="phz-ea-btn" @click=${this._handleCancel}>Cancel</button>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this._handleSave}
          ?disabled=${!this._name || (this._mode === 'simple' && !this._field)}>${this.isEdit ? 'Update' : 'Create'}</button>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzMetricForm.prototype, "metric", void 0);
__decorate([
    property({ type: Boolean })
], PhzMetricForm.prototype, "isEdit", void 0);
__decorate([
    property({ type: Array })
], PhzMetricForm.prototype, "fields", void 0);
__decorate([
    property({ type: Array })
], PhzMetricForm.prototype, "parameters", void 0);
__decorate([
    property({ type: Array })
], PhzMetricForm.prototype, "calculatedFields", void 0);
__decorate([
    property({ type: Array })
], PhzMetricForm.prototype, "metrics", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_name", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_mode", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_field", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_aggregation", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_expression", void 0);
__decorate([
    state()
], PhzMetricForm.prototype, "_format", void 0);
PhzMetricForm = __decorate([
    safeCustomElement('phz-metric-form')
], PhzMetricForm);
export { PhzMetricForm };
//# sourceMappingURL=phz-metric-form.js.map