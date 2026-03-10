/**
 * @phozart/phz-duckdb — SQL Builder Push-down Enhancement Tests
 *
 * Tests for enhanced sql-builder features: HAVING clause, GROUP BY with
 * aggregate SELECT columns, and combined push-down queries.
 */

import { describe, it, expect } from 'vitest';
import {
  buildGridQuery,
  buildCountQuery,
  type GridQueryInput,
} from '../sql-builder.js';
import type { FilterOperator } from '@phozart/phz-core';

describe('sql-builder push-down enhancements', () => {
  describe('HAVING clause', () => {
    it('generates HAVING with a single condition', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
        having: [{ field: 'revenue', operator: 'greaterThan', value: 1000, aggregation: 'sum' }],
      });
      expect(r.sql).toContain('HAVING SUM("revenue") > ?');
      expect(r.params).toContain(1000);
    });

    it('generates HAVING with multiple conditions joined by AND', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
        having: [
          { field: 'revenue', operator: 'greaterThan', value: 1000, aggregation: 'sum' },
          { field: 'order_count', operator: 'greaterThanOrEqual', value: 5, aggregation: 'count' },
        ],
      });
      expect(r.sql).toContain('HAVING SUM("revenue") > ? AND COUNT("order_count") >= ?');
      expect(r.params).toContain(1000);
      expect(r.params).toContain(5);
    });

    it('places HAVING after GROUP BY and before ORDER BY', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [{ field: 'region', direction: 'asc' }],
        groupBy: ['region'],
        having: [{ field: 'revenue', operator: 'greaterThan', value: 500, aggregation: 'sum' }],
      });
      const groupIdx = r.sql.indexOf('GROUP BY');
      const havingIdx = r.sql.indexOf('HAVING');
      const orderIdx = r.sql.indexOf('ORDER BY');
      expect(groupIdx).toBeLessThan(havingIdx);
      expect(havingIdx).toBeLessThan(orderIdx);
    });

    it('omits HAVING when array is empty', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
        having: [],
      });
      expect(r.sql).not.toContain('HAVING');
    });

    it('omits HAVING when not provided', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
      });
      expect(r.sql).not.toContain('HAVING');
    });

    it('uses parameterized values in HAVING (no string interpolation)', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
        having: [{ field: 'amount', operator: 'greaterThan', value: "1000'; DROP TABLE sales;--", aggregation: 'sum' }],
      });
      expect(r.sql).not.toContain('1000');
      expect(r.sql).not.toContain('DROP');
      expect(r.sql).toContain('?');
    });

    it('supports different aggregation functions', () => {
      const r = buildGridQuery({
        tableName: 'orders',
        filters: [],
        sort: [],
        groupBy: ['customer'],
        having: [
          { field: 'amount', operator: 'greaterThan', value: 100, aggregation: 'avg' },
          { field: 'id', operator: 'greaterThanOrEqual', value: 10, aggregation: 'count' },
          { field: 'price', operator: 'lessThan', value: 500, aggregation: 'max' },
          { field: 'discount', operator: 'greaterThan', value: 0, aggregation: 'min' },
        ],
      });
      expect(r.sql).toContain('AVG("amount") > ?');
      expect(r.sql).toContain('COUNT("id") >= ?');
      expect(r.sql).toContain('MAX("price") < ?');
      expect(r.sql).toContain('MIN("discount") > ?');
    });
  });

  describe('GROUP BY with aggregate SELECT columns', () => {
    it('adds aggregate columns to SELECT when aggregates provided', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
        aggregates: [
          { field: 'revenue', function: 'sum' },
        ],
      });
      expect(r.sql).toContain('SELECT "region", SUM("revenue") AS "revenue_sum"');
      expect(r.sql).toContain('GROUP BY "region"');
    });

    it('includes COUNT(*) as group row count when groupBy is used with aggregates', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['category'],
        aggregates: [
          { field: 'price', function: 'avg' },
        ],
      });
      expect(r.sql).toContain('COUNT(*) AS "group_count"');
    });

    it('supports multiple aggregates on different fields', () => {
      const r = buildGridQuery({
        tableName: 'orders',
        filters: [],
        sort: [],
        groupBy: ['region', 'quarter'],
        aggregates: [
          { field: 'revenue', function: 'sum' },
          { field: 'price', function: 'avg' },
          { field: 'order_id', function: 'count' },
        ],
      });
      expect(r.sql).toContain('"region"');
      expect(r.sql).toContain('"quarter"');
      expect(r.sql).toContain('SUM("revenue") AS "revenue_sum"');
      expect(r.sql).toContain('AVG("price") AS "price_avg"');
      expect(r.sql).toContain('COUNT("order_id") AS "order_id_count"');
      expect(r.sql).toContain('GROUP BY "region", "quarter"');
    });

    it('falls back to SELECT * when no aggregates provided with groupBy', () => {
      const r = buildGridQuery({
        tableName: 'sales',
        filters: [],
        sort: [],
        groupBy: ['region'],
      });
      expect(r.sql).toContain('SELECT * FROM');
    });
  });

  describe('buildCountQuery with groupBy', () => {
    it('wraps grouped count in a subquery', () => {
      const r = buildCountQuery({
        tableName: 'sales',
        filters: [],
        groupBy: ['region'],
      });
      expect(r.sql).toContain('COUNT(*)');
      // Should count distinct groups, not individual rows
      expect(r.sql).toContain('GROUP BY');
    });
  });

  describe('combined push-down: filter + group + having + sort + limit', () => {
    it('generates a fully combined query', () => {
      const r = buildGridQuery({
        tableName: 'transactions',
        filters: [{ field: 'status', operator: 'equals' as FilterOperator, value: 'completed' }],
        sort: [{ field: 'total_revenue', direction: 'desc' }],
        groupBy: ['merchant'],
        aggregates: [
          { field: 'amount', function: 'sum' },
        ],
        having: [{ field: 'amount', operator: 'greaterThan', value: 10000, aggregation: 'sum' }],
        viewport: { offset: 0, limit: 50 },
      });

      // Verify clause order: SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT
      const sql = r.sql;
      const selectIdx = sql.indexOf('SELECT');
      const fromIdx = sql.indexOf('FROM');
      const whereIdx = sql.indexOf('WHERE');
      const groupIdx = sql.indexOf('GROUP BY');
      const havingIdx = sql.indexOf('HAVING');
      const orderIdx = sql.indexOf('ORDER BY');
      const limitIdx = sql.indexOf('LIMIT');

      expect(selectIdx).toBeLessThan(fromIdx);
      expect(fromIdx).toBeLessThan(whereIdx);
      expect(whereIdx).toBeLessThan(groupIdx);
      expect(groupIdx).toBeLessThan(havingIdx);
      expect(havingIdx).toBeLessThan(orderIdx);
      expect(orderIdx).toBeLessThan(limitIdx);

      // Verify parameterized values
      expect(r.params).toContain('completed');
      expect(r.params).toContain(10000);
      expect(r.params).toContain(50);
      expect(r.params).toContain(0);
    });
  });
});
