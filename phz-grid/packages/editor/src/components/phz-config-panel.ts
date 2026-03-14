/**
 * @phozart/editor — <phz-editor-config-panel> (B-2.08)
 *
 * Constrained widget configuration panel. Authors configure
 * widgets by selecting from pre-approved measures and fields.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ConfigPanelState, FieldConstraint } from '../authoring/config-panel-state.js';
import {
  createConfigPanelState,
  setConfigValue,
  isConfigValid,
} from '../authoring/config-panel-state.js';

@customElement('phz-editor-config-panel')
export class PhzEditorConfigPanel extends LitElement {
  static override styles = css`
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
  `;

  @property({ type: String }) widgetType = '';
  @property({ type: String }) widgetId = '';
  @property({ type: Array }) allowedFields: FieldConstraint[] = [];

  @state() private _state: ConfigPanelState = createConfigPanelState('', '');

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('widgetType') || changed.has('widgetId') || changed.has('allowedFields')) {
      this._state = createConfigPanelState(this.widgetType, this.widgetId, {
        allowedFields: this.allowedFields,
      });
    }
  }

  /** Get the current config panel state. */
  getState(): ConfigPanelState {
    return this._state;
  }

  private _onFieldChange(fieldName: string, value: unknown): void {
    this._state = setConfigValue(this._state, fieldName, value);
    this.dispatchEvent(new CustomEvent('config-change', {
      detail: { field: fieldName, value, config: this._state.currentConfig },
      bubbles: true,
      composed: true,
    }));
  }

  private _onApply(): void {
    if (!isConfigValid(this._state)) return;
    this.dispatchEvent(new CustomEvent('config-apply', {
      detail: { config: this._state.currentConfig },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    return html`
      <div class="panel-header">${this.widgetType} Configuration</div>
      <div class="panel-body">
        ${this._state.allowedFields.map(field => {
          const error = this._state.validationErrors.find(e => e.field === field.name);
          return html`
            <div class="field-group">
              <div class="field-label">
                ${field.label}
                ${field.required ? html`<span class="required-mark" aria-hidden="true">*</span>` : nothing}
              </div>
              <input
                type="text"
                .value=${(this._state.currentConfig[field.name] as string) ?? ''}
                @input=${(e: Event) => {
                  this._onFieldChange(field.name, (e.target as HTMLInputElement).value);
                }}
                aria-label=${field.label}
                aria-required=${field.required}
                aria-invalid=${error ? 'true' : 'false'}
              />
              ${error
                ? html`<div class="validation-error" role="alert">${error.message}</div>`
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
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-editor-config-panel': PhzEditorConfigPanel;
  }
}
