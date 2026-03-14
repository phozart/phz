/**
 * @phozart/definitions — <phz-definition-report>
 *
 * Form for editing report/definition identity (name, description).
 * Emits `report-meta-change` on any field change.
 *
 * Migrated from phz-grid-admin's phz-admin-report with new tag name.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { adminBaseStyles } from './shared-styles.js';
let PhzDefinitionReport = class PhzDefinitionReport extends LitElement {
    constructor() {
        super(...arguments);
        this.reportName = '';
        this.reportDescription = '';
        this.reportId = '';
        this.createdBy = '';
        this.created = 0;
        this.updatedAt = 0;
        this.mode = 'edit';
    }
    static { this.styles = [
        adminBaseStyles,
        css `
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
    ]; }
    _emit(key, value) {
        this.dispatchEvent(new CustomEvent('report-meta-change', {
            bubbles: true, composed: true,
            detail: { key, value },
        }));
    }
    _formatDate(ts) {
        if (!ts)
            return '\u2014';
        return new Date(ts).toLocaleString();
    }
    render() {
        const showValidation = this.mode === 'create' && !this.reportName.trim();
        return html `
      <div class="report-form">
        ${this.reportId ? html `
          <div class="meta-row">
            <span><span class="meta-label">ID:</span> ${this.reportId}</span>
            ${this.created ? html `<span><span class="meta-label">Created:</span> ${this._formatDate(this.created)}</span>` : nothing}
            ${this.updatedAt ? html `<span><span class="meta-label">Updated:</span> ${this._formatDate(this.updatedAt)}</span>` : nothing}
            ${this.createdBy ? html `<span><span class="meta-label">By:</span> ${this.createdBy}</span>` : nothing}
          </div>
        ` : nothing}

        <div class="phz-admin-field">
          <label class="phz-admin-label">
            Report Name<span class="required-mark">*</span>
          </label>
          <input class="phz-admin-input"
                 type="text"
                 .value=${this.reportName}
                 @input=${(e) => this._emit('name', e.target.value)}
                 placeholder="Enter report name..."
                 required />
          ${showValidation ? html `<div class="validation-error">Report name is required</div>` : nothing}
        </div>

        <div class="phz-admin-field">
          <label class="phz-admin-label">Description</label>
          <textarea class="phz-admin-input"
                    .value=${this.reportDescription}
                    @input=${(e) => this._emit('description', e.target.value)}
                    placeholder="Optional description..."></textarea>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzDefinitionReport.prototype, "reportName", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionReport.prototype, "reportDescription", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionReport.prototype, "reportId", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionReport.prototype, "createdBy", void 0);
__decorate([
    property({ type: Number })
], PhzDefinitionReport.prototype, "created", void 0);
__decorate([
    property({ type: Number })
], PhzDefinitionReport.prototype, "updatedAt", void 0);
__decorate([
    property({ type: String })
], PhzDefinitionReport.prototype, "mode", void 0);
PhzDefinitionReport = __decorate([
    safeCustomElement('phz-definition-report')
], PhzDefinitionReport);
export { PhzDefinitionReport };
//# sourceMappingURL=phz-definition-report.js.map