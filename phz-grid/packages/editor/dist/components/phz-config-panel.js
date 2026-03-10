/**
 * @phozart/phz-editor — <phz-editor-config-panel> (B-2.08)
 *
 * Constrained widget configuration panel. Authors configure
 * widgets by selecting from pre-approved measures and fields.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createConfigPanelState, setConfigValue, isConfigValid, } from '../authoring/config-panel-state.js';
let PhzEditorConfigPanel = class PhzEditorConfigPanel extends LitElement {
    constructor() {
        super(...arguments);
        this.widgetType = '';
        this.widgetId = '';
        this.allowedFields = [];
        this._state = createConfigPanelState('', '');
    }
    static { this.styles = css `
    :host { display: block; }
    .panel-header {
      font-size: 14px;
      font-weight: 600;
      padding: 12px;
      border-bottom: 1px solid var(--phz-border, #e5e7eb);
    }
    .panel-body {
      padding: 12px;
    }
    .field-group {
      margin-bottom: 12px;
    }
    .field-label {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .required-mark {
      color: var(--phz-error, #ef4444);
    }
    .validation-error {
      font-size: 12px;
      color: var(--phz-error, #ef4444);
      margin-top: 2px;
    }
    input, select {
      width: 100%;
      padding: 6px;
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
    }
    .panel-footer {
      padding: 12px;
      border-top: 1px solid var(--phz-border, #e5e7eb);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    button {
      cursor: pointer;
      border: 1px solid var(--phz-border, #e5e7eb);
      background: var(--phz-surface, #ffffff);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
    }
  `; }
    willUpdate(changed) {
        if (changed.has('widgetType') || changed.has('widgetId') || changed.has('allowedFields')) {
            this._state = createConfigPanelState(this.widgetType, this.widgetId, {
                allowedFields: this.allowedFields,
            });
        }
    }
    /** Get the current config panel state. */
    getState() {
        return this._state;
    }
    _onFieldChange(fieldName, value) {
        this._state = setConfigValue(this._state, fieldName, value);
        this.dispatchEvent(new CustomEvent('config-change', {
            detail: { field: fieldName, value, config: this._state.currentConfig },
            bubbles: true,
            composed: true,
        }));
    }
    _onApply() {
        if (!isConfigValid(this._state))
            return;
        this.dispatchEvent(new CustomEvent('config-apply', {
            detail: { config: this._state.currentConfig },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="panel-header">${this.widgetType} Configuration</div>
      <div class="panel-body">
        ${this._state.allowedFields.map(field => {
            const error = this._state.validationErrors.find(e => e.field === field.name);
            return html `
            <div class="field-group">
              <div class="field-label">
                ${field.label}
                ${field.required ? html `<span class="required-mark" aria-hidden="true">*</span>` : nothing}
              </div>
              <input
                type="text"
                .value=${this._state.currentConfig[field.name] ?? ''}
                @input=${(e) => {
                this._onFieldChange(field.name, e.target.value);
            }}
                aria-label=${field.label}
                aria-required=${field.required}
                aria-invalid=${error ? 'true' : 'false'}
              />
              ${error
                ? html `<div class="validation-error" role="alert">${error.message}</div>`
                : nothing}
            </div>
          `;
        })}
      </div>
      <div class="panel-footer">
        <button
          @click=${this._onApply}
          ?disabled=${!isConfigValid(this._state)}
        >Apply</button>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzEditorConfigPanel.prototype, "widgetType", void 0);
__decorate([
    property({ type: String })
], PhzEditorConfigPanel.prototype, "widgetId", void 0);
__decorate([
    property({ type: Array })
], PhzEditorConfigPanel.prototype, "allowedFields", void 0);
__decorate([
    state()
], PhzEditorConfigPanel.prototype, "_state", void 0);
PhzEditorConfigPanel = __decorate([
    customElement('phz-editor-config-panel')
], PhzEditorConfigPanel);
export { PhzEditorConfigPanel };
//# sourceMappingURL=phz-config-panel.js.map