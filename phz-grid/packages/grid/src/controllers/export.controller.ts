import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/core';
import type { RowGroup } from '@phozart/core';
import { downloadCSV, type ExportGroupRow } from '../export/csv-exporter.js';
import { downloadExcel, type CellFormatting } from '../export/excel-exporter.js';
import type { ToastController } from './toast.controller.js';
import type { DataSetMeta } from '@phozart/core';

type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';

export interface ExportHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  columnDefs: ColumnDefinition[];
  columnGroups: Array<{ header: string; children: string[] }>;
  isGrouped: boolean;
  groups: RowGroup[];
  aggregationFn: AggregationFn;
  dateFormats: Record<string, string>;
  numberFormats: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
  compactNumbers: boolean;
  statusColors: Record<string, { bg: string; color: string; dot: string }>;
  barThresholds: Array<{ min: number; color: string }>;
  gridLines: string;
  gridLineColor: string;
  toast: ToastController;
  _dataSetMeta?: DataSetMeta;
  filteredRowCount: number;
  /** Client-side search-filtered rows (respects toolbar search query). */
  filteredRows: RowData[];
}

export class ExportController implements ReactiveController {
  private host: ExportHost;

  exportIncludeFormatting: boolean = false;
  exportIncludeGroupHeaders: boolean = true;

  constructor(host: ExportHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  exportCSV(options?: {
    filename?: string;
    selectedOnly?: boolean;
    includeFormatting?: boolean;
    includeGroupHeaders?: boolean;
    columnFormatting?: Record<string, CellFormatting>;
    colorThresholds?: Record<string, Array<{ operator: string; value: unknown; bgColor?: string; textColor?: string }>>;
  }): void {
    if (!this.host.gridApi) return;
    const colGroups = this.host.columnGroups.length > 0 ? this.host.columnGroups : undefined;
    const groupRows = (options?.includeGroupHeaders !== false && this.host.isGrouped && this.host.groups.length > 0)
      ? this.buildExportGroupRows()
      : undefined;
    const columnTypes = Object.fromEntries(this.host.columnDefs.map(c => [c.field, (c.type as string) ?? 'string']));
    // Pass search-filtered rows so export respects toolbar search query.
    const filteredRows = this.host.filteredRows;
    downloadCSV(this.host.gridApi, this.host.columnDefs, {
      ...options,
      rows: filteredRows,
      columnGroups: colGroups,
      groupRows,
      columnTypes,
      dateFormats: options?.includeFormatting ? this.host.dateFormats : undefined,
      numberFormats: options?.includeFormatting ? this.host.numberFormats : undefined,
      compactNumbers: this.host.compactNumbers || undefined,
      dataSetMeta: this.host._dataSetMeta,
    });
    this.host.toast.show(`Exported ${options?.selectedOnly ? 'selected' : filteredRows.length} rows`, 'success', { icon: 'export' });
  }

  exportExcel(options?: {
    filename?: string;
    selectedOnly?: boolean;
    sheetName?: string;
    includeFormatting?: boolean;
    includeGroupHeaders?: boolean;
    columnFormatting?: Record<string, CellFormatting>;
    colorThresholds?: Record<string, Array<{ operator: string; value: unknown; bgColor?: string; textColor?: string }>>;
  }): void {
    if (!this.host.gridApi) return;
    const colGroups = this.host.columnGroups.length > 0 ? this.host.columnGroups : undefined;
    const groupRows = (options?.includeGroupHeaders !== false && this.host.isGrouped && this.host.groups.length > 0)
      ? this.buildExportGroupRows()
      : undefined;
    const columnTypes = Object.fromEntries(this.host.columnDefs.map(c => [c.field, (c.type as string) ?? 'string']));
    // Pass search-filtered rows so export respects toolbar search query.
    const filteredRows = this.host.filteredRows;
    downloadExcel(this.host.gridApi, this.host.columnDefs, {
      ...options,
      rows: filteredRows,
      columnGroups: colGroups,
      groupRows,
      columnTypes,
      dateFormats: options?.includeFormatting ? this.host.dateFormats : undefined,
      numberFormats: options?.includeFormatting ? this.host.numberFormats : undefined,
      statusColors: options?.includeFormatting ? this.host.statusColors : undefined,
      barThresholds: options?.includeFormatting ? this.host.barThresholds : undefined,
      gridLines: this.host.gridLines !== 'none' ? this.host.gridLines as 'none' | 'horizontal' | 'vertical' | 'both' : undefined,
      gridLineColor: this.host.gridLineColor,
      compactNumbers: this.host.compactNumbers || undefined,
      dataSetMeta: this.host._dataSetMeta,
    });
    this.host.toast.show('Exported to Excel', 'success', { icon: 'export' });
  }

  private buildExportGroupRows(): ExportGroupRow[] {
    const result: ExportGroupRow[] = [];
    const fn = this.host.aggregationFn;
    const walkGroups = (groups: RowGroup[], depth: number) => {
      for (const group of groups) {
        const aggregations: Record<string, string> = {};
        const allRows = group.rows as Record<string, unknown>[];
        for (const col of this.host.columnDefs) {
          aggregations[col.field] = this.computeGroupColumnAgg(allRows, col, fn);
        }
        const indent = '\u00A0\u00A0'.repeat(depth);
        result.push({
          type: 'group-header',
          label: `${indent}${String(group.value)} (${allRows.length})`,
          depth,
          aggregations,
        });
        if (group.subGroups && group.subGroups.length > 0) {
          walkGroups(group.subGroups, depth + 1);
        } else {
          for (const row of allRows) {
            result.push({ type: 'data', data: row as RowData });
          }
        }
      }
    };
    walkGroups(this.host.groups, 0);
    return result;
  }

  computeGroupColumnAgg(rows: Record<string, unknown>[], col: ColumnDefinition, fn: AggregationFn): string {
    const values = rows
      .map(r => col.valueGetter ? col.valueGetter(r as any) : r[col.field])
      .filter(v => v != null && v !== '');

    switch (fn) {
      case 'count': return String(values.length);
      case 'sum': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.reduce((s, n) => s + n, 0).toLocaleString();
      }
      case 'avg': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        if (nums.length === 0) return '0';
        return (nums.reduce((s, n) => s + n, 0) / nums.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      case 'min': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length ? nums.reduce((m, v) => v < m ? v : m, Infinity).toLocaleString() : '';
      }
      case 'max': {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length ? nums.reduce((m, v) => v > m ? v : m, -Infinity).toLocaleString() : '';
      }
      default: return String(values.length);
    }
  }
}
