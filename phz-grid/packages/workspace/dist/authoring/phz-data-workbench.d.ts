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
import { LitElement } from 'lit';
import type { DataAdapter } from '../data-adapter.js';
export declare class PhzDataWorkbench extends LitElement {
    /** DataAdapter for loading sources, schemas, and executing queries. */
    adapter?: DataAdapter;
    /** Pre-select a data source by ID. */
    sourceId?: string;
    private _state;
    /** Debounce timer for auto-preview. */
    private _previewTimer;
    /** Track whether we've loaded sources already. */
    private _sourcesLoaded;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _loadSources;
    private _selectSource;
    private _schedulePreview;
    private _fetchPreview;
    private _onSourceChange;
    private _onFieldSearch;
    private _onFieldDoubleClick;
    private _onFieldClickToZone;
    private _onRemoveFromZone;
    private _onCycleAgg;
    private _onPreviewModeChange;
    private _onUndo;
    private _onRedo;
    private _onSaveAsReport;
    private _onAddToDashboard;
    render(): import("lit-html").TemplateResult<1>;
    private _renderToolbar;
    private _renderPalette;
    private _renderFieldCategory;
    private _renderShelves;
    private _renderShelf;
    private _renderChip;
    private _renderPreview;
    private _renderPreviewContent;
    private _renderTablePreview;
    private _renderChartPreview;
    private _renderSQLPreview;
    private _renderStatusBar;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-workbench': PhzDataWorkbench;
    }
}
//# sourceMappingURL=phz-data-workbench.d.ts.map