var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-viewer-report> Custom Element
 *
 * Report/grid view screen. Displays tabular data with pagination,
 * sort, and export. Delegates to phz-grid for rendering.
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createReportViewState, loadReport, setReportData, setReportPage, setReportPageSize, setReportSearch, setExporting, getReportTotalPages, } from '../screens/report-state.js';
// ========================================================================
// <phz-viewer-report>
// ========================================================================
let PhzViewerReport = class PhzViewerReport extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.reportId = '';
        this.reportTitle = '';
        this.reportDescription = '';
        this.columns = [];
        this.rows = [];
        this.totalRows = 0;
        this.exportFormats = ['csv', 'xlsx'];
        // --- Internal state ---
        this._reportState = createReportViewState();
    }
    static { this.styles = css `
    :host {
      display: block;
      padding: 16px;
    }

    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .report-title {
      font-size: 20px;
      font-weight: 600;
    }

    .report-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .report-search {
      padding: 6px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 6px;
      font-size: 13px;
    }

    .report-export-btn {
      padding: 6px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 6px;
      background: var(--phz-bg-surface, #ffffff);
      cursor: pointer;
      font-size: 13px;
    }

    .report-grid-slot {
      min-height: 200px;
    }

    .report-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      font-size: 13px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .report-pagination-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .report-pagination button {
      padding: 4px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      background: var(--phz-bg-surface, #ffffff);
      cursor: pointer;
    }

    .report-pagination button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .report-empty {
      text-align: center;
      padding: 48px;
      color: var(--phz-text-secondary, #64748b);
    }

    .report-page-size {
      padding: 4px 8px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 4px;
      font-size: 13px;
    }
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('reportId') || changed.has('columns') || changed.has('reportTitle')) {
            if (this.reportId) {
                this._reportState = loadReport(this._reportState, {
                    id: this.reportId,
                    title: this.reportTitle,
                    description: this.reportDescription,
                    columns: this.columns,
                    exportFormats: this.exportFormats,
                });
            }
        }
        if (changed.has('rows') || changed.has('totalRows')) {
            this._reportState = setReportData(this._reportState, this.rows, this.totalRows);
        }
    }
    // --- Public API ---
    getReportState() {
        return this._reportState;
    }
    // --- Rendering ---
    render() {
        const s = this._reportState;
        if (!s.reportId) {
            return html `<div class="report-empty">
        <p>Select a report from the catalog to view it here.</p>
      </div>`;
        }
        const totalPages = getReportTotalPages(s);
        return html `
      <div class="report-header">
        <div>
          <div class="report-title">${s.title}</div>
        </div>
        <div class="report-actions">
          <input
            class="report-search"
            type="search"
            placeholder="Search..."
            .value=${s.searchQuery}
            @input=${this._handleSearch}
            aria-label="Search report data"
          />
          ${s.exportFormats.map(fmt => html `
              <button
                class="report-export-btn"
                @click=${() => this._handleExport(fmt)}
                ?disabled=${s.exporting}
                aria-label="Export as ${fmt.toUpperCase()}"
              >${fmt.toUpperCase()}</button>
            `)}
        </div>
      </div>

      <div class="report-grid-slot">
        <slot></slot>
      </div>

      <div class="report-pagination">
        <span>${s.totalRows} rows</span>
        <div class="report-pagination-nav">
          <button
            ?disabled=${s.page === 0}
            @click=${() => this._handlePage(s.page - 1)}
            aria-label="Previous page"
          >Prev</button>
          <span>Page ${s.page + 1} of ${totalPages}</span>
          <button
            ?disabled=${s.page >= totalPages - 1}
            @click=${() => this._handlePage(s.page + 1)}
            aria-label="Next page"
          >Next</button>
        </div>
        <div>
          <select
            class="report-page-size"
            @change=${this._handlePageSize}
            aria-label="Rows per page"
          >
            ${[25, 50, 100, 250].map(n => html `<option value=${n} ?selected=${s.pageSize === n}>${n} rows</option>`)}
          </select>
        </div>
      </div>
    `;
    }
    // --- Event handlers ---
    _handleSearch(e) {
        const value = e.target.value;
        this._reportState = setReportSearch(this._reportState, value);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('report-search', { bubbles: true, composed: true, detail: { query: value } }));
    }
    _handleExport(format) {
        this._reportState = setExporting(this._reportState, true);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('report-export', {
            bubbles: true,
            composed: true,
            detail: { reportId: this._reportState.reportId, format },
        }));
    }
    _handlePage(page) {
        this._reportState = setReportPage(this._reportState, page);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('report-page', {
            bubbles: true,
            composed: true,
            detail: { page: this._reportState.page, pageSize: this._reportState.pageSize },
        }));
    }
    _handlePageSize(e) {
        const value = parseInt(e.target.value, 10);
        this._reportState = setReportPageSize(this._reportState, value);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('report-page', {
            bubbles: true,
            composed: true,
            detail: { page: 0, pageSize: value },
        }));
    }
};
__decorate([
    property({ type: String })
], PhzViewerReport.prototype, "reportId", void 0);
__decorate([
    property({ type: String })
], PhzViewerReport.prototype, "reportTitle", void 0);
__decorate([
    property({ type: String })
], PhzViewerReport.prototype, "reportDescription", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerReport.prototype, "columns", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerReport.prototype, "rows", void 0);
__decorate([
    property({ type: Number })
], PhzViewerReport.prototype, "totalRows", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerReport.prototype, "exportFormats", void 0);
__decorate([
    state()
], PhzViewerReport.prototype, "_reportState", void 0);
PhzViewerReport = __decorate([
    customElement('phz-viewer-report')
], PhzViewerReport);
export { PhzViewerReport };
//# sourceMappingURL=phz-viewer-report.js.map