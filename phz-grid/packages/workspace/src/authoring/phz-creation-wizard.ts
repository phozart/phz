/**
 * @phozart/phz-workspace — Creation Wizard Component
 *
 * Minimal 3-step wizard: pick type -> pick data source -> pick template -> configure.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { DataSourceSchema } from '../data-adapter.js';
import {
  type CreationFlowState,
  initialCreationFlow,
  selectType,
  selectDataSource,
  selectTemplate,
  setName,
  nextStep,
  prevStep,
  canProceed,
  finishCreation,
} from './creation-flow.js';
import { suggestTemplatesForSource, type TemplateSuggestion } from './template-selection.js';

@safeCustomElement('phz-creation-wizard')
export class PhzCreationWizard extends LitElement {
  /** Available data sources to choose from */
  @property({ type: Array }) dataSources: Array<{ id: string; name: string }> = [];

  /** Schema for the selected data source (set externally after selection) */
  @property({ type: Object }) selectedSchema?: DataSourceSchema;

  @state() private _flow: CreationFlowState = initialCreationFlow();
  @state() private _suggestions: TemplateSuggestion[] = [];

  static styles = css`
    :host {
      display: block;
      max-width: 640px;
      margin: 0 auto;
      padding: 32px 24px;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    .step-indicator {
      display: flex;
      gap: 8px;
      margin-bottom: 32px;
      align-items: center;
    }

    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      background: var(--phz-bg-tertiary, #f3f4f6);
      color: var(--phz-text-secondary, #6b7280);
    }

    .step-dot.active {
      background: var(--phz-primary, #2563eb);
      color: #fff;
    }

    .step-dot.done {
      background: var(--phz-success, #16a34a);
      color: #fff;
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: var(--phz-border, #d1d5db);
    }

    h3 { margin: 0 0 16px; font-size: 18px; }

    .type-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .type-card {
      border: 2px solid var(--phz-border, #d1d5db);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .type-card:hover, .type-card.selected {
      border-color: var(--phz-primary, #2563eb);
    }

    .type-card h4 { margin: 0 0 4px; font-size: 16px; }
    .type-card p { margin: 0; font-size: 13px; color: var(--phz-text-secondary, #6b7280); }

    .source-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .source-item {
      padding: 12px 16px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    .source-item:hover, .source-item.selected {
      border-color: var(--phz-primary, #2563eb);
      background: var(--phz-bg-hover, #f0f7ff);
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .template-item {
      padding: 12px 16px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 8px;
      cursor: pointer;
    }

    .template-item:hover, .template-item.selected {
      border-color: var(--phz-primary, #2563eb);
      background: var(--phz-bg-hover, #f0f7ff);
    }

    .template-score {
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .name-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px;
      font-size: 15px;
      box-sizing: border-box;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
    }

    .btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .btn-secondary { background: transparent; border: 1px solid var(--phz-border, #d1d5db); }
    .btn-primary { background: var(--phz-primary, #2563eb); color: #fff; border: none; font-weight: 500; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('selectedSchema') && this.selectedSchema) {
      this._suggestions = suggestTemplatesForSource(this.selectedSchema);
    }
  }

  private _selectType(type: 'report' | 'dashboard'): void {
    this._flow = selectType(this._flow, type);
  }

  private _selectSource(id: string): void {
    this._flow = selectDataSource(this._flow, id);
    this.dispatchEvent(new CustomEvent('source-selected', {
      detail: { sourceId: id },
      bubbles: true, composed: true,
    }));
  }

  private _selectTemplate(id: string): void {
    this._flow = selectTemplate(this._flow, id);
  }

  private _setName(e: Event): void {
    this._flow = setName(this._flow, (e.target as HTMLInputElement).value);
  }

  private _next(): void {
    if (this._flow.step === 'configure') {
      const result = finishCreation(this._flow);
      if (result) {
        this.dispatchEvent(new CustomEvent('creation-complete', {
          detail: result,
          bubbles: true, composed: true,
        }));
      }
      return;
    }
    this._flow = nextStep(this._flow);
  }

  private _prev(): void {
    this._flow = prevStep(this._flow);
  }

  private _cancel(): void {
    this._flow = initialCreationFlow();
    this.dispatchEvent(new CustomEvent('creation-cancel', { bubbles: true, composed: true }));
  }

  private _getStepNumber(): number {
    const steps = ['choose-type', 'choose-source', 'choose-template', 'configure'];
    return steps.indexOf(this._flow.step) + 1;
  }

  override render() {
    const stepNum = this._getStepNumber();
    const totalSteps = this._flow.artifactType === 'report' ? 3 : 4;

    return html`
      <div class="step-indicator">
        ${Array.from({ length: totalSteps }, (_, i) => html`
          ${i > 0 ? html`<div class="step-line"></div>` : nothing}
          <div class="step-dot ${i + 1 < stepNum ? 'done' : i + 1 === stepNum ? 'active' : ''}">
            ${i + 1}
          </div>
        `)}
      </div>

      ${this._renderStep()}

      <div class="footer">
        <button class="btn btn-secondary" @click=${stepNum === 1 ? this._cancel : this._prev}>
          ${stepNum === 1 ? 'Cancel' : 'Back'}
        </button>
        <button class="btn btn-primary"
          ?disabled=${!canProceed(this._flow)}
          @click=${this._next}>
          ${this._flow.step === 'configure' ? 'Create' : 'Next'}
        </button>
      </div>
    `;
  }

  private _renderStep() {
    switch (this._flow.step) {
      case 'choose-type':
        return html`
          <h3>What would you like to create?</h3>
          <div class="type-cards">
            <div class="type-card ${this._flow.artifactType === 'report' ? 'selected' : ''}"
                 @click=${() => this._selectType('report')}
                 tabindex="0" role="button" aria-label="Create a report">
              <h4>Report</h4>
              <p>A configured data grid with columns, filters, and formatting</p>
            </div>
            <div class="type-card ${this._flow.artifactType === 'dashboard' ? 'selected' : ''}"
                 @click=${() => this._selectType('dashboard')}
                 tabindex="0" role="button" aria-label="Create a dashboard">
              <h4>Dashboard</h4>
              <p>A canvas of charts, KPIs, and widgets</p>
            </div>
          </div>
        `;

      case 'choose-source':
        return html`
          <h3>Select a data source</h3>
          <div class="source-list">
            ${this.dataSources.map(ds => html`
              <div class="source-item ${this._flow.dataSourceId === ds.id ? 'selected' : ''}"
                   @click=${() => this._selectSource(ds.id)}
                   tabindex="0" role="button">
                ${ds.name}
              </div>
            `)}
          </div>
        `;

      case 'choose-template':
        return html`
          <h3>Choose a template</h3>
          <div class="template-list">
            <div class="template-item ${this._flow.templateId === 'blank' ? 'selected' : ''}"
                 @click=${() => this._selectTemplate('blank')}
                 tabindex="0" role="button">
              <strong>Blank Dashboard</strong>
              <div class="template-score">Start from scratch</div>
            </div>
            ${this._suggestions.map(s => html`
              <div class="template-item ${this._flow.templateId === s.template.id ? 'selected' : ''}"
                   @click=${() => this._selectTemplate(s.template.id)}
                   tabindex="0" role="button">
                <strong>${s.template.name}</strong>
                <div class="template-score">${Math.round(s.score * 100)}% match - ${s.rationale}</div>
              </div>
            `)}
          </div>
        `;

      case 'configure':
        return html`
          <h3>Name your ${this._flow.artifactType}</h3>
          <input
            class="name-input"
            type="text"
            placeholder="Enter a name..."
            .value=${this._flow.name}
            @input=${this._setName}
            aria-label="Artifact name"
          />
        `;

      default:
        return nothing;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-creation-wizard': PhzCreationWizard;
  }
}
