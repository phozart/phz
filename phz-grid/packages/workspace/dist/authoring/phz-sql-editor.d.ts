/**
 * <phz-sql-editor> — Raw SQL editor component for dashboard SQL pages.
 *
 * Layout: SQL textarea (top) → toolbar → results table or error (bottom).
 * Executes queries via dataAdapter.execute({ sql, limit }).
 *
 * Events:
 *   sql-execute — { sql: string, results: SqlQueryResults, executionTimeMs: number }
 *   sql-error   — { sql: string, error: string }
 */
import { LitElement } from 'lit';
import type { SqlQueryResults } from './sql-editor-state.js';
/**
 * Callback to execute a raw SQL string. Returns the result set.
 * Consumers provide this — typically wired to a DuckDB adapter.
 */
export type SqlExecutor = (sql: string, limit: number) => Promise<SqlQueryResults>;
export declare class PhzSqlEditor extends LitElement {
    static styles: import("lit").CSSResult;
    /** Callback to execute raw SQL. Consumers wire this to their DuckDB adapter. */
    executeSql?: SqlExecutor;
    private _state;
    private _onInput;
    private _onKeyDown;
    private _execute;
    private _onLimitChange;
    private _onAutoRunToggle;
    private _onHistorySelect;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-sql-editor': PhzSqlEditor;
    }
}
//# sourceMappingURL=phz-sql-editor.d.ts.map