/**
 * @phozart/grid-admin — Export Settings
 *
 * CSV + Excel export configuration.
 */

import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
import type { ReportExportSettings } from '@phozart/engine';

type ExportSettings = ReportExportSettings;

@safeCustomElement('phz-admin-export')
export class PhzAdminExport extends LitElement {
  static styles = [
    adminBaseStyles,
    css`
      .export-section { margin-bottom: 16px; }
      .format-group { display: flex; gap: 8px; margin-bottom: 16px; }
      .format-btn {
        flex: 1; padding: 12px; border: 1px solid #D6D3D1; border-radius: 12px;
        font-size: 13px; font-weight: 500; cursor: pointer; background: white; text-align: center;
        box-shadow: var(--phz-admin-shadow-sm);
        transition: all 0.15s ease;
      }
      .format-btn:hover { transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md); }
      .format-btn--active { background: #3B82F6; color: white; border-color: #3B82F6; box-shadow: var(--phz-admin-shadow-md); }
      .download-btn {
        display: block; width: 100%; padding: 12px 16px;
        background: #3B82F6; color: white; border: 1px solid #3B82F6;
        border-radius: 12px; font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: inherit; text-align: center;
        box-shadow: var(--phz-admin-shadow-sm); transition: all 0.15s ease;
        margin-top: 16px;
      }
      .download-btn:hover { background: #2563EB; border-color: #2563EB; transform: translateY(-1px); box-shadow: var(--phz-admin-shadow-md); }
    `,
  ];

  @property({ type: String }) format: 'csv' | 'excel' = 'csv';
  @property({ type: Boolean }) includeHeaders: boolean = true;
  @property({ type: Boolean }) includeFormatting: boolean = false;
  @property({ type: Boolean }) includeGroupHeaders: boolean = true;
  @property({ type: String }) separator: string = ',';
  @property({ type: Array }) availableColumns: string[] = [];
  @property({ type: Array }) selectedColumns: string[] = [];

  private emitChange(updates: Partial<ExportSettings>) {
    this.dispatchEvent(new CustomEvent('export-settings-change', {
      bubbles: true, composed: true, detail: updates,
    }));
  }

  private _handleDownload() {
    this.dispatchEvent(new CustomEvent('export-download', {
      bubbles: true, composed: true,
      detail: {
        format: this.format,
        includeHeaders: this.includeHeaders,
        includeFormatting: this.includeFormatting,
        includeGroupHeaders: this.includeGroupHeaders,
        separator: this.separator,
        selectedColumns: this.selectedColumns,
      },
    }));
  }

  render() {
    return html`
      <div>
        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Format</h4>
          <div class="format-group">
            <button class="format-btn ${this.format === 'csv' ? 'format-btn--active' : ''}"
                    @click=${() => this.emitChange({ format: 'csv' })}>CSV</button>
            <button class="format-btn ${this.format === 'excel' ? 'format-btn--active' : ''}"
                    @click=${() => this.emitChange({ format: 'excel' })}>Excel</button>
          </div>
        </div>

        ${this.format === 'csv' ? html`
          <div class="phz-admin-section">
            <h4 class="phz-admin-section-title">CSV Options</h4>
            <div class="phz-admin-field">
              <label class="phz-admin-label">Separator</label>
              <select class="phz-admin-select" .value=${this.separator}
                      @change=${(e: Event) => this.emitChange({ separator: (e.target as HTMLSelectElement).value })}>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>
        ` : ''}

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Options</h4>
          <label class="phz-admin-checkbox">
            <input type="checkbox" ?checked=${this.includeHeaders}
                   @change=${(e: Event) => this.emitChange({ includeHeaders: (e.target as HTMLInputElement).checked })}>
            Include column headers
          </label>
          <label class="phz-admin-checkbox">
            <input type="checkbox" ?checked=${this.includeGroupHeaders}
                   @change=${(e: Event) => this.emitChange({ includeGroupHeaders: (e.target as HTMLInputElement).checked })}>
            Include group headers (if applicable)
          </label>
          <label class="phz-admin-checkbox">
            <input type="checkbox" ?checked=${this.includeFormatting}
                   @change=${(e: Event) => this.emitChange({ includeFormatting: (e.target as HTMLInputElement).checked })}>
            ${this.format === 'csv'
              ? 'Include formatting (formatted values & group rows)'
              : 'Include formatting (colors, styles & group rows)'}
          </label>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Columns</h4>
          ${(this.availableColumns ?? []).map(col => html`
            <label class="phz-admin-checkbox">
              <input type="checkbox" ?checked=${(this.selectedColumns ?? []).includes(col)}
                     @change=${() => {
                       const newSel = (this.selectedColumns ?? []).includes(col)
                         ? (this.selectedColumns ?? []).filter(c => c !== col)
                         : [...(this.selectedColumns ?? []), col];
                       this.emitChange({ selectedColumns: newSel });
                     }}>
              ${col}
            </label>
          `)}
        </div>

        <button class="download-btn" @click=${this._handleDownload}>
          Download ${this.format === 'csv' ? 'CSV' : 'Excel'}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'phz-admin-export': PhzAdminExport; }
}
