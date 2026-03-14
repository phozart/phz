import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, RowGroup } from '@phozart/core';

export interface GroupHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  groupBy: string[];
  groupByLevels: string[][];
}

export class GroupController implements ReactiveController {
  private host: GroupHost;

  groups: RowGroup[] = [];
  isGrouped: boolean = false;

  constructor(host: GroupHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  applyGrouping(): void {
    if (!this.host.gridApi) return;
    const fields = this.host.groupByLevels.length > 0
      ? this.host.groupByLevels.flat()
      : this.host.groupBy;
    if (fields.length > 0) {
      this.host.gridApi.groupBy(fields);
      const model = this.host.gridApi.getGroupedRowModel();
      this.groups = model.groups;
      this.isGrouped = true;
    } else {
      this.groups = [];
      this.isGrouped = false;
    }
    this.host.requestUpdate();
  }

  groupByField(field: string): void {
    this.host.groupBy = [field];
    this.applyGrouping();
  }

  ungroupBy(): void {
    this.host.groupBy = [];
    this.host.groupByLevels = [];
    this.applyGrouping();
  }
}
