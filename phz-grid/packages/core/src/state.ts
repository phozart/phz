/**
 * @phozart/core — State Management
 *
 * Immutable state tree with subscriber notifications.
 */

import type { GridState, SerializedGridState } from './types/state.js';
import type { ColumnDefinition } from './types/column.js';
import type { Unsubscribe, UserRole } from './types/common.js';
import { DEFAULT_BREAKPOINTS } from './types/state.js';

export type StatePriority = 'immediate' | 'deferred' | 'background';

export type StateListener<TData = any> = (state: GridState<TData>) => void;

export function createInitialState<TData = any>(
  columns: ColumnDefinition<TData>[],
  userRole?: UserRole,
): GridState<TData> {
  const visibility: Record<string, boolean> = {};
  for (const c of columns) {
    if (c.access?.requiredRoles && userRole && !c.access.requiredRoles.includes(userRole)) {
      // User lacks required role — hide unless mask is provided
      visibility[c.field] = !!c.access.mask;
    } else {
      visibility[c.field] = true;
    }
  }

  return {
    sort: { columns: [] },
    filter: { filters: [], presets: {} },
    selection: {
      mode: 'single',
      selectedRows: new Set(),
      selectedCells: new Set(),
    },
    edit: { status: 'idle' },
    columns: {
      order: columns.map((c) => c.field),
      widths: Object.fromEntries(columns.map((c) => [c.field, c.width ?? 150])),
      visibility,
      pinOverrides: {},
    },
    viewport: {
      scrollTop: 0,
      scrollLeft: 0,
      visibleRowRange: [0, 0],
      visibleColumnRange: [0, 0],
    },
    grouping: {
      groupBy: [],
      expandedGroups: new Set(),
    },
    focus: {
      activeCell: null,
      mode: 'cell',
      region: 'body',
    },
    status: {
      loading: false,
      error: null,
      rowCount: 0,
      filteredRowCount: 0,
    },
    history: {
      canUndo: false,
      canRedo: false,
      undoStack: 0,
      redoStack: 0,
    },
    responsive: {
      breakpoint: 'lg',
      layoutMode: 'full',
      containerWidth: 0,
      containerHeight: 0,
    },
    theme: {
      name: 'default',
      colorScheme: 'auto',
      tokens: {
        primitive: {},
        semantic: {},
        component: {},
      },
    },
    scroll: {
      scrollTop: 0,
      scrollLeft: 0,
      direction: 'none',
    },
    virtualization: {
      enabled: true,
      overscan: 5,
      estimatedRowHeight: 40,
      totalHeight: 0,
      visibleRange: [0, 0],
    },
  };
}

// --- Column Pinning ---

/**
 * Pin a column to the left or right edge at runtime.
 * Returns a new state with the pin override applied (immutable).
 */
export function pinColumn<TData = any>(
  state: GridState<TData>,
  field: string,
  side: 'left' | 'right',
): GridState<TData> {
  return {
    ...state,
    columns: {
      ...state.columns,
      pinOverrides: {
        ...state.columns.pinOverrides,
        [field]: side,
      },
    },
  };
}

/**
 * Remove a runtime pin override for a column.
 * Sets the override to `null` so that it explicitly overrides any static
 * `col.frozen` value. Returns a new state (immutable).
 * Safe to call on a column that has no override.
 */
export function unpinColumn<TData = any>(
  state: GridState<TData>,
  field: string,
): GridState<TData> {
  return {
    ...state,
    columns: {
      ...state.columns,
      pinOverrides: {
        ...state.columns.pinOverrides,
        [field]: null,
      },
    },
  };
}

/**
 * Get the effective pin state for a column.
 * Checks `pinOverrides` first, then falls back to `col.frozen`.
 * Returns `null` when the column is not pinned.
 */
export function getEffectivePinState<TData = any>(
  state: GridState<TData>,
  col: ColumnDefinition,
): 'left' | 'right' | null {
  const override = state.columns.pinOverrides[col.field];
  if (override !== undefined) {
    return override;
  }
  return col.frozen ?? null;
}

interface SelectorSub<TData, T> {
  selector: (state: GridState<TData>) => T;
  callback: (selected: T, prev: T) => void;
  equalityFn: (a: T, b: T) => boolean;
  prev: T;
}

const UNDO_MAX = 50;

export class StateManager<TData = any> {
  private state: GridState<TData>;
  private listeners = new Set<StateListener<TData>>();
  private selectorSubs = new Set<SelectorSub<TData, any>>();
  private batching = false;
  private _undoStack: SerializedGridState[] = [];
  private _redoStack: SerializedGridState[] = [];
  private _undoLabels: (string | undefined)[] = [];
  private _redoLabels: (string | undefined)[] = [];
  private _lastActionLabel?: string;
  private _pendingPriorities = new Set<StatePriority>();
  private _backgroundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(initialState: GridState<TData>) {
    this.state = initialState;
  }

  getState(): Readonly<GridState<TData>> {
    return this.state;
  }

  setState(
    updater: Partial<GridState<TData>> | ((prev: GridState<TData>) => GridState<TData>),
    options?: { priority?: StatePriority },
  ): void {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    if (!this.batching) {
      const priority = options?.priority ?? 'deferred';
      switch (priority) {
        case 'immediate':
          this.notifyImmediate();
          break;
        case 'background':
          this.notifyBackground();
          break;
        default:
          this.notify();
          break;
      }
    }
  }

