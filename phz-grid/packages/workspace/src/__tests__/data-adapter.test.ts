import { describe, it, expect } from 'vitest';
import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
  FieldMetadata,
  ColumnDescriptor,
  AggregationSpec,
  AggregationFunction,
  WindowSpec,
  WindowFunction,
  SemanticHint,
  UnitSpec,
  DataQualityInfo,
  DataQualityIssue,
} from '../data-adapter.js';
import { computeFreshnessStatus } from '../data-adapter.js';

describe('DataAdapter types', () => {
  describe('FieldMetadata', () => {
    it('creates a minimal field metadata', () => {
      const field: FieldMetadata = {
        name: 'revenue',
        dataType: 'number',
        nullable: false,
      };
      expect(field.name).toBe('revenue');
      expect(field.dataType).toBe('number');
      expect(field.nullable).toBe(false);
      expect(field.cardinality).toBeUndefined();
      expect(field.semanticHint).toBeUndefined();
    });

    it('includes optional semantic hint and unit', () => {
      const field: FieldMetadata = {
        name: 'price',
        dataType: 'number',
        nullable: false,
        cardinality: 'high',
        semanticHint: 'currency',
        unit: { type: 'currency', currencyCode: 'USD', decimalPlaces: 2 },
      };
      expect(field.semanticHint).toBe('currency');
      expect(field.unit?.currencyCode).toBe('USD');
      expect(field.cardinality).toBe('high');
    });
  });

  describe('SemanticHint', () => {
    it('covers all semantic hint values', () => {
      const hints: SemanticHint[] = [
        'measure', 'dimension', 'identifier', 'timestamp',
        'category', 'currency', 'percentage',
      ];
      expect(hints).toHaveLength(7);
    });
  });

  describe('UnitSpec', () => {
    it('creates a currency unit', () => {
      const unit: UnitSpec = { type: 'currency', currencyCode: 'EUR', decimalPlaces: 2 };
      expect(unit.type).toBe('currency');
      expect(unit.currencyCode).toBe('EUR');
    });

    it('creates a duration unit', () => {
      const unit: UnitSpec = { type: 'duration', durationUnit: 'hours', suffix: 'h' };
      expect(unit.type).toBe('duration');
      expect(unit.durationUnit).toBe('hours');
    });

    it('creates a percent unit with abbreviation', () => {
      const unit: UnitSpec = { type: 'percent', decimalPlaces: 1, abbreviate: true };
      expect(unit.abbreviate).toBe(true);
    });

    it('creates a custom unit with suffix and sign', () => {
      const unit: UnitSpec = { type: 'custom', suffix: ' kg', showSign: true };
      expect(unit.suffix).toBe(' kg');
      expect(unit.showSign).toBe(true);
    });
  });

  describe('DataSourceSchema', () => {
    it('creates a schema with fields', () => {
      const schema: DataSourceSchema = {
        id: 'sales',
        name: 'Sales Data',
        fields: [
          { name: 'amount', dataType: 'number', nullable: false, semanticHint: 'measure' },
          { name: 'region', dataType: 'string', nullable: false, semanticHint: 'dimension' },
        ],
      };
      expect(schema.fields).toHaveLength(2);
      expect(schema.timeIntelligence).toBeUndefined();
    });
  });

  describe('DataSourceSummary', () => {
    it('creates a summary', () => {
      const summary: DataSourceSummary = {
        id: 'ds1',
        name: 'Orders',
        fieldCount: 12,
        rowCount: 50000,
      };
      expect(summary.fieldCount).toBe(12);
      expect(summary.rowCount).toBe(50000);
    });

    it('allows optional rowCount', () => {
      const summary: DataSourceSummary = {
        id: 'ds2',
        name: 'Streaming',
        fieldCount: 5,
      };
      expect(summary.rowCount).toBeUndefined();
    });
  });

  describe('AggregationSpec', () => {
    it('covers all aggregation functions', () => {
      const fns: AggregationFunction[] = [
        'sum', 'avg', 'count', 'countDistinct', 'min', 'max',
        'median', 'stddev', 'variance', 'first', 'last',
      ];
      expect(fns).toHaveLength(11);
    });

    it('creates an aggregation spec', () => {
      const spec: AggregationSpec = {
        field: 'revenue',
        function: 'sum',
        alias: 'total_revenue',
      };
      expect(spec.alias).toBe('total_revenue');
    });
  });

  describe('WindowSpec', () => {
    it('covers all window functions', () => {
      const fns: WindowFunction[] = [
        'runningTotal', 'rank', 'denseRank', 'rowNumber',
        'lag', 'lead', 'percentOfTotal', 'periodOverPeriod',
      ];
      expect(fns).toHaveLength(8);
    });

    it('creates a window spec with partition and order', () => {
      const spec: WindowSpec = {
        field: 'revenue',
        function: 'runningTotal',
        partitionBy: ['region'],
        orderBy: ['date'],
        alias: 'running_revenue',
      };
      expect(spec.partitionBy).toEqual(['region']);
    });

    it('creates a period-over-period window', () => {
      const spec: WindowSpec = {
        field: 'revenue',
        function: 'periodOverPeriod',
        alias: 'revenue_mom',
        periodField: 'order_date',
        periodGranularity: 'month',
      };
      expect(spec.periodField).toBe('order_date');
    });
  });

  describe('ColumnDescriptor', () => {
    it('creates a column descriptor', () => {
      const col: ColumnDescriptor = { name: 'id', dataType: 'integer' };
      expect(col.name).toBe('id');
    });
  });

  describe('DataQuery', () => {
    it('creates a minimal query', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['region', 'revenue'],
      };
      expect(query.source).toBe('sales');
      expect(query.fields).toHaveLength(2);
    });

    it('creates a full query with aggregations and windows', () => {
      const query: DataQuery = {
        source: 'sales',
        fields: ['region'],
        filters: { region: 'US' },
        groupBy: ['region'],
        sort: [{ field: 'revenue', direction: 'desc' }],
        limit: 100,
        offset: 0,
        aggregations: [{ field: 'revenue', function: 'sum', alias: 'total' }],
        pivotBy: [{ field: 'quarter' }],
        windows: [{
          field: 'revenue',
          function: 'runningTotal',
          alias: 'running',
          orderBy: ['date'],
        }],
      };
      expect(query.aggregations).toHaveLength(1);
      expect(query.windows).toHaveLength(1);
      expect(query.pivotBy).toHaveLength(1);
    });
  });

  describe('DataResult', () => {
    it('creates a data result', () => {
      const result: DataResult = {
        columns: [
          { name: 'region', dataType: 'string' },
          { name: 'revenue', dataType: 'number' },
        ],
        rows: [
          ['US', 1000],
          ['EU', 2000],
        ],
        metadata: {
          totalRows: 2,
          truncated: false,
          queryTimeMs: 15,
        },
      };
      expect(result.rows).toHaveLength(2);
      expect(result.metadata.truncated).toBe(false);
    });

    it('includes data quality info in metadata', () => {
      const result: DataResult = {
        columns: [{ name: 'x', dataType: 'number' }],
        rows: [[1]],
        metadata: {
          totalRows: 1,
          truncated: false,
          queryTimeMs: 5,
          quality: {
            freshnessStatus: 'fresh',
            completeness: 0.98,
            issues: [],
          },
        },
      };
      expect(result.metadata.quality?.freshnessStatus).toBe('fresh');
    });
  });

  describe('DataAdapter interface conformance', () => {
    it('validates a mock adapter satisfies the interface', async () => {
      const mockAdapter: DataAdapter = {
        execute: async (_query: DataQuery) => ({
          columns: [],
          rows: [],
          metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
        }),
        getSchema: async () => ({
          id: 'test',
          name: 'Test',
          fields: [],
        }),
        listDataSources: async () => [],
        getDistinctValues: async () => ({
          values: [],
          totalCount: 0,
          truncated: false,
        }),
        getFieldStats: async () => ({
          distinctCount: 0,
          nullCount: 0,
          totalCount: 0,
        }),
      };

      const result = await mockAdapter.execute({ source: 'test', fields: ['a'] });
      expect(result.metadata.totalRows).toBe(0);

      const schema = await mockAdapter.getSchema('test');
      expect(schema.name).toBe('Test');

      const sources = await mockAdapter.listDataSources();
      expect(sources).toEqual([]);

      const distinct = await mockAdapter.getDistinctValues('ds', 'field');
      expect(distinct.truncated).toBe(false);

      const stats = await mockAdapter.getFieldStats('ds', 'field');
      expect(stats.distinctCount).toBe(0);
    });

    it('supports AbortSignal in execute context', async () => {
      const controller = new AbortController();
      const mockAdapter: DataAdapter = {
        execute: async (_query, context) => {
          expect(context?.signal).toBe(controller.signal);
          return {
            columns: [],
            rows: [],
            metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 },
          };
        },
        getSchema: async () => ({ id: 'x', name: 'x', fields: [] }),
        listDataSources: async () => [],
        getDistinctValues: async () => ({ values: [], totalCount: 0, truncated: false }),
        getFieldStats: async () => ({ distinctCount: 0, nullCount: 0, totalCount: 0 }),
      };

      await mockAdapter.execute(
        { source: 'test', fields: [] },
        { signal: controller.signal },
      );
    });
  });
});
