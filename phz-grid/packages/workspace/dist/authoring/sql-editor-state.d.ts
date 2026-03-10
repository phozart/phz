/**
 * @phozart/phz-workspace — SQL Editor State Machine
 *
 * Pure functions for managing a raw SQL editor embedded within dashboard pages.
 * Executes queries via the DataAdapter against DuckDB.
 */
export interface SqlQueryHistoryEntry {
    sql: string;
    timestamp: number;
    rowCount: number;
}
export interface SqlQueryResults {
    columns: string[];
    rows: unknown[][];
}
export interface SqlEditorState {
    sql: string;
    queryHistory: SqlQueryHistoryEntry[];
    results: SqlQueryResults | null;
    error: string | null;
    isExecuting: boolean;
    autoRun: boolean;
    resultLimit: number;
    executionTimeMs: number | null;
}
export declare function initialSqlEditorState(): SqlEditorState;
export declare function setSqlText(state: SqlEditorState, sql: string): SqlEditorState;
export declare function startSqlExecution(state: SqlEditorState): SqlEditorState;
export declare function setSqlResults(state: SqlEditorState, results: SqlQueryResults, executionTimeMs: number): SqlEditorState;
export declare function setSqlError(state: SqlEditorState, error: string): SqlEditorState;
export declare function toggleSqlAutoRun(state: SqlEditorState): SqlEditorState;
export declare function setSqlResultLimit(state: SqlEditorState, limit: number): SqlEditorState;
export declare function addSqlToHistory(state: SqlEditorState, entry: SqlQueryHistoryEntry): SqlEditorState;
export declare function clearSqlHistory(state: SqlEditorState): SqlEditorState;
export declare function loadSqlFromHistory(state: SqlEditorState, index: number): SqlEditorState;
//# sourceMappingURL=sql-editor-state.d.ts.map