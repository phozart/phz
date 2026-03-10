/**
 * TDD RED — Unified Filter Algebra (Item 6.9)
 *
 * Tests for FilterExpression AST: recursive AND/OR/NOT composition
 * with a canonical evaluator and backward compatibility.
 */
import { describe, it, expect } from 'vitest';
import type { FilterExpression, FilterAtom } from '../types/filter-expression.js';
import {
  evaluateFilterExpression,
  normalizeFiltersToExpression,
  filterRowsWithExpression,
} from '../filter-expression.js';

// --- Helpers ---

const row = (data: Record<string, unknown>) => ({ __id: 'r1', ...data });

// --- FilterAtom evaluation ---

describe('FilterExpression — atom evaluation', () => {
  it('evaluates equals atom', () => {
    const atom: FilterAtom = { field: 'status', operator: 'equals', value: 'active' };
    expect(evaluateFilterExpression(row({ status: 'active' }), { logic: 'and', conditions: [atom] })).toBe(true);
    expect(evaluateFilterExpression(row({ status: 'inactive' }), { logic: 'and', conditions: [atom] })).toBe(false);
  });

  it('evaluates contains atom (case-insensitive)', () => {
    const atom: FilterAtom = { field: 'name', operator: 'contains', value: 'Alice' };
    expect(evaluateFilterExpression(row({ name: 'alice wonderland' }), { logic: 'and', conditions: [atom] })).toBe(true);
    expect(evaluateFilterExpression(row({ name: 'Bob' }), { logic: 'and', conditions: [atom] })).toBe(false);
  });

  it('evaluates between atom', () => {
    const atom: FilterAtom = { field: 'age', operator: 'between', value: [18, 65] };
    expect(evaluateFilterExpression(row({ age: 30 }), { logic: 'and', conditions: [atom] })).toBe(true);
    expect(evaluateFilterExpression(row({ age: 10 }), { logic: 'and', conditions: [atom] })).toBe(false);
  });

  it('evaluates in atom', () => {
    const atom: FilterAtom = { field: 'role', operator: 'in', value: ['admin', 'editor'] };
    expect(evaluateFilterExpression(row({ role: 'admin' }), { logic: 'and', conditions: [atom] })).toBe(true);
    expect(evaluateFilterExpression(row({ role: 'viewer' }), { logic: 'and', conditions: [atom] })).toBe(false);
  });

  it('evaluates isNull/isNotNull atoms', () => {
    const isNull: FilterAtom = { field: 'email', operator: 'isNull', value: null };
    expect(evaluateFilterExpression(row({ email: null }), { logic: 'and', conditions: [isNull] })).toBe(true);
    expect(evaluateFilterExpression(row({ email: 'a@b.c' }), { logic: 'and', conditions: [isNull] })).toBe(false);
  });

  it('evaluates date operators', () => {
    const atom: FilterAtom = { field: 'created', operator: 'dateDayOfWeek', value: [1] }; // Monday
    // 2026-01-05 is a Monday
    expect(evaluateFilterExpression(row({ created: '2026-01-05' }), { logic: 'and', conditions: [atom] })).toBe(true);
  });
});

// --- Boolean composition ---

