/**
 * @phozart/duckdb — DuckDB Pivot Tests (WI 25)
 *
 * Tests SQL generation for DuckDB PIVOT queries.
 */

import { describe, it, expect } from 'vitest';
import { buildPivotQuery } from '../duckdb-pivot.js';
import type { PivotConfig } from '@phozart/core';

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

  describe('date grouping SQL in pivot query', () => {
    it('applies year granularity to column field', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'year' },
      });
      expect(r.sql).toContain('EXTRACT(YEAR FROM "order_date")');
      expect(r.sql).not.toContain('ON "order_date"');
    });

    it('applies quarter granularity to column field', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'quarter' },
      });
      expect(r.sql).toContain('EXTRACT(QUARTER FROM "order_date")');
      expect(r.sql).toContain('EXTRACT(YEAR FROM "order_date")');
    });

    it('applies month granularity to column field', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'month' },
      });
      expect(r.sql).toContain("STRFTIME(\"order_date\", '%Y-%m')");
    });

    it('applies week granularity to column field', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'week' },
      });
      expect(r.sql).toContain("STRFTIME(\"order_date\", '%G-W%V')");
    });

    it('applies day granularity to column field', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'day' },
      });
      expect(r.sql).toContain('CAST("order_date" AS DATE)');
    });

    it('applies date grouping to row fields', () => {
      const config: PivotConfig = {
        rowFields: ['hire_date'],
        columnFields: ['department'],
        valueFields: [{ field: 'salary', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('employees', config, {
        dateGroupings: { hire_date: 'year' },
      });
      expect(r.sql).toContain('GROUP BY CAST(EXTRACT(YEAR FROM "hire_date") AS INTEGER)');
    });

    it('applies date grouping to both row and column fields', () => {
      const config: PivotConfig = {
        rowFields: ['hire_date'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('data', config, {
        dateGroupings: {
          hire_date: 'month',
          order_date: 'quarter',
        },
      });
      expect(r.sql).toContain("STRFTIME(\"hire_date\", '%Y-%m')");
      expect(r.sql).toContain('EXTRACT(QUARTER FROM "order_date")');
    });

    it('leaves fields without dateGrouping as plain identifiers', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['order_date'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { order_date: 'year' },
      });
      // region should remain a plain identifier
      expect(r.sql).toContain('GROUP BY "region"');
    });

    it('works without options (backward compatible)', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('"quarter"');
      expect(r.sql).toContain('"region"');
    });
  });

  describe('subtotals via ROLLUP', () => {
    it('uses GROUP BY ROLLUP when showSubtotals is true', () => {
      const config: PivotConfig = {
        rowFields: ['region', 'country'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
        showSubtotals: true,
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('GROUP BY ROLLUP("region", "country")');
    });

    it('uses plain GROUP BY when showSubtotals is false', () => {
      const config: PivotConfig = {
        rowFields: ['region', 'country'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
        showSubtotals: false,
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('GROUP BY "region", "country"');
      expect(r.sql).not.toContain('ROLLUP');
    });

    it('uses plain GROUP BY when showSubtotals is undefined', () => {
      const config: PivotConfig = {
        rowFields: ['region'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
      };
      const r = buildPivotQuery('sales', config);
      expect(r.sql).toContain('GROUP BY "region"');
      expect(r.sql).not.toContain('ROLLUP');
    });

    it('combines ROLLUP with date grouping', () => {
      const config: PivotConfig = {
        rowFields: ['region', 'hire_date'],
        columnFields: ['quarter'],
        valueFields: [{ field: 'revenue', aggregation: 'sum' }],
        showSubtotals: true,
      };
      const r = buildPivotQuery('sales', config, {
        dateGroupings: { hire_date: 'year' },
      });
      expect(r.sql).toContain('ROLLUP');
      expect(r.sql).toContain('"region"');
      expect(r.sql).toContain('CAST(EXTRACT(YEAR FROM "hire_date") AS INTEGER)');
    });
  });
});
