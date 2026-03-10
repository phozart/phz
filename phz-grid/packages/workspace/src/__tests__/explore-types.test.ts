import { describe, it, expect } from 'vitest';
import {
  exploreToDataQuery,
  type ExploreQuery,
  type ExploreFieldSlot,
  type ExploreValueSlot,
  type ExploreFilterSlot,
} from '../explore-types.js';

describe('ExploreTypes', () => {
  describe('ExploreQuery structure', () => {
    it('constructs a minimal ExploreQuery', () => {
      const query: ExploreQuery = {
        dimensions: [],
        measures: [],
        filters: [],
      };
      expect(query.dimensions).toEqual([]);
      expect(query.measures).toEqual([]);
      expect(query.filters).toEqual([]);
    });

    it('constructs a full ExploreQuery with all slot types', () => {
      const dim: ExploreFieldSlot = { field: 'region', alias: 'Region' };
      const measure: ExploreValueSlot = { field: 'revenue', aggregation: 'sum', alias: 'Total Revenue' };
      const filter: ExploreFilterSlot = { field: 'status', operator: 'eq', value: 'active' };

      const query: ExploreQuery = {
        dimensions: [dim],
        measures: [measure],
        filters: [filter],
        sort: [{ field: 'revenue', direction: 'desc' }],
        limit: 100,
      };

      expect(query.dimensions).toHaveLength(1);
      expect(query.measures).toHaveLength(1);
      expect(query.filters).toHaveLength(1);
      expect(query.sort).toHaveLength(1);
      expect(query.limit).toBe(100);
    });
  });

  describe('exploreToDataQuery', () => {
    it('converts empty ExploreQuery', () => {
      const explore: ExploreQuery = {
        dimensions: [],
        measures: [],
        filters: [],
      };
      const result = exploreToDataQuery(explore);
      expect(result.fields).toEqual([]);
      expect(result.aggregations).toEqual([]);
      expect(result.filters).toEqual([]);
    });

    it('maps dimensions to fields with groupBy', () => {
      const explore: ExploreQuery = {
        dimensions: [
          { field: 'region' },
          { field: 'product', alias: 'Product Name' },
        ],
        measures: [],
        filters: [],
      };
      const result = exploreToDataQuery(explore);
      expect(result.fields).toContain('region');
      expect(result.fields).toContain('product');
      expect(result.groupBy).toEqual(['region', 'product']);
    });

    it('maps measures to aggregations', () => {
      const explore: ExploreQuery = {
        dimensions: [],
        measures: [
          { field: 'revenue', aggregation: 'sum', alias: 'Total' },
          { field: 'orders', aggregation: 'count' },
        ],
        filters: [],
      };
      const result = exploreToDataQuery(explore);
      expect(result.aggregations).toEqual([
        { field: 'revenue', function: 'sum', alias: 'Total' },
        { field: 'orders', function: 'count', alias: undefined },
      ]);
    });

    it('maps all aggregation types', () => {
      const aggregations: ExploreValueSlot['aggregation'][] = [
        'sum', 'avg', 'min', 'max', 'count', 'count_distinct',
      ];

      for (const agg of aggregations) {
        const explore: ExploreQuery = {
          dimensions: [],
          measures: [{ field: 'value', aggregation: agg }],
          filters: [],
        };
        const result = exploreToDataQuery(explore);
        expect(result.aggregations[0].function).toBe(agg);
      }
    });

    it('maps filters', () => {
      const explore: ExploreQuery = {
        dimensions: [],
        measures: [],
        filters: [
          { field: 'status', operator: 'eq', value: 'active' },
          { field: 'amount', operator: 'gt', value: 100 },
        ],
      };
      const result = exploreToDataQuery(explore);
      expect(result.filters).toEqual([
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'amount', operator: 'gt', value: 100 },
      ]);
    });

    it('maps sort and limit', () => {
      const explore: ExploreQuery = {
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
        filters: [],
        sort: [{ field: 'revenue', direction: 'desc' }],
        limit: 50,
      };
      const result = exploreToDataQuery(explore);
      expect(result.sort).toEqual([{ field: 'revenue', direction: 'desc' }]);
      expect(result.limit).toBe(50);
    });

    it('combines dimensions and measure fields', () => {
      const explore: ExploreQuery = {
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'revenue', aggregation: 'sum' }],
        filters: [],
      };
      const result = exploreToDataQuery(explore);
      expect(result.fields).toContain('region');
      expect(result.fields).toContain('revenue');
    });
  });
});
