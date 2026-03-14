/**
 * @phozart/engine — Expression SQL Transpiler
 *
 * Transpiles ExpressionNode ASTs into DuckDB-compatible SQL expression strings.
 * Used by the DuckDB ComputeBackend to push calculated field evaluation down
 * to the SQL engine instead of evaluating in JavaScript.
 */

import type { ExpressionNode, BuiltinFunction } from './expression-types.js';

/** Map of engine BuiltinFunction name to DuckDB SQL equivalent */
export const FUNCTION_SQL_MAP: Record<string, string> = {
  ABS: 'ABS',
  ROUND: 'ROUND',
  FLOOR: 'FLOOR',
  CEIL: 'CEIL',
  UPPER: 'UPPER',
  LOWER: 'LOWER',
  TRIM: 'TRIM',
  LEN: 'LENGTH',
  SUBSTR: 'SUBSTRING',
  CONCAT: 'CONCAT',
  YEAR: 'YEAR',
  MONTH: 'MONTH',
  DAY: 'DAY',
  COALESCE: 'COALESCE',
  SQRT: 'SQRT',
  POWER: 'POWER',
  MOD: 'MOD',
  LOG: 'LOG',
  EXP: 'EXP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  REPLACE: 'REPLACE',
  REPEAT: 'REPEAT',
  DATE_DIFF: 'DATE_DIFF',
  DATE_ADD: 'DATE_ADD',
  FORMAT_DATE: 'STRFTIME',
  STDDEV: 'STDDEV_SAMP',
  VARIANCE: 'VAR_SAMP',
  PERCENTILE: 'PERCENTILE_CONT',
  RANK: 'RANK',
  DENSE_RANK: 'DENSE_RANK',
  LAG: 'LAG',
  LEAD: 'LEAD',
  RUNNING_SUM: 'SUM',
  NTILE: 'NTILE',
};

/** Transpile an expression AST to a DuckDB SQL expression string */
export function expressionToSQL(node: ExpressionNode): string {
  switch (node.kind) {
    case 'literal':
      if (node.value === null) return 'NULL';
      if (typeof node.value === 'string') return `'${escapeSQLString(node.value)}'`;
      if (typeof node.value === 'boolean') return node.value ? 'TRUE' : 'FALSE';
      return String(node.value);

    case 'field_ref':
      return `"${escapeSQLIdentifier(node.fieldName)}"`;

    case 'param_ref':
      return `$${node.parameterId}`;

    case 'metric_ref':
      throw new Error(`metric_ref "${node.metricId}" must be resolved before SQL transpilation`);

    case 'calc_ref':
      throw new Error(`calc_ref "${node.calculatedFieldId}" must be resolved before SQL transpilation`);

    case 'unary_op':
      if (node.operator === 'negate') return `(-(${expressionToSQL(node.operand)}))`;
      if (node.operator === 'not') return `(NOT (${expressionToSQL(node.operand)}))`;
      return expressionToSQL(node.operand);

    case 'binary_op':
      return transpileBinaryOp(node.operator, node.left, node.right);

    case 'conditional':
      return `(CASE WHEN ${expressionToSQL(node.condition)} THEN ${expressionToSQL(node.thenBranch)} ELSE ${expressionToSQL(node.elseBranch)} END)`;

    case 'function_call':
      return transpileFunction(node.functionName, node.args);

    case 'null_check':
      return `(${expressionToSQL(node.operand)} IS ${node.isNull ? '' : 'NOT '}NULL)`;

    default:
      return 'NULL';
  }
}

function transpileBinaryOp(op: string, left: ExpressionNode, right: ExpressionNode): string {
  const l = expressionToSQL(left);
  const r = expressionToSQL(right);

  const opMap: Record<string, string> = {
    '+': '+', '-': '-', '*': '*', '/': '/', '%': '%',
    '^': '', // special case: POWER
    eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=',
    and: 'AND', or: 'OR', concat: '||',
  };

  if (op === '^') {
    return `POWER(${l}, ${r})`;
  }

  const sqlOp = opMap[op];
  if (!sqlOp) return 'NULL';
  return `(${l} ${sqlOp} ${r})`;
}

function transpileFunction(name: BuiltinFunction, args: ExpressionNode[]): string {
  const sqlArgs = args.map(a => expressionToSQL(a));

  // Special cases
  if (name === 'IF') {
    // IF(cond, then, else) -> CASE WHEN cond THEN then ELSE else END
    return `(CASE WHEN ${sqlArgs[0]} THEN ${sqlArgs[1]} ELSE ${sqlArgs[2] ?? 'NULL'} END)`;
  }

  if (name === 'CLAMP') {
    // CLAMP(val, min, max) -> GREATEST(min, LEAST(max, val))
    return `GREATEST(${sqlArgs[1]}, LEAST(${sqlArgs[2]}, ${sqlArgs[0]}))`;
  }

  const sqlName = FUNCTION_SQL_MAP[name];
  if (!sqlName) return 'NULL';
  return `${sqlName}(${sqlArgs.join(', ')})`;
}

function escapeSQLString(s: string): string {
  return s.replace(/'/g, "''");
}

function escapeSQLIdentifier(s: string): string {
  return s.replace(/"/g, '""');
}
