/**
 * @phozart/criteria - Rule Editor Modal
 *
 * Modal dialog for creating, editing, and copying filter rules.
 * Shows type-specific form fields with guidance for each rule type.
 * CSS prefix: phz-rem-
 *
 * Events:
 * - rule-editor-save: { rule: FilterRule, mode: 'add' | 'edit' | 'copy' }
 * - rule-editor-cancel: {}
 * - rule-editor-delete: { ruleId: string }
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type {
  FilterRule, FilterDefinition, FilterDefinitionId,
  FilterRuleType, FilterRuleConfig,
  ExcludePatternConfig, IncludePatternConfig,
  ValueSetConfig, TreeGroupCompareConfig, CustomRuleConfig,
  CrossFilterConfig, CrossFilterCondition, CrossFilterAction,
  CrossFilterConditionOperator, CrossFilterActionType, CrossFilterElseActionType,
} from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';
import { criteriaStyles } from '@phozart/criteria/shared-styles';
// Consumer component — registered via @phozart/criteria
import '@phozart/criteria';

export type RuleEditorMode = 'add' | 'edit' | 'copy';

interface RuleTypeInfo {
  value: FilterRuleType;
  label: string;
  description: string;
  icon: string;
}

const RULE_TYPES: RuleTypeInfo[] = [
  {
    value: 'exclude_pattern',
    label: 'Exclude Pattern',
    description: 'Regex pattern to remove matching options by value or label.',
    icon: '\u2212',
  },
  {
    value: 'include_pattern',
    label: 'Include Pattern',
    description: 'Regex pattern to keep only matching options by value or label.',
    icon: '+',
  },
  {
    value: 'value_set',
    label: 'Value Set',
    description: 'Explicitly include or exclude a list of specific values.',
    icon: '\u2261',
  },
  {
    value: 'tree_group_compare',
    label: 'Tree Group Compare',
    description: 'Match tree nodes by comparing a field with an operator.',
    icon: '\u25B7',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Use a registered custom evaluator function with parameters.',
    icon: '\u2699',
  },
  {
    value: 'cross_filter',
    label: 'Cross Filter',
    description: 'Link filters together \u2014 control options based on another filter\'s selection or a runtime parameter.',
    icon: '\u21C4',
  },
];

const RULE_TYPE_OPTIONS = RULE_TYPES.map(t => ({ value: t.value, label: t.label }));

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In (set)' },
  { value: 'not_in', label: 'Not In (set)' },
];

const CROSS_FILTER_CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not In' },
  { value: 'is_set', label: 'Is Set' },
  { value: 'is_not_set', label: 'Is Not Set' },
];

const VALUE_SET_MODE_OPTIONS = [
  { value: 'include', label: 'Include Only' },
  { value: 'exclude', label: 'Exclude' },
];

function defaultConfigForType(type: FilterRuleType): FilterRuleConfig {
  switch (type) {
    case 'exclude_pattern':
      return { type: 'exclude_pattern', pattern: '', flags: 'i' };
    case 'include_pattern':
      return { type: 'include_pattern', pattern: '', flags: 'i' };
    case 'value_set':
      return { type: 'value_set', mode: 'exclude', values: [] };
    case 'tree_group_compare':
      return { type: 'tree_group_compare', groupField: '', operator: 'equals', value: '' };
    case 'custom':
      return { type: 'custom', evaluatorKey: '' };
    case 'cross_filter':
      return {
        type: 'cross_filter',
        conditions: [{ source: 'filter' as const, key: '', operator: 'equals' as const, values: [] }],
        logic: 'all' as const,
        action: { type: 'include_values' as const, values: [] },
      };
  }
}

@safeCustomElement('phz-rule-editor-modal')
export class PhzRuleEditorModal extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; }

    /* -- Backdrop -- */
    .phz-rem-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(28, 25, 23, 0.4);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: phz-rem-fade-in 150ms ease forwards;
    }

    @keyframes phz-rem-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* -- Panel -- */
    .phz-rem-panel {
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(28, 25, 23, 0.2), 0 4px 16px rgba(28, 25, 23, 0.08);
      width: 560px;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: phz-rem-slide-in 200ms cubic-bezier(0, 0, 0.2, 1) forwards;
    }

    @keyframes phz-rem-slide-in {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* -- Header -- */
    .phz-rem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #E7E5E4;
      background: #FAFAF9;
    }

    .phz-rem-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .phz-rem-header-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #1C1917;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .phz-rem-title {
      font-size: 15px;
      font-weight: 700;
      color: #1C1917;
    }

    .phz-rem-subtitle {
      font-size: 11px;
      color: #78716C;
      margin-top: 1px;
    }

    .phz-rem-close {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      color: #78716C;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .phz-rem-close:hover { background: #F5F5F4; color: #1C1917; }
    .phz-rem-close:focus-visible { outline: 2px solid #EF4444; outline-offset: 2px; }

    /* -- Body -- */
    .phz-rem-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .phz-rem-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* -- Field rows -- */
    .phz-rem-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .phz-rem-label {
      font-size: 12px;
      font-weight: 600;
      color: #44403C;
    }

    .phz-rem-label--required::after {
      content: ' *';
      color: #EF4444;
    }

    .phz-rem-hint {
      font-size: 11px;
      color: #A8A29E;
      line-height: 1.4;
    }

    .phz-rem-input {
      padding: 8px 12px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      color: #1C1917;
      background: #FFFFFF;
      transition: border-color 0.15s;
    }

    .phz-rem-input:focus {
      outline: none;
      border-color: #1C1917;
      box-shadow: 0 0 0 3px rgba(28, 25, 23, 0.08);
    }

    .phz-rem-input--error {
      border-color: #EF4444;
    }

    .phz-rem-input--error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .phz-rem-textarea {
      padding: 8px 12px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      color: #1C1917;
      background: #FFFFFF;
      resize: vertical;
      min-height: 80px;
      line-height: 1.5;
      transition: border-color 0.15s;
    }

    .phz-rem-textarea:focus {
      outline: none;
      border-color: #1C1917;
      box-shadow: 0 0 0 3px rgba(28, 25, 23, 0.08);
    }

    .phz-rem-error {
      font-size: 11px;
      color: #EF4444;
      margin-top: 2px;
    }

    /* -- Rule type selector -- */
    .phz-rem-type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .phz-rem-type-card {
      padding: 10px 12px;
      border: 2px solid #E7E5E4;
      border-radius: 10px;
      background: #FFFFFF;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
      font-family: inherit;
    }

    .phz-rem-type-card:hover { border-color: #A8A29E; background: #FAFAF9; }

    .phz-rem-type-card--selected {
      border-color: #1C1917;
      background: #FAFAF9;
    }

    .phz-rem-type-card:focus-visible { outline: 2px solid #EF4444; outline-offset: 2px; }

    .phz-rem-type-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .phz-rem-type-card-icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: #F5F5F4;
      color: #44403C;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .phz-rem-type-card--selected .phz-rem-type-card-icon {
      background: #1C1917;
      color: #FFFFFF;
    }

    .phz-rem-type-card-name {
      font-size: 12px;
      font-weight: 600;
      color: #1C1917;
    }

    .phz-rem-type-card-desc {
      font-size: 11px;
      color: #78716C;
      margin-top: 4px;
      line-height: 1.3;
    }

    /* -- Type info box -- */
    .phz-rem-type-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      background: #F0F9FF;
      border: 1px solid #BAE6FD;
      border-radius: 8px;
      font-size: 12px;
      color: #0369A1;
      line-height: 1.4;
    }

    .phz-rem-type-info-icon {
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* -- Regex preview -- */
    .phz-rem-regex-preview {
      padding: 8px 12px;
      background: #F5F5F4;
      border-radius: 8px;
      font-size: 12px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      color: #44403C;
    }

    .phz-rem-regex-valid { color: #16A34A; }
    .phz-rem-regex-invalid { color: #EF4444; }

    /* -- Inline row (side-by-side fields) -- */
    .phz-rem-row {
      display: flex;
      gap: 12px;
    }

    .phz-rem-row > .phz-rem-field { flex: 1; }
    .phz-rem-row > .phz-rem-field--narrow { flex: 0 0 100px; }

    /* -- Toggle -- */
    .phz-rem-toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .phz-rem-toggle {
      width: 40px;
      height: 22px;
      border-radius: 11px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .phz-rem-toggle--on { background: #1C1917; }
    .phz-rem-toggle--off { background: #D6D3D1; }

    .phz-rem-toggle::after {
      content: '';
      position: absolute;
      top: 2px;
      width: 18px;
      height: 18px;
      border-radius: 9px;
      background: #FFFFFF;
      transition: left 0.2s;
    }

    .phz-rem-toggle--on::after { left: 20px; }
    .phz-rem-toggle--off::after { left: 2px; }

    .phz-rem-toggle-label {
      font-size: 13px;
      color: #1C1917;
    }

    /* -- Divider -- */
    .phz-rem-divider {
      height: 1px;
      background: #E7E5E4;
      margin: 4px 0;
    }

    /* -- Section heading -- */
    .phz-rem-section {
      font-size: 11px;
      font-weight: 700;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* -- Footer -- */
    .phz-rem-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-top: 1px solid #E7E5E4;
      background: #FAFAF9;
    }

    .phz-rem-footer-left {
      display: flex;
      gap: 8px;
    }

    .phz-rem-footer-right {
      display: flex;
      gap: 8px;
    }

    .phz-rem-btn {
      padding: 8px 16px;
      border: 1px solid #D6D3D1;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      background: #FFFFFF;
      color: #1C1917;
      transition: all 0.15s;
    }

    .phz-rem-btn:hover { background: #F5F5F4; border-color: #A8A29E; }
    .phz-rem-btn:focus-visible { outline: 2px solid #EF4444; outline-offset: 2px; }

    .phz-rem-btn--primary {
      background: #1C1917;
      color: #FFFFFF;
      border-color: #1C1917;
    }

    .phz-rem-btn--primary:hover { background: #292524; }

    .phz-rem-btn--danger {
      color: #DC2626;
      border-color: #FECACA;
    }

    .phz-rem-btn--danger:hover { background: #FEF2F2; border-color: #EF4444; }

    .phz-rem-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* -- Touch targets -- */
    .phz-rem-btn { min-height: 44px; min-width: 44px; }

    /* -- Animations -- */
    @media (prefers-reduced-motion: reduce) {
      .phz-rem-backdrop { animation: none; }
      .phz-rem-panel { animation: none; }
      .phz-rem-toggle { transition: none; }
      .phz-rem-toggle::after { transition: none; }
    }

    /* -- Full-screen below 576px -- */
    @media (max-width: 576px) {
      .phz-rem-backdrop { padding: 0; }
      .phz-rem-panel {
        width: 100%; max-width: 100%; max-height: 100%;
        border-radius: 0; height: 100%;
      }
    }
  `];

  /** The rule being edited/copied (null for new) */
  @property({ type: Object }) rule: FilterRule | null = null;

  /** Available filter definitions for the definition picker */
  @property({ type: Array }) definitions: FilterDefinition[] = [];

  /** Editor mode */
  @property({ type: String }) mode: RuleEditorMode = 'add';

  /** Whether the modal is open */
  @property({ type: Boolean, reflect: true }) open = false;

  /** Highest existing priority (new rules get this + 1) */
  @property({ type: Number }) maxPriority = 0;

  // -- Internal state --
  @state() private _type: FilterRuleType = 'exclude_pattern';
  @state() private _description = '';
  @state() private _filterDefId: FilterDefinitionId | '' = '';
  @state() private _priority = 0;
  @state() private _enabled = true;

  // Pattern config
  @state() private _pattern = '';
  @state() private _flags = 'i';

  // Value set config
  @state() private _vsMode: 'include' | 'exclude' = 'exclude';
  @state() private _vsValues = '';

  // Tree group compare config
  @state() private _tgField = '';
  @state() private _tgOperator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' = 'equals';
  @state() private _tgValue = '';
  @state() private _tgValues = '';

  // Custom config
  @state() private _customKey = '';
  @state() private _customParams = '';

  // Cross-filter config
  @state() private _cfConditions: CrossFilterCondition[] = [{ source: 'filter', key: '', operator: 'equals', values: [] }];
  @state() private _cfLogic: 'all' | 'any' = 'all';
  @state() private _cfValueSource: 'fixed' | 'context' = 'fixed';
  @state() private _cfBehavior: 'include' | 'exclude' = 'include';
  @state() private _cfActionValues = '';
  @state() private _cfActionContextKey = '';
  @state() private _cfElseAction: CrossFilterElseActionType = 'pass_through';

  // Validation
  @state() private _errors: Record<string, string> = {};
  @state() private _submitted = false;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open') && this.open) {
      this._initFromRule();
    }
  }

  private _initFromRule() {
    this._submitted = false;
    this._errors = {};

    if (this.rule) {
      this._type = this.rule.type;
      this._description = this.mode === 'copy'
        ? (this.rule.description ?? '') + ' (Copy)'
        : (this.rule.description ?? '');
      this._filterDefId = this.rule.filterDefinitionId;
      this._priority = this.mode === 'copy' ? this.maxPriority + 1 : this.rule.priority;
      this._enabled = this.mode === 'copy' ? true : this.rule.enabled;

      const config = this.rule.config;
      switch (config.type) {
        case 'exclude_pattern':
        case 'include_pattern':
          this._pattern = config.pattern;
          this._flags = config.flags ?? 'i';
          break;
        case 'value_set':
          this._vsMode = config.mode;
          this._vsValues = config.values.join('\n');
          break;
        case 'tree_group_compare':
          this._tgField = config.groupField;
          this._tgOperator = config.operator;
          this._tgValue = config.value;
          this._tgValues = (config.values ?? []).join('\n');
          break;
        case 'custom':
          this._customKey = config.evaluatorKey;
          this._customParams = config.params ? JSON.stringify(config.params, null, 2) : '';
          break;
        case 'cross_filter':
          this._cfConditions = config.conditions.map(c => ({ ...c }));
          this._cfLogic = config.logic;
          if (config.action.type === 'include_from_context' || config.action.type === 'exclude_from_context') {
            this._cfValueSource = 'context';
            this._cfBehavior = config.action.type === 'include_from_context' ? 'include' : 'exclude';
          } else {
            this._cfValueSource = 'fixed';
            this._cfBehavior = config.action.type === 'include_values' ? 'include' : 'exclude';
          }
          this._cfActionValues = (config.action.values ?? []).join('\n');
          this._cfActionContextKey = config.action.contextKey ?? '';
          this._cfElseAction = config.elseAction ?? 'pass_through';
          break;
      }
    } else {
      this._type = 'exclude_pattern';
      this._description = '';
      this._filterDefId = (this.definitions ?? []).length === 1 ? (this.definitions ?? [])[0].id : '';
      this._priority = this.maxPriority + 1;
      this._enabled = true;
      this._pattern = '';
      this._flags = 'i';
      this._vsMode = 'exclude';
      this._vsValues = '';
      this._tgField = '';
      this._tgOperator = 'equals';
      this._tgValue = '';
      this._tgValues = '';
      this._customKey = '';
      this._customParams = '';
      this._cfConditions = [{ source: 'filter', key: '', operator: 'equals', values: [] }];
      this._cfLogic = 'all';
      this._cfValueSource = 'fixed';
      this._cfBehavior = 'include';
      this._cfActionValues = '';
      this._cfActionContextKey = '';
      this._cfElseAction = 'pass_through';
    }
  }

  render() {
    if (!this.open) return nothing;

    const titles: Record<RuleEditorMode, string> = {
      add: 'Add New Rule',
      edit: 'Edit Rule',
      copy: 'Copy Rule',
    };

    const subtitles: Record<RuleEditorMode, string> = {
      add: 'Define how filter options are constrained',
      edit: 'Modify rule configuration',
      copy: 'Create a new rule from an existing one',
    };

    return html`
      <div class="phz-rem-backdrop" @click=${this._handleBackdropClick}
           @keydown=${this._handleKeydown}>
        <div class="phz-rem-panel"
             @click=${(e: Event) => e.stopPropagation()}
             role="dialog" aria-modal="true" aria-label=${titles[this.mode]}>

          <div class="phz-rem-header">
            <div class="phz-rem-header-left">
              <div class="phz-rem-header-icon">${this.mode === 'add' ? '+' : this.mode === 'copy' ? '\u29C9' : '\u270E'}</div>
              <div>
                <div class="phz-rem-title">${titles[this.mode]}</div>
                <div class="phz-rem-subtitle">${subtitles[this.mode]}</div>
              </div>
            </div>
            <button class="phz-rem-close" @click=${this._cancel} aria-label="Close">\u2715</button>
          </div>

          <div class="phz-rem-body">
            <div class="phz-rem-form">
              ${this._renderDescriptionField()}
              ${this._renderDefinitionPicker()}
              <div class="phz-rem-divider"></div>
              <span class="phz-rem-section">Rule Type</span>
              ${this._renderTypeSelector()}
              ${this._renderTypeInfo()}
              <div class="phz-rem-divider"></div>
              <span class="phz-rem-section">Configuration</span>
              ${this._renderTypeFields()}
              <div class="phz-rem-divider"></div>
              ${this._renderPriorityAndEnabled()}
            </div>
          </div>

          <div class="phz-rem-footer">
            <div class="phz-rem-footer-left">
              ${this.mode === 'edit' ? html`
                <button class="phz-rem-btn phz-rem-btn--danger" @click=${this._delete}>Delete Rule</button>
              ` : nothing}
            </div>
            <div class="phz-rem-footer-right">
              <button class="phz-rem-btn" @click=${this._cancel}>Cancel</button>
              <button class="phz-rem-btn phz-rem-btn--primary" @click=${this._save}>
                ${this.mode === 'add' ? 'Add Rule' : this.mode === 'copy' ? 'Create Copy' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // -- Field Renderers --

  private _renderDescriptionField() {
    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label">Description</label>
        <input class="phz-rem-input" type="text"
               placeholder="e.g. Exclude discontinued products, Include active regions only"
               .value=${this._description}
               @input=${(e: Event) => { this._description = (e.target as HTMLInputElement).value; this._clearError('description'); }}>
        <span class="phz-rem-hint">A human-readable name to describe what this rule does</span>
      </div>
    `;
  }

  private _renderDefinitionPicker() {
    const nonDeprecated = (this.definitions ?? []).filter(d => !d.deprecated);
    const options = nonDeprecated.map(d => ({ value: d.id, label: d.label }));
    const hasError = this._submitted && this._errors['filterDefId'];

    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Filter Definition</label>
        <phz-combobox
          .options=${options}
          .value=${this._filterDefId}
          .allowEmpty=${false}
          empty-label="\u2014 Select a filter \u2014"
          @combobox-change=${(e: CustomEvent) => { this._filterDefId = (e.detail as { value: string }).value as FilterDefinitionId; this._clearError('filterDefId'); }}
        ></phz-combobox>
        ${hasError ? html`<span class="phz-rem-error">${this._errors['filterDefId']}</span>` : nothing}
        <span class="phz-rem-hint">The filter definition this rule applies to</span>
      </div>
    `;
  }

  private _renderTypeSelector() {
    return html`
      <div class="phz-rem-type-grid">
        ${RULE_TYPES.map(rt => html`
          <button class="phz-rem-type-card ${this._type === rt.value ? 'phz-rem-type-card--selected' : ''}"
                  @click=${() => this._changeType(rt.value)}
                  aria-pressed="${this._type === rt.value}">
            <div class="phz-rem-type-card-header">
              <span class="phz-rem-type-card-icon">${rt.icon}</span>
              <span class="phz-rem-type-card-name">${rt.label}</span>
            </div>
            <div class="phz-rem-type-card-desc">${rt.description}</div>
          </button>
        `)}
      </div>
    `;
  }

  private _renderTypeInfo() {
    const info = this._getTypeGuidance();
    if (!info) return nothing;

    return html`
      <div class="phz-rem-type-info">
        <span class="phz-rem-type-info-icon">\u24D8</span>
        <span>${info}</span>
      </div>
    `;
  }

  private _getTypeGuidance(): string {
    switch (this._type) {
      case 'exclude_pattern':
        return 'Enter a regular expression. Options whose value or label matches will be removed. Example: "^TEST_" excludes values starting with TEST_. Use flags "i" for case-insensitive matching.';
      case 'include_pattern':
        return 'Enter a regular expression. Only options whose value or label matches will be kept. Example: "ACTIVE" keeps only values containing ACTIVE. Use flags "i" for case-insensitive matching.';
      case 'value_set':
        return 'Enter specific values, one per line. Choose "Include Only" to show only these values, or "Exclude" to hide them from the filter options.';
      case 'tree_group_compare':
        return 'Match tree nodes by comparing a field with an operator. Useful for hierarchical filters where you want to show only certain branches.';
      case 'custom':
        return 'Reference a custom evaluator registered via ruleEngine.registerCustomEvaluator(key, fn). The evaluator receives (params, options, treeNodes, context) and returns { included, excluded } arrays. Optional JSON parameters are passed as the first argument.';
      case 'cross_filter':
        return 'Set up a dependency between filters. Example: "When the Status filter equals Active, show only certain options in this filter." Values can come from a fixed list or be read from runtime context.';
    }
  }

  private _renderTypeFields() {
    switch (this._type) {
      case 'exclude_pattern':
      case 'include_pattern':
        return this._renderPatternFields();
      case 'value_set':
        return this._renderValueSetFields();
      case 'tree_group_compare':
        return this._renderTreeGroupFields();
      case 'custom':
        return this._renderCustomFields();
      case 'cross_filter':
        return this._renderCrossFilterFields();
    }
  }

  private _renderPatternFields() {
    const regexValid = this._validateRegex();
    const hasPatternError = this._submitted && this._errors['pattern'];

    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Pattern (regex)</label>
        <input class="phz-rem-input ${hasPatternError ? 'phz-rem-input--error' : ''}" type="text"
               placeholder="e.g. ^TEST_|_DEV$"
               .value=${this._pattern}
               @input=${(e: Event) => { this._pattern = (e.target as HTMLInputElement).value; this._clearError('pattern'); }}>
        ${hasPatternError ? html`<span class="phz-rem-error">${this._errors['pattern']}</span>` : nothing}
        <span class="phz-rem-hint">Regular expression to match against option values and labels. Max 500 characters.</span>
      </div>
      <div class="phz-rem-field phz-rem-field--narrow">
        <label class="phz-rem-label">Flags</label>
        <input class="phz-rem-input" type="text"
               placeholder="i"
               .value=${this._flags}
               @input=${(e: Event) => { this._flags = (e.target as HTMLInputElement).value; }}>
        <span class="phz-rem-hint">Common: "i" (case-insensitive), "g" (global)</span>
      </div>
      ${this._pattern ? html`
        <div class="phz-rem-regex-preview">
          ${regexValid
            ? html`<span class="phz-rem-regex-valid">Valid regex: /${this._pattern}/${this._flags}</span>`
            : html`<span class="phz-rem-regex-invalid">Invalid regex - check your pattern syntax</span>`
          }
        </div>
      ` : nothing}
    `;
  }

  private _renderValueSetFields() {
    const hasValuesError = this._submitted && this._errors['values'];

    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Mode</label>
        <div style="display:flex;gap:8px">
          ${VALUE_SET_MODE_OPTIONS.map(opt => html`
            <button class="phz-rem-type-card ${this._vsMode === opt.value ? 'phz-rem-type-card--selected' : ''}"
                    style="flex:1;padding:8px 10px"
                    @click=${() => { this._vsMode = opt.value as 'include' | 'exclude'; }}
                    aria-pressed="${this._vsMode === opt.value}">
              <span class="phz-rem-type-card-name">${opt.label}</span>
            </button>
          `)}
        </div>
        <span class="phz-rem-hint">${this._vsMode === 'include'
          ? 'Only these values will appear in the filter'
          : 'These values will be hidden from the filter'
        }</span>
      </div>
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Values (one per line)</label>
        <textarea class="phz-rem-textarea ${hasValuesError ? 'phz-rem-input--error' : ''}"
                  placeholder="VALUE_1\nVALUE_2\nVALUE_3"
                  rows="6"
                  .value=${this._vsValues}
                  @input=${(e: Event) => { this._vsValues = (e.target as HTMLTextAreaElement).value; this._clearError('values'); }}
        ></textarea>
        ${hasValuesError ? html`<span class="phz-rem-error">${this._errors['values']}</span>` : nothing}
        <span class="phz-rem-hint">
          ${this._vsValues.trim()
            ? `${this._vsValues.split('\n').filter(v => v.trim()).length} value(s) entered`
            : 'Enter exact values that match option values in the filter'
          }
        </span>
      </div>
    `;
  }

  private _renderTreeGroupFields() {
    const hasFieldError = this._submitted && this._errors['groupField'];
    const hasValueError = this._submitted && this._errors['tgValue'];

    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Group Field</label>
        <input class="phz-rem-input ${hasFieldError ? 'phz-rem-input--error' : ''}" type="text"
               placeholder="e.g. category, region, department"
               .value=${this._tgField}
               @input=${(e: Event) => { this._tgField = (e.target as HTMLInputElement).value; this._clearError('groupField'); }}>
        ${hasFieldError ? html`<span class="phz-rem-error">${this._errors['groupField']}</span>` : nothing}
        <span class="phz-rem-hint">The tree node field to compare against</span>
      </div>
      <div class="phz-rem-row">
        <div class="phz-rem-field">
          <label class="phz-rem-label phz-rem-label--required">Operator</label>
          <phz-combobox
            .options=${OPERATOR_OPTIONS}
            .value=${this._tgOperator}
            .allowEmpty=${false}
            @combobox-change=${(e: CustomEvent) => { this._tgOperator = (e.detail as { value: string }).value as 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in'; }}
          ></phz-combobox>
        </div>
        ${this._tgOperator === 'in' || this._tgOperator === 'not_in' ? html`
          <div class="phz-rem-field">
            <label class="phz-rem-label phz-rem-label--required">Values (one per line)</label>
            <textarea class="phz-rem-textarea"
                      placeholder="VALUE_1\nVALUE_2"
                      rows="4"
                      .value=${this._tgValues}
                      @input=${(e: Event) => { this._tgValues = (e.target as HTMLTextAreaElement).value; this._clearError('tgValues'); }}
            ></textarea>
            <span class="phz-rem-hint">
              ${this._tgValues.trim()
                ? `${this._tgValues.split('\n').filter((v: string) => v.trim()).length} value(s) entered`
                : 'Enter values to match against tree node values'
              }
            </span>
          </div>
        ` : html`
          <div class="phz-rem-field">
            <label class="phz-rem-label phz-rem-label--required">Value</label>
            <input class="phz-rem-input ${hasValueError ? 'phz-rem-input--error' : ''}" type="text"
                   placeholder="e.g. Electronics, EMEA"
                   .value=${this._tgValue}
                   @input=${(e: Event) => { this._tgValue = (e.target as HTMLInputElement).value; this._clearError('tgValue'); }}>
            ${hasValueError ? html`<span class="phz-rem-error">${this._errors['tgValue']}</span>` : nothing}
          </div>
        `}
      </div>
      <span class="phz-rem-hint">Matches: tree node's ${this._tgField || '(field)'} ${this._tgOperator.replace(/_/g, ' ')} ${this._tgOperator === 'in' || this._tgOperator === 'not_in' ? `[${this._tgValues.split('\n').filter((v: string) => v.trim()).length} values]` : `"${this._tgValue || '(value)'}"`}</span>
    `;
  }

  private _renderCustomFields() {
    const hasKeyError = this._submitted && this._errors['evaluatorKey'];
    const paramsValid = this._validateJsonParams();

    return html`
      <div class="phz-rem-field">
        <label class="phz-rem-label phz-rem-label--required">Evaluator Key</label>
        <input class="phz-rem-input ${hasKeyError ? 'phz-rem-input--error' : ''}" type="text"
               placeholder="e.g. userAccessFilter, geoRestriction"
               .value=${this._customKey}
               @input=${(e: Event) => { this._customKey = (e.target as HTMLInputElement).value; this._clearError('evaluatorKey'); }}>
        ${hasKeyError ? html`<span class="phz-rem-error">${this._errors['evaluatorKey']}</span>` : nothing}
        <span class="phz-rem-hint">Must match a custom evaluator registered via engine.registerCustomEvaluator()</span>
      </div>
      <div class="phz-rem-field">
        <label class="phz-rem-label">Parameters (JSON, optional)</label>
        <textarea class="phz-rem-textarea ${!paramsValid && this._customParams.trim() ? 'phz-rem-input--error' : ''}"
                  placeholder='{\n  "threshold": 100,\n  "includeInactive": false\n}'
                  rows="5"
                  .value=${this._customParams}
                  @input=${(e: Event) => { this._customParams = (e.target as HTMLTextAreaElement).value; }}
        ></textarea>
        ${!paramsValid && this._customParams.trim() ? html`<span class="phz-rem-error">Invalid JSON</span>` : nothing}
        <span class="phz-rem-hint">Optional JSON object passed to the evaluator function as the first argument</span>
      </div>
    `;
  }

  private _renderCrossFilterFields() {
    const hasCondError = this._submitted && this._errors['cfConditions'];
    const hasActionError = this._submitted && this._errors['cfActionValues'];

    return html`
      <!-- WHEN -->
      <span class="phz-rem-section">When</span>
      <span class="phz-rem-hint">Define when this rule should activate</span>
      ${hasCondError ? html`<span class="phz-rem-error">${this._errors['cfConditions']}</span>` : nothing}
      ${this._cfConditions.map((cond, idx) => this._renderCondition(cond, idx))}
      <button class="phz-rem-btn" @click=${this._addCondition} style="align-self:flex-start">+ Add Condition</button>

      ${this._cfConditions.length > 1 ? html`
        <div class="phz-rem-field">
          <label class="phz-rem-label">Match</label>
          <div style="display:flex;gap:8px">
            ${(['all', 'any'] as const).map(logic => html`
              <button class="phz-rem-type-card ${this._cfLogic === logic ? 'phz-rem-type-card--selected' : ''}"
                      style="flex:1;padding:8px 10px"
                      @click=${() => { this._cfLogic = logic; }}
                      aria-pressed="${this._cfLogic === logic}">
                <span class="phz-rem-type-card-name">${logic === 'all' ? 'All conditions' : 'Any condition'}</span>
              </button>
            `)}
          </div>
          <span class="phz-rem-hint">${this._cfLogic === 'all'
            ? 'Every condition must be true for the action to apply'
            : 'At least one condition must be true for the action to apply'
          }</span>
        </div>
      ` : nothing}

      <div class="phz-rem-divider"></div>

      <!-- THEN -->
      <span class="phz-rem-section">Then</span>

      <div class="phz-rem-field">
        <label class="phz-rem-label">Matching options should be</label>
        <div style="display:flex;gap:8px">
          ${(['include', 'exclude'] as const).map(b => html`
            <button class="phz-rem-type-card ${this._cfBehavior === b ? 'phz-rem-type-card--selected' : ''}"
                    style="flex:1;padding:8px 10px"
                    @click=${() => { this._cfBehavior = b; }}
                    aria-pressed="${this._cfBehavior === b}">
              <span class="phz-rem-type-card-name">${b === 'include' ? 'Shown only' : 'Hidden'}</span>
            </button>
          `)}
        </div>
        <span class="phz-rem-hint">${this._cfBehavior === 'include'
          ? 'Only the listed values will appear as options'
          : 'The listed values will be removed from the options'
        }</span>
      </div>

      <div class="phz-rem-field">
        <label class="phz-rem-label">Values come from</label>
        <div style="display:flex;gap:8px">
          ${(['fixed', 'context'] as const).map(s => html`
            <button class="phz-rem-type-card ${this._cfValueSource === s ? 'phz-rem-type-card--selected' : ''}"
                    style="flex:1;padding:8px 10px"
                    @click=${() => { this._cfValueSource = s; }}
                    aria-pressed="${this._cfValueSource === s}">
              <span class="phz-rem-type-card-name">${s === 'fixed' ? 'Fixed list' : 'Runtime context'}</span>
            </button>
          `)}
        </div>
      </div>

      ${this._cfValueSource === 'context' ? html`
        <div class="phz-rem-field">
          <label class="phz-rem-label phz-rem-label--required">Context Key</label>
          <input class="phz-rem-input" type="text"
                 placeholder="e.g. allowed_values, visible_items"
                 .value=${this._cfActionContextKey}
                 @input=${(e: Event) => { this._cfActionContextKey = (e.target as HTMLInputElement).value; this._clearError('cfActionValues'); }}>
          <span class="phz-rem-hint">A runtime key whose value (string or array) contains the ${this._cfBehavior === 'include' ? 'allowed' : 'blocked'} option values</span>
        </div>
      ` : html`
        <div class="phz-rem-field">
          <label class="phz-rem-label phz-rem-label--required">Values (one per line)</label>
          <textarea class="phz-rem-textarea"
                    placeholder="VALUE_1\nVALUE_2\nVALUE_3"
                    rows="4"
                    .value=${this._cfActionValues}
                    @input=${(e: Event) => { this._cfActionValues = (e.target as HTMLTextAreaElement).value; this._clearError('cfActionValues'); }}
          ></textarea>
          <span class="phz-rem-hint">${this._cfBehavior === 'include'
            ? 'Only these values will be available as options'
            : 'These values will be removed from the options'
          }</span>
        </div>
      `}
      ${hasActionError ? html`<span class="phz-rem-error">${this._errors['cfActionValues']}</span>` : nothing}

      <div class="phz-rem-divider"></div>

      <!-- OTHERWISE -->
      <span class="phz-rem-section">Otherwise</span>
      <div class="phz-rem-field">
        <label class="phz-rem-label">When conditions are not met</label>
        <div style="display:flex;gap:8px">
          ${(['pass_through', 'block'] as const).map(ea => html`
            <button class="phz-rem-type-card ${this._cfElseAction === ea ? 'phz-rem-type-card--selected' : ''}"
                    style="flex:1;padding:8px 10px"
                    @click=${() => { this._cfElseAction = ea; }}
                    aria-pressed="${this._cfElseAction === ea}">
              <span class="phz-rem-type-card-name">${ea === 'pass_through' ? 'Show all options' : 'Block all options'}</span>
            </button>
          `)}
        </div>
        <span class="phz-rem-hint">${this._cfElseAction === 'pass_through'
          ? 'All options remain available when conditions are not met'
          : 'No options are available when conditions are not met'
        }</span>
      </div>
    `;
  }

  private _renderCondition(cond: CrossFilterCondition, idx: number) {
    const needsValues = cond.operator !== 'is_set' && cond.operator !== 'is_not_set';
    const filterDefOptions = this.definitions
      .filter(d => !d.deprecated)
      .map(d => ({ value: d.id, label: d.label }));

    return html`
      <div style="border:1px solid #E7E5E4;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;font-weight:600;color:#A8A29E">Condition ${idx + 1}</span>
          <span style="flex:1"></span>
          ${this._cfConditions.length > 1 ? html`
            <button class="phz-rem-btn" style="padding:4px 8px;font-size:11px" @click=${() => this._removeCondition(idx)}>Remove</button>
          ` : nothing}
        </div>
        <div class="phz-rem-row">
          <div class="phz-rem-field">
            <label class="phz-rem-label">Check</label>
            <phz-combobox
              .options=${[{ value: 'filter', label: 'Another filter' }, { value: 'context', label: 'Runtime parameter' }]}
              .value=${cond.source}
              .allowEmpty=${false}
              @combobox-change=${(e: CustomEvent) => { this._updateCondition(idx, 'source', (e.detail as { value: string }).value); }}
            ></phz-combobox>
          </div>
          <div class="phz-rem-field">
            ${cond.source === 'filter' ? html`
              <label class="phz-rem-label phz-rem-label--required">Filter</label>
              <phz-combobox
                .options=${filterDefOptions}
                .value=${cond.key}
                .allowEmpty=${false}
                empty-label="\u2014 Select a filter \u2014"
                @combobox-change=${(e: CustomEvent) => { this._updateCondition(idx, 'key', (e.detail as { value: string }).value); }}
              ></phz-combobox>
            ` : html`
              <label class="phz-rem-label phz-rem-label--required">Parameter key</label>
              <input class="phz-rem-input" type="text"
                     placeholder="e.g. user_role, feature_flag"
                     .value=${cond.key}
                     @input=${(e: Event) => { this._updateCondition(idx, 'key', (e.target as HTMLInputElement).value); }}>
            `}
          </div>
        </div>
        <div class="phz-rem-row">
          <div class="phz-rem-field">
            <label class="phz-rem-label">When it</label>
            <phz-combobox
              .options=${CROSS_FILTER_CONDITION_OPERATORS}
              .value=${cond.operator}
              .allowEmpty=${false}
              @combobox-change=${(e: CustomEvent) => { this._updateCondition(idx, 'operator', (e.detail as { value: string }).value); }}
            ></phz-combobox>
          </div>
          ${needsValues ? html`
            <div class="phz-rem-field">
              <label class="phz-rem-label">Value(s)</label>
              <input class="phz-rem-input" type="text"
                     placeholder="Comma-separated, e.g. value_1, value_2"
                     .value=${(cond.values ?? []).join(', ')}
                     @input=${(e: Event) => { this._updateCondition(idx, 'values', (e.target as HTMLInputElement).value); }}>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private _addCondition() {
    this._cfConditions = [...this._cfConditions, { source: 'filter', key: '', operator: 'equals', values: [] }];
  }

  private _removeCondition(idx: number) {
    this._cfConditions = this._cfConditions.filter((_, i) => i !== idx);
  }

  private _updateCondition(idx: number, field: string, value: string) {
    const updated = this._cfConditions.map((c, i) => {
      if (i !== idx) return c;
      if (field === 'values') {
        return { ...c, values: value.split(',').map(v => v.trim()).filter(Boolean) };
      }
      return { ...c, [field]: value };
    });
    this._cfConditions = updated;
  }

  private _renderPriorityAndEnabled() {
    return html`
      <div class="phz-rem-row">
        <div class="phz-rem-field" style="flex:0 0 120px">
          <label class="phz-rem-label">Priority</label>
          <input class="phz-rem-input" type="number" min="0" step="1"
                 .value=${String(this._priority)}
                 @input=${(e: Event) => { this._priority = parseInt((e.target as HTMLInputElement).value, 10) || 0; }}>
          <span class="phz-rem-hint">Lower = runs first</span>
        </div>
        <div class="phz-rem-field" style="flex:1;justify-content:center">
          <div class="phz-rem-toggle-row">
            <button class="phz-rem-toggle ${this._enabled ? 'phz-rem-toggle--on' : 'phz-rem-toggle--off'}"
                    @click=${() => { this._enabled = !this._enabled; }}
                    aria-label="${this._enabled ? 'Disable' : 'Enable'} rule"></button>
            <span class="phz-rem-toggle-label">${this._enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <span class="phz-rem-hint">Disabled rules are saved but do not run</span>
        </div>
      </div>
    `;
  }

  // -- Validation --

  private _validateRegex(): boolean {
    if (!this._pattern) return true;
    if (this._pattern.length > 500) return false;
    try {
      new RegExp(this._pattern, this._flags);
      return true;
    } catch {
      return false;
    }
  }

  private _validateJsonParams(): boolean {
    if (!this._customParams.trim()) return true;
    try {
      JSON.parse(this._customParams);
      return true;
    } catch {
      return false;
    }
  }

  private _validate(): boolean {
    this._errors = {};

    if (!this._filterDefId) {
      this._errors['filterDefId'] = 'Please select a filter definition';
    }

    switch (this._type) {
      case 'exclude_pattern':
      case 'include_pattern':
        if (!this._pattern.trim()) {
          this._errors['pattern'] = 'Pattern is required';
        } else if (this._pattern.length > 500) {
          this._errors['pattern'] = 'Pattern must be 500 characters or less';
        } else if (!this._validateRegex()) {
          this._errors['pattern'] = 'Invalid regular expression';
        }
        break;
      case 'value_set': {
        const values = this._vsValues.split('\n').filter(v => v.trim());
        if (values.length === 0) {
          this._errors['values'] = 'Enter at least one value';
        }
        break;
      }
      case 'tree_group_compare':
        if (!this._tgField.trim()) {
          this._errors['groupField'] = 'Group field is required';
        }
        if (this._tgOperator === 'in' || this._tgOperator === 'not_in') {
          const tgVals = this._tgValues.split('\n').filter(v => v.trim());
          if (tgVals.length === 0) {
            this._errors['tgValues'] = 'Enter at least one value';
          }
        } else {
          if (!this._tgValue.trim()) {
            this._errors['tgValue'] = 'Value is required';
          }
        }
        break;
      case 'cross_filter': {
        if (this._cfConditions.length === 0) {
          this._errors['cfConditions'] = 'At least one condition is required';
        } else {
          const hasEmptyKey = this._cfConditions.some(c => !c.key.trim());
          if (hasEmptyKey) {
            this._errors['cfConditions'] = 'All conditions must have a key';
          }
        }
        if (this._cfValueSource === 'context') {
          if (!this._cfActionContextKey.trim()) {
            this._errors['cfActionValues'] = 'Context key is required';
          }
        } else {
          const actionVals = this._cfActionValues.split('\n').filter(v => v.trim());
          if (actionVals.length === 0) {
            this._errors['cfActionValues'] = 'Enter at least one value';
          }
        }
        break;
      }
      case 'custom':
        if (!this._customKey.trim()) {
          this._errors['evaluatorKey'] = 'Evaluator key is required';
        }
        if (this._customParams.trim() && !this._validateJsonParams()) {
          this._errors['customParams'] = 'Invalid JSON';
        }
        break;
    }

    return Object.keys(this._errors).length === 0;
  }

  private _clearError(field: string) {
    if (this._errors[field]) {
      const updated = { ...this._errors };
      delete updated[field];
      this._errors = updated;
    }
  }

  // -- Build Rule --

  private _buildConfig(): FilterRuleConfig {
    switch (this._type) {
      case 'exclude_pattern':
        return {
          type: 'exclude_pattern',
          pattern: this._pattern.trim(),
          flags: this._flags.trim() || undefined,
        } as ExcludePatternConfig;
      case 'include_pattern':
        return {
          type: 'include_pattern',
          pattern: this._pattern.trim(),
          flags: this._flags.trim() || undefined,
        } as IncludePatternConfig;
      case 'value_set':
        return {
          type: 'value_set',
          mode: this._vsMode,
          values: this._vsValues.split('\n').map(v => v.trim()).filter(Boolean),
        } as ValueSetConfig;
      case 'tree_group_compare': {
        const tgConfig: TreeGroupCompareConfig = {
          type: 'tree_group_compare',
          groupField: this._tgField.trim(),
          operator: this._tgOperator,
          value: this._tgValue.trim(),
        };
        if (this._tgOperator === 'in' || this._tgOperator === 'not_in') {
          tgConfig.values = this._tgValues.split('\n').map(v => v.trim()).filter(Boolean);
          tgConfig.value = '';
        }
        return tgConfig;
      }
      case 'cross_filter': {
        let actionType: CrossFilterActionType;
        if (this._cfValueSource === 'context') {
          actionType = this._cfBehavior === 'include' ? 'include_from_context' : 'exclude_from_context';
        } else {
          actionType = this._cfBehavior === 'include' ? 'include_values' : 'exclude_values';
        }
        const action: CrossFilterAction = { type: actionType };
        if (this._cfValueSource === 'context') {
          action.contextKey = this._cfActionContextKey.trim();
        } else {
          action.values = this._cfActionValues.split('\n').map(v => v.trim()).filter(Boolean);
        }
        return {
          type: 'cross_filter',
          conditions: this._cfConditions.map(c => ({ ...c })),
          logic: this._cfLogic,
          action,
          elseAction: this._cfElseAction,
        } as CrossFilterConfig;
      }
      case 'custom': {
        const config: CustomRuleConfig = {
          type: 'custom',
          evaluatorKey: this._customKey.trim(),
        };
        if (this._customParams.trim()) {
          config.params = JSON.parse(this._customParams);
        }
        return config;
      }
    }
  }

  private _buildRule(): FilterRule {
    const now = Date.now();
    const isNew = this.mode === 'add' || this.mode === 'copy';
    const id = isNew
      ? `rule_${this._type}_${now}`
      : this.rule!.id;

    return {
      id,
      filterDefinitionId: this._filterDefId as FilterDefinitionId,
      type: this._type,
      priority: this._priority,
      enabled: this._enabled,
      config: this._buildConfig(),
      description: this._description.trim() || undefined,
      createdAt: isNew ? now : this.rule!.createdAt,
      createdBy: this.rule?.createdBy,
    };
  }

  // -- Actions --

  private _changeType(type: FilterRuleType) {
    if (type === this._type) return;
    this._type = type;
    // Reset type-specific state
    this._pattern = '';
    this._flags = 'i';
    this._vsMode = 'exclude';
    this._vsValues = '';
    this._tgField = '';
    this._tgOperator = 'equals';
    this._tgValue = '';
    this._tgValues = '';
    this._customKey = '';
    this._customParams = '';
    this._cfConditions = [{ source: 'filter', key: '', operator: 'equals', values: [] }];
    this._cfLogic = 'all';
    this._cfValueSource = 'fixed';
    this._cfBehavior = 'include';
    this._cfActionValues = '';
    this._cfActionContextKey = '';
    this._cfElseAction = 'pass_through';
    // Clear type-specific errors
    this._errors = {};
    this._submitted = false;
  }

  private _save() {
    this._submitted = true;
    if (!this._validate()) return;

    const rule = this._buildRule();
    this.dispatchEvent(new CustomEvent('rule-editor-save', {
      detail: { rule, mode: this.mode },
      bubbles: true,
      composed: true,
    }));
  }

  private _cancel() {
    this.dispatchEvent(new CustomEvent('rule-editor-cancel', {
      bubbles: true,
      composed: true,
    }));
  }

  private _delete() {
    if (!this.rule) return;
    this.dispatchEvent(new CustomEvent('rule-editor-delete', {
      detail: { ruleId: this.rule.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleBackdropClick() {
    this._cancel();
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._cancel();
    }
  }
}
