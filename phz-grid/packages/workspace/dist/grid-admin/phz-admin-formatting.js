/**
 * @phozart/grid-admin — Conditional Formatting Rule Builder
 *
 * Rule list with inline condition builder, style editor, and live preview.
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
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
const OPERATOR_LABELS = {
    equals: 'Equals',
    notEquals: 'Not Equals',
    contains: 'Contains',
    notContains: 'Not Contains',
    startsWith: 'Starts With',
    endsWith: 'Ends With',
    greaterThan: 'Greater Than',
    greaterThanOrEqual: 'Greater or Equal',
    lessThan: 'Less Than',
    lessThanOrEqual: 'Less or Equal',
    between: 'Between',
    isEmpty: 'Is Empty',
    isNotEmpty: 'Is Not Empty',
};
const NO_VALUE_OPS = new Set(['isEmpty', 'isNotEmpty']);
const TWO_VALUE_OPS = new Set(['between']);
let PhzAdminFormatting = class PhzAdminFormatting extends LitElement {
    constructor() {
        super(...arguments);
        this.rules = [];
        this.fields = [];
        this.editingRuleId = null;
        this._prevRuleCount = 0;
    }
    static { this.styles = [
        adminBaseStyles,
        css `
      .rule-list { display: flex; flex-direction: column; gap: 8px; }
      .rule-item {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--phz-admin-shadow-sm);
        background: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .rule-item:hover { transform: translateY(-2px); box-shadow: var(--phz-admin-shadow-md); }
      .rule-header {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
      }
      .rule-preview {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid #E7E5E4;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
      }
      .rule-desc { font-size: 13px; color: #1C1917; }
      .rule-field { font-weight: 600; }
      .rule-op { color: #78716C; font-size: 12px; }
      .add-rule-btn { margin-top: 10px; }

      /* Inline editor */
      .rule-editor {
        padding: 14px;
        box-shadow: inset 0 1px 2px rgba(28,25,23,0.06);
        background: #FAFAF9;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .editor-row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .editor-row label {
        font-size: 12px;
        font-weight: 600;
        color: #44403C;
        min-width: 72px;
      }
      .editor-row select,
      .editor-row input[type="text"],
      .editor-row input[type="number"] {
        padding: 6px 10px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        font-size: 12px;
        background: white;
        color: #1C1917;
        flex: 1;
        min-width: 80px;
      }
      .editor-row input[type="color"] {
        width: 32px;
        height: 28px;
        border: 1px solid #D6D3D1;
        border-radius: 8px;
        padding: 2px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .editor-row .hex-input {
        width: 76px;
        flex: 0;
      }
      .editor-done-btn {
        align-self: flex-end;
      }
    `,
    ]; }
    updated(changed) {
        if (changed.has('editingRuleId') && this.editingRuleId && (this.rules ?? []).length > this._prevRuleCount) {
            requestAnimationFrame(() => {
                const el = this.shadowRoot?.querySelector(`[data-rule-id="${this.editingRuleId}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }
        this._prevRuleCount = (this.rules ?? []).length;
    }
    handleAddRule() {
        const ruleId = 'rule-' + Date.now();
        this.editingRuleId = ruleId;
        this.dispatchEvent(new CustomEvent('rules-change', {
            bubbles: true, composed: true,
            detail: { action: 'add', ruleId },
        }));
    }
    handleRemoveRule(ruleId) {
        if (this.editingRuleId === ruleId)
            this.editingRuleId = null;
        this.dispatchEvent(new CustomEvent('rules-change', {
            bubbles: true, composed: true,
            detail: { action: 'remove', ruleId },
        }));
    }
    handleToggleEdit(ruleId) {
        this.editingRuleId = this.editingRuleId === ruleId ? null : ruleId;
    }
    emitUpdate(ruleId, updates) {
        this.dispatchEvent(new CustomEvent('rules-change', {
            bubbles: true, composed: true,
            detail: { action: 'update', ruleId, updates },
        }));
    }
    handleFieldChange(rule, value) {
        this.emitUpdate(rule.id, { field: value });
    }
    handleOperatorChange(rule, value) {
        this.emitUpdate(rule.id, { operator: value });
    }
    handleValueChange(rule, value) {
        const numVal = Number(value);
        this.emitUpdate(rule.id, { value: value !== '' && !isNaN(numVal) ? numVal : value });
    }
    handleValue2Change(rule, value) {
        const numVal = Number(value);
        this.emitUpdate(rule.id, { value2: value !== '' && !isNaN(numVal) ? numVal : value });
    }
    handleBgColorChange(rule, value) {
        this.emitUpdate(rule.id, { backgroundColor: value });
    }
    handleTextColorChange(rule, value) {
        this.emitUpdate(rule.id, { color: value });
    }
    handleFontWeightChange(rule, value) {
        this.emitUpdate(rule.id, { fontWeight: value });
    }
    renderEditor(rule) {
        const op = rule.condition.operator;
        const showValue = !NO_VALUE_OPS.has(op);
        const showValue2 = TWO_VALUE_OPS.has(op);
        return html `
      <div class="rule-editor">
        <div class="editor-row">
          <label>Field</label>
          <select .value=${rule.field}
                  @change=${(e) => this.handleFieldChange(rule, e.target.value)}>
            ${(this.fields ?? []).map(f => html `<option value=${f} ?selected=${f === rule.field}>${f}</option>`)}
          </select>
        </div>

        <div class="editor-row">
          <label>Operator</label>
          <select .value=${rule.condition.operator}
                  @change=${(e) => this.handleOperatorChange(rule, e.target.value)}>
            ${Object.entries(OPERATOR_LABELS).map(([key, label]) => html `<option value=${key} ?selected=${key === rule.condition.operator}>${label}</option>`)}
          </select>
        </div>

        ${showValue ? html `
          <div class="editor-row">
            <label>Value</label>
            <input type="text" .value=${String(rule.condition.value ?? '')}
                   @input=${(e) => this.handleValueChange(rule, e.target.value)}>
          </div>
        ` : nothing}

        ${showValue2 ? html `
          <div class="editor-row">
            <label>Value 2</label>
            <input type="text" .value=${String(rule.condition.value2 ?? '')}
                   @input=${(e) => this.handleValue2Change(rule, e.target.value)}>
          </div>
        ` : nothing}

        <div class="editor-row">
          <label>Background</label>
          <input type="color" .value=${rule.style.backgroundColor || '#ffffff'}
                 @input=${(e) => this.handleBgColorChange(rule, e.target.value)}>
          <input type="text" class="hex-input" .value=${rule.style.backgroundColor || '#ffffff'}
                 @input=${(e) => this.handleBgColorChange(rule, e.target.value)}>
        </div>

        <div class="editor-row">
          <label>Text Color</label>
          <input type="color" .value=${rule.style.color || '#000000'}
                 @input=${(e) => this.handleTextColorChange(rule, e.target.value)}>
          <input type="text" class="hex-input" .value=${rule.style.color || '#000000'}
                 @input=${(e) => this.handleTextColorChange(rule, e.target.value)}>
        </div>

        <div class="editor-row">
          <label>Font Weight</label>
          <select .value=${rule.style.fontWeight || 'normal'}
                  @change=${(e) => this.handleFontWeightChange(rule, e.target.value)}>
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        <button class="phz-admin-btn phz-admin-btn--primary editor-done-btn"
                @click=${() => { this.editingRuleId = null; }}>
          Done
        </button>
      </div>
    `;
    }
    render() {
        return html `
      <div>
        <div class="rule-list" role="list">
          ${(this.rules ?? []).map(rule => html `
            <div class="rule-item" role="listitem" data-rule-id="${rule.id}">
              <div class="rule-header">
                <div class="rule-preview"
                     style="background-color: ${rule.style.backgroundColor ?? '#fff'}; color: ${rule.style.color ?? '#000'};">
                  Aa
                </div>
                <div class="rule-desc">
                  <span class="rule-field">${rule.field}</span>
                  <span class="rule-op">${OPERATOR_LABELS[rule.condition.operator] || rule.condition.operator}</span>
                  ${!NO_VALUE_OPS.has(rule.condition.operator)
            ? html ` <span>${String(rule.condition.value ?? '')}</span>`
            : nothing}
                </div>
                <button class="phz-admin-btn" @click=${() => this.handleToggleEdit(rule.id)}>
                  ${this.editingRuleId === rule.id ? 'Close' : 'Edit'}
                </button>
                <button class="phz-admin-btn phz-admin-btn--danger" @click=${() => this.handleRemoveRule(rule.id)}>Remove</button>
              </div>
              ${this.editingRuleId === rule.id ? this.renderEditor(rule) : nothing}
            </div>
          `)}
        </div>
        <button class="phz-admin-btn phz-admin-btn--primary add-rule-btn" @click=${this.handleAddRule}>
          + Add Rule
        </button>
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzAdminFormatting.prototype, "rules", void 0);
__decorate([
    property({ type: Array })
], PhzAdminFormatting.prototype, "fields", void 0);
__decorate([
    state()
], PhzAdminFormatting.prototype, "editingRuleId", void 0);
PhzAdminFormatting = __decorate([
    safeCustomElement('phz-admin-formatting')
], PhzAdminFormatting);
export { PhzAdminFormatting };
//# sourceMappingURL=phz-admin-formatting.js.map