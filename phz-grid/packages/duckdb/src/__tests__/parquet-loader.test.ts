/**
 * @phozart/phz-duckdb — Parquet Loader Tests (WI 27)
 *
 * Tests for smart Parquet loading with projection and predicate pushdown.
 */

import { describe, it, expect } from 'vitest';
import {
  buildProjectionQuery,
  buildPredicatePushdownQuery,
  buildSchemaInspectionQuery,
} from '../parquet-loader.js';
import type { FilterOperator } from '@phozart/phz-core';

describe('parquet-loader', () => {
  describe('buildProjectionQuery', () => {
    it('generates SELECT with specific columns from read_parquet', () => {
      const sql = buildProjectionQuery('https://example.com/data.parquet', ['id', 'name', 'revenue']);
      expect(sql).toContain('SELECT "id", "name", "revenue"');
      expect(sql).toContain("read_parquet('https://example.com/data.parquet')");
    });

    it('generates SELECT * when no columns specified', () => {
      const sql = buildProjectionQuery('https://example.com/data.parquet');
      expect(sql).toContain('SELECT *');
      expect(sql).toContain("read_parquet('https://example.com/data.parquet')");
    });

    it('sanitizes column names', () => {
      const sql = buildProjectionQuery('/data.parquet', ['col;DROP']);
      expect(sql).not.toContain(';');
    });
  });

  describe('buildPredicatePushdownQuery', () => {
    it('includes WHERE clause in read_parquet query', () => {
      const r = buildPredicatePushdownQuery(
        '/data.parquet',
        ['id', 'name'],
        [{ field: 'active', operator: 'equals' as FilterOperator, value: true }],
      );
      expect(r.sql).toContain('WHERE "active" = ?');
      expect(r.sql).toContain("read_parquet('/data.parquet')");
      expect(r.params).toContain(true);
    });

    it('combines projection and predicate pushdown', () => {
      const r = buildPredicatePushdownQuery(
        '/data.parquet',
        ['revenue'],
        [{ field: 'revenue', operator: 'greaterThan' as FilterOperator, value: 1000 }],
      );
      expect(r.sql).toContain('SELECT "revenue"');
      expect(r.sql).toContain('WHERE "revenue" > ?');
    });
  });

  describe('buildSchemaInspectionQuery', () => {
    it('generates parquet_schema query', () => {
      const sql = buildSchemaInspectionQuery('https://example.com/data.parquet');
      expect(sql).toContain("parquet_schema('https://example.com/data.parquet')");
    });

    it('works with local file paths', () => {
      const sql = buildSchemaInspectionQuery('/local/data.parquet');
      expect(sql).toContain("parquet_schema('/local/data.parquet')");
    });
  });
});
