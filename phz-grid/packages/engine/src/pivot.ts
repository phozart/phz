/**
 * @phozart/engine — Pivot Engine
 *
 * Computes pivot tables: groups rows by row/column fields and aggregates values.
 * Supports row totals, subtotals, grand totals, and "show values as" transformations.
 */

import type { PivotConfig, AggregationFunction } from '@phozart/core';
import { computeAggregation } from './aggregation.js';

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
export function computePivot(rows: Record<string, unknown>[], config: PivotConfig): PivotResult {
  if (rows.length === 0 || config.valueFields.length === 0) {
    return { rowHeaders: [], columnHeaders: [], cells: [], grandTotals: [], rowTotals: [], subtotals: [] };
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

  // Compute grand totals (default true for backward compat)
  const showGrandTotals = config.showGrandTotals !== false;
  let grandTotals: unknown[] = [];

  if (showGrandTotals) {
    const colGroups = new Map<string, Record<string, unknown>[]>();
    for (const [key, cellRows] of intersections) {
      const colKey = key.split('###')[1];
      if (!colGroups.has(colKey)) colGroups.set(colKey, []);
      colGroups.get(colKey)!.push(...cellRows);
    }

    grandTotals = colKeys.map(colKey => {
      const colRows = colGroups.get(colKey) ?? [];
      return computeCellValue(colRows);
    });
  }

  // Compute row totals (sum across columns for each row)
  let rowTotals: unknown[] = [];

  if (config.showRowTotals) {
    rowTotals = rowKeys.map(rowKey => {
      const allRowData = rowKeyMap.get(rowKey) ?? [];
      return computeCellValue(allRowData);
    });
  }

  // Compute subtotals (group by first N-1 row fields, insert subtotal rows)
  let subtotals: PivotSubtotal[] = [];

  if (config.showSubtotals && config.rowFields.length > 1) {
    subtotals = computeSubtotals(rowHeaders, rowKeys, rows, colKeys, config, computeCellValue);
  }

  let result: PivotResult = { rowHeaders, columnHeaders, cells, grandTotals, rowTotals, subtotals };

  // Apply "show values as" transformations
  if (config.valueFields.some(vf => vf.showAs && vf.showAs !== 'value')) {
    result = applyShowValuesAs(result, config);
  }

  return result;
}

/**
 * Compute subtotal rows for multi-level row fields.
 * Groups by the first row field and inserts subtotals after each group.
 */
function computeSubtotals(
  rowHeaders: string[][],
  rowKeys: string[],
  rows: Record<string, unknown>[],
  colKeys: string[],
  config: PivotConfig,
  computeCellValue: (cellRows: Record<string, unknown>[]) => unknown,
): PivotSubtotal[] {
  const subtotals: PivotSubtotal[] = [];
  const depth = 0; // Currently only support depth=0 (first level grouping)

  // Group row indices by first row field value
  const groupMap = new Map<string, number[]>();
  for (let i = 0; i < rowHeaders.length; i++) {
    const groupKey = rowHeaders[i][0];
    if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
    groupMap.get(groupKey)!.push(i);
  }

  // Group source data by first row field
  const dataByGroup = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const groupKey = String(row[config.rowFields[0]] ?? '');
    if (!dataByGroup.has(groupKey)) dataByGroup.set(groupKey, []);
    dataByGroup.get(groupKey)!.push(row);
  }

  for (const [groupKey, indices] of groupMap) {
    const lastIndex = indices[indices.length - 1];
    const groupRows = dataByGroup.get(groupKey) ?? [];

    // Compute subtotal values per column
    const values = colKeys.map(colKey => {
      const colField = config.columnFields[0];
      const colValue = colKey.split('|||')[0];
      const matchingRows = groupRows.filter(r => String(r[colField] ?? '') === colValue);
      return computeCellValue(matchingRows);
    });

    // Compute row total for subtotal
    const rowTotal = computeCellValue(groupRows);

    subtotals.push({
      rowIndex: lastIndex,
      label: `${groupKey} — Subtotal`,
      values,
      rowTotal,
      depth,
    });
  }

  return subtotals;
}

