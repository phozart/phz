/**
 * @phozart/grid — Copy Engine
 *
 * Pure utility module for clipboard copy operations.
 * Handles cell value formatting and TSV generation.
 * No DOM or Lit dependencies — fully testable in isolation.
 */
import type { ColumnDefinition, RowData } from '@phozart/core';
export interface ColumnGroup {
    header: string;
    children: string[];
}
export interface CopyOptions {
    includeHeaders: boolean;
    formatted: boolean;
    dateFormats?: Record<string, string>;
    columnGroups?: ColumnGroup[];
    numberFormats?: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    /** Maximum number of rows allowed in a single copy operation. 0 = unlimited. */
    maxCopyRows?: number;
    /** Fields to exclude from copy (e.g., sensitive columns). */
    excludeFields?: Set<string>;
    /** Mask functions for sensitive columns — value is replaced with mask output. */
    maskFields?: Map<string, (value: unknown) => string>;
}
export interface CopyResult {
    text: string;
    rowCount: number;
    colCount: number;
}
/**
 * Format a single cell value for clipboard copy.
 *
 * - `formatted=false`: raw `String(value)`
 * - `formatted=true`: dates use formatDate(), numbers localized,
 *   booleans → "Yes"/"No", bars → "X%", status → as-is
 */
export declare function formatCellForCopy(value: unknown, colType: string, formatted: boolean, dateFormat?: string): string;
/**
 * Build a TSV string from rows and columns.
 * Optional header row, optional formatted values.
 */
export declare function buildCopyText(rows: RowData[], columns: ColumnDefinition[], options: CopyOptions): CopyResult;
/**
 * Write text to the clipboard. Returns true on success, false on failure.
 * Falls back to execCommand for older browsers.
 */
export declare function copyToClipboard(text: string): Promise<boolean>;
//# sourceMappingURL=copy-engine.d.ts.map