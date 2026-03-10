/**
 * @phozart/phz-engine — ComputeBackend Strategy
 *
 * Abstraction layer for computation: aggregation, pivot, filter, calculated fields.
 * BIEngine uses this to delegate work to either the JS engine or DuckDB-WASM.
 */

import type { AggregationConfig, PivotConfig, FilterOperator } from '@phozart/phz-core';
import type { AggregationResult } from './aggregation.js';
import type { PivotResult } from './pivot.js';
import { computeAggregations } from './aggregation.js';
import { computePivot } from './pivot.js';

export interface ComputeFilterInput {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface CalculatedFieldInput {
  name: string;
  expression: string;
}

export interface ComputeBackend {
  aggregate(data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult>;
  pivot(data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult>;
  filter(data: Record<string, unknown>[], criteria: ComputeFilterInput[]): Promise<Record<string, unknown>[]>;
  computeCalculatedFields(data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]>;
}

function matchesFilter(row: Record<string, unknown>, filter: ComputeFilterInput): boolean {
  const value = row[filter.field];
  switch (filter.operator) {
    case 'equals':
      return value === filter.value;
    case 'notEquals':
      return value !== filter.value;
    case 'greaterThan':
      return typeof value === 'number' && typeof filter.value === 'number' && value > filter.value;
    case 'greaterThanOrEqual':
      return typeof value === 'number' && typeof filter.value === 'number' && value >= filter.value;
    case 'lessThan':
      return typeof value === 'number' && typeof filter.value === 'number' && value < filter.value;
    case 'lessThanOrEqual':
      return typeof value === 'number' && typeof filter.value === 'number' && value <= filter.value;
    case 'contains':
      return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().includes(filter.value.toLowerCase());
    case 'notContains':
      return typeof value === 'string' && typeof filter.value === 'string' && !value.toLowerCase().includes(filter.value.toLowerCase());
    case 'startsWith':
      return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().startsWith(filter.value.toLowerCase());
    case 'endsWith':
      return typeof value === 'string' && typeof filter.value === 'string' && value.toLowerCase().endsWith(filter.value.toLowerCase());
    case 'isNull':
      return value === null || value === undefined;
    case 'isNotNull':
      return value !== null && value !== undefined;
    case 'in':
      return Array.isArray(filter.value) && (filter.value as unknown[]).includes(value);
    case 'notIn':
      return Array.isArray(filter.value) && !(filter.value as unknown[]).includes(value);
    case 'between': {
      const [min, max] = filter.value as [number, number];
      return typeof value === 'number' && value >= min && value <= max;
    }
    default:
      return true;
  }
}

function evaluateSimpleExpression(row: Record<string, unknown>, expression: string): unknown {
  // Simple expression evaluator for "field1 op field2" patterns
  const match = expression.match(/^(\w+)\s*([+\-*/])\s*(\w+)$/);
  if (match) {
    const [, left, op, right] = match;
    const lval = row[left] as number;
    const rval = row[right] as number;
    if (typeof lval !== 'number' || typeof rval !== 'number') return null;
    switch (op) {
      case '+': return lval + rval;
      case '-': return lval - rval;
      case '*': return lval * rval;
      case '/': return rval !== 0 ? lval / rval : null;
    }
  }
  // Try single field reference
  if (/^\w+$/.test(expression) && expression in row) {
    return row[expression];
  }
  return null;
}

export class JSComputeBackend implements ComputeBackend {
  async aggregate(data: Record<string, unknown>[], config: AggregationConfig): Promise<AggregationResult> {
    return computeAggregations(data, config);
  }

  async pivot(data: Record<string, unknown>[], config: PivotConfig): Promise<PivotResult> {
    return computePivot(data, config);
  }

  async filter(data: Record<string, unknown>[], criteria: ComputeFilterInput[]): Promise<Record<string, unknown>[]> {
    if (criteria.length === 0) return data;
    return data.filter(row => criteria.every(f => matchesFilter(row, f)));
  }

  async computeCalculatedFields(data: Record<string, unknown>[], fields: CalculatedFieldInput[]): Promise<Record<string, unknown>[]> {
    if (fields.length === 0) return data;
    return data.map(row => {
      const newRow = { ...row };
      for (const field of fields) {
        newRow[field.name] = evaluateSimpleExpression(row, field.expression);
      }
      return newRow;
    });
  }
}

export function createJSComputeBackend(): ComputeBackend {
  return new JSComputeBackend();
}
