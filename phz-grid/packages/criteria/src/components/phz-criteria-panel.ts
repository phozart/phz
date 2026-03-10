/**
 * @phozart/phz-criteria — Criteria Panel
 *
 * Main facade. Renders header, fields grid, Apply/Reset bar, summary strip, preset manager.
 * Monochrome icons, Phz UI console mode.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  CriteriaConfig,
  SelectionContext,
  SelectionPreset,
  SelectionFieldOption,
  SelectionValidationResult,
} from '@phozart/phz-core';
import {
  resolveDynamicDefaults,
  resolveDependencies,
  validateCriteria,
} from '@phozart/phz-engine';
import { criteriaStyles } from '../shared-styles.js';

import './phz-criteria-field.js';
import './phz-criteria-summary.js';
import './phz-preset-manager.js';

const ICON_FUNNEL = html`<svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"><path d="M40 48h176l-64 80v56l-48 24V128Z"/></svg>`;
const ICON_CHEVRON = html`<svg width="12" height="12" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><polyline points="80,48 176,128 80,208"/></svg>`;

@customElement('phz-criteria-panel')
export class PhzCriteriaPanel extends LitElement {
  static styles = [criteriaStyles, css`
    .phz-sc-validation-errors {
      padding: 8px 16px;
      background: #FEF2F2;
      border-top: 1px solid #FECACA;
    }
    .phz-sc-panel-header-icon {
      display: flex;
      align-items: center;
      color: #78716C;
    }
    .phz-sc-panel-toggle {
      display: flex;
      align-items: center;
      color: #78716C;
      transition: transform 0.2s cubic-bezier(0.0, 0.0, 0.2, 1);
    }
    .phz-sc-panel-toggle--expanded {
      transform: rotate(90deg);
    }
  `];

  @property({ type: Object }) criteriaConfig: CriteriaConfig | null = null;
  @property({ type: Object }) selectionContext: SelectionContext = {};
  @property({ type: Array }) presets: SelectionPreset[] = [];
  @property({ attribute: false }) optionsData: Record<string, SelectionFieldOption[]> = {};
  @property({ type: String }) currentUserId = '';

  @state() private _pendingContext: SelectionContext = {};
  @state() private _panelExpanded = true;
  @state() private _validationResult: SelectionValidationResult = { valid: true, errors: [] };

  connectedCallback() {
    super.connectedCallback();
    this._initDefaults();
  }

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('criteriaConfig') && this.criteriaConfig) {
      this._initDefaults();
    }
  }

  private _initDefaults() {
    if (!this.criteriaConfig) return;
    const defaults = resolveDynamicDefaults(this.criteriaConfig);
    this._pendingContext = { ...defaults, ...this.selectionContext };
  }

  private get _autoApply() {
    return this.criteriaConfig?.behavior?.autoApply ?? false;
  }

  private get _showSummary() {
    return this.criteriaConfig?.behavior?.showSummaryStrip !== false;
  }

  private get _showPresets() {
    return this.criteriaConfig?.behavior?.showPresetManager !== false;
  }

  private get _showReset() {
    return this.criteriaConfig?.behavior?.showResetButton !== false;
  }

  private _getFieldOptions(): Map<string, SelectionFieldOption[]> {
    if (!this.criteriaConfig) return new Map();
    const depResolved = resolveDependencies(this.criteriaConfig, this._pendingContext);
    for (const [key, opts] of Object.entries(this.optionsData ?? {})) {
      if (!depResolved.has(key)) depResolved.set(key, opts);
    }
    return depResolved;
  }

  private _onFieldChange(e: CustomEvent<{ fieldId: string; value: string | string[] | null }>) {
    const { fieldId, value } = e.detail;
    this._pendingContext = { ...this._pendingContext, [fieldId]: value };

    this.dispatchEvent(new CustomEvent('criteria-change', {
      detail: { field: fieldId, value, values: this._pendingContext },
      bubbles: true, composed: true,
    }));

    if (this._autoApply) {
      this._apply();
    }
  }

  private _apply() {
    if (!this.criteriaConfig) return;
    const validation = validateCriteria(this.criteriaConfig, this._pendingContext);
    this._validationResult = validation;
    if (!validation.valid) return;

    this.dispatchEvent(new CustomEvent('criteria-apply', {
      detail: { values: { ...this._pendingContext } },
      bubbles: true, composed: true,
    }));
  }

  private _reset() {
    if (!this.criteriaConfig) return;
    const defaults = resolveDynamicDefaults(this.criteriaConfig);
    this._pendingContext = defaults;
    this._validationResult = { valid: true, errors: [] };

    this.dispatchEvent(new CustomEvent('criteria-reset', {
      detail: { values: defaults },
      bubbles: true, composed: true,
    }));

    if (this._autoApply) {
      this.dispatchEvent(new CustomEvent('criteria-apply', {
        detail: { values: defaults },
        bubbles: true, composed: true,
      }));
    }
  }

  private _togglePanel() {
    this._panelExpanded = !this._panelExpanded;
  }

  private _onPresetLoad(e: CustomEvent<{ preset: SelectionPreset }>) {
    this._pendingContext = { ...e.detail.preset.values };
    if (this._autoApply) this._apply();
  }

  private _onSummaryClick() {
    this._panelExpanded = true;
  }

  render() {
    if (!this.criteriaConfig) return nothing;
    const fieldOptions = this._getFieldOptions();
    const fields = this.criteriaConfig.fields;

    return html`
      <div class="phz-sc-panel">
        <div class="phz-sc-panel-header" @click=${this._togglePanel}>
          <span class="phz-sc-panel-title">
            <span class="phz-sc-panel-header-icon">${ICON_FUNNEL}</span>
            Selection Criteria
          </span>
          <span class="phz-sc-panel-toggle ${this._panelExpanded ? 'phz-sc-panel-toggle--expanded' : ''}">${ICON_CHEVRON}</span>
        </div>

        ${this._panelExpanded ? html`
          <div class="phz-sc-fields">
            ${fields.map(field => html`
              <phz-criteria-field
                .fieldDef=${field}
                .value=${this._pendingContext[field.id] ?? null}
                .filteredOptions=${fieldOptions.get(field.id) ?? []}
                .locked=${!!field.lockedValue}
                @field-change=${this._onFieldChange}
              ></phz-criteria-field>
            `)}
          </div>

          ${!this._validationResult.valid ? html`
            <div class="phz-sc-validation-errors">
              ${this._validationResult.errors.map(err => html`
                <div class="phz-sc-error">${err.message}</div>
              `)}
            </div>
          ` : nothing}

          ${!this._autoApply ? html`
            <div class="phz-sc-actions">
              <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._apply}>Apply</button>
              ${this._showReset ? html`
                <button class="phz-sc-btn" @click=${this._reset}>Reset</button>
              ` : nothing}
              <div style="flex:1"></div>
              ${this._showPresets ? html`
                <phz-preset-manager
                  .presets=${this.presets}
                  .currentUserId=${this.currentUserId}
                  @preset-load=${this._onPresetLoad}
                ></phz-preset-manager>
              ` : nothing}
            </div>
          ` : nothing}
        ` : nothing}

        ${!this._panelExpanded && this._showSummary ? html`
          <phz-criteria-summary
            .criteriaConfig=${this.criteriaConfig}
            .selectionContext=${this._pendingContext}
            @summary-click=${this._onSummaryClick}
          ></phz-criteria-summary>
        ` : nothing}
      </div>
    `;
  }
}
