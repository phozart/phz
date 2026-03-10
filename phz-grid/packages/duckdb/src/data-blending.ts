/**
 * @phozart/phz-duckdb — Data Blending
 *
 * JOIN query builder for multi-table data blending.
 * Supports inner, left, right, full joins with multiple conditions.
 */

import { sanitizeIdentifier, type SqlResult } from './sql-builder.js';

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
  field: string; // "table.column" or just "column"
  operator: string;
  value: unknown;
}

function joinTypeToSQL(type: JoinDefinition['joinType']): string {
  switch (type) {
    case 'inner': return 'INNER JOIN';
    case 'left': return 'LEFT JOIN';
    case 'right': return 'RIGHT JOIN';
    case 'full': return 'FULL JOIN';
  }
}

function formatColumn(qualifiedName: string): string {
  if (qualifiedName === '*') return '*';
  if (qualifiedName.includes('.')) {
    const [table, col] = qualifiedName.split('.');
    if (col === '*') return `"${sanitizeIdentifier(table)}".*`;
    return `"${sanitizeIdentifier(table)}"."${sanitizeIdentifier(col)}"`;
  }
  return `"${sanitizeIdentifier(qualifiedName)}"`;
}

function formatFilterColumn(qualifiedName: string): string {
  if (qualifiedName.includes('.')) {
    const [table, col] = qualifiedName.split('.');
    return `"${sanitizeIdentifier(table)}"."${sanitizeIdentifier(col)}"`;
  }
  return `"${sanitizeIdentifier(qualifiedName)}"`;
}

export function buildJoinQuery(
  joins: JoinDefinition[],
  select: string[],
  filters?: JoinFilter[],
): SqlResult {
  if (joins.length === 0) return { sql: '', params: [] };

  const selectClause = select.map(formatColumn).join(', ');

  // Base table is the leftTable of the first join
  const baseTable = `"${sanitizeIdentifier(joins[0].leftTable)}"`;

  // Build JOIN clauses
  const joinClauses = joins.map(join => {
    const rightTable = `"${sanitizeIdentifier(join.rightTable)}"`;
    const leftTable = `"${sanitizeIdentifier(join.leftTable)}"`;
    const onConditions = join.on.map(cond =>
      `${leftTable}."${sanitizeIdentifier(cond.leftField)}" = ${rightTable}."${sanitizeIdentifier(cond.rightField)}"`
    ).join(' AND ');
    return `${joinTypeToSQL(join.joinType)} ${rightTable} ON ${onConditions}`;
  }).join(' ');

  let sql = `SELECT ${selectClause} FROM ${baseTable} ${joinClauses}`;
  const params: unknown[] = [];

  // WHERE
  if (filters && filters.length > 0) {
    const whereParts: string[] = [];
    for (const filter of filters) {
      const col = formatFilterColumn(filter.field);
      switch (filter.operator) {
        case 'equals':
          whereParts.push(`${col} = ?`);
          params.push(filter.value);
          break;
        case 'notEquals':
          whereParts.push(`${col} != ?`);
          params.push(filter.value);
          break;
        case 'greaterThan':
          whereParts.push(`${col} > ?`);
          params.push(filter.value);
          break;
        case 'lessThan':
          whereParts.push(`${col} < ?`);
          params.push(filter.value);
          break;
        default:
          whereParts.push(`${col} = ?`);
          params.push(filter.value);
      }
    }
    sql += ` WHERE ${whereParts.join(' AND ')}`;
  }

  return { sql, params };
}

export function buildCreateViewQuery(
  viewName: string,
  joins: JoinDefinition[],
  select: string[],
): string {
  const joinResult = buildJoinQuery(joins, select);
  return `CREATE OR REPLACE VIEW "${sanitizeIdentifier(viewName)}" AS ${joinResult.sql}`;
}
