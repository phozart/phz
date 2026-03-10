/**
 * @phozart/phz-definitions — <phz-definition-report>
 *
 * Form for editing report/definition identity (name, description).
 * Emits `report-meta-change` on any field change.
 *
 * Migrated from phz-grid-admin's phz-admin-report with new tag name.
 */

import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';

@safeCustomElement('phz-definition-report')
export class PhzDefinitionReport extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      :host { display: block; }
      .report-form { display: flex; flex-direction: column; gap: 4px; }
      .meta-row {
        display: flex; gap: 16px; flex-wrap: wrap;
        padding: 8px 12px; background: #FAFAF9; border-radius: 8px;
        font-size: 12px; color: #78716C; margin-bottom: 8px;
      }
      .meta-row span { white-space: nowrap; }
      .meta-label { font-weight: 600; color: #44403C; }
      textarea.phz-admin-input {
        min-height: 80px; resize: vertical; font-family: inherit;
      }
      .required-mark { color: #DC2626; margin-left: 2px; }
      .validation-error {
        font-size: 12px; color: #DC2626; margin-top: -4px; margin-bottom: 8px;
      }
    `,
  ];

  @property({ type: String }) reportName: string = '';
  @property({ type: String }) reportDescription: string = '';
  @property({ type: String }) reportId: string = '';
  @property({ type: String }) createdBy: string = '';
  @property({ type: Number }) created: number = 0;
  @property({ type: Number }) updatedAt: number = 0;
  @property({ type: String }) mode: 'create' | 'edit' = 'edit';

  private _emit(key: string, value: string) {
    this.dispatchEvent(new CustomEvent('report-meta-change', {
      bubbles: true, composed: true,
      detail: { key, value },
    }));
  }

  private _formatDate(ts: number): string {
    if (!ts) return '\u2014';
    return new Date(ts).toLocaleString();
  }

  render() {
    const showValidation = this.mode === 'create' && !this.reportName.trim();

    return html`
      <div class="report-form">
        ${this.reportId ? html`
          <div class="meta-row">
            <span><span class="meta-label">ID:</span> ${this.reportId}</span>
            ${this.created ? html`<span><span class="meta-label">Created:</span> ${this._formatDate(this.created)}</span>` : nothing}
            ${this.updatedAt ? html`<span><span class="meta-label">Updated:</span> ${this._formatDate(this.updatedAt)}</span>` : nothing}
            ${this.createdBy ? html`<span><span class="meta-label">By:</span> ${this.createdBy}</span>` : nothing}
          </div>
        ` : nothing}

        <div class="phz-admin-field">
          <label class="phz-admin-label">
            Report Name<span class="required-mark">*</span>
          </label>
          <input class="phz-admin-input"
                 type="text"
                 .value=${this.reportName}
                 @input=${(e: InputEvent) => this._emit('name', (e.target as HTMLInputElement).value)}
                 placeholder="Enter report name..."
                 required />
          ${showValidation ? html`<div class="validation-error">Report name is required</div>` : nothing}
        </div>

        <div class="phz-admin-field">
          <label class="phz-admin-label">Description</label>
          <textarea class="phz-admin-input"
                    .value=${this.reportDescription}
                    @input=${(e: InputEvent) => this._emit('description', (e.target as HTMLTextAreaElement).value)}
                    placeholder="Optional description..."></textarea>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-definition-report': PhzDefinitionReport; }
}
