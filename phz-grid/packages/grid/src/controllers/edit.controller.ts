import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData, RowId } from '@phozart/phz-core';
import type { ToastController } from './toast.controller.js';

export interface EditingCell {
  rowId: RowId;
  field: string;
  value: unknown;
}

export interface EditHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  columnDefs: ColumnDefinition[];
  toast: ToastController;
}

export class EditController implements ReactiveController {
  private host: EditHost;

  editingCell: EditingCell | null = null;
  editValue: string = '';

  constructor(host: EditHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  startInlineEdit(row: RowData, field: string): void {
    const col = this.host.columnDefs.find(c => c.field === field);
    if (!col || col.editable === false) return;
    const value = col.valueGetter ? col.valueGetter(row) : row[field];
    this.editingCell = { rowId: row.__id, field, value };
    this.editValue = String(value ?? '');
    this.host.requestUpdate();
  }

  commitInlineEdit(rawValue: string): void {
    if (!this.editingCell || !this.host.gridApi) return;
    const { rowId, field } = this.editingCell;
    const col = this.host.columnDefs.find(c => c.field === field);
    if (col?.type === 'number') {
      if (rawValue.trim() === '') {
        this.host.gridApi.updateRow(rowId, { [field]: null });
      } else {
        const num = Number(rawValue);
        if (Number.isNaN(num)) {
          this.host.toast.show('Invalid number', 'error');
          return;
        }
        this.host.gridApi.updateRow(rowId, { [field]: num });
      }
    } else {
      this.host.gridApi.updateRow(rowId, { [field]: rawValue });
    }
    this.editingCell = null;
    this.host.toast.show('Cell updated', 'success');
    this.host.requestUpdate();
  }

  cancelInlineEdit(): void {
    this.editingCell = null;
    this.host.requestUpdate();
  }

  isEditing(rowId: RowId, field: string): boolean {
    return this.editingCell?.rowId === rowId && this.editingCell?.field === field;
  }
}
