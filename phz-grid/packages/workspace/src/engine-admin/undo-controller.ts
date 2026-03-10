import type { ReactiveControllerHost, ReactiveController } from 'lit';
import { UndoManager } from './undo-manager.js';

export interface UndoControllerOptions<T> {
  maxHistory?: number;
  isEqual?: (a: T, b: T) => boolean;
  onStateRestore?: (state: T) => void;
}

export class UndoController<T> implements ReactiveController {
  private host: ReactiveControllerHost;
  private manager: UndoManager<T>;
  private onStateRestore?: (state: T) => void;

  constructor(host: ReactiveControllerHost, options?: UndoControllerOptions<T>) {
    this.host = host;
    this.manager = new UndoManager<T>({
      maxHistory: options?.maxHistory,
      isEqual: options?.isEqual,
    });
    this.onStateRestore = options?.onStateRestore;
    this.host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  get canUndo(): boolean {
    return this.manager.canUndo;
  }

  get canRedo(): boolean {
    return this.manager.canRedo;
  }

  push(state: T): void {
    this.manager.push(state);
    this.host.requestUpdate();
  }

  undo(): T | null {
    const state = this.manager.undo();
    if (state !== null) {
      this.onStateRestore?.(state);
    }
    this.host.requestUpdate();
    return state;
  }

  redo(): T | null {
    const state = this.manager.redo();
    if (state !== null) {
      this.onStateRestore?.(state);
    }
    this.host.requestUpdate();
    return state;
  }

  clear(): void {
    this.manager.clear();
    this.host.requestUpdate();
  }

  handleKeydown(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod || e.key !== 'z') return;

    if (e.shiftKey) {
      const state = this.manager.redo();
      if (state !== null) {
        e.preventDefault();
        this.onStateRestore?.(state);
        this.host.requestUpdate();
      }
    } else {
      const state = this.manager.undo();
      if (state !== null) {
        e.preventDefault();
        this.onStateRestore?.(state);
        this.host.requestUpdate();
      }
    }
  }
}
