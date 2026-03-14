/**
 * @phozart/engine-admin — Selection Field Manager
 *
 * CRUD for selection field definitions. Embeddable component.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../../safe-custom-element.js';
import { engineAdminStyles } from '../shared-styles.js';
import type { SelectionFieldDef, SelectionFieldType } from '@phozart/core';

@safeCustomElement('phz-selection-field-manager')
export class PhzSelectionFieldManager extends LitElement {
  static styles = [
    engineAdminStyles,
    css`
      .field-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
      .field-item {
        display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
        padding: 8px 12px; border: 1px solid #E7E5E4; border-radius: 6px;
      }
      .field-item:hover { background: #FAFAF9; }
      .field-drag { cursor: grab; color: #A8A29E; }
      .field-info { display: flex; flex-direction: column; }
      .field-name { font-size: 13px; font-weight: 500; }
      .field-type { font-size: 11px; color: #78716C; }
      .field-badges { display: flex; gap: 4px; }
      .field-badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; background: #F5F5F4; color: #78716C; }
    `,
  ];

  @property({ type: Array }) fields: SelectionFieldDef[] = [];

  @state() private editingId?: string;

  private handleAdd() {
    this.dispatchEvent(new CustomEvent('fields-change', {
      bubbles: true, composed: true,
      detail: { action: 'add' },
    }));
  }

  private handleRemove(id: string) {
    this.dispatchEvent(new CustomEvent('fields-change', {
      bubbles: true, composed: true,
      detail: { action: 'remove', fieldId: id },
    }));
  }

  private handleEdit(id: string) {
    this.editingId = this.editingId === id ? undefined : id;
  }

  render() {
    const types: SelectionFieldType[] = ['single_select', 'multi_select', 'period_picker', 'chip_group', 'text'];

    return html`
      <div role="region" aria-label="Selection Field Manager">
        <div class="field-list" role="list">
          ${this.fields.map(field => html`
            <div class="field-item" role="listitem">
              <span class="field-drag" aria-hidden="true">&#x2630;</span>
              <div class="field-info">
                <span class="field-name">${field.label}</span>
                <span class="field-type">${field.type} · ${field.id}</span>
              </div>
              <div class="field-badges">
                ${field.locked ? html`<span class="field-badge">Locked</span>` : nothing}
                ${field.allowAll ? html`<span class="field-badge">All</span>` : nothing}
                <button class="phz-ea-btn" style="font-size:11px; padding:2px 8px;" @click=${() => this.handleEdit(field.id)}>Edit</button>
                <button class="phz-ea-btn phz-ea-btn--danger" style="font-size:11px; padding:2px 8px;" @click=${() => this.handleRemove(field.id)}>Remove</button>
              </div>
            </div>
          `)}
        </div>
        <button class="phz-ea-btn phz-ea-btn--primary" @click=${this.handleAdd}>+ Add Selection Field</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-selection-field-manager': PhzSelectionFieldManager; }
}
