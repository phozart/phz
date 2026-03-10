/**
 * JS Array QueryBackend — reference implementation.
 *
 * Wraps the existing pure row-model functions (filterRows, sortRows)
 * behind the QueryBackend interface. This is the parity reference —
 * DuckDB and server backends must produce identical results.
 */
import type { ColumnDefinition } from './types/column.js';
import type { QueryBackend } from './types/query-backend.js';
export declare function createJSArrayQueryBackend(data: unknown[], columns: ColumnDefinition[]): QueryBackend;
//# sourceMappingURL=js-query-backend.d.ts.map