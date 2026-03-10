/**
 * @phozart/phz-workspace — SQL Editor State Machine
 *
 * Pure functions for managing a raw SQL editor embedded within dashboard pages.
 * Executes queries via the DataAdapter against DuckDB.
 */
// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------
export function initialSqlEditorState() {
    return {
        sql: '',
        queryHistory: [],
        results: null,
        error: null,
        isExecuting: false,
        autoRun: false,
        resultLimit: 1000,
        executionTimeMs: null,
    };
}
// ---------------------------------------------------------------------------
// Pure State Transitions
// ---------------------------------------------------------------------------
export function setSqlText(state, sql) {
    return { ...state, sql };
}
export function startSqlExecution(state) {
    return { ...state, isExecuting: true, error: null, results: null, executionTimeMs: null };
}
export function setSqlResults(state, results, executionTimeMs) {
    return { ...state, results, executionTimeMs, isExecuting: false, error: null };
}
export function setSqlError(state, error) {
    return { ...state, error, isExecuting: false, results: null, executionTimeMs: null };
}
export function toggleSqlAutoRun(state) {
    return { ...state, autoRun: !state.autoRun };
}
export function setSqlResultLimit(state, limit) {
    if (limit < 1)
        return state;
    return { ...state, resultLimit: limit };
}
export function addSqlToHistory(state, entry) {
    const MAX_HISTORY = 50;
    const history = [entry, ...state.queryHistory].slice(0, MAX_HISTORY);
    return { ...state, queryHistory: history };
}
export function clearSqlHistory(state) {
    return { ...state, queryHistory: [] };
}
export function loadSqlFromHistory(state, index) {
    const entry = state.queryHistory[index];
    if (!entry)
        return state;
    return { ...state, sql: entry.sql };
}
//# sourceMappingURL=sql-editor-state.js.map