import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ColumnDefinition } from '@phozart/phz-core';
export interface ColumnChooserHost extends ReactiveControllerHost {
    columnDefs: ColumnDefinition[];
    setColumnDefs(defs: ColumnDefinition[]): void;
}
export declare class ColumnChooserController implements ReactiveController {
    private host;
    columnChooserOpen: boolean;
    colPanelOpen: boolean;
    constructor(host: ColumnChooserHost);
    hostConnected(): void;
    hostDisconnected(): void;
    open(): void;
    close(): void;
    handleColumnChooserChange(detail: {
        order: string[];
        visibility: Record<string, boolean>;
    }): void;
    hideColumn(field: string): void;
}
//# sourceMappingURL=column-chooser.controller.d.ts.map