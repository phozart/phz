/**
 * @phozart/phz-core — State Management
 *
 * Immutable state tree with subscriber notifications.
 */
export function createInitialState(columns, userRole) {
    const visibility = {};
    for (const c of columns) {
        if (c.access?.requiredRoles && userRole && !c.access.requiredRoles.includes(userRole)) {
            // User lacks required role — hide unless mask is provided
            visibility[c.field] = !!c.access.mask;
        }
        else {
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
const UNDO_MAX = 50;
export class StateManager {
    state;
    listeners = new Set();
    selectorSubs = new Set();
    batching = false;
    _undoStack = [];
    _redoStack = [];
    _pendingPriorities = new Set();
    _backgroundTimer = null;
    constructor(initialState) {
        this.state = initialState;
    }
    getState() {
        return this.state;
    }
    setState(updater, options) {
        if (typeof updater === 'function') {
            this.state = updater(this.state);
        }
        else {
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
    batch(fn) {
        this.batching = true;
        try {
            fn();
        }
        finally {
            this.batching = false;
            this.notify();
        }
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    subscribeSelector(selector, callback, equalityFn) {
        const sub = {
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
    pushUndo() {
        this._undoStack.push(this.exportState());
        if (this._undoStack.length > UNDO_MAX) {
            this._undoStack.shift();
        }
        this._redoStack.length = 0;
        this.updateHistory();
    }
    undo() {
        const snapshot = this._undoStack.pop();
        if (!snapshot)
            return false;
        this._redoStack.push(this.exportState());
        this.importState(snapshot);
        this.updateHistory();
        return true;
    }
    redo() {
        const snapshot = this._redoStack.pop();
        if (!snapshot)
            return false;
        this._undoStack.push(this.exportState());
        this.importState(snapshot);
        this.updateHistory();
        return true;
    }
    canUndo() {
        return this._undoStack.length > 0;
    }
    canRedo() {
        return this._redoStack.length > 0;
    }
    updateHistory() {
        this.setState({
            history: {
                canUndo: this._undoStack.length > 0,
                canRedo: this._redoStack.length > 0,
                undoStack: this._undoStack.length,
                redoStack: this._redoStack.length,
            },
        });
    }
    getPendingPriorities() {
        return Array.from(this._pendingPriorities);
    }
    dispatchListeners() {
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
    notifyImmediate() {
        this.dispatchListeners();
    }
    notifyScheduled = false;
    notify() {
        if (this.notifyScheduled)
            return;
        this.notifyScheduled = true;
        this._pendingPriorities.add('deferred');
        queueMicrotask(() => {
            this.notifyScheduled = false;
            this._pendingPriorities.delete('deferred');
            this.dispatchListeners();
        });
    }
    notifyBackground() {
        this._pendingPriorities.add('background');
        if (this._backgroundTimer)
            return;
        this._backgroundTimer = setTimeout(() => {
            this._backgroundTimer = null;
            this._pendingPriorities.delete('background');
            this.dispatchListeners();
        }, 0);
    }
    exportState(options) {
        const s = this.state;
        let filter = s.filter;
        if (options?.sanitizeFilterValues) {
            filter = {
                ...filter,
                filters: filter.filters.map((f) => ({ ...f, value: '[FILTERED]' })),
                presets: Object.fromEntries(Object.entries(filter.presets).map(([name, preset]) => [
                    name,
                    { ...preset, filters: preset.filters.map((f) => ({ ...f, value: '[FILTERED]' })) },
                ])),
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
    importState(serialized) {
        this.setState({
            sort: serialized.sort,
            filter: serialized.filter,
            selection: {
                ...this.state.selection,
                selectedRows: new Set(serialized.selection.selectedRows),
                selectedCells: new Set(serialized.selection.selectedCells.map((c) => `${c.rowId}:${c.field}`)),
            },
            columns: serialized.columns,
            grouping: {
                groupBy: serialized.grouping.groupBy,
                expandedGroups: new Set(serialized.grouping.expandedGroups),
            },
        });
    }
    destroy() {
        this.listeners.clear();
        this.selectorSubs.clear();
        if (this._backgroundTimer) {
            clearTimeout(this._backgroundTimer);
            this._backgroundTimer = null;
        }
        this._pendingPriorities.clear();
    }
}
//# sourceMappingURL=state.js.map