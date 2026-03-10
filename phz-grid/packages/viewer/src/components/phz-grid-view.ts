/**
 * <phz-grid-view> — Standalone grid rendering surface.
 * Use without the viewer shell for embedding grids directly.
 *
 * Accepts either direct data/columns or a grid definition blueprint.
 * When a DataAdapter is provided alongside a definition, fetches data
 * automatically via the adapter's execute() method.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DataAdapter, ViewerContext } from '@phozart/phz-shared/adapters';
import type { ColumnDefinition } from '@phozart/phz-core';

// ========================================================================
// Local definition types (mirrors @phozart/phz-definitions subset)
// ========================================================================

/**
 * Serializable column spec — JSON-safe subset of ColumnDefinition.
 * No functions (renderer, validator, etc.).
 */
export interface GridViewColumnSpec {
  field: string;
  header?: string;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  resizable?: boolean;
  frozen?: 'left' | 'right' | null;
  priority?: 1 | 2 | 3;
}

/**
 * Data source discriminated union for grid view definitions.
 */
export type GridViewDataSource =
  | { type: 'local'; data: unknown[] }
  | { type: 'data-product'; dataProductId: string }
  | { type: 'url'; url: string }
  | { type: 'duckdb-query'; sql: string };

/**
 * Lightweight grid definition for the standalone grid view.
 */
export interface GridViewDefinition {
  dataSource: GridViewDataSource;
  columns: GridViewColumnSpec[];
}

// ========================================================================
// Helpers
// ========================================================================

/**
 * Convert a serializable column spec to a core ColumnDefinition.
 * ColumnDefinition can carry renderers, validators, etc., but the
 * spec only contains JSON-safe properties.
 */
export function specToColumn(spec: GridViewColumnSpec): ColumnDefinition {
  return {
    field: spec.field,
    header: spec.header,
    type: spec.type,
    width: spec.width,
    minWidth: spec.minWidth,
    maxWidth: spec.maxWidth,
    sortable: spec.sortable,
    filterable: spec.filterable,
    editable: spec.editable,
    resizable: spec.resizable,
    frozen: spec.frozen,
    priority: spec.priority,
  };
}

// ========================================================================
// <phz-grid-view>
// ========================================================================

@customElement('phz-grid-view')
export class PhzGridView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host([hidden]) { display: none; }
    .grid-view-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .grid-view-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--phz-text-secondary, #6b7280);
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }
    .grid-view-error {
      padding: 16px;
      color: var(--phz-error-text, #dc2626);
      background: var(--phz-error-bg, #fef2f2);
      border-radius: 8px;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }
  `;

  /** Data adapter for server-side data fetching. */
  @property({ attribute: false }) dataAdapter?: DataAdapter;

  /** Grid definition blueprint (columns, data source). */
  @property({ attribute: false }) definition?: GridViewDefinition;

  /** Direct data array (overrides definition.dataSource if provided). */
  @property({ attribute: false }) data?: unknown[];

  /** Direct column definitions (overrides definition.columns if provided). */
  @property({ attribute: false }) columns?: ColumnDefinition[];

  /** Viewer context for RLS and personalization. */
  @property({ attribute: false }) viewerContext?: ViewerContext;

  /** Grid density mode. */
  @property({ type: String }) density: 'compact' | 'dense' | 'comfortable' = 'comfortable';

  /** Grid theme. */
  @property({ type: String }) theme: string = 'light';

  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _resolvedData: unknown[] = [];
  @state() private _resolvedColumns: ColumnDefinition[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._resolveData();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('data') || changed.has('columns') || changed.has('definition') || changed.has('dataAdapter')) {
      this._resolveData();
    }
  }

  private async _resolveData(): Promise<void> {
    // Direct data takes precedence
    if (this.data) {
      this._resolvedData = this.data;
      this._resolvedColumns = this.columns ?? (this.definition?.columns ?? []).map(specToColumn);
      this._loading = false;
      this._error = null;
      return;
    }

    // If we have a definition with local data source
    if (this.definition?.dataSource.type === 'local') {
      this._resolvedData = this.definition.dataSource.data;
      this._resolvedColumns = this.columns ?? this.definition.columns.map(specToColumn);
      this._loading = false;
      this._error = null;
      return;
    }

    // If we have a data adapter and definition, fetch data
    if (this.dataAdapter && this.definition) {
      this._loading = true;
      this._error = null;
      try {
        const sourceId = this.definition.dataSource.type === 'data-product'
          ? this.definition.dataSource.dataProductId
          : 'default';
        const result = await this.dataAdapter.execute(
          {
            source: sourceId,
            fields: this.definition.columns.map(c => c.field),
          },
          { viewerContext: this.viewerContext },
        );
        this._resolvedData = result.rows;
        this._resolvedColumns = this.columns ?? this.definition.columns.map(specToColumn);
        this._loading = false;
      } catch (err) {
        this._error = err instanceof Error ? err.message : String(err);
        this._loading = false;
      }
      return;
    }

    // Fallback: use whatever columns are available
    this._resolvedColumns = this.columns ?? (this.definition?.columns ?? []).map(specToColumn);
    this._resolvedData = [];
  }

  protected override render() {
    if (this._error) {
      return html`<div class="grid-view-error">${this._error}</div>`;
    }
    if (this._loading) {
      return html`<div class="grid-view-loading">Loading data...</div>`;
    }
    return html`
      <div class="grid-view-container">
        <phz-grid
          .data=${this._resolvedData}
          .columns=${this._resolvedColumns}
          density=${this.density}
          theme=${this.theme}
          grid-height="100%"
        ></phz-grid>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-grid-view': PhzGridView;
  }
}