/**
 * Post-process pivot cells based on each valueField's showAs setting.
 */
export function applyShowValuesAs(
  result: PivotResult,
  config: PivotConfig,
): PivotResult {
  const { cells, grandTotals, rowTotals } = result;
  const multiMeasure = config.valueFields.length > 1;

  // Deep clone cells to avoid mutating the input
  const newCells: unknown[][] = cells.map(row => [...row]);

  for (let vfi = 0; vfi < config.valueFields.length; vfi++) {
    const showAs = config.valueFields[vfi].showAs;
    if (!showAs || showAs === 'value') continue;

    // Helper to extract/set the numeric value for this measure from a cell
    const getNum = (cell: unknown): number => {
      if (cell === null || cell === undefined) return 0;
      if (multiMeasure) {
        const arr = cell as unknown[];
        const v = arr[vfi];
        return typeof v === 'number' ? v : 0;
      }
      return typeof cell === 'number' ? cell : 0;
    };

    const setNum = (cell: unknown, value: number): unknown => {
      if (multiMeasure) {
        const arr = [...(cell as unknown[])];
        arr[vfi] = value;
        return arr;
      }
      return value;
    };

    switch (showAs) {
      case 'pct_of_grand': {
        for (let ri = 0; ri < newCells.length; ri++) {
          for (let ci = 0; ci < newCells[ri].length; ci++) {
            const grandVal = getNum(grandTotals[ci]);
            const cellVal = getNum(newCells[ri][ci]);
            const pct = grandVal !== 0 ? (cellVal / grandVal) * 100 : 0;
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), pct);
          }
        }
        break;
      }

      case 'pct_of_row': {
        for (let ri = 0; ri < newCells.length; ri++) {
          const rowTotalVal = getNum(rowTotals[ri]);
          for (let ci = 0; ci < newCells[ri].length; ci++) {
            const cellVal = getNum(newCells[ri][ci]);
            const pct = rowTotalVal !== 0 ? (cellVal / rowTotalVal) * 100 : 0;
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), pct);
          }
        }
        break;
      }

      case 'pct_of_column': {
        // Column total = sum of all cells in the column
        const colTotals: number[] = [];
        for (let ci = 0; ci < (newCells[0]?.length ?? 0); ci++) {
          let total = 0;
          for (let ri = 0; ri < newCells.length; ri++) {
            total += getNum(cells[ri][ci]); // Use original cells for total
          }
          colTotals.push(total);
        }

        for (let ri = 0; ri < newCells.length; ri++) {
          for (let ci = 0; ci < newCells[ri].length; ci++) {
            const cellVal = getNum(newCells[ri][ci]);
            const pct = colTotals[ci] !== 0 ? (cellVal / colTotals[ci]) * 100 : 0;
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), pct);
          }
        }
        break;
      }

      case 'running_total': {
        for (let ri = 0; ri < newCells.length; ri++) {
          let running = 0;
          for (let ci = 0; ci < newCells[ri].length; ci++) {
            running += getNum(cells[ri][ci]); // Use original cells
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), running);
          }
        }
        break;
      }

      case 'rank': {
        for (let ci = 0; ci < (newCells[0]?.length ?? 0); ci++) {
          // Collect values in this column, sort descending, assign rank
          const indexed = newCells.map((row, ri) => ({ ri, val: getNum(cells[ri][ci]) }));
          indexed.sort((a, b) => b.val - a.val);
          for (let rank = 0; rank < indexed.length; rank++) {
            const { ri } = indexed[rank];
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), rank + 1);
          }
        }
        break;
      }

      case 'difference_from_previous': {
        for (let ci = 0; ci < (newCells[0]?.length ?? 0); ci++) {
          let prevVal = 0;
          for (let ri = 0; ri < newCells.length; ri++) {
            const curVal = getNum(cells[ri][ci]); // Use original cells
            const diff = ri === 0 ? 0 : curVal - prevVal;
            prevVal = curVal;
            newCells[ri][ci] = setNum(newCells[ri][ci] ?? (multiMeasure ? config.valueFields.map(() => null) : null), diff);
          }
        }
        break;
      }
    }
  }

  return { ...result, cells: newCells };
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
