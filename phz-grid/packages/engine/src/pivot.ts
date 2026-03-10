/**
 * @phozart/phz-engine — Pivot Engine
 *
 * Computes pivot tables: groups rows by row/column fields and aggregates values.
 */

import type { PivotConfig, AggregationFunction } from '@phozart/phz-core';
import { computeAggregation } from './aggregation.js';

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
export function computePivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult {
  if (rows.length === 0 || config.valueFields.length === 0) {
    return { rowHeaders: [], columnHeaders: [], cells: [], grandTotals: [] };
  }

  // Collect unique row and column header combinations
  const rowKeyMap = new Map<string, Record<string, unknown>[]>();
  const colKeySet = new Set<string>();

  for (const row of rows) {
    const rowKey = config.rowFields.map(f => String(row[f] ?? '')).join('|||');
    const colKey = config.columnFields.map(f => String(row[f] ?? '')).join('|||');

    if (!rowKeyMap.has(rowKey)) rowKeyMap.set(rowKey, []);
    rowKeyMap.get(rowKey)!.push(row);
    colKeySet.add(colKey);
  }

  const rowKeys = Array.from(rowKeyMap.keys()).sort();
  const colKeys = Array.from(colKeySet).sort();

  // Build row headers
  const rowHeaders = rowKeys.map(k => k.split('|||'));

  // Build column headers
  const columnHeaders = colKeys.map(k => k.split('|||'));

  // Build intersection map: rowKey+colKey → rows
  const intersections = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const rowKey = config.rowFields.map(f => String(row[f] ?? '')).join('|||');
    const colKey = config.columnFields.map(f => String(row[f] ?? '')).join('|||');
    const key = `${rowKey}###${colKey}`;
    if (!intersections.has(key)) intersections.set(key, []);
    intersections.get(key)!.push(row);
  }

  const multiMeasure = config.valueFields.length > 1;

  function computeCellValue(cellRows: Record<string, unknown>[]): unknown {
    if (cellRows.length === 0) return null;
    if (multiMeasure) {
      return config.valueFields.map(vf =>
        computeAggregation(cellRows, vf.field, vf.aggregation),
      );
    }
    return computeAggregation(cellRows, config.valueFields[0].field, config.valueFields[0].aggregation);
  }

  // Compute cells
  const cells: unknown[][] = rowKeys.map(rowKey =>
    colKeys.map(colKey => {
      const key = `${rowKey}###${colKey}`;
      const cellRows = intersections.get(key) ?? [];
      return computeCellValue(cellRows);
    }),
  );

  // Compute grand totals using grouped intersections (avoid O(rows*cols) re-scan)
  const colGroups = new Map<string, Record<string, unknown>[]>();
  for (const [key, cellRows] of intersections) {
    const colKey = key.split('###')[1];
    if (!colGroups.has(colKey)) colGroups.set(colKey, []);
    colGroups.get(colKey)!.push(...cellRows);
  }

  const grandTotals = colKeys.map(colKey => {
    const colRows = colGroups.get(colKey) ?? [];
    return computeCellValue(colRows);
  });

  return { rowHeaders, columnHeaders, cells, grandTotals };
}

/**
 * Flatten a pivot result back to rows for export or display.
 */
export function pivotResultToFlatRows(
  result: PivotResult,
  rowFieldNames: string[],
  colFieldNames: string[],
): Record<string, unknown>[] {
  const flatRows: Record<string, unknown>[] = [];

  for (let ri = 0; ri < result.rowHeaders.length; ri++) {
    const row: Record<string, unknown> = {};

    // Add row header values
    for (let fi = 0; fi < rowFieldNames.length; fi++) {
      row[rowFieldNames[fi]] = result.rowHeaders[ri][fi];
    }

    // Add cell values keyed by column header
    for (let ci = 0; ci < result.columnHeaders.length; ci++) {
      const colLabel = result.columnHeaders[ci].join(' / ');
      row[colLabel] = result.cells[ri][ci];
    }

    flatRows.push(row);
  }

  return flatRows;
}
