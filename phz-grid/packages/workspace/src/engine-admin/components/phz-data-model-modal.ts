/**
 * @phozart/phz-engine-admin — Data Model Modal
 *
 * Centered 720px modal workspace for creating/editing data model entities.
 * Replaces the narrow 380px slide-over with guidance header, existing items
 * list, contextual tips, and the form content.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type {
  DataModelField, ParameterDef, CalculatedFieldDef,
} from '@phozart/phz-engine';
import type { MetricDef, KPIDefinition, BIEngine } from '@phozart/phz-engine';

import './phz-parameter-form.js';
import './phz-calculated-field-form.js';
import './phz-metric-form.js';
import './phz-kpi-form.js';

type EntityType = 'parameters' | 'calculatedFields' | 'metrics' | 'kpis';

interface EntityMeta {
  label: string;
  pluralLabel: string;
  color: string;
  icon: string;
  guidance: string;
  tip: string;
}

const ENTITY_META: Record<EntityType, EntityMeta> = {
  parameters: {
    label: 'Parameter',
    pluralLabel: 'Parameters',
    color: '#7C3AED',
    icon: '\u2699\uFE0F',
    guidance: 'Parameters are adjustable inputs that control dashboard behavior \u2014 targets, thresholds, weights. Users can change these without modifying the data model.',
    tip: 'Reference parameters in expressions with $name. Example: [salary] * $bonus_rate',
  },
  calculatedFields: {
    label: 'Calculated Field',
    pluralLabel: 'Calculated Fields',
    color: '#D97706',
    icon: '\uD83E\uDDEE',
    guidance: 'Calculated fields create new columns from existing data. They run on each row before any aggregation \u2014 perfect for transformations, ratios, and categorizations.',
    tip: 'Reference fields with [brackets], parameters with $dollar. Example: [rating] / [max_rating] * 100',
  },
  metrics: {
    label: 'Metric',
    pluralLabel: 'Metrics',
    color: '#3B82F6',
    icon: '\uD83D\uDCCA',
    guidance: 'Metrics aggregate data across all rows into a single value (sum, average, count, etc.). Use simple mode for single-field aggregation, or composite mode to combine multiple metrics.',
    tip: 'Reference other metrics with @name in composite mode. Example: @total_revenue / @headcount',
  },
  kpis: {
    label: 'KPI',
    pluralLabel: 'KPIs',
    color: '#16A34A',
    icon: '\uD83C\uDFAF',
    guidance: 'KPIs track key business outcomes with targets and status thresholds. Link a KPI to a metric to automatically compute its value from data.',
    tip: 'Use Custom Bands to define 2\u20135 colored status zones. Band thresholds can be dynamic \u2014 sourced from parameters or metrics.',
  },
};

@safeCustomElement('phz-data-model-modal')
export class PhzDataModelModal extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      :host { display: block; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

      .backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 999;
        opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
        display: flex; align-items: center; justify-content: center;
      }
      .backdrop--open { opacity: 1; pointer-events: auto; }

      .modal {
        width: 720px; max-width: 92vw; max-height: 85vh;
        background: white; border-radius: 14px; z-index: 1000;
        display: flex; flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
        transform: scale(0.95) translateY(10px);
        transition: transform 0.25s ease-out, opacity 0.25s ease-out;
        opacity: 0;
      }
      .backdrop--open .modal { transform: scale(1) translateY(0); opacity: 1; }

      /* ─── Header ─── */
      .modal-header {
        display: flex; align-items: center; gap: 12px;
        padding: 20px 24px 0;
      }
      .header-icon {
        width: 36px; height: 36px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
      }
      .header-title { font-size: 16px; font-weight: 700; color: #1C1917; flex: 1; }
      .close-btn {
        width: 32px; height: 32px; border: none; background: none;
        font-size: 20px; color: #78716C; cursor: pointer;
        border-radius: 6px; display: flex; align-items: center; justify-content: center;
      }
      .close-btn:hover { background: #F5F5F4; color: #1C1917; }

      /* ─── Guidance ─── */
      .guidance {
        padding: 12px 24px 16px;
        font-size: 13px; color: #57534E; line-height: 1.6;
        border-bottom: 1px solid #E7E5E4;
      }

      /* ─── Body: list + form ─── */
      .modal-body {
        display: flex; flex: 1; overflow: hidden; min-height: 0;
      }

      /* ── Left: existing items ── */
      .list-panel {
        width: 180px; flex-shrink: 0;
        border-right: 1px solid #E7E5E4;
        display: flex; flex-direction: column;
        overflow: hidden;
      }
      .list-title {
        font-size: 10px; font-weight: 700; color: #A8A29E;
        text-transform: uppercase; letter-spacing: 0.06em;
        padding: 12px 14px 8px;
      }
      .list-items {
        flex: 1; overflow-y: auto; padding: 0 8px;
      }
      .list-item {
        display: flex; align-items: center; gap: 8px;
        padding: 7px 8px; border-radius: 6px; cursor: pointer;
        transition: background 0.12s;
      }
      .list-item:hover { background: #F5F5F4; }
      .list-item--active { background: #EFF6FF; }
      .list-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .list-name {
        font-size: 12px; font-weight: 500; color: #1C1917;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .list-item--active .list-name { color: #3B82F6; font-weight: 600; }
      .list-sub {
        font-size: 10px; color: #A8A29E;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .list-new {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-top: 1px solid #E7E5E4;
        cursor: pointer; font-size: 12px; font-weight: 600; color: #3B82F6;
      }
      .list-new:hover { background: #EFF6FF; }

      .list-empty {
        padding: 12px 14px; font-size: 11px; color: #A8A29E; font-style: italic;
      }

      /* ── Right: form content ── */
      .form-panel {
        flex: 1; overflow-y: auto; padding: 16px 24px;
      }

      /* ─── Footer ─── */
      .modal-footer {
        display: flex; align-items: center; gap: 12px;
        padding: 14px 24px;
        border-top: 1px solid #E7E5E4;
        background: #FAFAF9;
        border-radius: 0 0 14px 14px;
      }
      .tip {
        flex: 1; font-size: 12px; color: #78716C; line-height: 1.5;
      }
      .tip strong { color: #44403C; }
      .tip code {
        background: #E7E5E4; padding: 1px 5px; border-radius: 3px;
        font-family: 'JetBrains Mono', monospace; font-size: 11px;
      }

      /* ── Touch targets ── */
      .close-btn { width: 44px; height: 44px; }
      .list-item { min-height: 44px; }
      .list-new { min-height: 44px; }

      /* ── Responsive: collapse list+form at 768px ── */
      @media (max-width: 768px) {
        .modal-body { flex-direction: column; }
        .list-panel {
          width: 100%; border-right: none;
          border-bottom: 1px solid #E7E5E4;
          max-height: 160px;
        }
        .list-items { flex-direction: row; flex-wrap: wrap; gap: 4px; }
      }

      /* ── Full-screen below 576px ── */
      @media (max-width: 576px) {
        .modal {
          width: 100%; max-width: 100%; max-height: 100%;
          border-radius: 0; height: 100%;
        }
        .modal-header { padding: 16px; }
        .guidance { padding: 12px 16px; }
        .form-panel { padding: 12px 16px; }
        .modal-footer { padding: 12px 16px; }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) entityType: EntityType = 'parameters';
  @property({ type: String }) editId?: string;

  // Data model context
  @property({ type: Array }) fields: DataModelField[] = [];
  @property({ type: Array }) parameters: ParameterDef[] = [];
  @property({ type: Array }) calculatedFields: CalculatedFieldDef[] = [];
  @property({ type: Array }) metrics: MetricDef[] = [];
  @property({ type: Array }) kpis: KPIDefinition[] = [];
  @property({ type: Array }) previewData: Record<string, unknown>[] = [];
  @property({ type: Object }) engine?: BIEngine;

  connectedCallback() {
    super.connectedCallback();
    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeyDown);
  }

  private _onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.open) {
      this._close();
    }
  }

  private _close() {
    this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
  }

  private _onBackdropClick(e: MouseEvent) {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      this._close();
    }
  }

  private _getExistingItems(): Array<{ id: string; name: string; sub: string }> {
    switch (this.entityType) {
      case 'parameters':
        return this.parameters.map(p => ({ id: p.id, name: p.name, sub: `${p.type} = ${p.defaultValue}` }));
      case 'calculatedFields':
        return this.calculatedFields.map(c => ({ id: c.id, name: c.name, sub: c.outputType }));
      case 'metrics':
        return this.metrics.map(m => ({
          id: m.id, name: m.name,
          sub: m.formula.type === 'simple'
            ? `${m.formula.aggregation}(${m.formula.field})`
            : m.formula.type === 'expression' ? 'expression' : m.formula.type,
        }));
      case 'kpis':
        return this.kpis.map(k => ({ id: k.id, name: k.name, sub: `target: ${k.target}` }));
      default:
        return [];
    }
  }

  private _selectItem(id: string) {
    this.editId = id;
    this.dispatchEvent(new CustomEvent('modal-select', {
      bubbles: true, composed: true,
      detail: { entityType: this.entityType, id },
    }));
  }

  private _createNew() {
    this.editId = undefined;
    this.requestUpdate();
  }

  private _getEditEntity(): unknown {
    if (!this.editId) return undefined;
    switch (this.entityType) {
      case 'parameters':
        return this.parameters.find(p => p.id === this.editId);
      case 'calculatedFields':
        return this.calculatedFields.find(c => c.id === this.editId);
      case 'metrics':
        return this.metrics.find(m => m.id === this.editId);
      case 'kpis':
        return this.kpis.find(k => k.id === this.editId);
      default:
        return undefined;
    }
  }

  private _renderForm() {
    const isEdit = !!this.editId;

    switch (this.entityType) {
      case 'parameters':
        return html`
          <phz-parameter-form
            .parameter=${this._getEditEntity() as ParameterDef | undefined}
            .isEdit=${isEdit}
            @parameter-save=${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('parameter-save', { bubbles: true, composed: true, detail: e.detail }))}
            @parameter-cancel=${this._close}
          ></phz-parameter-form>
        `;
      case 'calculatedFields':
        return html`
          <phz-calculated-field-form
            .calculatedField=${this._getEditEntity() as CalculatedFieldDef | undefined}
            .isEdit=${isEdit}
            .fields=${this.fields}
            .parameters=${this.parameters}
            .calculatedFields=${this.calculatedFields}
            .previewData=${this.previewData.slice(0, 3)}
            @calculated-field-save=${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('calculated-field-save', { bubbles: true, composed: true, detail: e.detail }))}
            @calculated-field-cancel=${this._close}
          ></phz-calculated-field-form>
        `;
      case 'metrics':
        return html`
          <phz-metric-form
            .metric=${this._getEditEntity() as MetricDef | undefined}
            .isEdit=${isEdit}
            .fields=${this.fields}
            .parameters=${this.parameters}
            .calculatedFields=${this.calculatedFields}
            .metrics=${this.metrics}
            @metric-save=${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('metric-save', { bubbles: true, composed: true, detail: e.detail }))}
            @metric-cancel=${this._close}
          ></phz-metric-form>
        `;
      case 'kpis':
        return html`
          <phz-kpi-form
            .kpi=${this._getEditEntity() as KPIDefinition | undefined}
            .isEdit=${isEdit}
            .metrics=${this.metrics}
            .parameters=${this.parameters}
            @kpi-save=${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('kpi-save', { bubbles: true, composed: true, detail: e.detail }))}
            @kpi-cancel=${this._close}
          ></phz-kpi-form>
        `;
      default:
        return nothing;
    }
  }

  render() {
    const meta = ENTITY_META[this.entityType];
    if (!meta) return nothing;

    const items = this._getExistingItems();
    const isEdit = !!this.editId;
    const heading = `${isEdit ? 'Edit' : 'Create'} ${meta.label}`;
    const iconBg = `${meta.color}18`; // ~10% opacity via hex alpha

    return html`
      <div class="backdrop ${this.open ? 'backdrop--open' : ''}"
           @click=${this._onBackdropClick}>
        <div class="modal" role="dialog" aria-label=${heading}
             @click=${(e: Event) => e.stopPropagation()}>

          <!-- Header -->
          <div class="modal-header">
            <div class="header-icon" style="background: ${iconBg};">
              ${meta.icon}
            </div>
            <div class="header-title">${heading}</div>
            <button class="close-btn" @click=${this._close} aria-label="Close">&times;</button>
          </div>

          <!-- Guidance -->
          <div class="guidance">${meta.guidance}</div>

          <!-- Body -->
          <div class="modal-body">

            <!-- Left: existing items -->
            <div class="list-panel">
              <div class="list-title">Existing</div>
              <div class="list-items">
                ${items.length === 0
                  ? html`<div class="list-empty">None yet</div>`
                  : items.map(item => html`
                    <div class="list-item ${item.id === this.editId ? 'list-item--active' : ''}"
                         @click=${() => this._selectItem(item.id)}>
                      <span class="list-dot" style="background: ${meta.color};"></span>
                      <div style="min-width:0;">
                        <div class="list-name">${item.name}</div>
                        <div class="list-sub">${item.sub}</div>
                      </div>
                    </div>
                  `)
                }
              </div>
              <div class="list-new" @click=${this._createNew}>+ New</div>
            </div>

            <!-- Right: form -->
            <div class="form-panel">
              ${this._renderForm()}
            </div>

          </div>

          <!-- Footer tip -->
          <div class="modal-footer">
            <div class="tip"><strong>TIP:</strong> ${meta.tip}</div>
          </div>

        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-data-model-modal': PhzDataModelModal; }
}
