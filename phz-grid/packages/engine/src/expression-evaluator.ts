/**
 * @phozart/engine — Expression Evaluator
 *
 * Synchronous tree-walk evaluator for ExpressionNode ASTs.
 * Two contexts: row-level (for calculated fields) and metric-level (for composite metrics).
 */

import type { ExpressionNode, BuiltinFunction } from './expression-types.js';

// --- Contexts ---

export interface RowExpressionContext {
  row: Record<string, unknown>;
  params: Record<string, unknown>;
  calculatedValues: Record<string, unknown>;
}

export interface MetricExpressionContext {
  metricValues: Record<string, number | null>;
  params: Record<string, unknown>;
}

// --- Row-level evaluator ---

export function evaluateRowExpression(
  node: ExpressionNode,
  ctx: RowExpressionContext,
): unknown {
  return evalNode(node, ctx, 'row');
}

// --- Metric-level evaluator ---

export function evaluateMetricExpression(
  node: ExpressionNode,
  ctx: MetricExpressionContext,
): number | null {
  const result = evalNode(node, ctx, 'metric');
  if (result === null || result === undefined) return null;
  if (typeof result === 'number') return result;
  if (typeof result === 'string') {
    const n = Number(result);
    return isNaN(n) ? null : n;
  }
  return null;
}

// --- Core evaluator ---

type EvalContext = RowExpressionContext | MetricExpressionContext;
type EvalLevel = 'row' | 'metric';

function evalNode(node: ExpressionNode, ctx: EvalContext, level: EvalLevel): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;

    case 'field_ref': {
      if (level === 'row') {
        const rowCtx = ctx as RowExpressionContext;
        return rowCtx.row[node.fieldName] ?? null;
      }
      return null;
    }

    case 'param_ref': {
      const params = level === 'row'
        ? (ctx as RowExpressionContext).params
        : (ctx as MetricExpressionContext).params;
      return params[node.parameterId] ?? null;
    }

    case 'metric_ref': {
      if (level === 'metric') {
        const metricCtx = ctx as MetricExpressionContext;
        return metricCtx.metricValues[node.metricId] ?? null;
      }
      return null;
    }

    case 'calc_ref': {
      if (level === 'row') {
        const rowCtx = ctx as RowExpressionContext;
        return rowCtx.calculatedValues[node.calculatedFieldId] ?? null;
      }
      return null;
    }

    case 'unary_op': {
      const operand = evalNode(node.operand, ctx, level);
      if (operand === null) return null;

      switch (node.operator) {
        case 'negate':
          return typeof operand === 'number' ? -operand : null;
        case 'not':
          return !toBool(operand);
        default:
          return null;
      }
    }

    case 'binary_op':
      return evalBinaryOp(node.operator, node.left, node.right, ctx, level);

    case 'conditional': {
      const cond = evalNode(node.condition, ctx, level);
      return toBool(cond)
        ? evalNode(node.thenBranch, ctx, level)
        : evalNode(node.elseBranch, ctx, level);
    }

    case 'function_call':
      return evalFunction(node.functionName, node.args, ctx, level);

    case 'null_check': {
      const val = evalNode(node.operand, ctx, level);
      const isNullVal = val === null || val === undefined;
      return node.isNull ? isNullVal : !isNullVal;
    }

    default:
      return null;
  }
}

// --- Binary Operator ---

