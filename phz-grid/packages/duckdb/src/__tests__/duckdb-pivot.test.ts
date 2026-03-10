/**
 * @phozart/phz-duckdb — DuckDB Pivot Tests (WI 25)
 *
 * Tests SQL generation for DuckDB PIVOT queries.
 */

import { describe, it, expect } from 'vitest';
import { buildPivotQuery } from '../duckdb-pivot.js';
import type { PivotConfig } from '@phozart/phz-core';

describe('duckdb-pivot', () => {
  describe('buildPivotQuery', () => {
    it('generates PIVOT SQL for simple case', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('PIVOT');
      expect(r.sql).toContain('"sales"');
      expect(r.sql).toContain('SUM("revenue")');
      expect(r.sql).toContain('"quarter"');
    });

    it('handles multiple value fields', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['quarter'],
        valueFields: [
          { field: 'revenue', aggregation: 'sum' },
          { field: 'revenue', aggregation: 'avg' },
        ],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('SUM("revenue")');
      expect(r.sql).toContain('AVG("revenue")');
    });

    it('includes GROUP BY for row fields', () => {
      const config: PivotConfig = {
        rowFields: ['region', 'country'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('GROUP BY');
      expect(r.sql).toContain('"region"');
      expect(r.sql).toContain('"country"');
    });

    it('returns empty result for empty config', () => {
      const config: PivotConfig = {
        rowFields: [],
        columnFields: [],
        valueFields: [],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toBe('');
    });

    it('generates valid SQL with single row and column field', () => {
      const config: PivotConfig = {
        rowFields: ['dept'],
        columnFields: ['year'],
        valueFields: [{ field: 'budget', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('budgets', config);
      // Should be a valid PIVOT statement
      expect(r.sql).toMatch(/PIVOT/);
      expect(r.sql).toContain('"dept"');
      expect(r.sql).toContain('"year"');
    });
  });
});
