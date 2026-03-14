/**
 * @phozart/grid — CSV Exporter
 *
 * Exports grid data to CSV format. Respects current sort/filter state
 * (exports what the user sees). Triggers browser download.
 */
import type { GridApi, ColumnDefinition, RowData, CriteriaExportMetadata, DataSetMeta } from '@phozart/core';
import { formatCellForCopy } from '../clipboard/copy-engine.js';

export interface ExportGroupRow {
  type: 'group-header' | 'data';
  label?: string;
  depth?: number;
  aggregations?: Record<string, string>;
  data?: RowData;
}

export interface CsvExportOptions {
  includeHeaders?: boolean;
  separator?: string;
  filename?: string;
  selectedOnly?: boolean;
  columns?: string[];
  columnGroups?: Array<{ header: string; children: string[] }>;
  includeFormatting?: boolean;
  dateFormats?: Record<string, string>;
  numberFormats?: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
  columnTypes?: Record<string, string>;
  groupRows?: ExportGroupRow[];
  compactNumbers?: boolean;
  criteriaMetadata?: CriteriaExportMetadata;
  /** DataSet metadata — auto-populates source/date header rows when present. */
  dataSetMeta?: DataSetMeta;
  /** Fields to exclude from export (e.g., restricted columns). */
  excludeFields?: Set<string>;
  /** Mask functions for sensitive columns — value is replaced with mask output. */
  maskFields?: Map<string, (value: unknown) => string>;
  /** Pre-filtered rows to export (overrides gridApi.getSortedRowModel().rows).
   *  Use when client-side search filter should be respected in exports. */
  rows?: RowData[];
}

/** Format a number in compact form: 1234 → 1.2K, 1500000 → 1.5M, 2000000000 → 2B */
export function formatCompactNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function sanitizeFormulaInjection(str: string): string {
  if (str.length > 0 && /^[=+\-@\t\r|]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function escapeCSV(value: unknown, separator: string): string {
  if (value == null) return '';
  let str = String(value);
  str = sanitizeFormulaInjection(str);
  if (str.includes(separator) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCellValue(
  value: unknown,
  col: ColumnDefinition,
  options: CsvExportOptions,
): string {
  if (!options.includeFormatting) {
    const formatted = col.valueFormatter ? col.valueFormatter(value) : value;
    return String(formatted ?? '');
  }

  const colType = options.columnTypes?.[col.field] ?? (col.type as string) ?? 'string';
  const dateFormat = options.dateFormats?.[col.field];
  let text = formatCellForCopy(value, colType, true, dateFormat);

  // Compact numbers
  if (options.compactNumbers && colType === 'number' && typeof value === 'number') {
    return formatCompactNumber(value);
  }

  // Apply number formatting
  if (colType === 'number' && typeof value === 'number' && options.numberFormats?.[col.field]) {
    const nf = options.numberFormats[col.field];
    const formatted = nf.decimals !== undefined ? value.toFixed(nf.decimals) : value.toLocaleString();
    const prefix = nf.prefix || '';
    let suffix = nf.suffix || '';
    if (nf.display === 'percent') suffix = '%';
    if (nf.display === 'currency' && !prefix) text = '$' + formatted + suffix;
    else text = prefix + formatted + suffix;
  }

  return text;
}

export function exportToCSV(
  gridApi: GridApi,
  columnDefs: ColumnDefinition[],
  options: CsvExportOptions = {},
): string {
  const {
    includeHeaders = true,
    separator = ',',
    selectedOnly = false,
    columns,
  } = options;

  let cols = columns
    ? columnDefs.filter(c => columns.includes(c.field))
    : columnDefs;

  // Exclude restricted fields
  if (options.excludeFields?.size) {
    cols = cols.filter(c => !options.excludeFields!.has(c.field));
  }

  const lines: string[] = [];

  // Criteria metadata header
  if (options.criteriaMetadata) {
    lines.push(escapeCSV(options.criteriaMetadata.label, separator));
    for (const entry of options.criteriaMetadata.entries) {
      lines.push(`${escapeCSV(entry.fieldLabel, separator)}${separator}${escapeCSV(entry.displayValue, separator)}`);
    }
    lines.push(''); // blank line separator
  }

  // DataSet metadata header (when no criteria metadata already present)
  if (!options.criteriaMetadata && options.dataSetMeta) {
    const meta = options.dataSetMeta;
    if (meta.source) lines.push(`Source${separator}${escapeCSV(meta.source, separator)}`);
    if (meta.lastUpdated) lines.push(`Generated${separator}${escapeCSV(meta.lastUpdated, separator)}`);
    if (meta.source || meta.lastUpdated) lines.push('');
  }

  if (includeHeaders) {
    // Add column group header row if groups are present
    if (options.columnGroups && options.columnGroups.length > 0) {
      const fieldToGroup = new Map<string, string>();
      for (const group of options.columnGroups) {
        for (const child of group.children) {
          fieldToGroup.set(child, group.header);
        }
      }
      lines.push(cols.map(c => escapeCSV(fieldToGroup.get(c.field) ?? '', separator)).join(separator));
    }
    lines.push(cols.map(c => escapeCSV(c.header ?? c.field, separator)).join(separator));
  }

  // If grouped rows are provided, use them instead of flat rows
  if (options.groupRows && options.groupRows.length > 0) {
    for (const gr of options.groupRows) {
      if (gr.type === 'group-header') {
        // Group header: label in first column, aggregation values in subsequent columns
        const cells = cols.map((col, i) => {
          if (i === 0) return escapeCSV(gr.label ?? '', separator);
          const aggVal = gr.aggregations?.[col.field];
          return escapeCSV(aggVal ?? '', separator);
        });
        lines.push(cells.join(separator));
      } else if (gr.type === 'data' && gr.data) {
        const row = gr.data;
        const values = cols.map(col => {
          const val = col.valueGetter ? col.valueGetter(row) : row[col.field];
          return escapeCSV(formatCellValue(val, col, options), separator);
        });
        lines.push(values.join(separator));
      }
    }
  } else {
    // Flat rows — prefer pre-filtered rows (respects client-side search),
    // fall back to sorted row model for full dataset export.
    const allRows = options.rows ?? gridApi.getSortedRowModel().rows;
    let dataRows: RowData[];

    if (selectedOnly) {
      const sel = gridApi.getSelection();
      const selectedSet = new Set(sel.rows);
      dataRows = allRows.filter(r => selectedSet.has(r.__id));
    } else {
      dataRows = allRows;
    }

    for (const row of dataRows) {
      const values = cols.map(col => {
        const val = col.valueGetter ? col.valueGetter(row) : row[col.field];
        // Apply mask function for sensitive columns
        const maskFn = options.maskFields?.get(col.field);
        if (maskFn) return escapeCSV(maskFn(val), separator);
        return escapeCSV(formatCellValue(val, col, options), separator);
      });
      lines.push(values.join(separator));
    }
  }

  return lines.join('\n');
}

export function downloadCSV(
  gridApi: GridApi,
  columnDefs: ColumnDefinition[],
  options: CsvExportOptions = {},
): void {
  const { filename = 'export.csv' } = options;
  const csv = exportToCSV(gridApi, columnDefs, options);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
