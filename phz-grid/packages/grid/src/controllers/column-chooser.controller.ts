import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition } from '@phozart/phz-core';

export interface ColumnChooserHost extends ReactiveControllerHost {
  columnDefs: ColumnDefinition[];
  setColumnDefs(defs: ColumnDefinition[]): void;
}

export class ColumnChooserController implements ReactiveController {
  private host: ColumnChooserHost;

  columnChooserOpen: boolean = false;
  colPanelOpen: boolean = false;

  constructor(host: ColumnChooserHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  open(): void {
    this.columnChooserOpen = true;
    this.host.requestUpdate();
  }

  close(): void {
    this.columnChooserOpen = false;
    this.host.requestUpdate();
  }

  handleColumnChooserChange(detail: { order: string[]; visibility: Record<string, boolean> }): void {
    const { visibility, order } = detail;
    const newDefs = this.host.columnDefs
      .map(c => ({ ...c, hidden: visibility[c.field] === false }))
      .sort((a, b) => {
        const ai = order.indexOf(a.field);
        const bi = order.indexOf(b.field);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
    this.host.setColumnDefs(newDefs);
  }

  hideColumn(field: string): void {
    const newDefs = this.host.columnDefs.map(c =>
      c.field === field ? { ...c, hidden: true } : c,
    );
    this.host.setColumnDefs(newDefs);
  }
}
