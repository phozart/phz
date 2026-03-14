/**
 * @phozart/workspace — SQL Editor State Machine
 *
 * Pure functions for managing a raw SQL editor embedded within dashboard pages.
 * Executes queries via the DataAdapter against DuckDB.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

export function initialSqlEditorState(): SqlEditorState {
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

export function setSqlText(state: SqlEditorState, sql: string): SqlEditorState {
  return { ...state, sql };
}

export function startSqlExecution(state: SqlEditorState): SqlEditorState {
  return { ...state, isExecuting: true, error: null, results: null, executionTimeMs: null };
}

export function setSqlResults(
  state: SqlEditorState,
  results: SqlQueryResults,
  executionTimeMs: number,
): SqlEditorState {
  return { ...state, results, executionTimeMs, isExecuting: false, error: null };
}

export function setSqlError(state: SqlEditorState, error: string): SqlEditorState {
  return { ...state, error, isExecuting: false, results: null, executionTimeMs: null };
}

export function toggleSqlAutoRun(state: SqlEditorState): SqlEditorState {
  return { ...state, autoRun: !state.autoRun };
}

export function setSqlResultLimit(state: SqlEditorState, limit: number): SqlEditorState {
  if (limit < 1) return state;
  return { ...state, resultLimit: limit };
}

export function addSqlToHistory(
  state: SqlEditorState,
  entry: SqlQueryHistoryEntry,
): SqlEditorState {
  const MAX_HISTORY = 50;
  const history = [entry, ...state.queryHistory].slice(0, MAX_HISTORY);
  return { ...state, queryHistory: history };
}

export function clearSqlHistory(state: SqlEditorState): SqlEditorState {
  return { ...state, queryHistory: [] };
}

export function loadSqlFromHistory(
  state: SqlEditorState,
  index: number,
): SqlEditorState {
  const entry = state.queryHistory[index];
  if (!entry) return state;
  return { ...state, sql: entry.sql };
}