describe('FilterExpression — AND/OR/NOT composition', () => {
  it('AND: all conditions must match', () => {
    const expr: FilterExpression = {
      logic: 'and',
      conditions: [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'age', operator: 'greaterThan', value: 18 },
      ],
    };
    expect(evaluateFilterExpression(row({ status: 'active', age: 25 }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ status: 'active', age: 15 }), expr)).toBe(false);
    expect(evaluateFilterExpression(row({ status: 'inactive', age: 25 }), expr)).toBe(false);
  });

  it('OR: any condition can match', () => {
    const expr: FilterExpression = {
      logic: 'or',
      conditions: [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'status', operator: 'equals', value: 'pending' },
      ],
    };
    expect(evaluateFilterExpression(row({ status: 'active' }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ status: 'pending' }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ status: 'closed' }), expr)).toBe(false);
  });

  it('NOT: inverts nested expression', () => {
    const expr: FilterExpression = {
      logic: 'not',
      conditions: [
        { field: 'status', operator: 'equals', value: 'deleted' },
      ],
    };
    expect(evaluateFilterExpression(row({ status: 'active' }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ status: 'deleted' }), expr)).toBe(false);
  });

  it('nested composition: A AND (B OR C)', () => {
    const expr: FilterExpression = {
      logic: 'and',
      conditions: [
        { field: 'active', operator: 'equals', value: true },
        {
          logic: 'or',
          conditions: [
            { field: 'role', operator: 'equals', value: 'admin' },
            { field: 'role', operator: 'equals', value: 'editor' },
          ],
        },
      ],
    };
    expect(evaluateFilterExpression(row({ active: true, role: 'admin' }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ active: true, role: 'editor' }), expr)).toBe(true);
    expect(evaluateFilterExpression(row({ active: true, role: 'viewer' }), expr)).toBe(false);
    expect(evaluateFilterExpression(row({ active: false, role: 'admin' }), expr)).toBe(false);
  });

  it('deeply nested: NOT (A AND B)', () => {
    const expr: FilterExpression = {
      logic: 'not',
      conditions: [{
        logic: 'and',
        conditions: [
          { field: 'x', operator: 'equals', value: 1 },
          { field: 'y', operator: 'equals', value: 2 },
        ],
      }],
    };
    expect(evaluateFilterExpression(row({ x: 1, y: 2 }), expr)).toBe(false);
    expect(evaluateFilterExpression(row({ x: 1, y: 3 }), expr)).toBe(true);
  });

  it('empty AND expression matches all rows', () => {
    const expr: FilterExpression = { logic: 'and', conditions: [] };
    expect(evaluateFilterExpression(row({ anything: true }), expr)).toBe(true);
  });

  it('empty OR expression matches no rows', () => {
    const expr: FilterExpression = { logic: 'or', conditions: [] };
    expect(evaluateFilterExpression(row({ anything: true }), expr)).toBe(false);
  });
});

// --- Backward compatibility ---

describe('normalizeFiltersToExpression — backward compat', () => {
  it('converts flat FilterState.filters to AND expression', () => {
    const filters = [
      { field: 'status', operator: 'equals' as const, value: 'active' },
      { field: 'age', operator: 'greaterThan' as const, value: 18 },
    ];
    const expr = normalizeFiltersToExpression(filters);
    expect(expr.logic).toBe('and');
    expect(expr.conditions).toHaveLength(2);
    expect((expr.conditions[0] as FilterAtom).field).toBe('status');
  });

  it('converts empty filters to empty AND', () => {
    const expr = normalizeFiltersToExpression([]);
    expect(expr.logic).toBe('and');
    expect(expr.conditions).toHaveLength(0);
  });

  it('single filter becomes single-condition AND', () => {
    const filters = [{ field: 'x', operator: 'equals' as const, value: 1 }];
    const expr = normalizeFiltersToExpression(filters);
    expect(expr.logic).toBe('and');
    expect(expr.conditions).toHaveLength(1);
  });
});

// --- filterRows integration with expressions ---

describe('filterRows with FilterExpression', () => {
  it('FilterState with expression field is used for filtering', () => {
    const rows = [
      { __id: 'r1', status: 'active', role: 'admin' },
      { __id: 'r2', status: 'active', role: 'viewer' },
      { __id: 'r3', status: 'inactive', role: 'admin' },
    ];
    const coreModel = {
      rows,
      rowsById: new Map(rows.map(r => [r.__id, r])),
      flatRows: rows,
      rowCount: rows.length,
    };
    const expr: FilterExpression = {
      logic: 'and',
      conditions: [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'role', operator: 'equals', value: 'admin' },
      ],
    };
    const result = filterRowsWithExpression(coreModel, expr, []);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].__id).toBe('r1');
  });

  it('OR expression filters correctly', () => {
    const rows = [
      { __id: 'r1', status: 'active' },
      { __id: 'r2', status: 'pending' },
      { __id: 'r3', status: 'closed' },
    ];
    const coreModel = {
      rows,
      rowsById: new Map(rows.map(r => [r.__id, r])),
      flatRows: rows,
      rowCount: rows.length,
    };
    const expr: FilterExpression = {
      logic: 'or',
      conditions: [
        { field: 'status', operator: 'equals', value: 'active' },
        { field: 'status', operator: 'equals', value: 'pending' },
      ],
    };
    const result = filterRowsWithExpression(coreModel, expr, []);
    expect(result.rows).toHaveLength(2);
  });
});
