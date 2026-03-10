export interface UndoManagerOptions<T> {
  maxHistory?: number;
  isEqual?: (a: T, b: T) => boolean;
}

export class UndoManager<T> {
  private stack: T[] = [];
  private cursor = -1;
  private readonly maxHistory: number;
  private readonly isEqual: (a: T, b: T) => boolean;

  constructor(options?: UndoManagerOptions<T>) {
    this.maxHistory = options?.maxHistory ?? 50;
    this.isEqual = options?.isEqual ?? ((a, b) => JSON.stringify(a) === JSON.stringify(b));
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.stack.length - 1;
  }

  push(state: T): void {
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

  undo(): T | null {
    if (!this.canUndo) return null;
    this.cursor--;
    return this.stack[this.cursor];
  }

  redo(): T | null {
    if (!this.canRedo) return null;
    this.cursor++;
    return this.stack[this.cursor];
  }

  clear(): void {
    this.stack = [];
    this.cursor = -1;
  }
}
