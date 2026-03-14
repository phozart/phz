/**
 * @phozart/criteria — Rule Admin
 *
 * Admin UI for managing filter rules: CRUD, priority reorder,
 * enable/disable toggle, preview panel, and rule editor modal.
 * CSS prefix: phz-ra-
 *
 * Events:
 * - rule-add: { rule: FilterRule }
 * - rule-remove: { ruleId }
 * - rule-toggle: { ruleId, enabled }
 * - rule-update: { ruleId, patch }
 * - rule-contextmenu: { ruleId, rule, x, y }
 * - rules-bg-contextmenu: { x, y }
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  FilterRule, FilterDefinition, FilterDefinitionId,
  SelectionFieldOption, FilterRuleType,
} from '@phozart/core';
import { filterDefinitionId } from '@phozart/core';
import { criteriaStyles } from '../shared-styles.js';
import './phz-rule-editor-modal.js';
import type { RuleEditorMode } from './phz-rule-editor-modal.js';

const RULE_TYPES: { value: FilterRuleType; label: string }[] = [
  { value: 'exclude_pattern', label: 'Exclude Pattern' },
  { value: 'include_pattern', label: 'Include Pattern' },
  { value: 'value_set', label: 'Value Set' },
  { value: 'tree_group_compare', label: 'Tree Group Compare' },
  { value: 'custom', label: 'Custom' },
  { value: 'cross_filter', label: 'Cross Filter' },
];

@customElement('phz-rule-admin')
export class PhzRuleAdmin extends LitElement {
  static styles = [criteriaStyles, css`
    :host { display: block; height: 100%; }

    .phz-ra-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #FAFAF9;
      border: 1px solid #E7E5E4;
      border-radius: 12px;
      overflow: hidden;
    }

    .phz-ra-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #FFFFFF;
      border-bottom: 1px solid #E7E5E4;
    }

    .phz-ra-title {
      font-size: 14px;
      font-weight: 700;
      color: #1C1917;
    }

    .phz-ra-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .phz-ra-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phz-ra-card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 12px;
      transition: border-color 0.15s;
    }

    .phz-ra-card:hover { border-color: #A8A29E; }
    .phz-ra-card--disabled { opacity: 0.5; }

    .phz-ra-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .phz-ra-card-priority {
      font-size: 11px;
      font-weight: 700;
      color: #A8A29E;
      min-width: 20px;
    }

    .phz-ra-card-label {
      font-size: 13px;
      font-weight: 600;
      color: #1C1917;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .phz-ra-card-type {
      font-size: 11px;
      color: #78716C;
      background: #F5F5F4;
      padding: 2px 8px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .phz-ra-toggle {
      width: 36px;
      height: 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .phz-ra-toggle--on { background: #1C1917; }
    .phz-ra-toggle--off { background: #D6D3D1; }

    .phz-ra-toggle::after {
      content: '';
      position: absolute;
      top: 2px;
      width: 16px;
      height: 16px;
      border-radius: 8px;
      background: #FFFFFF;
      transition: left 0.2s;
    }

    .phz-ra-toggle--on::after { left: 18px; }
    .phz-ra-toggle--off::after { left: 2px; }

    .phz-ra-card-desc {
      font-size: 12px;
      color: #78716C;
      margin-top: 4px;
    }

    .phz-ra-card-config {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
      margin-top: 4px;
      font-size: 11px;
      color: #A8A29E;
    }

    .phz-ra-card-config-tag {
      padding: 1px 6px;
      background: #F5F5F4;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }

    .phz-ra-card-actions {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .phz-ra-card-btn {
      padding: 4px 10px;
      border: 1px solid #E7E5E4;
      border-radius: 6px;
      background: #FFFFFF;
      font-size: 11px;
      font-weight: 500;
      font-family: inherit;
      color: #44403C;
      cursor: pointer;
      transition: all 0.15s;
    }

    .phz-ra-card-btn:hover { background: #F5F5F4; border-color: #A8A29E; }
    .phz-ra-card-btn:focus-visible { outline: 2px solid #EF4444; outline-offset: 2px; }
    .phz-ra-card-btn--danger { color: #DC2626; }
    .phz-ra-card-btn--danger:hover { background: #FEF2F2; border-color: #FECACA; }

    .phz-ra-preview {
      margin-top: 8px;
      padding: 8px;
      background: #F5F5F4;
      border-radius: 8px;
      font-size: 11px;
      color: #44403C;
    }

    .phz-ra-preview-label {
      font-weight: 600;
      color: #78716C;
      margin-bottom: 4px;
    }

    .phz-ra-empty {
      text-align: center;
      padding: 32px 16px;
      color: #A8A29E;
      font-size: 13px;
      line-height: 1.5;
    }

    .phz-ra-empty-icon {
      font-size: 28px;
      margin-bottom: 8px;
      opacity: 0.4;
    }

    @media (prefers-reduced-motion: reduce) {
      .phz-ra-toggle { transition: none; }
      .phz-ra-toggle::after { transition: none; }
    }
  `];

  @property({ type: Array }) rules: FilterRule[] = [];
  @property({ type: Array }) definitions: FilterDefinition[] = [];
  @property({ type: Object }) previewResults: Record<string, { before: number; after: number }> = {};

  // Modal state
  @state() private _modalOpen = false;
  @state() private _modalMode: RuleEditorMode = 'add';
  @state() private _modalRule: FilterRule | null = null;

  render() {
    const sorted = [...this.rules].sort((a, b) => a.priority - b.priority);
    const maxPriority = sorted.length > 0 ? sorted[sorted.length - 1].priority : -1;

    return html`
      <div class="phz-ra-root" @contextmenu=${(e: MouseEvent) => this._handleBgContextMenu(e)}>
        <div class="phz-ra-header">
          <span class="phz-ra-title">Filter Rules</span>
          <button class="phz-sc-btn phz-sc-btn--primary" @click=${this._addRule}>+ Add Rule</button>
        </div>
        <div class="phz-ra-body">
          <div class="phz-ra-list">
            ${sorted.length === 0 ? html`
              <div class="phz-ra-empty">
                <div class="phz-ra-empty-icon">\u2699</div>
                No rules configured yet.<br>
                Click "+ Add Rule" to create your first rule,<br>
                or right-click for options.
              </div>
            ` : nothing}
            ${sorted.map(rule => this._renderRule(rule))}
          </div>
        </div>
      </div>

      <phz-rule-editor-modal
        ?open=${this._modalOpen}
        .rule=${this._modalRule}
        .mode=${this._modalMode}
        .definitions=${this.definitions}
        .maxPriority=${maxPriority}
        @rule-editor-save=${this._handleEditorSave}
        @rule-editor-cancel=${this._handleEditorCancel}
        @rule-editor-delete=${this._handleEditorDelete}
      ></phz-rule-editor-modal>
    `;
  }

  private _renderRule(rule: FilterRule) {
    const def = (this.definitions ?? []).find(d => d.id === rule.filterDefinitionId);
    const preview = this.previewResults[rule.id];
    const configSummary = this._getConfigSummary(rule);

    return html`
      <div class="phz-ra-card ${!rule.enabled ? 'phz-ra-card--disabled' : ''}"
           @contextmenu=${(e: MouseEvent) => this._handleCardContextMenu(e, rule)}>
        <div class="phz-ra-card-header">
          <span class="phz-ra-card-priority">#${rule.priority}</span>
          <span class="phz-ra-card-label">${rule.description || rule.id}</span>
          <span class="phz-ra-card-type">${(rule.type ?? 'unknown').replace(/_/g, ' ')}</span>
          <button class="phz-ra-toggle ${rule.enabled ? 'phz-ra-toggle--on' : 'phz-ra-toggle--off'}"
                  @click=${() => this._dispatchEvent('rule-toggle', { ruleId: rule.id, enabled: !rule.enabled })}
                  aria-label="${rule.enabled ? 'Disable' : 'Enable'} rule"></button>
        </div>
        ${def ? html`<div class="phz-ra-card-desc">Filter: ${def.label}</div>` : nothing}
        ${configSummary.length > 0 ? html`
          <div class="phz-ra-card-config">
            ${configSummary.map(tag => html`<span class="phz-ra-card-config-tag">${tag}</span>`)}
          </div>
        ` : nothing}
        ${preview ? html`
          <div class="phz-ra-preview">
            <div class="phz-ra-preview-label">Preview</div>
            Before: ${preview.before} options \u2192 After: ${preview.after} options
          </div>
        ` : nothing}
        <div class="phz-ra-card-actions">
          <button class="phz-ra-card-btn" @click=${() => this._editRule(rule)}>Edit</button>
          <button class="phz-ra-card-btn" @click=${() => this._copyRule(rule)}>Copy</button>
          <button class="phz-ra-card-btn phz-ra-card-btn--danger"
                  @click=${() => this._dispatchEvent('rule-remove', { ruleId: rule.id })}>Remove</button>
        </div>
      </div>
    `;
  }

  /** Summary tags showing key config details at a glance */
  private _getConfigSummary(rule: FilterRule): string[] {
    const tags: string[] = [];
    const config = rule.config;
    switch (config.type) {
      case 'exclude_pattern':
      case 'include_pattern':
        if (config.pattern) tags.push(`/${config.pattern}/${config.flags ?? ''}`);
        break;
      case 'value_set':
        tags.push(config.mode);
        tags.push(`${config.values.length} value(s)`);
        break;
      case 'tree_group_compare':
        if (config.operator === 'in' || config.operator === 'not_in') {
          tags.push(`${config.groupField} ${config.operator.replace(/_/g, ' ')} [${(config.values ?? []).length} values]`);
        } else {
          tags.push(`${config.groupField} ${config.operator.replace(/_/g, ' ')} "${config.value}"`);
        }
        break;
      case 'custom':
        tags.push(config.evaluatorKey);
        break;
      case 'cross_filter':
        tags.push(`${config.conditions.length} condition(s)`);
        tags.push(config.logic.toUpperCase());
        tags.push(`\u2192 ${config.action.type.replace(/_/g, ' ')}`);
        if (config.elseAction) {
          tags.push(`else: ${config.elseAction.replace(/_/g, ' ')}`);
        }
        break;
    }
    return tags;
  }

  // -- Modal management --

  private _addRule() {
    this._modalRule = null;
    this._modalMode = 'add';
    this._modalOpen = true;
  }

  private _editRule(rule: FilterRule) {
    this._modalRule = { ...rule };
    this._modalMode = 'edit';
    this._modalOpen = true;
  }

  private _copyRule(rule: FilterRule) {
    this._modalRule = { ...rule };
    this._modalMode = 'copy';
    this._modalOpen = true;
  }

  /** Called from parent (filter designer) for context menu edit/copy */
  public openEditor(rule: FilterRule, mode: RuleEditorMode) {
    if (mode === 'edit') this._editRule(rule);
    else if (mode === 'copy') this._copyRule(rule);
    else this._addRule();
  }

  private _handleEditorSave(e: CustomEvent) {
    const { rule, mode } = e.detail as { rule: FilterRule; mode: RuleEditorMode };
    this._modalOpen = false;

    if (mode === 'add' || mode === 'copy') {
      this._dispatchEvent('rule-add', { rule });
    } else {
      this._dispatchEvent('rule-update', {
        ruleId: rule.id,
        patch: {
          filterDefinitionId: rule.filterDefinitionId,
          type: rule.type,
          priority: rule.priority,
          enabled: rule.enabled,
          config: rule.config,
          description: rule.description,
        },
      });
    }
  }

  private _handleEditorCancel() {
    this._modalOpen = false;
  }

  private _handleEditorDelete(e: CustomEvent) {
    const { ruleId } = e.detail as { ruleId: string };
    this._modalOpen = false;
    this._dispatchEvent('rule-remove', { ruleId });
  }

  // -- Context menu --

  private _handleCardContextMenu(e: MouseEvent, rule: FilterRule) {
    e.preventDefault();
    e.stopPropagation();
    this._dispatchEvent('rule-contextmenu', {
      ruleId: rule.id,
      rule: { ...rule },
      x: e.clientX,
      y: e.clientY,
    });
  }

  private _handleBgContextMenu(e: MouseEvent) {
    const path = e.composedPath();
    const isCard = path.some(
      el => el instanceof HTMLElement && el.classList?.contains('phz-ra-card')
    );
    if (isCard) return; // Card handler takes priority
    e.preventDefault();
    this._dispatchEvent('rules-bg-contextmenu', {
      x: e.clientX,
      y: e.clientY,
    });
  }

  private _dispatchEvent(name: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}
