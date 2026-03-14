/**
 * @phozart/engine — Pivot Engine
 *
 * Computes pivot tables: groups rows by row/column fields and aggregates values.
 * Supports row totals, subtotals, grand totals, and "show values as" transformations.
 */
import type { PivotConfig } from '@phozart/core';
export interface PivotSubtotal {
    /** Position to insert after (row index in the cells array) */
    rowIndex: number;
    /** e.g. "North America — Subtotal" */
    label: string;
    /** One value per column */
    values: unknown[];
    /** Total across all columns for this subtotal row */
    rowTotal: unknown;
    /** Nesting level (for multi-row-field pivots) */
    depth: number;
}
export interface PivotResult {
    rowHeaders: string[][];
    columnHeaders: string[][];
    cells: unknown[][];
    grandTotals: unknown[];
    /** Per-row totals (one per row) — populated when config.showRowTotals is true */
    rowTotals: unknown[];
    /** Subtotal rows — populated when config.showSubtotals is true and rowFields.length > 1 */
    subtotals: PivotSubtotal[];
}
/**
 * Compute a pivot table from flat rows.
 *
 * Groups rows by rowFields → row headers, by columnFields → column headers,
 * computes aggregations at intersections.
 */
export declare function computePivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult;
/**
 * Post-process pivot cells based on each valueField's showAs setting.
 */
export declare function applyShowValuesAs(result: PivotResult, config: PivotConfig): PivotResult;
/**
 * Flatten a pivot result back to rows for export or display.
 */
export declare function pivotResultToFlatRows(result: PivotResult, rowFieldNames: string[], colFieldNames: string[]): Record<string, unknown>[];
//# sourceMappingURL=pivot.d.ts.map