function evalBinaryOp(
  op: string,
  leftNode: ExpressionNode,
  rightNode: ExpressionNode,
  ctx: EvalContext,
  level: EvalLevel,
): unknown {
  // Short-circuit for AND/OR
  if (op === 'and') {
    const left = evalNode(leftNode, ctx, level);
    if (!toBool(left)) return false;
    return toBool(evalNode(rightNode, ctx, level));
  }
  if (op === 'or') {
    const left = evalNode(leftNode, ctx, level);
    if (toBool(left)) return true;
    return toBool(evalNode(rightNode, ctx, level));
  }

  const left = evalNode(leftNode, ctx, level);
  const right = evalNode(rightNode, ctx, level);

  // SQL-like null propagation
  if (left === null || right === null) {
    // Equality checks can compare with null
    if (op === 'eq') return left === right;
    if (op === 'neq') return left !== right;
    return null;
  }

  // String concat
  if (op === 'concat') {
    return String(left) + String(right);
  }

  // Arithmetic
  const leftNum = toNumber(left);
  const rightNum = toNumber(right);

  switch (op) {
    case '+':
      if (leftNum !== null && rightNum !== null) return leftNum + rightNum;
      return null;
    case '-':
      if (leftNum !== null && rightNum !== null) return leftNum - rightNum;
      return null;
    case '*':
      if (leftNum !== null && rightNum !== null) return leftNum * rightNum;
      return null;
    case '/':
      if (leftNum !== null && rightNum !== null) {
        if (rightNum === 0) return null; // Division by zero
        return leftNum / rightNum;
      }
      return null;
    case '%':
      if (leftNum !== null && rightNum !== null) {
        if (rightNum === 0) return null;
        return leftNum % rightNum;
      }
      return null;
    case '^':
      if (leftNum !== null && rightNum !== null) return Math.pow(leftNum, rightNum);
      return null;
    case 'eq': return left === right;
    case 'neq': return left !== right;
    case 'gt':
      if (leftNum !== null && rightNum !== null) return leftNum > rightNum;
      return null;
    case 'gte':
      if (leftNum !== null && rightNum !== null) return leftNum >= rightNum;
      return null;
    case 'lt':
      if (leftNum !== null && rightNum !== null) return leftNum < rightNum;
      return null;
    case 'lte':
      if (leftNum !== null && rightNum !== null) return leftNum <= rightNum;
      return null;
    default:
      return null;
  }
}

// --- Built-in Functions ---

function evalFunction(
  name: BuiltinFunction,
  argNodes: ExpressionNode[],
  ctx: EvalContext,
  level: EvalLevel,
): unknown {
  const args = argNodes.map(a => evalNode(a, ctx, level));

  switch (name) {
    // Math
    case 'ABS': {
      const v = toNumber(args[0]);
      return v !== null ? Math.abs(v) : null;
    }
    case 'ROUND': {
      const v = toNumber(args[0]);
      const decimals = toNumber(args[1]) ?? 0;
      if (v === null) return null;
      const factor = Math.pow(10, decimals);
      return Math.round(v * factor) / factor;
    }
    case 'FLOOR': {
      const v = toNumber(args[0]);
      return v !== null ? Math.floor(v) : null;
    }
    case 'CEIL': {
      const v = toNumber(args[0]);
      return v !== null ? Math.ceil(v) : null;
    }

    // String
    case 'UPPER':
      return args[0] !== null && args[0] !== undefined ? String(args[0]).toUpperCase() : null;
    case 'LOWER':
      return args[0] !== null && args[0] !== undefined ? String(args[0]).toLowerCase() : null;
    case 'TRIM':
      return args[0] !== null && args[0] !== undefined ? String(args[0]).trim() : null;
    case 'LEN':
      return args[0] !== null && args[0] !== undefined ? String(args[0]).length : null;
    case 'SUBSTR': {
      if (args[0] === null || args[0] === undefined) return null;
      const str = String(args[0]);
      const start = toNumber(args[1]) ?? 0;
      const len = toNumber(args[2]);
      return len !== null ? str.substring(start, start + len) : str.substring(start);
    }
    case 'CONCAT':
      return args.map(a => a !== null && a !== undefined ? String(a) : '').join('');

    // Date
    case 'YEAR': {
      const d = toDate(args[0]);
      return d ? d.getFullYear() : null;
    }
    case 'MONTH': {
      const d = toDate(args[0]);
      return d ? d.getMonth() + 1 : null;
    }
    case 'DAY': {
      const d = toDate(args[0]);
      return d ? d.getDate() : null;
    }

    // Utility
    case 'COALESCE':
      for (const a of args) {
        if (a !== null && a !== undefined) return a;
      }
      return null;

    case 'IF':
      return toBool(args[0]) ? args[1] : (args[2] ?? null);

    case 'CLAMP': {
      const v = toNumber(args[0]);
      const min = toNumber(args[1]);
      const max = toNumber(args[2]);
      if (v === null || min === null || max === null) return null;
      return Math.max(min, Math.min(max, v));
    }

    default:
      return null;
  }
}

// --- Helpers ---

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  if (typeof val === 'boolean') return val ? 1 : 0;
  return null;
}

function toBool(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  return true;
}

function toDate(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
