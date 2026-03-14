/**
 * <phz-data-workbench> — Interactive Data Workbench (Tableau-like)
 *
 * A visual query builder where users:
 * 1. Connect to a data source → fields load and are classified
 * 2. Drag/click fields into shelves (Rows, Columns, Values, Filters)
 * 3. See a LIVE preview of the data that updates with every field change
 * 4. Cycle aggregations on measures (SUM → AVG → COUNT → etc.)
 * 5. Switch preview mode (Table / Chart / SQL)
 * 6. Save as Report or Add to Dashboard
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────┐
 * │ Toolbar: [Source ▾] [Undo] [Redo] [Save ▾]          │
 * ├──────────┬───────────────────────────────────────────┤
 * │ Fields   │  Shelves: Rows / Columns / Values / Filts │
 * │ (search) │  ─────────────────────────────────────── │
 * │ Time     │  Preview: [Table] [Chart] [SQL]           │
 * │ Dims     │  ┌───────────────────────────────────┐   │
 * │ Measures │  │ Live data table or chart           │   │
 * │ IDs      │  └───────────────────────────────────┘   │
 * ├──────────┴───────────────────────────────────────────┤
 * │ Status bar: rows · columns · query time              │
 * └──────────────────────────────────────────────────────┘
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import type { DataAdapter } from '../data-adapter.js';
import type { FieldMetadata, DataSourceMeta } from '@phozart/shared';
import type { ZoneName } from '@phozart/engine';
import { exploreQueryToDataQuery } from '../coordination/explorer-wiring.js';
import {
  type WorkbenchState,
  type PreviewMode,
  createWorkbenchState,
  setWorkbenchSources,
  setWorkbenchSourcesLoading,
  setWorkbenchSchema,
  setWorkbenchSchemaLoading,
  setWorkbenchFieldSearch,
  addFieldToWorkbench,
  removeFieldFromWorkbench,
  autoPlaceWorkbenchField,
  cycleAggregation,
  setPreviewMode,
  setPreviewLoading,
  setPreviewResult,
  setPreviewError,
  workbenchToExploreQuery,
  hasWorkbenchQuery,
  getFilteredFieldsByCategory,
  pushWorkbenchSnapshot,
  undoWorkbench,
  redoWorkbench,
  canUndoWorkbench,
  canRedoWorkbench,
} from './data-workbench-orchestrator.js';

// ========================================================================
// Type icons for field palette
// ========================================================================

const TYPE_ICONS: Record<string, string> = {
  date: '\u{1F4C5}',      // 📅
  string: '\u{1F4CA}',    // 📊
  number: '\u{1F4C8}',    // 📈
  boolean: '\u{2705}',    // ✅
};

const CATEGORY_LABELS: Record<string, string> = {
  timeFields: 'Time',
  dimensions: 'Dimensions',
  measures: 'Measures',
  identifiers: 'Identifiers',
};

const CATEGORY_COLORS: Record<string, string> = {
  timeFields: '#f59e0b',
  dimensions: '#3b82f6',
  measures: '#10b981',
  identifiers: '#8b5cf6',
};

@safeCustomElement('phz-data-workbench')
export class PhzDataWorkbench extends LitElement {
  // ── Properties ──

  /** DataAdapter for loading sources, schemas, and executing queries. */
  @property({ attribute: false }) adapter?: DataAdapter;

  /** Pre-select a data source by ID. */
  @property({ type: String }) sourceId?: string;

  // ── Internal State ──

  @state() private _state: WorkbenchState = createWorkbenchState();

  /** Debounce timer for auto-preview. */
  private _previewTimer: ReturnType<typeof setTimeout> | null = null;

  /** Track whether we've loaded sources already. */
  private _sourcesLoaded = false;

  // ── Styles ──

  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto 1fr auto;
      grid-template-columns: 240px 1fr;
      height: 100%;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--phz-text, #1C1917);
      --_shelf-bg: #f8fafc;
      --_shelf-border: #e2e8f0;
      --_chip-radius: 6px;
    }

    /* ── Toolbar ── */
    .wb-toolbar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--_shelf-border);
      background: #fff;
    }

    .wb-toolbar__title {
      font-weight: 700;
      font-size: 15px;
      margin-right: 12px;
    }

    .wb-toolbar__source-select {
      padding: 6px 10px;
      border: 1px solid var(--_shelf-border);
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
      min-width: 160px;
    }

    .wb-toolbar__spacer { flex: 1; }

    .wb-btn {
      padding: 6px 12px;
      border: 1px solid var(--_shelf-border);
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.1s;
    }

    .wb-btn:hover { background: #f1f5f9; }
    .wb-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .wb-btn--primary {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }

    .wb-btn--primary:hover { background: #1d4ed8; }

    .wb-btn--save-menu {
      position: relative;
    }

    /* ── Field Palette (Left Panel) ── */
    .wb-palette {
      grid-row: 2;
      grid-column: 1;
      overflow-y: auto;
      background: #fff;
      border-right: 1px solid var(--_shelf-border);
      padding: 0;
    }

    .wb-palette__search {
      padding: 8px 12px;
      border-bottom: 1px solid var(--_shelf-border);
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 1;
    }

    .wb-palette__search-input {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid var(--_shelf-border);
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    }

    .wb-palette__search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .wb-palette__category {
      padding: 0 8px;
    }

    .wb-palette__category-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 12px 4px 4px;
      color: var(--phz-text-muted, #78716C);
    }

    .wb-palette__category-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .wb-field {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.1s;
      user-select: none;
    }

    .wb-field:hover { background: #f1f5f9; }

    .wb-field__icon {
      width: 16px;
      text-align: center;
      flex-shrink: 0;
      font-size: 11px;
    }

    .wb-field__name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wb-field__type {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .wb-field__type--string { background: #dbeafe; color: #1d4ed8; }
    .wb-field__type--number { background: #dcfce7; color: #166534; }
    .wb-field__type--date { background: #fef3c7; color: #92400e; }
    .wb-field__type--boolean { background: #f3e8ff; color: #7c3aed; }

    /* ── Main Area (Shelves + Preview) ── */
    .wb-main {
      grid-row: 2;
      grid-column: 2;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Shelves ── */
    .wb-shelves {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 12px 16px;
      background: var(--_shelf-bg);
      border-bottom: 1px solid var(--_shelf-border);
      flex-shrink: 0;
    }

    .wb-shelf {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      min-height: 34px;
      padding: 4px 8px;
      border: 1px dashed var(--_shelf-border);
      border-radius: 6px;
      background: #fff;
      transition: border-color 0.15s, background 0.15s;
    }

    .wb-shelf:hover,
    .wb-shelf--drag-over {
      border-color: #93c5fd;
      background: #eff6ff;
    }

    .wb-shelf__label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--phz-text-muted, #78716C);
      min-width: 60px;
      flex-shrink: 0;
    }

    .wb-shelf__placeholder {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
    }

    /* ── Shelf Chips ── */
    .wb-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--_chip-radius);
      font-size: 12px;
      font-weight: 500;
      background: #e0f2fe;
      color: #0369a1;
      cursor: default;
      transition: background 0.1s;
    }

    .wb-chip--values {
      background: #dcfce7;
      color: #166534;
    }

    .wb-chip--filters {
      background: #fef3c7;
      color: #92400e;
    }

    .wb-chip__agg {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.08);
      cursor: pointer;
      font-weight: 700;
      text-transform: uppercase;
      transition: background 0.1s;
    }

    .wb-chip__agg:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    .wb-chip__remove {
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      opacity: 0.5;
      transition: opacity 0.1s;
      border: none;
      background: none;
      padding: 0;
      color: inherit;
    }

    .wb-chip__remove:hover { opacity: 1; }

    /* ── Preview ── */
    .wb-preview {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }

    .wb-preview__tabs {
      display: flex;
      gap: 2px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--_shelf-border);
      background: #fff;
      flex-shrink: 0;
    }

    .wb-preview__tab {
      padding: 6px 14px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--phz-text-muted, #78716C);
      transition: all 0.15s;
    }

    .wb-preview__tab:hover {
      background: #f1f5f9;
      color: var(--phz-text, #1C1917);
    }

    .wb-preview__tab--active {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }

    .wb-preview__chart-hint {
      margin-left: auto;
      font-size: 12px;
      color: var(--phz-text-muted, #78716C);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .wb-preview__body {
      flex: 1;
      overflow: auto;
      padding: 0;
      position: relative;
    }

    /* ── Data Table Preview ── */
    .wb-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .wb-table th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #f8fafc;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--phz-text-muted, #78716C);
      border-bottom: 2px solid var(--_shelf-border);
      white-space: nowrap;
    }

    .wb-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .wb-table tr:hover td { background: #f8fafc; }

    .wb-table td.wb-table__number {
      text-align: right;
      font-weight: 500;
    }

    /* ── Empty / Loading / Error States ── */
    .wb-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      color: var(--phz-text-muted, #78716C);
    }

    .wb-empty__icon { font-size: 48px; margin-bottom: 16px; }
    .wb-empty__title { font-size: 16px; font-weight: 600; color: var(--phz-text, #1C1917); margin: 0 0 8px; }
    .wb-empty__desc { font-size: 13px; max-width: 320px; margin: 0; }

    .wb-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: var(--phz-text-muted, #78716C);
    }

    .wb-loading__spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: wb-spin 0.6s linear infinite;
      margin-right: 12px;
    }

    @keyframes wb-spin {
      to { transform: rotate(360deg); }
    }

    .wb-error {
      padding: 16px;
      margin: 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 13px;
    }

    /* SQL preview */
    .wb-sql {
      padding: 16px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 8px;
      margin: 16px;
      line-height: 1.6;
    }

    /* ── Status Bar ── */
    .wb-status {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 6px 16px;
      border-top: 1px solid var(--_shelf-border);
      background: #f8fafc;
      font-size: 12px;
      color: var(--phz-text-muted, #78716C);
    }

    .wb-status__item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .wb-status__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .wb-status__dot--ready { background: #10b981; }
    .wb-status__dot--loading { background: #f59e0b; }
    .wb-status__dot--error { background: #ef4444; }
    .wb-status__dot--idle { background: #94a3b8; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      :host {
        grid-template-columns: 1fr;
      }
      .wb-palette { display: none; }
      .wb-shelves { grid-template-columns: 1fr; }
    }
  `;

  // ── Lifecycle ──

  override connectedCallback(): void {
    super.connectedCallback();
    this._loadSources();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._previewTimer) {
      clearTimeout(this._previewTimer);
      this._previewTimer = null;
    }
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('adapter') && this.adapter && !this._sourcesLoaded) {
      this._loadSources();
    }
    if (changed.has('sourceId') && this.sourceId) {
      this._selectSource(this.sourceId);
    }
  }

  // ── Async Data Operations ──

  private async _loadSources(): Promise<void> {
    if (!this.adapter || this._sourcesLoaded) return;
    this._sourcesLoaded = true;
    this._state = setWorkbenchSourcesLoading(this._state);
    try {
      const sources = await this.adapter.listDataSources();
      this._state = setWorkbenchSources(this._state, sources as DataSourceMeta[]);
      // Auto-select if sourceId prop is set or only one source
      if (this.sourceId) {
        await this._selectSource(this.sourceId);
      } else if (this._state.sources.length === 1) {
        await this._selectSource(this._state.sources[0].id);
      }
    } catch (err) {
      this._state = { ...this._state, sourcesLoading: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async _selectSource(sourceId: string): Promise<void> {
    if (!this.adapter) return;
    this._state = setWorkbenchSchemaLoading(this._state);
    try {
      const schema = await this.adapter.getSchema(sourceId);
      this._state = setWorkbenchSchema(this._state, schema);
    } catch (err) {
      this._state = { ...this._state, schemaLoading: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private _schedulePreview(): void {
    if (this._previewTimer) clearTimeout(this._previewTimer);
    this._previewTimer = setTimeout(() => {
      this._previewTimer = null;
      this._fetchPreview();
    }, 300); // 300ms debounce
  }

  private async _fetchPreview(): Promise<void> {
    if (!this.adapter || !this._state.selectedSourceId) return;
    if (!hasWorkbenchQuery(this._state)) {
      this._state = { ...this._state, previewResult: undefined, previewLoading: false };
      return;
    }

    this._state = setPreviewLoading(this._state, true);

    try {
      const query = workbenchToExploreQuery(this._state);
      const dataQuery = exploreQueryToDataQuery(query, this._state.selectedSourceId!);
      const result = await this.adapter.execute(dataQuery);
      this._state = setPreviewResult(this._state, result as any);
    } catch (err) {
      this._state = setPreviewError(this._state, err instanceof Error ? err.message : String(err));
    }
  }

  // ── Event Handlers ──

  private _onSourceChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    this._selectSource(select.value);
  }

  private _onFieldSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._state = setWorkbenchFieldSearch(this._state, input.value);
  }

  private _onFieldDoubleClick(field: FieldMetadata): void {
    this._state = pushWorkbenchSnapshot(this._state);
    this._state = autoPlaceWorkbenchField(this._state, field);
    this._schedulePreview();
  }

  private _onFieldClickToZone(field: FieldMetadata, zone: ZoneName): void {
    this._state = pushWorkbenchSnapshot(this._state);
    this._state = addFieldToWorkbench(this._state, zone, field);
    this._schedulePreview();
  }

  private _onRemoveFromZone(zone: ZoneName, fieldName: string): void {
    this._state = pushWorkbenchSnapshot(this._state);
    this._state = removeFieldFromWorkbench(this._state, zone, fieldName);
    this._schedulePreview();
  }

  private _onCycleAgg(fieldName: string): void {
    this._state = pushWorkbenchSnapshot(this._state);
    this._state = cycleAggregation(this._state, fieldName);
    this._schedulePreview();
  }

  private _onPreviewModeChange(mode: PreviewMode): void {
    this._state = setPreviewMode(this._state, mode);
  }

  private _onUndo(): void {
    this._state = undoWorkbench(this._state);
    this._schedulePreview();
  }

  private _onRedo(): void {
    this._state = redoWorkbench(this._state);
    this._schedulePreview();
  }

  private _onSaveAsReport(): void {
    const query = workbenchToExploreQuery(this._state);
    this.dispatchEvent(new CustomEvent('save-as-report', {
      bubbles: true,
      composed: true,
      detail: {
        query,
        dataSourceId: this._state.selectedSourceId,
        suggestedChart: this._state.suggestedChart,
      },
    }));
  }

  private _onAddToDashboard(): void {
    const query = workbenchToExploreQuery(this._state);
    this.dispatchEvent(new CustomEvent('add-to-dashboard', {
      bubbles: true,
      composed: true,
      detail: {
        query,
        dataSourceId: this._state.selectedSourceId,
        suggestedChart: this._state.suggestedChart,
      },
    }));
  }

  // ── Render ──

  override render() {
    return html`
      ${this._renderToolbar()}
      ${this._renderPalette()}
      <div class="wb-main">
        ${this._renderShelves()}
        ${this._renderPreview()}
      </div>
      ${this._renderStatusBar()}
    `;
  }

  // ── Toolbar ──

  private _renderToolbar() {
    return html`
      <div class="wb-toolbar">
        <span class="wb-toolbar__title">Data Workbench</span>
        ${this._state.sources.length > 0 ? html`
          <select class="wb-toolbar__source-select"
                  .value=${this._state.selectedSourceId ?? ''}
                  @change=${this._onSourceChange}>
            <option value="" disabled>Select data source...</option>
            ${this._state.sources.map(s => html`
              <option value=${s.id} ?selected=${s.id === this._state.selectedSourceId}>${s.name}</option>
            `)}
          </select>
        ` : this._state.sourcesLoading ? html`
          <span style="font-size:13px;color:#78716C;">Loading sources...</span>
        ` : nothing}
        <div class="wb-toolbar__spacer"></div>
        <button class="wb-btn" @click=${this._onUndo}
                ?disabled=${!canUndoWorkbench(this._state)}
                title="Undo (Ctrl+Z)">Undo</button>
        <button class="wb-btn" @click=${this._onRedo}
                ?disabled=${!canRedoWorkbench(this._state)}
                title="Redo (Ctrl+Y)">Redo</button>
        <button class="wb-btn" @click=${this._onSaveAsReport}
                ?disabled=${!hasWorkbenchQuery(this._state)}>Save as Report</button>
        <button class="wb-btn wb-btn--primary" @click=${this._onAddToDashboard}
                ?disabled=${!hasWorkbenchQuery(this._state)}>Add to Dashboard</button>
      </div>
    `;
  }

  // ── Field Palette ──

  private _renderPalette() {
    const groups = getFilteredFieldsByCategory(this._state);

    return html`
      <aside class="wb-palette" role="complementary" aria-label="Available fields">
        <div class="wb-palette__search">
          <input class="wb-palette__search-input"
                 type="search"
                 placeholder="Search fields..."
                 .value=${this._state.fieldSearch}
                 @input=${this._onFieldSearch}
                 aria-label="Search fields" />
        </div>

        ${this._state.schemaLoading ? html`
          <div class="wb-loading">
            <div class="wb-loading__spinner"></div>
            Loading schema...
          </div>
        ` : !this._state.schema ? html`
          <div class="wb-empty" style="padding:32px 16px;">
            <p class="wb-empty__desc">Select a data source to see available fields</p>
          </div>
        ` : html`
          ${this._renderFieldCategory('timeFields', groups.timeFields)}
          ${this._renderFieldCategory('dimensions', groups.dimensions)}
          ${this._renderFieldCategory('measures', groups.measures)}
          ${this._renderFieldCategory('identifiers', groups.identifiers)}
        `}
      </aside>
    `;
  }

  private _renderFieldCategory(category: string, fields: FieldMetadata[]) {
    if (fields.length === 0) return nothing;

    return html`
      <div class="wb-palette__category">
        <div class="wb-palette__category-header">
          <span class="wb-palette__category-dot"
                style="background:${CATEGORY_COLORS[category] ?? '#94a3b8'};"></span>
          ${CATEGORY_LABELS[category] ?? category} (${fields.length})
        </div>
        ${fields.map(f => html`
          <div class="wb-field"
               @dblclick=${() => this._onFieldDoubleClick(f)}
               title="Double-click to auto-place, or click + to add to a specific shelf"
               role="button"
               tabindex="0"
               @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._onFieldDoubleClick(f); }}>
            <span class="wb-field__icon">${TYPE_ICONS[f.dataType] ?? ''}</span>
            <span class="wb-field__name">${f.name}</span>
            <span class="wb-field__type wb-field__type--${f.dataType}">${f.dataType.charAt(0).toUpperCase()}</span>
          </div>
        `)}
      </div>
    `;
  }

  // ── Shelves (Rows / Columns / Values / Filters) ──

  private _renderShelves() {
    const dz = this._state.dropZones;

    return html`
      <div class="wb-shelves">
        ${this._renderShelf('rows', 'Rows', dz.rows, 'dimension')}
        ${this._renderShelf('columns', 'Columns', dz.columns, 'dimension')}
        ${this._renderShelf('values', 'Values', dz.values, 'value')}
        ${this._renderShelf('filters', 'Filters', dz.filters, 'filter')}
      </div>
    `;
  }

  private _renderShelf(zone: ZoneName, label: string, entries: any[], type: string) {
    return html`
      <div class="wb-shelf"
           role="region"
           aria-label="${label} shelf"
           @dragover=${(e: DragEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('wb-shelf--drag-over'); }}
           @dragleave=${(e: DragEvent) => { (e.currentTarget as HTMLElement).classList.remove('wb-shelf--drag-over'); }}
           @drop=${(e: DragEvent) => {
             e.preventDefault();
             (e.currentTarget as HTMLElement).classList.remove('wb-shelf--drag-over');
             const fieldName = e.dataTransfer?.getData('text/plain');
             if (fieldName && this._state.schema) {
               const field = this._state.schema.fields.find(f => f.name === fieldName);
               if (field) this._onFieldClickToZone(field, zone);
             }
           }}>
        <span class="wb-shelf__label">${label}</span>
        ${entries.length === 0
          ? html`<span class="wb-shelf__placeholder">Drop fields here</span>`
          : entries.map((entry: any) => this._renderChip(zone, entry, type))
        }
      </div>
    `;
  }

  private _renderChip(zone: ZoneName, entry: any, type: string) {
    const chipClass = type === 'value' ? 'wb-chip--values' : type === 'filter' ? 'wb-chip--filters' : '';

    return html`
      <span class="wb-chip ${chipClass}">
        ${entry.field}
        ${type === 'value' ? html`
          <span class="wb-chip__agg"
                @click=${() => this._onCycleAgg(entry.field)}
                title="Click to change aggregation">${entry.aggregation}</span>
        ` : nothing}
        ${type === 'filter' ? html`
          <span style="font-size:10px;opacity:0.7;">${entry.operator}</span>
        ` : nothing}
        <button class="wb-chip__remove"
                @click=${() => this._onRemoveFromZone(zone, entry.field)}
                title="Remove"
                aria-label="Remove ${entry.field}">×</button>
      </span>
    `;
  }

  // ── Preview Area ──

  private _renderPreview() {
    return html`
      <div class="wb-preview">
        <div class="wb-preview__tabs">
          ${(['table', 'chart', 'sql'] as PreviewMode[]).map(mode => html`
            <button class="wb-preview__tab ${this._state.previewMode === mode ? 'wb-preview__tab--active' : ''}"
                    @click=${() => this._onPreviewModeChange(mode)}>
              ${mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          `)}
          ${this._state.suggestedChart !== 'table' ? html`
            <span class="wb-preview__chart-hint">
              Suggested: ${this._state.suggestedChart}
            </span>
          ` : nothing}
        </div>
        <div class="wb-preview__body">
          ${this._renderPreviewContent()}
        </div>
      </div>
    `;
  }

  private _renderPreviewContent() {
    // Loading state
    if (this._state.previewLoading) {
      return html`
        <div class="wb-loading">
          <div class="wb-loading__spinner"></div>
          Executing query...
        </div>
      `;
    }

    // Error state
    if (this._state.previewError) {
      return html`
        <div class="wb-error">
          <strong>Error:</strong> ${this._state.previewError}
          <br>
          <button class="wb-btn" style="margin-top:8px;" @click=${() => this._fetchPreview()}>Retry</button>
        </div>
      `;
    }

    // No query yet
    if (!hasWorkbenchQuery(this._state)) {
      return html`
        <div class="wb-empty">
          <div class="wb-empty__icon">\u{1F50D}</div>
          <h3 class="wb-empty__title">Start exploring your data</h3>
          <p class="wb-empty__desc">
            Double-click fields in the palette to add them to shelves,
            or drag them to a specific shelf. The preview updates automatically.
          </p>
        </div>
      `;
    }

    // No result yet (query submitted but no data back)
    if (!this._state.previewResult) {
      return html`
        <div class="wb-empty">
          <p class="wb-empty__desc">Click a field to execute a query</p>
        </div>
      `;
    }

    // Render based on mode
    switch (this._state.previewMode) {
      case 'table':
        return this._renderTablePreview();
      case 'chart':
        return this._renderChartPreview();
      case 'sql':
        return this._renderSQLPreview();
      default:
        return this._renderTablePreview();
    }
  }

  private _renderTablePreview() {
    const result = this._state.previewResult!;
    const cols = result.columns;
    const rows = result.rows;

    if (rows.length === 0) {
      return html`
        <div class="wb-empty">
          <div class="wb-empty__icon">\u{1F4ED}</div>
          <h3 class="wb-empty__title">No data</h3>
          <p class="wb-empty__desc">The query returned 0 rows. Try adjusting your filters.</p>
        </div>
      `;
    }

    return html`
      <table class="wb-table">
        <thead>
          <tr>${cols.map(c => html`<th>${c.name}</th>`)}</tr>
        </thead>
        <tbody>
          ${rows.slice(0, 200).map(row => html`
            <tr>
              ${(row as unknown[]).map((cell, i) => {
                const isNum = cols[i]?.dataType === 'number' || typeof cell === 'number';
                return html`<td class="${isNum ? 'wb-table__number' : ''}">
                  ${cell != null ? (isNum ? Number(cell).toLocaleString() : String(cell)) : '—'}
                </td>`;
              })}
            </tr>
          `)}
        </tbody>
      </table>
      ${rows.length > 200 ? html`
        <div style="padding:8px 16px;font-size:12px;color:#78716C;">
          Showing 200 of ${rows.length} rows
        </div>
      ` : nothing}
    `;
  }

  private _renderChartPreview() {
    const suggested = this._state.suggestedChart;
    // For now, show chart recommendation + the data table as fallback
    // Full chart rendering would use <phz-bar-chart>, <phz-line-chart>, etc.
    return html`
      <div style="padding:16px;">
        <div style="background:#eff6ff;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px;">
          <strong>Recommended visualization:</strong> ${suggested}
          <br>
          <span style="color:#64748b;">Based on ${this._state.dropZones.rows.length + this._state.dropZones.columns.length} dimension(s) and ${this._state.dropZones.values.length} measure(s)</span>
        </div>
        ${this._renderTablePreview()}
      </div>
    `;
  }

  private _renderSQLPreview() {
    if (!this._state.selectedSourceId) return nothing;

    const query = workbenchToExploreQuery(this._state);
    const dataQuery = exploreQueryToDataQuery(query, this._state.selectedSourceId);

    // Format as readable SQL-like representation
    const lines: string[] = ['SELECT'];

    // Fields
    const fieldParts: string[] = [];
    for (const dim of query.dimensions) {
      fieldParts.push(`  ${dim.field}`);
    }
    for (const meas of query.measures) {
      fieldParts.push(`  ${meas.aggregation.toUpperCase()}(${meas.field})`);
    }
    lines.push(fieldParts.join(',\n'));

    lines.push(`FROM ${this._state.selectedSourceId}`);

    // WHERE
    if (query.filters.length > 0) {
      lines.push('WHERE');
      lines.push(
        query.filters
          .map(f => `  ${f.field} ${f.operator} ${JSON.stringify(f.value ?? '?')}`)
          .join('\n  AND\n'),
      );
    }

    // GROUP BY
    if (query.dimensions.length > 0 && query.measures.length > 0) {
      lines.push(`GROUP BY ${query.dimensions.map(d => d.field).join(', ')}`);
    }

    // LIMIT
    if (query.limit) {
      lines.push(`LIMIT ${query.limit}`);
    }

    return html`<pre class="wb-sql">${lines.join('\n')}</pre>`;
  }

  // ── Status Bar ──

  private _renderStatusBar() {
    const result = this._state.previewResult;
    const dotClass = this._state.previewLoading
      ? 'wb-status__dot--loading'
      : this._state.previewError
        ? 'wb-status__dot--error'
        : result
          ? 'wb-status__dot--ready'
          : 'wb-status__dot--idle';

    return html`
      <div class="wb-status">
        <span class="wb-status__item">
          <span class="wb-status__dot ${dotClass}"></span>
          ${this._state.previewLoading ? 'Loading...' :
            this._state.previewError ? 'Error' :
            result ? 'Ready' : 'Idle'}
        </span>
        ${result ? html`
          <span class="wb-status__item">${result.metadata.totalRows.toLocaleString()} rows</span>
          <span class="wb-status__item">${result.columns.length} columns</span>
          <span class="wb-status__item">${result.metadata.queryTimeMs}ms</span>
        ` : nothing}
        ${this._state.schema ? html`
          <span class="wb-status__item" style="margin-left:auto;">
            ${this._state.schema.name} \u{2022} ${this._state.schema.fields.length} fields
          </span>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-data-workbench': PhzDataWorkbench;
  }
}
