import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, RowGroup } from '@phozart/phz-core';
export interface GroupHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    groupBy: string[];
    groupByLevels: string[][];
}
export declare class GroupController implements ReactiveController {
    private host;
    groups: RowGroup[];
    isGrouped: boolean;
    constructor(host: GroupHost);
    hostConnected(): void;
    hostDisconnected(): void;
    applyGrouping(): void;
    groupByField(field: string): void;
    ungroupBy(): void;
}
//# sourceMappingURL=group.controller.d.ts.map