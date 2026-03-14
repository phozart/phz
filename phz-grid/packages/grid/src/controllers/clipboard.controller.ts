import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData, RowId } from '@phozart/core';
import type { ToastController } from './toast.controller.js';
import { formatCellForCopy, copyToClipboard, buildCopyText } from '../clipboard/copy-engine.js';

export interface ClipboardHost extends ReactiveControllerHost {
  visibleRows: RowData[];
  columnDefs: ColumnDefinition[];
  selectedRowIds: Set<RowId>;
  copyHeaders: boolean;
  copyFormatted: boolean;
  maxCopyRows: number;
  excludeFieldsFromCopy: string[];
  dateFormats: Record<string, string>;
  cellRangeAnchor: { rowIndex: number; colIndex: number } | null;
  cellRangeEnd: { rowIndex: number; colIndex: number } | null;
  toast: ToastController;
}

export class ClipboardController implements ReactiveController {
  private host: ClipboardHost;

  constructor(host: ClipboardHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  copyCell(rowId: RowId, field: string): void {
    const row = this.host.visibleRows.find(r => r.__id === rowId);
    if (!row) return;
    const col = this.host.columnDefs.find(c => c.field === field);
    const colType = (col?.type as string) ?? 'string';
    const text = formatCellForCopy(row[field], colType, this.host.copyFormatted, this.host.dateFormats[field]);
    copyToClipboard(text);
    this.host.toast.show('Cell copied', 'success', { icon: 'copy' });
  }

  copyRow(rowId: RowId): void {
    const row = this.host.visibleRows.find(r => r.__id === rowId);
    if (!row) return;
    const cols = this.host.columnDefs.filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
    const result = buildCopyText([row], cols, { includeHeaders: this.host.copyHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
    copyToClipboard(result.text);
    this.host.toast.show('Row copied', 'success', { icon: 'copy' });
  }

  copyCellRange(includeHeaders: boolean): void {
    if (!this.host.cellRangeAnchor || !this.host.cellRangeEnd) return;
    const { rowIndex: r1, colIndex: c1 } = this.host.cellRangeAnchor;
    const { rowIndex: r2, colIndex: c2 } = this.host.cellRangeEnd;
    const minR = Math.min(r1, r2); const maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2); const maxC = Math.max(c1, c2);
    const rows = this.host.visibleRows.slice(minR, maxR + 1);
    const cols = this.host.columnDefs.slice(minC, maxC + 1).filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
    const result = buildCopyText(rows, cols, { includeHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
    copyToClipboard(result.text);
    this.host.toast.show(`${rows.length * cols.length} cells copied`, 'success', { icon: 'copy' });
  }

  copySelectedRows(includeHeaders: boolean): void {
    const rows = this.host.visibleRows.filter(r => this.host.selectedRowIds.has(r.__id));
    const cols = this.host.columnDefs.filter(c => !this.host.excludeFieldsFromCopy.includes(c.field));
    if (this.host.maxCopyRows > 0 && rows.length > this.host.maxCopyRows) {
      this.host.toast.show(`Cannot copy more than ${this.host.maxCopyRows} rows`, 'error', { icon: 'error' });
      return;
    }
    const result = buildCopyText(rows, cols, { includeHeaders, formatted: this.host.copyFormatted, dateFormats: this.host.dateFormats });
    copyToClipboard(result.text);
    this.host.toast.show(`${rows.length} rows copied`, 'success', { icon: 'copy' });
  }
}
