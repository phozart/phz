import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition } from '@phozart/phz-core';

export interface ColumnResizeHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  columnDefs: ColumnDefinition[];
  visibleRows: import('@phozart/phz-core').RowData[];
}

export class ColumnResizeController implements ReactiveController {
  private host: ColumnResizeHost;

  constructor(host: ColumnResizeHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  startResize(e: MouseEvent, field: string): void {
    if (!this.host.gridApi) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const colState = this.host.gridApi.getColumnState();
    const startWidth = colState.widths[field] ?? 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      this.host.gridApi?.setColumnWidth(field, newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  autoFitColumn(e: MouseEvent, field: string): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.host.gridApi) return;

    const col = this.host.columnDefs.find(c => c.field === field);
    if (!col) return;

    let maxWidth = 60;
    for (const row of this.host.visibleRows.slice(0, 100)) {
      const val = row[col.field];
      if (val != null) {
        maxWidth = Math.max(maxWidth, String(val).length * 8 + 32);
      }
    }
    const headerMinWidth = Math.min((col.header ?? col.field).length * 5 + 40, 180);
    maxWidth = Math.max(maxWidth, headerMinWidth);
    maxWidth = Math.min(maxWidth, 500);
    maxWidth = Math.max(maxWidth, 60);
    this.host.gridApi.setColumnWidth(field, maxWidth);
  }

  autoSizeAllColumns(): void {
    if (!this.host.gridApi) return;
    for (const col of this.host.columnDefs) {
      this.autoFitColumn(new MouseEvent('dblclick'), col.field);
    }
  }
}
