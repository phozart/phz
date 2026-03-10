import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, SortDirection } from '@phozart/phz-core';
import type { AriaManager } from '../a11y/aria-manager.js';

export interface SortHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  ariaManager: AriaManager | null;
  sortColumns: Array<{ field: string; direction: SortDirection }>;
}

export class SortController implements ReactiveController {
  private host: SortHost;

  constructor(host: SortHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  handleHeaderClick(col: ColumnDefinition, e: MouseEvent): void {
    if (!this.host.gridApi) return;
    if ((e.target as HTMLElement).closest('.phz-filter-btn')) return;

    if (e.ctrlKey || e.metaKey) {
      const existing = this.host.sortColumns.find(s => s.field === col.field);
      if (!existing) {
        const newSorts = [...this.host.sortColumns, { field: col.field, direction: 'asc' as const }];
        this.host.gridApi.multiSort(newSorts);
      } else if (existing.direction === 'asc') {
        const newSorts = this.host.sortColumns.map(s =>
          s.field === col.field ? { ...s, direction: 'desc' as const } : s
        );
        this.host.gridApi.multiSort(newSorts);
      } else {
        const newSorts = this.host.sortColumns.filter(s => s.field !== col.field);
        if (newSorts.length > 0) {
          this.host.gridApi.multiSort(newSorts);
        } else {
          this.host.gridApi.clearSort();
        }
      }
    } else {
      const sortInfo = this.host.sortColumns.find(s => s.field === col.field);
      if (!sortInfo) {
        this.host.gridApi.sort(col.field, 'asc');
      } else if (sortInfo.direction === 'asc') {
        this.host.gridApi.sort(col.field, 'desc');
      } else {
        this.host.gridApi.sort(col.field, null);
      }
    }

    const direction = this.host.sortColumns.find(s => s.field === col.field)?.direction;
    this.host.ariaManager?.announceChange(
      `Sorted by ${col.header ?? col.field}${direction ? `, ${direction}ending` : ', cleared'}`
    );
  }
}
