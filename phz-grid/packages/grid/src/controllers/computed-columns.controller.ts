import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition, RowData } from '@phozart/core';

export interface ComputedColumnDef {
  field: string;
  header: string;
  formula: (row: RowData) => unknown;
}

export interface ComputedColumnsHost extends ReactiveControllerHost {
  columnDefs: ColumnDefinition[];
  visibleRows: RowData[];
  setColumnDefs(defs: ColumnDefinition[]): void;
}

export class ComputedColumnsController implements ReactiveController {
  private host: ComputedColumnsHost;

  constructor(host: ComputedColumnsHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  applyComputedColumns(computedColumns: ComputedColumnDef[]): void {
    if (computedColumns.length === 0) return;

    const existingFields = new Set(this.host.columnDefs.map(c => c.field));
    const newCols: ColumnDefinition[] = [];

    for (const cc of computedColumns) {
      if (existingFields.has(cc.field)) continue;
      newCols.push({ field: cc.field, header: cc.header, type: 'string' } as ColumnDefinition);

      for (const row of this.host.visibleRows) {
        (row as Record<string, unknown>)[cc.field] = cc.formula(row);
      }
    }

    if (newCols.length > 0) {
      this.host.setColumnDefs([...this.host.columnDefs, ...newCols]);
    }
  }
}
