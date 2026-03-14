/**
 * <phz-report-embed> — Standalone report rendering surface.
 * Wraps a grid with report-specific features (title, description, export).
 *
 * Accepts a ReportViewConfig with data source, columns, filters, and sort.
 * Fetches data via DataAdapter.execute() or uses a direct data prop.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DataAdapter, ViewerContext } from '@phozart/shared/adapters';
import type { ColumnDefinition } from '@phozart/core';

// ========================================================================
// Configuration types
// ========================================================================

export interface ReportViewConfig {
  id: string;
  title: string;
  description?: string;
  sourceId: string;
  columns?: ColumnDefinition[];
  filters?: Array<{ field: string; operator: string; value: unknown }>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  pageSize?: number;
}

// ========================================================================
// <phz-report-embed>
// ========================================================================

@customElement('phz-report-embed')
export class PhzReportEmbed extends LitElement {
  static override styles = css`
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
  `;

  /** Data adapter for fetching report data. */
  @property({ attribute: false }) dataAdapter?: DataAdapter;

  /** Report configuration. */
  @property({ attribute: false }) config?: ReportViewConfig;

  /** Viewer context for RLS. */
  @property({ attribute: false }) viewerContext?: ViewerContext;

  /** Direct data override. */
  @property({ attribute: false }) data?: unknown[];

  /** Grid density. */
  @property({ type: String }) density: 'compact' | 'dense' | 'comfortable' = 'comfortable';

  /** Grid theme. */
  @property({ type: String }) theme: string = 'light';

  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _resolvedData: unknown[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._fetchData();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('config') || changed.has('dataAdapter') || changed.has('data')) {
      this._fetchData();
    }
  }

  private async _fetchData(): Promise<void> {
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
      const result = await this.dataAdapter.execute(
        {
          source: this.config.sourceId,
          fields,
          sort,
          limit: this.config.pageSize ?? 10000,
        },
        { viewerContext: this.viewerContext },
      );
      this._resolvedData = result.rows;
      this._loading = false;
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
      this._loading = false;
    }
  }

  protected override render() {
    if (this._error) {
      return html`<div class="report-error">${this._error}</div>`;
    }

    if (!this.config) {
      return html`<div class="report-empty">No report configuration provided.</div>`;
    }

    return html`
      <div class="report-header">
        <h2 class="report-title">${this.config.title}</h2>
        ${this.config.description ? html`<p class="report-description">${this.config.description}</p>` : ''}
      </div>
      <div class="report-body">
        ${this._loading
          ? html`<div class="report-loading">Loading report data...</div>`
          : html`
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
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-report-embed': PhzReportEmbed;
  }
}
