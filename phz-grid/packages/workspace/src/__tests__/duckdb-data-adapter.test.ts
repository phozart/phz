import { describe, it, expect, vi } from 'vitest';
import {
  buildDataAdapterQuery,
  mapDuckDBTypeToDataType,
  mapColumnSchemaToFieldMetadata,
  inferSemanticHint,
  buildAggregationSelectSQL,
  buildWindowFunctionSQL,
} from '../adapters/duckdb-data-adapter.js';
import type { DataQuery, FieldMetadata, SemanticHint } from '../data-adapter.js';

describe('DuckDB DataAdapter', () => {
  describe('buildDataAdapterQuery', () => {
    it('builds a simple SELECT query', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['region', 'revenue'],
      };
      const result = buildDataAdapterQuery(query);
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('"region"');
      expect(result.sql).toContain('"revenue"');
      expect(result.sql).toContain('"sales"');
      expect(result.params).toEqual([]);
    });

    it('builds query with limit and offset', () => {
      const query: DataQuery = {
        source: 'orders',
        fields: ['id', 'total'],
        limit: 50,
        offset: 100,
      };
      const result = buildDataAdapterQuery(query);
      expect(result.sql).toContain('LIMIT ?');
      expect(result.sql).toContain('OFFSET ?');
      expect(result.params).toContain(50);
      expect(result.params).toContain(100);
    });

    it('builds query with sort', () => {
      const query: DataQuery = {
        source: 'products',
        fields: ['name', 'price'],
        sort: [
          { field: 'price', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      };
      const result = buildDataAdapterQuery(query);
      expect(result.sql).toContain('ORDER BY');
      expect(result.sql).toContain('"price" DESC');
      expect(result.sql).toContain('"name" ASC');
    });

    it('builds query with groupBy and aggregations', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['region'],
        groupBy: ['region'],
        aggregations: [
          { field: 'revenue', function: 'sum', alias: 'total_revenue' },
          { field: 'orders', function: 'count' },
        ],
      };
      const result = buildDataAdapterQuery(query);
      expect(result.sql).toContain('GROUP BY');
      expect(result.sql).toContain('SUM("revenue")');
      expect(result.sql).toContain('"total_revenue"');
      expect(result.sql).toContain('COUNT("orders")');
    });

    it('supports all aggregation functions', () => {
      const fns = ['sum', 'avg', 'count', 'countDistinct', 'min', 'max', 'median', 'stddev', 'variance', 'first', 'last'] as const;
      for (const fn of fns) {
        const query: DataQuery = {
          source: 'test',
          fields: ['x'],
          aggregations: [{ field: 'x', function: fn }],
        };
        const result = buildDataAdapterQuery(query);
        expect(result.sql).toContain('SELECT');
      }
    });

    it('builds query with window functions', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['date', 'revenue'],
        windows: [{
          field: 'revenue',
          function: 'runningTotal',
          orderBy: ['date'],
          alias: 'running_revenue',
        }],
      };
      const result = buildDataAdapterQuery(query);
      expect(result.sql).toContain('"running_revenue"');
    });

    it('sanitizes identifiers to prevent injection', () => {
      const query: DataQuery = {
        source: 'my; DROP TABLE--data',
        fields: ['field; DROP TABLE--'],
      };
      const result = buildDataAdapterQuery(query);
      // Semicolons and dashes are stripped (replaced with underscores)
      expect(result.sql).not.toContain(';');
      expect(result.sql).not.toContain('--');
      // The remaining alpha chars are safe inside quoted identifiers
      expect(result.sql).toContain('"my__DROP_TABLE__data"');
    });

    it('builds query with pivotBy', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['region', 'quarter', 'revenue'],
        groupBy: ['region', 'quarter'],
        aggregations: [{ field: 'revenue', function: 'sum' }],
        pivotBy: [{ field: 'quarter' }],
      };
      const result = buildDataAdapterQuery(query);
      // Pivot is handled as a wrapper CTE or subquery
      expect(result.sql).toContain('SELECT');
    });
  });

  describe('mapDuckDBTypeToDataType', () => {
    it('maps VARCHAR to string', () => {
      expect(mapDuckDBTypeToDataType('VARCHAR')).toBe('string');
    });

    it('maps TEXT to string', () => {
      expect(mapDuckDBTypeToDataType('TEXT')).toBe('string');
    });

    it('maps INTEGER to number', () => {
      expect(mapDuckDBTypeToDataType('INTEGER')).toBe('number');
    });

    it('maps BIGINT to number', () => {
      expect(mapDuckDBTypeToDataType('BIGINT')).toBe('number');
    });

    it('maps DOUBLE to number', () => {
      expect(mapDuckDBTypeToDataType('DOUBLE')).toBe('number');
    });

    it('maps FLOAT to number', () => {
      expect(mapDuckDBTypeToDataType('FLOAT')).toBe('number');
    });

    it('maps DECIMAL to number', () => {
      expect(mapDuckDBTypeToDataType('DECIMAL(10,2)')).toBe('number');
    });

    it('maps BOOLEAN to boolean', () => {
      expect(mapDuckDBTypeToDataType('BOOLEAN')).toBe('boolean');
    });

    it('maps DATE to date', () => {
      expect(mapDuckDBTypeToDataType('DATE')).toBe('date');
    });

    it('maps TIMESTAMP to date', () => {
      expect(mapDuckDBTypeToDataType('TIMESTAMP')).toBe('date');
    });

    it('maps TIMESTAMP WITH TIME ZONE to date', () => {
      expect(mapDuckDBTypeToDataType('TIMESTAMP WITH TIME ZONE')).toBe('date');
    });

    it('defaults unknown types to string', () => {
      expect(mapDuckDBTypeToDataType('BLOB')).toBe('string');
      expect(mapDuckDBTypeToDataType('STRUCT')).toBe('string');
    });
  });

  describe('mapColumnSchemaToFieldMetadata', () => {
    it('maps a basic column', () => {
      const result = mapColumnSchemaToFieldMetadata({
        name: 'revenue',
        type: 'DOUBLE',
        nullable: false,
      });
      expect(result.name).toBe('revenue');
      expect(result.dataType).toBe('number');
      expect(result.nullable).toBe(false);
    });

    it('infers semantic hint for known field names', () => {
      const result = mapColumnSchemaToFieldMetadata({
        name: 'created_at',
        type: 'TIMESTAMP',
        nullable: true,
      });
      expect(result.dataType).toBe('date');
      expect(result.semanticHint).toBe('timestamp');
    });
  });

  describe('inferSemanticHint', () => {
    it('returns timestamp for date-like fields', () => {
      expect(inferSemanticHint('created_at', 'date')).toBe('timestamp');
      expect(inferSemanticHint('order_date', 'date')).toBe('timestamp');
      expect(inferSemanticHint('updated_at', 'date')).toBe('timestamp');
    });

    it('returns identifier for id fields', () => {
      expect(inferSemanticHint('user_id', 'number')).toBe('identifier');
      expect(inferSemanticHint('id', 'number')).toBe('identifier');
      expect(inferSemanticHint('order_id', 'string')).toBe('identifier');
    });

    it('returns measure for numeric non-id fields', () => {
      expect(inferSemanticHint('revenue', 'number')).toBe('measure');
      expect(inferSemanticHint('quantity', 'number')).toBe('measure');
      expect(inferSemanticHint('score', 'number')).toBe('measure');
    });

    it('returns currency for price/cost fields', () => {
      expect(inferSemanticHint('unit_price', 'number')).toBe('currency');
      expect(inferSemanticHint('total_cost', 'number')).toBe('currency');
    });

    it('returns percentage for pct/rate fields', () => {
      expect(inferSemanticHint('conversion_rate', 'number')).toBe('percentage');
      expect(inferSemanticHint('discount_pct', 'number')).toBe('percentage');
    });

    it('returns dimension for string fields', () => {
      expect(inferSemanticHint('region', 'string')).toBe('dimension');
      expect(inferSemanticHint('category', 'string')).toBe('category');
    });

    it('returns category for enum-like fields', () => {
      expect(inferSemanticHint('status', 'string')).toBe('category');
      expect(inferSemanticHint('type', 'string')).toBe('category');
    });

    it('returns undefined for boolean fields', () => {
      expect(inferSemanticHint('is_active', 'boolean')).toBeUndefined();
    });
  });

  describe('buildAggregationSelectSQL', () => {
    it('builds SUM', () => {
      const sql = buildAggregationSelectSQL('revenue', 'sum', 'total');
      expect(sql).toBe('SUM("revenue") AS "total"');
    });

    it('builds AVG', () => {
      const sql = buildAggregationSelectSQL('score', 'avg');
      expect(sql).toContain('AVG("score")');
    });

    it('builds COUNT', () => {
      expect(buildAggregationSelectSQL('id', 'count')).toContain('COUNT("id")');
    });

    it('builds COUNT(DISTINCT)', () => {
      expect(buildAggregationSelectSQL('user', 'countDistinct')).toContain('COUNT(DISTINCT "user")');
    });

    it('builds MEDIAN', () => {
      expect(buildAggregationSelectSQL('val', 'median')).toContain('MEDIAN("val")');
    });

    it('builds STDDEV', () => {
      expect(buildAggregationSelectSQL('val', 'stddev')).toContain('STDDEV("val")');
    });

    it('builds VARIANCE', () => {
      expect(buildAggregationSelectSQL('val', 'variance')).toContain('VARIANCE("val")');
    });

    it('builds FIRST', () => {
      expect(buildAggregationSelectSQL('val', 'first')).toContain('FIRST("val")');
    });

    it('builds LAST', () => {
      expect(buildAggregationSelectSQL('val', 'last')).toContain('LAST("val")');
    });

    it('auto-generates alias when not provided', () => {
      const sql = buildAggregationSelectSQL('revenue', 'sum');
      expect(sql).toContain('"revenue_sum"');
    });
  });

  describe('buildWindowFunctionSQL', () => {
    it('builds running total', () => {
      const sql = buildWindowFunctionSQL({
        field: 'revenue',
        function: 'runningTotal',
        orderBy: ['date'],
        alias: 'running',
      });
      expect(sql).toContain('SUM("revenue")');
      expect(sql).toContain('OVER');
      expect(sql).toContain('ORDER BY');
      expect(sql).toContain('"running"');
    });

    it('builds rank', () => {
      const sql = buildWindowFunctionSQL({
        field: 'score',
        function: 'rank',
        orderBy: ['score'],
        alias: 'rank_col',
      });
      expect(sql).toContain('RANK()');
      expect(sql).toContain('OVER');
    });

    it('builds dense rank', () => {
      const sql = buildWindowFunctionSQL({
        field: 'score',
        function: 'denseRank',
        orderBy: ['score'],
        alias: 'dense_rank_col',
      });
      expect(sql).toContain('DENSE_RANK()');
    });

    it('builds row number', () => {
      const sql = buildWindowFunctionSQL({
        field: 'id',
        function: 'rowNumber',
        orderBy: ['id'],
        alias: 'rn',
      });
      expect(sql).toContain('ROW_NUMBER()');
    });

    it('builds lag', () => {
      const sql = buildWindowFunctionSQL({
        field: 'revenue',
        function: 'lag',
        orderBy: ['date'],
        alias: 'prev_rev',
        offset: 1,
      });
      expect(sql).toContain('LAG("revenue"');
    });

    it('builds lead', () => {
      const sql = buildWindowFunctionSQL({
        field: 'revenue',
        function: 'lead',
        orderBy: ['date'],
        alias: 'next_rev',
        offset: 2,
      });
      expect(sql).toContain('LEAD("revenue"');
    });

    it('builds percent of total', () => {
      const sql = buildWindowFunctionSQL({
        field: 'revenue',
        function: 'percentOfTotal',
        alias: 'pct',
      });
      expect(sql).toContain('SUM("revenue")');
      expect(sql).toContain('OVER');
    });

    it('includes partition by when specified', () => {
      const sql = buildWindowFunctionSQL({
        field: 'revenue',
        function: 'runningTotal',
        partitionBy: ['region'],
        orderBy: ['date'],
        alias: 'running',
      });
      expect(sql).toContain('PARTITION BY "region"');
    });
  });
});
