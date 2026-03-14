/**
 * @phozart/shared — Grid Export Config (A-2.08)
 *
 * Configuration for grid data export. Defines which formats are available,
 * row limits, and when to use async export for large datasets.
 *
 * Pure types and functions only — no side effects.
 */
import type { ExportFormat } from '../adapters/data-adapter.js';
export type { ExportFormat };
/**
 * Configuration for grid data export operations.
 */
export interface GridExportConfig {
    /** Formats available to the user for export. */
    enabledFormats: ExportFormat[];
    /**
     * Maximum number of rows to include in a single export.
     * Undefined means no limit.
     */
    maxRows?: number;
    /** Whether to include column headers in the exported output. */
    includeHeaders: boolean;
    /** Whether to include group summary rows in the export. */
    includeGroupSummary: boolean;
    /**
     * Custom file name (without extension). When undefined, a default
     * name is generated from the grid/dashboard title and timestamp.
     */
    fileName?: string;
    /**
     * Row count threshold above which export is performed asynchronously
     * via `executeQueryAsync` on the DataAdapter. Defaults to 10_000.
     */
    asyncThreshold?: number;
}
/**
 * Creates a default export configuration with CSV and XLSX enabled,
 * headers included, and group summaries included.
 */
export declare function createDefaultExportConfig(overrides?: Partial<GridExportConfig>): GridExportConfig;
/**
 * Determines whether an export operation should use the async path.
 *
 * Returns `true` when:
 * - `asyncThreshold` is defined, AND
 * - `rowCount` exceeds the threshold
 */
export declare function shouldUseAsyncExport(config: GridExportConfig, rowCount: number): boolean;
/**
 * Checks whether a specific export format is enabled in the config.
 */
export declare function isFormatEnabled(config: GridExportConfig, format: ExportFormat): boolean;
//# sourceMappingURL=export-config.d.ts.map