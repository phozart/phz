/**
 * @phozart/editor — <phz-editor-report> (B-2.09)
 *
 * Report editing component. Provides column configuration,
 * filter management, sort setup, and preview mode.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createReportEditState, toggleReportPreview, setReportTitle, } from '../screens/report-state.js';
let PhzEditorReport = class PhzEditorReport extends LitElement {
    constructor() {
        super(...arguments);
        this.reportId = '';
        this.editMode = false;
        this._state = createReportEditState('');
    }
    static { this.styles = css `
    :host { display: block; }
    .report-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 600;
      border: none;
      background: transparent;
      flex: 1;
      padding: 4px;
    }
    .report-title:focus {
      outline: 2px solid var(--phz-primary, #3b82f6);
      border-radius: 4px;
    }
    .report-body {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      min-height: 300px;
      padding: 16px;
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
        if (changed.has('reportId')) {
            this._state = createReportEditState(this.reportId);
        }
    }
    /** Get the current report state. */
    getState() {
        return this._state;
    }
    _onTitleChange(e) {
        const input = e.target;
        this._state = setReportTitle(this._state, input.value);
    }
    _onTogglePreview() {
        this._state = toggleReportPreview(this._state);
        this.dispatchEvent(new CustomEvent('preview-toggle', {
            detail: { previewMode: this._state.previewMode },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        return html `
      <div class="report-header">
        ${this.editMode
            ? html `<input
              class="report-title"
              type="text"
              .value=${this._state.title}
              @input=${this._onTitleChange}
              placeholder="Report title"
              aria-label="Report title"
            />`
            : html `<h2 class="report-title">${this._state.title || 'Untitled Report'}</h2>`}
        <button @click=${this._onTogglePreview}>
          ${this._state.previewMode ? 'Edit' : 'Preview'}
        </button>
      </div>

      <div class="report-body" role="region" aria-label="Report content">
        <slot name="columns"></slot>
        <slot name="filters"></slot>
        <slot name="preview"></slot>
        <slot></slot>
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzEditorReport.prototype, "reportId", void 0);
__decorate([
    property({ type: Boolean })
], PhzEditorReport.prototype, "editMode", void 0);
__decorate([
    state()
], PhzEditorReport.prototype, "_state", void 0);
PhzEditorReport = __decorate([
    customElement('phz-editor-report')
], PhzEditorReport);
export { PhzEditorReport };
//# sourceMappingURL=phz-editor-report.js.map