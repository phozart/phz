/**
 * <phz-report-embed> — Standalone report rendering surface.
 * Wraps a grid with report-specific features (title, description, export).
 *
 * Accepts a ReportViewConfig with data source, columns, filters, and sort.
 * Fetches data via DataAdapter.execute() or uses a direct data prop.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
// ========================================================================
// <phz-report-embed>
// ========================================================================
let PhzReportEmbed = class PhzReportEmbed extends LitElement {
    constructor() {
        super(...arguments);
        /** Grid density. */
        this.density = 'comfortable';
        /** Grid theme. */
        this.theme = 'light';
        this._loading = false;
        this._error = null;
        this._resolvedData = [];
    }
    static { this.styles = css `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host([hidden]) { display: none; }
    .report-header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--phz-border, #e5e7eb);
    }
    .report-title {
      font-family: var(--phz-font-family, system-ui, sans-serif);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--phz-text-primary, #1f2937);
      margin: 0;
    }
    .report-description {
      font-family: var(--phz-font-family, system-ui, sans-serif);
      font-size: 0.875rem;
      color: var(--phz-text-secondary, #6b7280);
      margin: 4px 0 0;
    }
    .report-body {
      width: 100%;
      height: calc(100% - 80px);
    }
    .report-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--phz-text-secondary, #6b7280);
    }
    .report-error {
      padding: 16px;
      color: var(--phz-error-text, #dc2626);
      background: var(--phz-error-bg, #fef2f2);
      border-radius: 8px;
      margin: 16px;
    }
    .report-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--phz-text-secondary, #6b7280);
    }
  `; }
    connectedCallback() {
        super.connectedCallback();
        this._fetchData();
    }
    updated(changed) {
        if (changed.has('config') || changed.has('dataAdapter') || changed.has('data')) {
            this._fetchData();
        }
    }
    async _fetchData() {
        if (this.data) {
            this._resolvedData = this.data;
            this._loading = false;
            this._error = null;
            return;
        }
        if (!this.dataAdapter || !this.config) {
            this._resolvedData = [];
            return;
        }
        this._loading = true;
        this._error = null;
        try {
            const fields = this.config.columns?.map(c => c.field) ?? [];
            const sort = this.config.sort
                ? [{ field: this.config.sort.field, direction: this.config.sort.direction }]
                : undefined;
            const result = await this.dataAdapter.execute({
                source: this.config.sourceId,
                fields,
                sort,
                limit: this.config.pageSize ?? 10000,
            }, { viewerContext: this.viewerContext });
            this._resolvedData = result.rows;
            this._loading = false;
        }
        catch (err) {
            this._error = err instanceof Error ? err.message : String(err);
            this._loading = false;
        }
    }
    render() {
        if (this._error) {
            return html `<div class="report-error">${this._error}</div>`;
        }
        if (!this.config) {
            return html `<div class="report-empty">No report configuration provided.</div>`;
        }
        return html `
      <div class="report-header">
        <h2 class="report-title">${this.config.title}</h2>
        ${this.config.description ? html `<p class="report-description">${this.config.description}</p>` : ''}
      </div>
      <div class="report-body">
        ${this._loading
            ? html `<div class="report-loading">Loading report data...</div>`
            : html `
            <phz-grid
              .data=${this._resolvedData}
              .columns=${this.config.columns ?? []}
              density=${this.density}
              theme=${this.theme}
            ></phz-grid>
          `}
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzReportEmbed.prototype, "dataAdapter", void 0);
__decorate([
    property({ attribute: false })
], PhzReportEmbed.prototype, "config", void 0);
__decorate([
    property({ attribute: false })
], PhzReportEmbed.prototype, "viewerContext", void 0);
__decorate([
    property({ attribute: false })
], PhzReportEmbed.prototype, "data", void 0);
__decorate([
    property({ type: String })
], PhzReportEmbed.prototype, "density", void 0);
__decorate([
    property({ type: String })
], PhzReportEmbed.prototype, "theme", void 0);
__decorate([
    state()
], PhzReportEmbed.prototype, "_loading", void 0);
__decorate([
    state()
], PhzReportEmbed.prototype, "_error", void 0);
__decorate([
    state()
], PhzReportEmbed.prototype, "_resolvedData", void 0);
PhzReportEmbed = __decorate([
    customElement('phz-report-embed')
], PhzReportEmbed);
export { PhzReportEmbed };
//# sourceMappingURL=phz-report-view.js.map