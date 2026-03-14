/**
 * @phozart/core — DataSet Types
 *
 * A DataSet bundles schema (columns), rows, and optional metadata into a
 * single container. Grids, dashboards, widgets, and exporters can consume
 * a DataSet directly instead of requiring separate columns + data + options.
 */
import type { ColumnType } from './column.js';
import type { SelectionContext } from './selection-context.js';
/** Extended column type that covers BI/engine concepts on top of core ColumnType. */
export type DataSetColumnType = ColumnType | 'enum' | 'datetime';
/** Schema definition for a single column in a DataSet. */
export interface DataSetColumn {
    /** Field name — must match the key in each row object. */
    field: string;
    /** Data type. */
    type: DataSetColumnType;
    /** Human-readable label. Falls back to `field` if omitted. */
    label?: string;
    /** Format string (date format, number format name, etc.). */
    format?: string;
    /** Whether the column is sortable. Default: true. */
    sortable?: boolean;
    /** Whether the column is visible. Default: true. */
    visible?: boolean;
    /** Text alignment override. */
    align?: 'left' | 'center' | 'right';
    /** Column group name (for multi-row headers). */
    group?: string;
    /** Tooltip / description. */
    description?: string;
    /** Allowed values for enum columns. */
    enumValues?: string[];
    /** Override field name used when exporting. */
    exportAs?: string;
}
/** Optional metadata attached to a DataSet. */
export interface DataSetMeta {
    /** Total row count (may differ from `rows.length` for paginated data). */
    totalCount?: number;
    /** Page size (if paginated). */
    pageSize?: number;
    /** Current page index (0-based). */
    currentPage?: number;
    /** ISO timestamp of last data refresh. */
    lastUpdated?: string;
    /** Human-readable data source name. */
    source?: string;
    /** Active selection criteria at time of data fetch. */
    criteria?: SelectionContext;
}
/** A DataSet: typed schema + rows + optional metadata. */
export interface DataSet<T = Record<string, unknown>> {
    /** Column schema. */
    columns: DataSetColumn[];
    /** Row data. */
    rows: T[];
    /** Optional metadata. */
    meta?: DataSetMeta;
}
//# sourceMappingURL=dataset.d.ts.map