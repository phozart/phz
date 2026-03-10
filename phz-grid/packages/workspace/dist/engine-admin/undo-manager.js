export class UndoManager {
    constructor(options) {
        this.stack = [];
        this.cursor = -1;
        this.maxHistory = options?.maxHistory ?? 50;
        this.isEqual = options?.isEqual ?? ((a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
    get canUndo() {
        return this.cursor > 0;
    }
    get canRedo() {
        return this.cursor < this.stack.length - 1;
    }
    push(state) {
        if (this.cursor >= 0 && this.isEqual(this.stack[this.cursor], state)) {
            return;
        }
        // Truncate any redo history
        this.stack = this.stack.slice(0, this.cursor + 1);
        this.stack.push(state);
        this.cursor = this.stack.length - 1;
        // Enforce max history
        if (this.stack.length > this.maxHistory) {
            const excess = this.stack.length - this.maxHistory;
            this.stack = this.stack.slice(excess);
            this.cursor -= excess;
        }
    }
    undo() {
        if (!this.canUndo)
            return null;
        this.cursor--;
        return this.stack[this.cursor];
    }
    redo() {
        if (!this.canRedo)
            return null;
        this.cursor++;
        return this.stack[this.cursor];
    }
    clear() {
        this.stack = [];
        this.cursor = -1;
    }
}
//# sourceMappingURL=undo-manager.js.map