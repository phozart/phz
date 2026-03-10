export interface UndoManagerOptions<T> {
    maxHistory?: number;
    isEqual?: (a: T, b: T) => boolean;
}
export declare class UndoManager<T> {
    private stack;
    private cursor;
    private readonly maxHistory;
    private readonly isEqual;
    constructor(options?: UndoManagerOptions<T>);
    get canUndo(): boolean;
    get canRedo(): boolean;
    push(state: T): void;
    undo(): T | null;
    redo(): T | null;
    clear(): void;
}
//# sourceMappingURL=undo-manager.d.ts.map