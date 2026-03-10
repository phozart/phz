/**
 * @phozart/phz-engine-admin — Metric Builder
 *
 * Create/edit metric definitions: name, data product, formula, format.
 * Embeddable component.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type { BIEngine, MetricDef, MetricFormula, AggregationFunction } from '@phozart/phz-engine';

@safeCustomElement('phz-metric-builder')
export class PhzMetricBuilder extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      .builder { border: 1px solid #E7E5E4; border-radius: 8px; padding: 20px; }
      .formula-type-group { display: flex; gap: 4px; margin-bottom: 16px; }
    `,
  ];

  @property({ type: Object }) engine?: BIEngine;
  @property({ type: String }) metricId?: string;

  @state() private name: string = '';
  @state() private dataProductId: string = '';
  @state() private formulaType: 'simple' | 'conditional' | 'composite' = 'simple';
  @state() private field: string = '';
  @state() private aggregation: AggregationFunction = 'sum';
  @state() private conditionField: string = '';
  @state() private conditionOperator: string = 'equals';
  @state() private conditionValue: string = '';
  @state() private expression: string = '';

  private handleSave() {
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
    const aggregations: AggregationFunction[] = ['sum', 'avg', 'min', 'max', 'count', 'first', 'last'];

    return html`
      <div class="builder" role="region" aria-label="Metric Builder">
        <h3 style="margin:0 0 16px;">Metric Builder</h3>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Name</label>
          <input class="phz-ea-input" .value=${this.name} @input=${(e: Event) => { this.name = (e.target as HTMLInputElement).value; }}>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Data Product</label>
          <select class="phz-ea-select" .value=${this.dataProductId} @change=${(e: Event) => { this.dataProductId = (e.target as HTMLSelectElement).value; }}>
            <option value="">Select...</option>
            ${(this.engine?.dataProducts.list() ?? []).map((dp: { id: string; name: string }) => html`<option value=${dp.id}>${dp.name}</option>`)}
          </select>
        </div>

        <div class="phz-ea-field">
          <label class="phz-ea-label">Formula Type</label>
          <div class="formula-type-group">
            ${(['simple', 'conditional', 'composite'] as const).map(t => html`
              <button class="phz-ea-chip ${this.formulaType === t ? 'phz-ea-chip--active' : ''}" @click=${() => { this.formulaType = t; }}>${t}</button>
            `)}
          </div>
        </div>

        ${this.formulaType === 'simple' || this.formulaType === 'conditional' ? html`
          <div class="phz-ea-field">
            <label class="phz-ea-label">Field</label>
            <input class="phz-ea-input" .value=${this.field} @input=${(e: Event) => { this.field = (e.target as HTMLInputElement).value; }}>
          </div>
          <div class="phz-ea-field">
            <label class="phz-ea-label">Aggregation</label>
            <div style="display:flex; gap:4px; flex-wrap:wrap;">
              ${aggregations.map(a => html`
                <button class="phz-ea-chip ${this.aggregation === a ? 'phz-ea-chip--active' : ''}" @click=${() => { this.aggregation = a; }}>${a}</button>
              `)}
            </div>
          </div>
        ` : nothing}

        ${this.formulaType === 'conditional' ? html`
          <div class="phz-ea-field">
            <label class="phz-ea-label">Condition</label>
            <div style="display:flex; gap:8px;">
              <input class="phz-ea-input" style="flex:1;" placeholder="Field" .value=${this.conditionField} @input=${(e: Event) => { this.conditionField = (e.target as HTMLInputElement).value; }}>
              <select class="phz-ea-select" style="width:100px;" .value=${this.conditionOperator} @change=${(e: Event) => { this.conditionOperator = (e.target as HTMLSelectElement).value; }}>
                <option value="equals">=</option>
                <option value="greaterThan">&gt;</option>
                <option value="lessThan">&lt;</option>
              </select>
              <input class="phz-ea-input" style="flex:1;" placeholder="Value" .value=${this.conditionValue} @input=${(e: Event) => { this.conditionValue = (e.target as HTMLInputElement).value; }}>
            </div>
          </div>
        ` : nothing}

        ${this.formulaType === 'composite' ? html`
          <div class="phz-ea-field">
            <label class="phz-ea-label">Expression</label>
            <textarea class="phz-ea-textarea" .value=${this.expression} @input=${(e: Event) => { this.expression = (e.target as HTMLTextAreaElement).value; }} placeholder="e.g. $sales / $orders * 100"></textarea>
          </div>
        ` : nothing}

        <div class="phz-ea-btn-group" style="margin-top:16px;">
          <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleSave}>Save Metric</button>
          <button class="phz-ea-btn" @click=${() => this.dispatchEvent(new CustomEvent('metric-cancel', { bubbles: true, composed: true }))}>Cancel</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-metric-builder': PhzMetricBuilder; }
}
