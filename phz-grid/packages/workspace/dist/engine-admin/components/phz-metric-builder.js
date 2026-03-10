/**
 * @phozart/phz-engine-admin — Metric Builder
 *
 * Create/edit metric definitions: name, data product, formula, format.
 * Embeddable component.
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
let PhzMetricBuilder = class PhzMetricBuilder extends LitElement {
    constructor() {
        super(...arguments);
        this.name = '';
        this.dataProductId = '';
        this.formulaType = 'simple';
        this.field = '';
        this.aggregation = 'sum';
        this.conditionField = '';
        this.conditionOperator = 'equals';
        this.conditionValue = '';
        this.expression = '';
    }
    static { this.styles = [
        engineAdminStyles,
        css `
      .builder { border: 1px solid #E7E5E4; border-radius: 8px; padding: 20px; }
      .formula-type-group { display: flex; gap: 4px; margin-bottom: 16px; }
    `,
    ]; }
    handleSave() {
        this.dispatchEvent(new CustomEvent('metric-save', {
            bubbles: true, composed: true,
            detail: {
                name: this.name,
                dataProductId: this.dataProductId,
                formulaType: this.formulaType,
                field: this.field,
                aggregation: this.aggregation,
            },
        }));
    }
    render() {
        const aggregations = ['sum', 'avg', 'min', 'max', 'count', 'first', 'last'];
        return html `
      <div class="builder" role="region" aria-label="Metric Builder">
        <h3 style="margin:0 0 16px;">Metric Builder</h3>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Name</label>
          <input class="phz-ea-input" .value=${this.name} @input=${(e) => { this.name = e.target.value; }}>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Data Product</label>
          <select class="phz-ea-select" .value=${this.dataProductId} @change=${(e) => { this.dataProductId = e.target.value; }}>
            <option value="">Select...</option>
            ${(this.engine?.dataProducts.list() ?? []).map((dp) => html `<option value=${dp.id}>${dp.name}</option>`)}
          </select>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Formula Type</label>
          <div class="formula-type-group">
            ${['simple', 'conditional', 'composite'].map(t => html `
              <button class="phz-ea-chip ${this.formulaType === t ? 'phz-ea-chip--active' : ''}" @click=${() => { this.formulaType = t; }}>${t}</button>
            `)}
          </div>
        </div>

        ${this.formulaType === 'simple' || this.formulaType === 'conditional' ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label">Field</label>
            <input class="phz-ea-input" .value=${this.field} @input=${(e) => { this.field = e.target.value; }}>
          </div>
          <div class="phz-ea-field">
            <label class="phz-ea-label">Aggregation</label>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
              ${aggregations.map(a => html `
                <button class="phz-ea-chip ${this.aggregation === a ? 'phz-ea-chip--active' : ''}" @click=${() => { this.aggregation = a; }}>${a}</button>
              `)}
            </div>
          </div>
        ` : nothing}

        ${this.formulaType === 'conditional' ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label">Condition</label>
            <div style="display:flex; gap:8px;">
              <input class="phz-ea-input" style="flex:1;" placeholder="Field" .value=${this.conditionField} @input=${(e) => { this.conditionField = e.target.value; }}>
              <select class="phz-ea-select" style="width:100px;" .value=${this.conditionOperator} @change=${(e) => { this.conditionOperator = e.target.value; }}>
                <option value="equals">=</option>
                <option value="greaterThan">&gt;</option>
                <option value="lessThan">&lt;</option>
              </select>
              <input class="phz-ea-input" style="flex:1;" placeholder="Value" .value=${this.conditionValue} @input=${(e) => { this.conditionValue = e.target.value; }}>
            </div>
          </div>
        ` : nothing}

        ${this.formulaType === 'composite' ? html `
          <div class="phz-ea-field">
            <label class="phz-ea-label">Expression</label>
            <textarea class="phz-ea-textarea" .value=${this.expression} @input=${(e) => { this.expression = e.target.value; }} placeholder="e.g. $sales / $orders * 100"></textarea>
          </div>
        ` : nothing}

        <div class="phz-ea-btn-group" style="margin-top:16px;">
          <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleSave}>Save Metric</button>
          <button class="phz-ea-btn" @click=${() => this.dispatchEvent(new CustomEvent('metric-cancel', { bubbles: true, composed: true }))}>Cancel</button>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzMetricBuilder.prototype, "engine", void 0);
__decorate([
    property({ type: String })
], PhzMetricBuilder.prototype, "metricId", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "name", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "dataProductId", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "formulaType", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "field", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "aggregation", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "conditionField", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "conditionOperator", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "conditionValue", void 0);
__decorate([
    state()
], PhzMetricBuilder.prototype, "expression", void 0);
PhzMetricBuilder = __decorate([
    safeCustomElement('phz-metric-builder')
], PhzMetricBuilder);
export { PhzMetricBuilder };
//# sourceMappingURL=phz-metric-builder.js.map