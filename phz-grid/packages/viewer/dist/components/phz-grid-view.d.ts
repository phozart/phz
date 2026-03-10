/**
 * <phz-grid-view> — Standalone grid rendering surface.
 * Use without the viewer shell for embedding grids directly.
 *
 * Accepts either direct data/columns or a grid definition blueprint.
 * When a DataAdapter is provided alongside a definition, fetches data
 * automatically via the adapter's execute() method.
 */
import { LitElement } from 'lit';
import type { DataAdapter, ViewerContext } from '@phozart/phz-shared/adapters';
import type { ColumnDefinition } from '@phozart/phz-core';
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
export type GridViewDataSource = {
    type: 'local';
    data: unknown[];
} | {
    type: 'data-product';
    dataProductId: string;
} | {
    type: 'url';
    url: string;
} | {
    type: 'duckdb-query';
    sql: string;
};
/**
 * Lightweight grid definition for the standalone grid view.
 */
export interface GridViewDefinition {
    dataSource: GridViewDataSource;
    columns: GridViewColumnSpec[];
}
/**
 * Convert a serializable column spec to a core ColumnDefinition.
 * ColumnDefinition can carry renderers, validators, etc., but the
 * spec only contains JSON-safe properties.
 */
export declare function specToColumn(spec: GridViewColumnSpec): ColumnDefinition;
export declare class PhzGridView extends LitElement {
    static styles: import("lit").CSSResult;
    /** Data adapter for server-side data fetching. */
    dataAdapter?: DataAdapter;
    /** Grid definition blueprint (columns, data source). */
    definition?: GridViewDefinition;
    /** Direct data array (overrides definition.dataSource if provided). */
    data?: unknown[];
    /** Direct column definitions (overrides definition.columns if provided). */
    columns?: ColumnDefinition[];
    /** Viewer context for RLS and personalization. */
    viewerContext?: ViewerContext;
    /** Grid density mode. */
    density: 'compact' | 'dense' | 'comfortable';
    /** Grid theme. */
    theme: string;
    private _loading;
    private _error;
    private _resolvedData;
    private _resolvedColumns;
    connectedCallback(): void;
    updated(changed: Map<string, unknown>): void;
    private _resolveData;
    protected render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-grid-view': PhzGridView;
    }
}
//# sourceMappingURL=phz-grid-view.d.ts.map