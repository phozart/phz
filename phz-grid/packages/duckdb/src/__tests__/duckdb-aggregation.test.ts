/**
 * @phozart/duckdb — DuckDB Aggregation Tests (WI 24)
 *
 * Tests SQL generation for aggregation queries.
 */

import { describe, it, expect } from 'vitest';
import {
  buildAggregationQuery,
  buildGroupAggregationQuery,
  type DuckDBAggregationFunction,
} from '../duckdb-aggregation.js';

describe('duckdb-aggregation', () => {
  describe('buildAggregationQuery', () => {
    it('generates simple aggregation SQL', () => {
      const r = buildAggregationQuery('sales', [
        { field: 'revenue', functions: ['sum', 'avg'] },
      ]);
      expect(r.sql).toContain('SUM("revenue")');
      expect(r.sql).toContain('AVG("revenue")');
      expect(r.sql).toContain('FROM "sales"');
    });

    it('generates count aggregation', () => {
      const r = buildAggregationQuery('data', [
        { field: 'id', functions: ['count'] },
      ]);
      expect(r.sql).toContain('COUNT("id")');
    });

    it('handles min and max', () => {
      const r = buildAggregationQuery('orders', [
        { field: 'price', functions: ['min', 'max'] },
      ]);
      expect(r.sql).toContain('MIN("price")');
      expect(r.sql).toContain('MAX("price")');
    });

    it('supports DuckDB-specific statistical functions: median', () => {
      const r = buildAggregationQuery('data', [
        { field: 'score', functions: ['median'] },
      ]);
      expect(r.sql).toContain('MEDIAN("score")');
    });

    it('supports stddev', () => {
      const r = buildAggregationQuery('data', [
        { field: 'value', functions: ['stddev'] },
      ]);
      expect(r.sql).toContain('STDDEV("value")');
    });

    it('supports variance', () => {
      const r = buildAggregationQuery('data', [
        { field: 'value', functions: ['variance'] },
      ]);
      expect(r.sql).toContain('VARIANCE("value")');
    });

    it('supports approx_count_distinct', () => {
      const r = buildAggregationQuery('data', [
        { field: 'user_id', functions: ['approx_count_distinct'] },
      ]);
      expect(r.sql).toContain('APPROX_COUNT_DISTINCT("user_id")');
    });

    it('supports percentile_cont', () => {
      const r = buildAggregationQuery('data', [
        { field: 'latency', functions: ['percentile_cont'] },
      ]);
      expect(r.sql).toContain('PERCENTILE_CONT');
      expect(r.sql).toContain('"latency"');
    });

    it('generates aliases for each aggregation', () => {
      const r = buildAggregationQuery('sales', [
        { field: 'revenue', functions: ['sum', 'avg'] },
      ]);
      expect(r.sql).toContain('AS "revenue_sum"');
      expect(r.sql).toContain('AS "revenue_avg"');
    });

    it('handles multiple fields', () => {
      const r = buildAggregationQuery('sales', [
        { field: 'revenue', functions: ['sum'] },
        { field: 'quantity', functions: ['avg', 'count'] },
      ]);
      expect(r.sql).toContain('SUM("revenue")');
      expect(r.sql).toContain('AVG("quantity")');
      expect(r.sql).toContain('COUNT("quantity")');
    });

    it('applies filters when provided', () => {
      const r = buildAggregationQuery(
        'sales',
        [{ field: 'revenue', functions: ['sum'] }],
        [{ field: 'active', operator: 'equals', value: true }],
      );
      expect(r.sql).toContain('WHERE "active" = ?');
      expect(r.params).toContain(true);
    });
  });

  describe('buildGroupAggregationQuery', () => {
    it('includes GROUP BY clause', () => {
      const r = buildGroupAggregationQuery(
        'sales',
        ['region'],
        [{ field: 'revenue', functions: ['sum'] }],
      );
      expect(r.sql).toContain('GROUP BY "region"');
      expect(r.sql).toContain('SUM("revenue")');
      expect(r.sql).toContain('"region"');
    });

    it('handles multiple group-by fields', () => {
      const r = buildGroupAggregationQuery(
        'sales',
        ['region', 'quarter'],
        [{ field: 'revenue', functions: ['sum'] }],
      );
      expect(r.sql).toContain('GROUP BY "region", "quarter"');
    });

    it('selects group-by fields in output', () => {
      const r = buildGroupAggregationQuery(
        'sales',
        ['region'],
        [{ field: 'revenue', functions: ['sum'] }],
      );
      // The SELECT should include the group-by field
      expect(r.sql).toMatch(/SELECT\s+"region"/);
    });
  });
});
