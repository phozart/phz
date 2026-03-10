/**
 * @phozart/phz-duckdb — Data Blending
 *
 * JOIN query builder for multi-table data blending.
 * Supports inner, left, right, full joins with multiple conditions.
 */
import { type SqlResult } from './sql-builder.js';
export interface JoinCondition {
    leftField: string;
    rightField: string;
}
export interface JoinDefinition {
    leftTable: string;
    rightTable: string;
    joinType: 'inner' | 'left' | 'right' | 'full';
    on: JoinCondition[];
}
export interface JoinFilter {
    field: string;
    operator: string;
    value: unknown;
}
export declare function buildJoinQuery(joins: JoinDefinition[], select: string[], filters?: JoinFilter[]): SqlResult;
export declare function buildCreateViewQuery(viewName: string, joins: JoinDefinition[], select: string[]): string;
//# sourceMappingURL=data-blending.d.ts.map