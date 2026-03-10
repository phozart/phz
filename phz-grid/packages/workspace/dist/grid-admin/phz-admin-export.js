/**
 * @phozart/phz-grid-admin — Export Settings
 *
 * CSV + Excel export configuration.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
let PhzAdminExport = class PhzAdminExport extends LitElement {
    constructor() {
        super(...arguments);
        this.format = 'csv';
        this.includeHeaders = true;
        this.includeFormatting = false;
        this.includeGroupHeaders = true;
        this.separator = ',';
        this.availableColumns = [];
        this.selectedColumns = [];
    }
    static { this.styles = [
        adminBaseStyles,
        css `
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
    ]; }
    emitChange(updates) {
        this.dispatchEvent(new CustomEvent('export-settings-change', {
            bubbles: true, composed: true, detail: updates,
        }));
    }
    _handleDownload() {
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
        return html `
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

        ${this.format === 'csv' ? html `
          <div class="phz-admin-section">
            <h4 class="phz-admin-section-title">CSV Options</h4>
            <div class="phz-admin-field">
              <label class="phz-admin-label">Separator</label>
              <select class="phz-admin-select" .value=${this.separator}
                      @change=${(e) => this.emitChange({ separator: e.target.value })}>
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
                   @change=${(e) => this.emitChange({ includeHeaders: e.target.checked })}>
            Include column headers
          </label>
          <label class="phz-admin-checkbox">
            <input type="checkbox" ?checked=${this.includeGroupHeaders}
                   @change=${(e) => this.emitChange({ includeGroupHeaders: e.target.checked })}>
            Include group headers (if applicable)
          </label>
          <label class="phz-admin-checkbox">
            <input type="checkbox" ?checked=${this.includeFormatting}
                   @change=${(e) => this.emitChange({ includeFormatting: e.target.checked })}>
            ${this.format === 'csv'
            ? 'Include formatting (formatted values & group rows)'
            : 'Include formatting (colors, styles & group rows)'}
          </label>
        </div>

        <div class="phz-admin-section">
          <h4 class="phz-admin-section-title">Columns</h4>
          ${(this.availableColumns ?? []).map(col => html `
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
};
__decorate([
    property({ type: String })
], PhzAdminExport.prototype, "format", void 0);
__decorate([
    property({ type: Boolean })
], PhzAdminExport.prototype, "includeHeaders", void 0);
__decorate([
    property({ type: Boolean })
], PhzAdminExport.prototype, "includeFormatting", void 0);
__decorate([
    property({ type: Boolean })
], PhzAdminExport.prototype, "includeGroupHeaders", void 0);
__decorate([
    property({ type: String })
], PhzAdminExport.prototype, "separator", void 0);
__decorate([
    property({ type: Array })
], PhzAdminExport.prototype, "availableColumns", void 0);
__decorate([
    property({ type: Array })
], PhzAdminExport.prototype, "selectedColumns", void 0);
PhzAdminExport = __decorate([
    safeCustomElement('phz-admin-export')
], PhzAdminExport);
export { PhzAdminExport };
//# sourceMappingURL=phz-admin-export.js.map