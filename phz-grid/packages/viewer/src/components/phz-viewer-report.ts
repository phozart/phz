/**
 * @phozart/phz-viewer — <phz-viewer-report> Custom Element
 *
 * Report/grid view screen. Displays tabular data with pagination,
 * sort, and export. Delegates to phz-grid for rendering.
 */
import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { ExportFormat } from '@phozart/phz-shared/adapters';
import {
  type ReportViewState,
  type ReportColumnView,
  createReportViewState,
  loadReport,
  setReportData,
  toggleReportSort,
  setReportPage,
  setReportPageSize,
  setReportSearch,
  toggleColumnVisibility,
  setExporting,
  getReportTotalPages,
  getVisibleColumns,
} from '../screens/report-state.js';

// ========================================================================
// Custom events
// ========================================================================

export interface ReportExportEventDetail {
  reportId: string;
  format: ExportFormat;
}

export interface ReportSortEventDetail {
  field: string;
  direction: 'asc' | 'desc' | null;
}

export interface ReportPageEventDetail {
  page: number;
  pageSize: number;
}

// ========================================================================
// <phz-viewer-report>
// ========================================================================

@customElement('phz-viewer-report')
export class PhzViewerReport extends LitElement {
  static override styles = css`
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
  `;

  // --- Public properties ---

  @property({ type: String })
  reportId: string = '';

  @property({ type: String })
  reportTitle: string = '';

  @property({ type: String })
  reportDescription: string = '';

  @property({ attribute: false })
  columns: ReportColumnView[] = [];

  @property({ attribute: false })
  rows: unknown[][] = [];

  @property({ type: Number })
  totalRows: number = 0;

  @property({ attribute: false })
  exportFormats: ExportFormat[] = ['csv', 'xlsx'];

  // --- Internal state ---

  @state()
  private _reportState: ReportViewState = createReportViewState();

  // --- Lifecycle ---

  override willUpdate(changed: Map<string, unknown>): void {
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

  getReportState(): ReportViewState {
    return this._reportState;
  }

  // --- Rendering ---

  override render(): TemplateResult {
    const s = this._reportState;

    if (!s.reportId) {
      return html`<div class="report-empty">
        <p>Select a report from the catalog to view it here.</p>
      </div>`;
    }

    const totalPages = getReportTotalPages(s);

    return html`
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
          ${s.exportFormats.map(
            fmt => html`
              <button
                class="report-export-btn"
                @click=${() => this._handleExport(fmt)}
                ?disabled=${s.exporting}
                aria-label="Export as ${fmt.toUpperCase()}"
              >${fmt.toUpperCase()}</button>
            `,
          )}
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
            ${[25, 50, 100, 250].map(
              n => html`<option value=${n} ?selected=${s.pageSize === n}>${n} rows</option>`,
            )}
          </select>
        </div>
      </div>
    `;
  }

  // --- Event handlers ---

  private _handleSearch(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this._reportState = setReportSearch(this._reportState, value);
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent('report-search', { bubbles: true, composed: true, detail: { query: value } }),
    );
  }

  private _handleExport(format: ExportFormat): void {
    this._reportState = setExporting(this._reportState, true);
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent<ReportExportEventDetail>('report-export', {
        bubbles: true,
        composed: true,
        detail: { reportId: this._reportState.reportId!, format },
      }),
    );
  }

  private _handlePage(page: number): void {
    this._reportState = setReportPage(this._reportState, page);
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent<ReportPageEventDetail>('report-page', {
        bubbles: true,
        composed: true,
        detail: { page: this._reportState.page, pageSize: this._reportState.pageSize },
      }),
    );
  }

  private _handlePageSize(e: Event): void {
    const value = parseInt((e.target as HTMLSelectElement).value, 10);
    this._reportState = setReportPageSize(this._reportState, value);
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent<ReportPageEventDetail>('report-page', {
        bubbles: true,
        composed: true,
        detail: { page: 0, pageSize: value },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-viewer-report': PhzViewerReport;
  }
}
