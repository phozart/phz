/**
 * @phozart/phz-engine — Pivot Engine
 *
 * Computes pivot tables: groups rows by row/column fields and aggregates values.
 */
import type { PivotConfig } from '@phozart/phz-core';
export interface PivotResult {
    rowHeaders: string[][];
    columnHeaders: string[][];
    cells: unknown[][];
    grandTotals: unknown[];
}
/**
 * Compute a pivot table from flat rows.
 *
 * Groups rows by rowFields → row headers, by columnFields → column headers,
 * computes aggregations at intersections.
 */
export declare function computePivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult;
/**
 * Flatten a pivot result back to rows for export or display.
 */
export declare function pivotResultToFlatRows(result: PivotResult, rowFieldNames: string[], colFieldNames: string[]): Record<string, unknown>[];
//# sourceMappingURL=pivot.d.ts.map