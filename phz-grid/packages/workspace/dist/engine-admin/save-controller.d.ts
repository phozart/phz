import type { ReactiveControllerHost, ReactiveController } from 'lit';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export declare class SaveController implements ReactiveController {
    private host;
    private lastSaveFn?;
    private autoDismissTimer?;
    private saveGeneration;
    state: SaveState;
    dirty: boolean;
    errorMessage: string;
    constructor(host: ReactiveControllerHost);
    hostConnected(): void;
    hostDisconnected(): void;
    markDirty(): void;
    markClean(): void;
    save(fn: () => Promise<void>): Promise<void>;
    retry(): Promise<void>;
    dismiss(): void;
    get beforeUnloadMessage(): string;
    private scheduleAutoDismiss;
}
//# sourceMappingURL=save-controller.d.ts.map