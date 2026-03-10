/**
 * @phozart/phz-engine/explorer — Pivot Preview Controller
 *
 * Headless controller for preview mode (table/chart/sql).
 * Also converts DropZoneState -> ExploreQuery.
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
export function toExploreQuery(state, options) {
    const dimensions = [
        ...state.rows.map(r => ({ field: r.field })),
        ...state.columns.map(c => ({ field: c.field })),
    ];
    const measures = state.values.map(v => ({
        field: v.field,
        aggregation: v.aggregation,
    }));
    const filters = state.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
    }));
    return {
        dimensions,
        measures,
        filters,
        limit: options?.limit ?? 10000,
    };
}
export function createPreviewController() {
    let mode = 'table';
    let loading = false;
    let result = null;
    const listeners = new Set();
    function notify() {
        for (const listener of listeners) {
            listener();
        }
    }
    return {
        getMode: () => mode,
        setMode(m) {
            mode = m;
            notify();
        },
        isLoading: () => loading,
        setLoading(l) {
            loading = l;
        },
        getResult: () => result,
        setResult(r) {
            result = r;
            notify();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}
//# sourceMappingURL=phz-pivot-preview.js.map