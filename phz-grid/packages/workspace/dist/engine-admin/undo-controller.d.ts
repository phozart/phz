import type { ReactiveControllerHost, ReactiveController } from 'lit';
export interface UndoControllerOptions<T> {
    maxHistory?: number;
    isEqual?: (a: T, b: T) => boolean;
    onStateRestore?: (state: T) => void;
}
export declare class UndoController<T> implements ReactiveController {
    private host;
    private manager;
    private onStateRestore?;
    constructor(host: ReactiveControllerHost, options?: UndoControllerOptions<T>);
    hostConnected(): void;
    hostDisconnected(): void;
    get canUndo(): boolean;
    get canRedo(): boolean;
    push(state: T): void;
    undo(): T | null;
    redo(): T | null;
    clear(): void;
    handleKeydown(e: KeyboardEvent): void;
}
//# sourceMappingURL=undo-controller.d.ts.map