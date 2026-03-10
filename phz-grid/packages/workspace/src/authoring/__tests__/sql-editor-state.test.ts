/**
 * SQL Editor State Machine — Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  type SqlEditorState,
  initialSqlEditorState,
  setSqlText,
  startSqlExecution,
  setSqlResults,
  setSqlError,
  toggleSqlAutoRun,
  setSqlResultLimit,
  addSqlToHistory,
  clearSqlHistory,
  loadSqlFromHistory,
} from '../sql-editor-state.js';

describe('sql-editor-state', () => {
  let state: SqlEditorState;

  beforeEach(() => {
    state = initialSqlEditorState();
  });

  it('initial state has sensible defaults', () => {
    expect(state.sql).toBe('');
    expect(state.queryHistory).toEqual([]);
    expect(state.results).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isExecuting).toBe(false);
    expect(state.autoRun).toBe(false);
    expect(state.resultLimit).toBe(1000);
    expect(state.executionTimeMs).toBeNull();
  });

  // ── setSqlText ──

  it('updates SQL text', () => {
    const next = setSqlText(state, 'SELECT * FROM orders');
    expect(next.sql).toBe('SELECT * FROM orders');
  });

  // ── startSqlExecution ──

  it('marks execution in progress and clears previous results', () => {
    state = setSqlResults(state, { columns: ['a'], rows: [[1]] }, 42);
    const next = startSqlExecution(state);
    expect(next.isExecuting).toBe(true);
    expect(next.results).toBeNull();
    expect(next.error).toBeNull();
    expect(next.executionTimeMs).toBeNull();
  });

  // ── setSqlResults ──

  it('stores results and execution time', () => {
    state = startSqlExecution(state);
    const results = { columns: ['id', 'name'], rows: [[1, 'Alice'], [2, 'Bob']] };
    const next = setSqlResults(state, results, 150);
    expect(next.results).toEqual(results);
    expect(next.executionTimeMs).toBe(150);
    expect(next.isExecuting).toBe(false);
    expect(next.error).toBeNull();
  });

  // ── setSqlError ──

  it('stores error and clears results', () => {
    state = startSqlExecution(state);
    const next = setSqlError(state, 'Syntax error at line 1');
    expect(next.error).toBe('Syntax error at line 1');
    expect(next.isExecuting).toBe(false);
    expect(next.results).toBeNull();
    expect(next.executionTimeMs).toBeNull();
  });

  // ── toggleSqlAutoRun ──

  it('toggles auto-run', () => {
    expect(state.autoRun).toBe(false);
    const next = toggleSqlAutoRun(state);
    expect(next.autoRun).toBe(true);
    const toggled = toggleSqlAutoRun(next);
    expect(toggled.autoRun).toBe(false);
  });

  // ── setSqlResultLimit ──

  it('sets result limit', () => {
    const next = setSqlResultLimit(state, 500);
    expect(next.resultLimit).toBe(500);
  });

  it('rejects invalid limit', () => {
    const next = setSqlResultLimit(state, 0);
    expect(next).toBe(state);
    const next2 = setSqlResultLimit(state, -5);
    expect(next2).toBe(state);
  });

  // ── addSqlToHistory ──

  it('adds entries to history in LIFO order', () => {
    const entry1 = { sql: 'SELECT 1', timestamp: 1000, rowCount: 1 };
    const entry2 = { sql: 'SELECT 2', timestamp: 2000, rowCount: 1 };
    state = addSqlToHistory(state, entry1);
    state = addSqlToHistory(state, entry2);
    expect(state.queryHistory).toHaveLength(2);
    expect(state.queryHistory[0].sql).toBe('SELECT 2');
    expect(state.queryHistory[1].sql).toBe('SELECT 1');
  });

  it('caps history at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      state = addSqlToHistory(state, { sql: `SELECT ${i}`, timestamp: i, rowCount: 1 });
    }
    expect(state.queryHistory).toHaveLength(50);
    // Most recent should be last added
    expect(state.queryHistory[0].sql).toBe('SELECT 54');
  });

  // ── clearSqlHistory ──

  it('clears all history', () => {
    state = addSqlToHistory(state, { sql: 'SELECT 1', timestamp: 1, rowCount: 1 });
    const next = clearSqlHistory(state);
    expect(next.queryHistory).toEqual([]);
  });

  // ── loadSqlFromHistory ──

  it('loads SQL from history by index', () => {
    state = addSqlToHistory(state, { sql: 'SELECT old', timestamp: 1, rowCount: 1 });
    state = addSqlToHistory(state, { sql: 'SELECT new', timestamp: 2, rowCount: 1 });
    const next = loadSqlFromHistory(state, 1); // second entry = 'SELECT old'
    expect(next.sql).toBe('SELECT old');
  });

  it('returns same state for out-of-bounds index', () => {
    expect(loadSqlFromHistory(state, 0)).toBe(state);
    expect(loadSqlFromHistory(state, -1)).toBe(state);
  });

  // ── Full workflow ──

  it('handles a complete query lifecycle', () => {
    // 1. Write query
    state = setSqlText(state, 'SELECT count(*) as cnt FROM sales');
    expect(state.sql).toBe('SELECT count(*) as cnt FROM sales');

    // 2. Start execution
    state = startSqlExecution(state);
    expect(state.isExecuting).toBe(true);

    // 3. Receive results
    const results = { columns: ['cnt'], rows: [[42]] };
    state = setSqlResults(state, results, 23);
    expect(state.isExecuting).toBe(false);
    expect(state.results!.rows[0][0]).toBe(42);
    expect(state.executionTimeMs).toBe(23);

    // 4. Add to history
    state = addSqlToHistory(state, {
      sql: state.sql,
      timestamp: Date.now(),
      rowCount: 1,
    });
    expect(state.queryHistory).toHaveLength(1);
  });
});
