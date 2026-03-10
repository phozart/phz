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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { initialSqlEditorState, setSqlText, startSqlExecution, setSqlResults, setSqlError, toggleSqlAutoRun, setSqlResultLimit, addSqlToHistory, loadSqlFromHistory, } from './sql-editor-state.js';
let PhzSqlEditor = class PhzSqlEditor extends LitElement {
    constructor() {
        super(...arguments);
        this._state = initialSqlEditorState();
    }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    .editor-area {
      display: flex;
      flex-direction: column;
      flex: 0 0 auto;
      min-height: 120px;
      max-height: 40%;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
    }

    .sql-textarea {
      flex: 1;
      padding: 12px;
      border: none;
      outline: none;
      resize: none;
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 13px;
      line-height: 1.5;
      background: var(--phz-bg-canvas, #f9fafb);
      color: var(--phz-text-primary, #111827);
      tab-size: 2;
    }

    .sql-textarea::placeholder {
      color: var(--phz-text-tertiary, #9ca3af);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-top: 1px solid var(--phz-border, #d1d5db);
      background: var(--phz-bg-surface, #fff);
      font-size: 12px;
    }

    .toolbar-btn {
      padding: 4px 10px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
    }

    .toolbar-btn:hover { background: var(--phz-bg-hover, #f3f4f6); }
    .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .toolbar-btn.run {
      background: var(--phz-primary, #2563eb);
      color: #fff;
      border-color: var(--phz-primary, #2563eb);
    }

    .toolbar-btn.run:hover { opacity: 0.9; }
    .toolbar-btn.run:disabled { opacity: 0.4; }

    .toolbar-separator { width: 1px; height: 20px; background: var(--phz-border, #d1d5db); }

    .toolbar-label {
      color: var(--phz-text-secondary, #6b7280);
      font-size: 11px;
    }

    .limit-input {
      width: 60px;
      padding: 2px 6px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 3px;
      font-size: 12px;
      text-align: right;
    }

    .auto-run-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-size: 11px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .auto-run-toggle input { cursor: pointer; }

    .execution-time {
      margin-left: auto;
      color: var(--phz-text-tertiary, #9ca3af);
      font-size: 11px;
    }

    /* ── Results ── */
    .results-area {
      flex: 1;
      overflow: auto;
      background: var(--phz-bg-surface, #fff);
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .results-table th {
      position: sticky;
      top: 0;
      background: var(--phz-bg-canvas, #f9fafb);
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--phz-text-secondary, #6b7280);
      border-bottom: 1px solid var(--phz-border, #d1d5db);
    }

    .results-table td {
      padding: 6px 12px;
      border-bottom: 1px solid var(--phz-border-light, #e5e7eb);
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 12px;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .results-table tr:hover td {
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .results-footer {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border-top: 1px solid var(--phz-border, #d1d5db);
      font-size: 11px;
      color: var(--phz-text-secondary, #6b7280);
      background: var(--phz-bg-surface, #fff);
    }

    /* ── Error ── */
    .error-panel {
      padding: 16px;
      background: #fef2f2;
      color: #991b1b;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      white-space: pre-wrap;
      overflow: auto;
    }

    /* ── Empty ── */
    .empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--phz-text-tertiary, #9ca3af);
      font-size: 13px;
    }

    /* ── History dropdown ── */
    .history-select {
      padding: 2px 6px;
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 3px;
      font-size: 12px;
      max-width: 200px;
    }

    /* ── Loading ── */
    .loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--phz-text-secondary, #6b7280);
      font-size: 13px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--phz-border, #d1d5db);
      border-top-color: var(--phz-primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
    }
  `; }
    _onInput(e) {
        const value = e.target.value;
        this._state = setSqlText(this._state, value);
    }
    _onKeyDown(e) {
        // Ctrl+Enter or Cmd+Enter to execute
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this._execute();
        }
        // Tab inserts spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const el = e.target;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const value = el.value;
            el.value = value.substring(0, start) + '  ' + value.substring(end);
            el.selectionStart = el.selectionEnd = start + 2;
            this._state = setSqlText(this._state, el.value);
        }
    }
    async _execute() {
        const sql = this._state.sql.trim();
        if (!sql)
            return;
        if (!this.executeSql)
            return;
        this._state = startSqlExecution(this._state);
        const start = performance.now();
        try {
            const results = await this.executeSql(sql, this._state.resultLimit);
            const elapsed = Math.round(performance.now() - start);
            this._state = setSqlResults(this._state, results, elapsed);
            this._state = addSqlToHistory(this._state, {
                sql,
                timestamp: Date.now(),
                rowCount: results.rows.length,
            });
            this.dispatchEvent(new CustomEvent('sql-execute', {
                bubbles: true, composed: true,
                detail: { sql, results: this._state.results, executionTimeMs: elapsed },
            }));
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this._state = setSqlError(this._state, message);
            this.dispatchEvent(new CustomEvent('sql-error', {
                bubbles: true, composed: true,
                detail: { sql, error: message },
            }));
        }
    }
    _onLimitChange(e) {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            this._state = setSqlResultLimit(this._state, value);
        }
    }
    _onAutoRunToggle() {
        this._state = toggleSqlAutoRun(this._state);
    }
    _onHistorySelect(e) {
        const index = parseInt(e.target.value, 10);
        if (!isNaN(index) && index >= 0) {
            this._state = loadSqlFromHistory(this._state, index);
        }
    }
    render() {
        const { sql, results, error, isExecuting, autoRun, resultLimit, executionTimeMs, queryHistory } = this._state;
        return html `
      <div class="editor-area">
        <textarea class="sql-textarea"
          .value=${sql}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
          placeholder="Write SQL here... (Ctrl+Enter to execute)"
          spellcheck="false"
          aria-label="SQL query editor"
        ></textarea>
      </div>

      <div class="toolbar">
        <button class="toolbar-btn run"
          @click=${this._execute}
          ?disabled=${isExecuting || !sql.trim() || !this.executeSql}
          title="Execute query (Ctrl+Enter)">
          ${isExecuting ? 'Running...' : 'Run'}
        </button>

        <div class="toolbar-separator"></div>

        <label class="auto-run-toggle">
          <input type="checkbox" .checked=${autoRun} @change=${this._onAutoRunToggle}>
          Auto-run
        </label>

        <div class="toolbar-separator"></div>

        <span class="toolbar-label">Limit:</span>
        <input class="limit-input" type="number" min="1" max="100000"
          .value=${String(resultLimit)}
          @change=${this._onLimitChange}
          aria-label="Result row limit" />

        ${queryHistory.length > 0 ? html `
          <div class="toolbar-separator"></div>
          <select class="history-select"
            @change=${this._onHistorySelect}
            aria-label="Query history">
            <option value="-1">History (${queryHistory.length})</option>
            ${queryHistory.map((entry, i) => html `
              <option value=${i}>
                ${entry.sql.substring(0, 60)}${entry.sql.length > 60 ? '...' : ''}
                (${entry.rowCount} rows)
              </option>
            `)}
          </select>
        ` : nothing}

        ${executionTimeMs != null ? html `
          <span class="execution-time">${executionTimeMs}ms</span>
        ` : nothing}
      </div>

      ${isExecuting ? html `
        <div class="loading">
          <div class="spinner"></div>
          Executing query...
        </div>
      ` : error ? html `
        <div class="error-panel" role="alert">${error}</div>
      ` : results ? html `
        <div class="results-area">
          <table class="results-table">
            <thead>
              <tr>${results.columns.map(c => html `<th>${c}</th>`)}</tr>
            </thead>
            <tbody>
              ${results.rows.map(row => html `
                <tr>${row.map(cell => html `<td title="${String(cell ?? '')}">${String(cell ?? '')}</td>`)}</tr>
              `)}
            </tbody>
          </table>
        </div>
        <div class="results-footer">
          ${results.rows.length} row${results.rows.length !== 1 ? 's' : ''}
          ${results.rows.length >= resultLimit ? ` (limited to ${resultLimit})` : ''}
        </div>
      ` : html `
        <div class="empty">Write a SQL query and press Ctrl+Enter to execute</div>
      `}
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzSqlEditor.prototype, "executeSql", void 0);
__decorate([
    state()
], PhzSqlEditor.prototype, "_state", void 0);
PhzSqlEditor = __decorate([
    safeCustomElement('phz-sql-editor')
], PhzSqlEditor);
export { PhzSqlEditor };
//# sourceMappingURL=phz-sql-editor.js.map