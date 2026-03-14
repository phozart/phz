/**
 * @phozart/duckdb — SQL Builder Tests (WI 23)
 *
 * Tests SQL generation from grid state: filters, sorts, grouping, viewport.
 * All operators from FilterOperator must map to valid parameterized SQL.
 */

import { describe, it, expect } from 'vitest';
import {
  buildGridQuery,
  buildCountQuery,
  sanitizeIdentifier,
  type GridQueryInput,
  type SqlResult,
} from '../sql-builder.js';
import type { FilterOperator } from '@phozart/core';

describe('sql-builder', () => {
  describe('sanitizeIdentifier', () => {
    it('passes through simple names', () => {
      expect(sanitizeIdentifier('revenue')).toBe('revenue');
    });

    it('strips special characters', () => {
      expect(sanitizeIdentifier('my-col!')).toBe('my_col_');
    });

    it('preserves underscores and alphanumerics', () => {
      expect(sanitizeIdentifier('col_123')).toBe('col_123');
    });
  });

  describe('buildGridQuery — no filters/sort/group', () => {
    it('returns simple SELECT with LIMIT/OFFSET', () => {
      const result = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: [],
        viewport: { offset: 0, limit: 100 },
      });
      expect(result.sql).toBe('SELECT * FROM "sales" LIMIT ? OFFSET ?');
      expect(result.params).toEqual([100, 0]);
    });

    it('omits LIMIT/OFFSET when viewport is undefined', () => {
      const result = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: [],
      });
      expect(result.sql).toBe('SELECT * FROM "sales"');
      expect(result.params).toEqual([]);
    });
  });

  describe('buildGridQuery — filters (all 20 FilterOperators)', () => {
    function filterQuery(operator: FilterOperator, value: unknown): SqlResult {
      return buildGridQuery({
        tableName: 'data',
        filters: [{ field: 'col', operator, value }],
        sort: [],
        groupBy: [],
      });
    }

    it('equals', () => {
      const r = filterQuery('equals', 'hello');
      expect(r.sql).toContain('WHERE "col" = ?');
      expect(r.params).toContain('hello');
    });

    it('notEquals', () => {
      const r = filterQuery('notEquals', 42);
      expect(r.sql).toContain('WHERE "col" != ?');
      expect(r.params).toContain(42);
    });

    it('contains', () => {
      const r = filterQuery('contains', 'test');
      expect(r.sql).toContain("WHERE \"col\" ILIKE '%' || ? || '%'");
      expect(r.params).toContain('test');
    });

    it('notContains', () => {
      const r = filterQuery('notContains', 'bad');
      expect(r.sql).toContain("WHERE \"col\" NOT ILIKE '%' || ? || '%'");
      expect(r.params).toContain('bad');
    });

    it('startsWith', () => {
      const r = filterQuery('startsWith', 'pre');
      expect(r.sql).toContain("WHERE \"col\" ILIKE ? || '%'");
      expect(r.params).toContain('pre');
    });

    it('endsWith', () => {
      const r = filterQuery('endsWith', 'suf');
      expect(r.sql).toContain("WHERE \"col\" ILIKE '%' || ?");
      expect(r.params).toContain('suf');
    });

    it('lessThan', () => {
      const r = filterQuery('lessThan', 10);
      expect(r.sql).toContain('WHERE "col" < ?');
      expect(r.params).toContain(10);
    });

    it('lessThanOrEqual', () => {
      const r = filterQuery('lessThanOrEqual', 10);
      expect(r.sql).toContain('WHERE "col" <= ?');
      expect(r.params).toContain(10);
    });

    it('greaterThan', () => {
      const r = filterQuery('greaterThan', 5);
      expect(r.sql).toContain('WHERE "col" > ?');
      expect(r.params).toContain(5);
    });

    it('greaterThanOrEqual', () => {
      const r = filterQuery('greaterThanOrEqual', 5);
      expect(r.sql).toContain('WHERE "col" >= ?');
      expect(r.params).toContain(5);
    });

    it('between', () => {
      const r = filterQuery('between', [10, 20]);
      expect(r.sql).toContain('WHERE "col" BETWEEN ? AND ?');
      expect(r.params).toEqual([10, 20]);
    });

    it('in', () => {
      const r = filterQuery('in', ['a', 'b', 'c']);
      expect(r.sql).toContain('WHERE "col" IN (?, ?, ?)');
      expect(r.params).toEqual(['a', 'b', 'c']);
    });

    it('notIn', () => {
      const r = filterQuery('notIn', [1, 2]);
      expect(r.sql).toContain('WHERE "col" NOT IN (?, ?)');
      expect(r.params).toEqual([1, 2]);
    });

    it('isNull', () => {
      const r = filterQuery('isNull', null);
      expect(r.sql).toContain('WHERE "col" IS NULL');
      expect(r.params).toEqual([]);
    });

    it('isNotNull', () => {
      const r = filterQuery('isNotNull', null);
      expect(r.sql).toContain('WHERE "col" IS NOT NULL');
      expect(r.params).toEqual([]);
    });

    it('isEmpty', () => {
      const r = filterQuery('isEmpty', null);
      expect(r.sql).toContain("WHERE (\"col\" IS NULL OR \"col\" = '')");
      expect(r.params).toEqual([]);
    });

    it('isNotEmpty', () => {
      const r = filterQuery('isNotEmpty', null);
      expect(r.sql).toContain("WHERE (\"col\" IS NOT NULL AND \"col\" != '')");
      expect(r.params).toEqual([]);
    });

    it('dateDayOfWeek', () => {
      const r = filterQuery('dateDayOfWeek', [0, 6]);
      expect(r.sql).toContain('WHERE EXTRACT(DOW FROM "col") IN (?, ?)');
      expect(r.params).toEqual([0, 6]);
    });

    it('dateMonth', () => {
      const r = filterQuery('dateMonth', [0, 11]);
      // Note: JS months are 0-based, SQL months are 1-based — builder converts
      expect(r.sql).toContain('WHERE (EXTRACT(MONTH FROM "col") - 1) IN (?, ?)');
      expect(r.params).toEqual([0, 11]);
    });

    it('dateYear', () => {
      const r = filterQuery('dateYear', [2024, 2025]);
      expect(r.sql).toContain('WHERE EXTRACT(YEAR FROM "col") IN (?, ?)');
      expect(r.params).toEqual([2024, 2025]);
    });

    it('dateWeekNumber', () => {
      const r = filterQuery('dateWeekNumber', [1, 52]);
      expect(r.sql).toContain('WHERE EXTRACT(WEEK FROM "col") IN (?, ?)');
      expect(r.params).toEqual([1, 52]);
    });
  });

  describe('buildGridQuery — multiple filters', () => {
    it('joins filters with AND', () => {
      const r = buildGridQuery({
        tableName: 'orders',
        filters: [
          { field: 'status', operator: 'equals' as FilterOperator, value: 'active' },
          { field: 'amount', operator: 'greaterThan' as FilterOperator, value: 100 },
        ],
        sort: [],
        groupBy: [],
      });
      expect(r.sql).toContain('WHERE "status" = ? AND "amount" > ?');
      expect(r.params).toEqual(['active', 100]);
    });
  });

  describe('buildGridQuery — sort', () => {
    it('single column ASC', () => {
      const r = buildGridQuery({
        tableName: 'data',
        filters: [],
        sort: [{ field: 'name', direction: 'asc' }],
        groupBy: [],
      });
      expect(r.sql).toContain('ORDER BY "name" ASC');
    });

    it('single column DESC', () => {
      const r = buildGridQuery({
        tableName: 'data',
        filters: [],
        sort: [{ field: 'score', direction: 'desc' }],
        groupBy: [],
      });
      expect(r.sql).toContain('ORDER BY "score" DESC');
    });

    it('multi-column sort', () => {
      const r = buildGridQuery({
        tableName: 'data',
        filters: [],
        sort: [
          { field: 'category', direction: 'asc' },
          { field: 'price', direction: 'desc' },
        ],
        groupBy: [],
      });
      expect(r.sql).toContain('ORDER BY "category" ASC, "price" DESC');
    });
  });

  describe('buildGridQuery — groupBy', () => {
    it('adds GROUP BY clause', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region', 'quarter'],
      });
      expect(r.sql).toContain('GROUP BY "region", "quarter"');
    });
  });

  describe('buildGridQuery — combined', () => {
    it('filter + sort + viewport', () => {
      const r = buildGridQuery({
        tableName: 'products',
        filters: [{ field: 'active', operator: 'equals' as FilterOperator, value: true }],
        sort: [{ field: 'price', direction: 'desc' }],
        groupBy: [],
        viewport: { offset: 50, limit: 25 },
      });
      expect(r.sql).toBe(
        'SELECT * FROM "products" WHERE "active" = ? ORDER BY "price" DESC LIMIT ? OFFSET ?',
      );
      expect(r.params).toEqual([true, 25, 50]);
    });
  });

  describe('buildCountQuery', () => {
    it('returns COUNT query with same filters', () => {
      const r = buildCountQuery({
        tableName: 'data',
        filters: [{ field: 'x', operator: 'greaterThan' as FilterOperator, value: 0 }],
      });
      expect(r.sql).toBe('SELECT COUNT(*) AS "total" FROM "data" WHERE "x" > ?');
      expect(r.params).toEqual([0]);
    });

    it('returns simple count with no filters', () => {
      const r = buildCountQuery({ tableName: 'data', filters: [] });
      expect(r.sql).toBe('SELECT COUNT(*) AS "total" FROM "data"');
      expect(r.params).toEqual([]);
    });
  });

  describe('parameterization safety', () => {
    it('never interpolates values into SQL string', () => {
      const r = buildGridQuery({
        tableName: 'data',
        filters: [
          { field: 'name', operator: 'equals' as FilterOperator, value: "Robert'; DROP TABLE students;--" },
        ],
        sort: [],
        groupBy: [],
      });
      // SQL should use ? placeholder, not the actual value
      expect(r.sql).not.toContain('Robert');
      expect(r.sql).not.toContain('DROP');
      expect(r.sql).toContain('?');
      expect(r.params).toContain("Robert'; DROP TABLE students;--");
    });

    it('sanitizes table names', () => {
      const r = buildGridQuery({
        tableName: 'my;table--',
        filters: [],
        sort: [],
        groupBy: [],
      });
      expect(r.sql).not.toContain(';');
      expect(r.sql).not.toContain('--');
    });

    it('sanitizes column names in sort', () => {
      const r = buildGridQuery({
        tableName: 'data',
        filters: [],
        sort: [{ field: 'col;DROP', direction: 'asc' }],
        groupBy: [],
      });
      expect(r.sql).not.toContain(';');
    });
  });
});