  batch(fn: () => void): void {
    this.batching = true;
    try {
      fn();
    } finally {
      this.batching = false;
      this.notify();
    }
  }

  subscribe(listener: StateListener<TData>): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeSelector<T>(
    selector: (state: GridState<TData>) => T,
    callback: (selected: T, prev: T) => void,
    equalityFn?: (a: T, b: T) => boolean,
  ): Unsubscribe {
    const sub: SelectorSub<TData, T> = {
      selector,
      callback,
      equalityFn: equalityFn ?? Object.is,
      prev: selector(this.state),
    };
    this.selectorSubs.add(sub);
    return () => {
      this.selectorSubs.delete(sub);
    };
  }

  pushUndo(label?: string): void {
    this._undoStack.push(this.exportState());
    this._undoLabels.push(label);
    if (this._undoStack.length > UNDO_MAX) {
      this._undoStack.shift();
      this._undoLabels.shift();
    }
    this._redoStack.length = 0;
    this._redoLabels.length = 0;
    this._lastActionLabel = label;
    this.updateHistory();
  }

  undo(): boolean {
    const snapshot = this._undoStack.pop();
    const _label = this._undoLabels.pop();
    if (!snapshot) return false;
    this._redoStack.push(this.exportState());
    this._redoLabels.push(this._lastActionLabel);
    this.importState(snapshot);
    this._lastActionLabel = this._undoLabels[this._undoLabels.length - 1];
    this.updateHistory();
    return true;
  }

  redo(): boolean {
    const snapshot = this._redoStack.pop();
    const label = this._redoLabels.pop();
    if (!snapshot) return false;
    this._undoStack.push(this.exportState());
    this._undoLabels.push(this._lastActionLabel);
    this.importState(snapshot);
    this._lastActionLabel = label;
    this.updateHistory();
    return true;
  }

  /** Execute a state mutation with automatic undo snapshot */
  performAction(label: string, fn: () => void): void {
    this.pushUndo(label);
    fn();
  }

  getLastActionLabel(): string | undefined {
    return this._lastActionLabel;
  }

  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  private updateHistory(): void {
    this.setState({
      history: {
        canUndo: this._undoStack.length > 0,
        canRedo: this._redoStack.length > 0,
        undoStack: this._undoStack.length,
        redoStack: this._redoStack.length,
        lastActionLabel: this._lastActionLabel,
      },
    });
  }

  getPendingPriorities(): StatePriority[] {
    return Array.from(this._pendingPriorities);
  }

  private dispatchListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
    for (const sub of this.selectorSubs) {
      const next = sub.selector(this.state);
      if (!sub.equalityFn(next, sub.prev)) {
        const prev = sub.prev;
        sub.prev = next;
        sub.callback(next, prev);
      }
    }
  }

  private notifyImmediate(): void {
    this.dispatchListeners();
  }

  private notifyScheduled = false;

  private notify(): void {
    if (this.notifyScheduled) return;
    this.notifyScheduled = true;
    this._pendingPriorities.add('deferred');
    queueMicrotask(() => {
      this.notifyScheduled = false;
      this._pendingPriorities.delete('deferred');
      this.dispatchListeners();
    });
  }

  private notifyBackground(): void {
    this._pendingPriorities.add('background');
    if (this._backgroundTimer) return;
    this._backgroundTimer = setTimeout(() => {
      this._backgroundTimer = null;
      this._pendingPriorities.delete('background');
      this.dispatchListeners();
    }, 0);
  }

  exportState(options?: { sanitizeFilterValues?: boolean }): SerializedGridState {
    const s = this.state;

    let filter = s.filter;
    if (options?.sanitizeFilterValues) {
      filter = {
        ...filter,
        filters: filter.filters.map((f) => ({ ...f, value: '[FILTERED]' })),
        presets: Object.fromEntries(
          Object.entries(filter.presets).map(([name, preset]) => [
            name,
            { ...preset, filters: preset.filters.map((f) => ({ ...f, value: '[FILTERED]' })) },
          ]),
        ),
      };
    }

    return {
      version: '0.1.0',
      sort: s.sort,
      filter,
      selection: {
        selectedRows: Array.from(s.selection.selectedRows),
        selectedCells: Array.from(s.selection.selectedCells).map((key) => {
          const sep = key.indexOf(':');
          return { rowId: key.slice(0, sep), field: key.slice(sep + 1) };
        }),
      },
      columns: s.columns,
      grouping: {
        groupBy: s.grouping.groupBy,
        expandedGroups: Array.from(s.grouping.expandedGroups),
      },
    };
  }

  importState(serialized: SerializedGridState): void {
    this.setState({
      sort: serialized.sort,
      filter: serialized.filter,
      selection: {
        ...this.state.selection,
        selectedRows: new Set(serialized.selection.selectedRows),
        selectedCells: new Set(
          serialized.selection.selectedCells.map((c) => `${c.rowId}:${c.field}`),
        ),
      },
      columns: serialized.columns,
      grouping: {
        groupBy: serialized.grouping.groupBy,
        expandedGroups: new Set(serialized.grouping.expandedGroups),
      },
    });
  }

  destroy(): void {
    this.listeners.clear();
    this.selectorSubs.clear();
    if (this._backgroundTimer) {
      clearTimeout(this._backgroundTimer);
      this._backgroundTimer = null;
    }
    this._pendingPriorities.clear();
  }
}
