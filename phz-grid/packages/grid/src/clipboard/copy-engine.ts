/**
 * @phozart/phz-grid — Copy Engine
 *
 * Pure utility module for clipboard copy operations.
 * Handles cell value formatting and TSV generation.
 * No DOM or Lit dependencies — fully testable in isolation.
 */
import type { ColumnDefinition, RowData } from '@phozart/phz-core';
import { formatDate, DEFAULT_DATE_FORMAT, DEFAULT_DATETIME_FORMAT } from '../formatters/date-formatter.js';

export interface ColumnGroup {
  header: string;
  children: string[];
}

export interface CopyOptions {
  includeHeaders: boolean;
  formatted: boolean;
  dateFormats?: Record<string, string>;
  columnGroups?: ColumnGroup[];
  numberFormats?: Record<string, { decimals?: number; display?: string; prefix?: string; suffix?: string }>;
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
export function formatCellForCopy(
  value: unknown,
  colType: string,
  formatted: boolean,
  dateFormat?: string,
): string {
  if (value == null) return '';

  if (!formatted) return String(value);

  switch (colType) {
    case 'date': {
      const d = value instanceof Date ? value : new Date(String(value));
      if (isNaN(d.getTime())) return String(value);
      return formatDate(d, dateFormat ?? DEFAULT_DATE_FORMAT);
    }
    case 'datetime': {
      const d = value instanceof Date ? value : new Date(String(value));
      if (isNaN(d.getTime())) return String(value);
      return formatDate(d, dateFormat ?? DEFAULT_DATETIME_FORMAT);
    }
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'boolean':
      return Boolean(value) ? 'Yes' : 'No';
    case 'bar':
      return `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
    case 'status':
    default:
      return String(value);
  }
}

/**
 * Build a TSV string from rows and columns.
 * Optional header row, optional formatted values.
 */
export function buildCopyText(
  rows: RowData[],
  columns: ColumnDefinition[],
  options: CopyOptions,
): CopyResult {
  // Filter out excluded columns
  const copyColumns = options.excludeFields?.size
    ? columns.filter(c => !options.excludeFields!.has(c.field))
    : columns;

  // Enforce max row limit
  const maxRows = options.maxCopyRows && options.maxCopyRows > 0 ? options.maxCopyRows : rows.length;
  const copyRows = rows.slice(0, maxRows);

  const lines: string[] = [];

  if (options.includeHeaders) {
    // Add column group header row if groups are present
    if (options.columnGroups && options.columnGroups.length > 0) {
      const groupRow = buildGroupHeaderRow(copyColumns, options.columnGroups);
      lines.push(groupRow.join('\t'));
    }
    lines.push(copyColumns.map(c => c.header ?? c.field).join('\t'));
  }

  for (const row of copyRows) {
    const cells = copyColumns.map(col => {
      const value = col.valueGetter ? col.valueGetter(row) : row[col.field];
      // Apply mask function for sensitive columns
      const maskFn = options.maskFields?.get(col.field);
      if (maskFn) return maskFn(value);
      const colType = (col.type as string) ?? 'string';
      const dateFormat = options.dateFormats?.[col.field];
      let text = formatCellForCopy(value, colType, options.formatted, dateFormat);
      // Apply number formatting if present
      if (options.formatted && colType === 'number' && typeof value === 'number' && options.numberFormats?.[col.field]) {
        const nf = options.numberFormats[col.field];
        const formatted = nf.decimals !== undefined ? value.toFixed(nf.decimals) : value.toLocaleString();
        const prefix = nf.prefix || '';
        let suffix = nf.suffix || '';
        if (nf.display === 'percent') suffix = '%';
        if (nf.display === 'currency' && !prefix) text = '$' + formatted + suffix;
        else text = prefix + formatted + suffix;
      }
      return text;
    });
    lines.push(cells.join('\t'));
  }

  return {
    text: lines.join('\n'),
    rowCount: copyRows.length,
    colCount: copyColumns.length,
  };
}

/**
 * Build a group header row for TSV export.
 * Each column gets the group name it belongs to, or empty string if ungrouped.
 */
function buildGroupHeaderRow(columns: ColumnDefinition[], groups: ColumnGroup[]): string[] {
  // Build a field → group name lookup
  const fieldToGroup = new Map<string, string>();
  for (const group of groups) {
    for (const child of group.children) {
      fieldToGroup.set(child, group.header);
    }
  }
  return columns.map(col => fieldToGroup.get(col.field) ?? '');
}

/**
 * Write text to the clipboard. Returns true on success, false on failure.
 * Falls back to execCommand for older browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: textarea + execCommand
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
