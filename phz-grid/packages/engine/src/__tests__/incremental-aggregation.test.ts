import { describe, it, expect, beforeEach } from 'vitest';
import { createIncrementalAggregator, type IncrementalAggregator } from '../incremental-aggregation.js';
import type { AggregationConfig } from '@phozart/core';

describe('IncrementalAggregator', () => {
  let agg: IncrementalAggregator;
  const baseData = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'A', value: 30 },
    { category: 'C', value: 40 },
  ];

  describe('basic aggregations', () => {
    beforeEach(() => {
      agg = createIncrementalAggregator();
    });

    it('should compute sum correctly after initialize', () => {
      const config: AggregationConfig = {
        fields: [{ field: 'value', functions: ['sum'] }],
      };
      agg.initialize(baseData, config);
      const result = agg.getResult();
      expect(result.fieldResults.value.sum).toBe(100);
    });

    it('should compute count correctly', () => {
      const config: AggregationConfig = {
        fields: [{ field: 'value', functions: ['count'] }],
      };
      agg.initialize(baseData, config);
      expect(agg.getResult().fieldResults.value.count).toBe(4);
    });

    it('should compute avg correctly', () => {
      const config: AggregationConfig = {
        fields: [{ field: 'value', functions: ['avg'] }],
      };
      agg.initialize(baseData, config);
      expect(agg.getResult().fieldResults.value.avg).toBe(25);
    });

    it('should compute min/max correctly', () => {
      const config: AggregationConfig = {
        fields: [{ field: 'value', functions: ['min', 'max'] }],
      };
      agg.initialize(baseData, config);
      expect(agg.getResult().fieldResults.value.min).toBe(10);
      expect(agg.getResult().fieldResults.value.max).toBe(40);
    });
  });

  describe('incremental add', () => {
    beforeEach(() => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum', 'count', 'avg', 'min', 'max'] }],
      });
    });

    it('should update sum on addRow', () => {
      agg.addRow({ value: 50 });
      expect(agg.getResult().fieldResults.value.sum).toBe(150);
      expect(agg.getResult().fieldResults.value.count).toBe(5);
      expect(agg.getResult().fieldResults.value.avg).toBe(30);
    });

    it('should update min on addRow with lower value', () => {
      agg.addRow({ value: 5 });
      expect(agg.getResult().fieldResults.value.min).toBe(5);
    });

    it('should update max on addRow with higher value', () => {
      agg.addRow({ value: 50 });
      expect(agg.getResult().fieldResults.value.max).toBe(50);
    });
  });

  describe('incremental remove', () => {
    beforeEach(() => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum', 'count', 'avg', 'min', 'max'] }],
      });
    });

    it('should update sum on removeRow', () => {
      agg.removeRow({ value: 10 });
      expect(agg.getResult().fieldResults.value.sum).toBe(90);
      expect(agg.getResult().fieldResults.value.count).toBe(3);
      expect(agg.getResult().fieldResults.value.avg).toBe(30);
    });

    it('should rescan min when removing current min', () => {
      agg.removeRow({ value: 10 });
      expect(agg.getResult().fieldResults.value.min).toBe(20);
    });

    it('should rescan max when removing current max', () => {
      agg.removeRow({ value: 40 });
      expect(agg.getResult().fieldResults.value.max).toBe(30);
    });
  });

  describe('incremental update', () => {
    it('should handle updateRow correctly', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum'] }],
      });
      agg.updateRow({ value: 10 }, { value: 15 });
      expect(agg.getResult().fieldResults.value.sum).toBe(105);
    });
  });

  describe('Welford variance/stddev', () => {
    it('should compute variance using Welford algorithm', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 2 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 5 }, { v: 5 }, { v: 7 }, { v: 9 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['variance', 'stddev'] }],
      });
      const result = agg.getResult();
      // Sample variance of [2,4,4,4,5,5,7,9] = 4.571
      expect(result.fieldResults.v.variance).toBeCloseTo(4.571, 2);
      expect(result.fieldResults.v.stddev).toBeCloseTo(2.138, 2);
    });

    it('should maintain accuracy after incremental updates', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 10 }, { v: 20 }, { v: 30 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['variance'] }],
      });
      agg.addRow({ v: 40 });
      // Sample variance of [10,20,30,40] = 166.667
      expect(agg.getResult().fieldResults.v.variance).toBeCloseTo(166.667, 1);
    });

    it('should return 0 for single value', () => {
      agg = createIncrementalAggregator();
      agg.initialize([{ v: 5 }], {
        fields: [{ field: 'v', functions: ['variance', 'stddev'] }],
      });
      expect(agg.getResult().fieldResults.v.variance).toBe(0);
      expect(agg.getResult().fieldResults.v.stddev).toBe(0);
    });

    it('should return null for empty data', () => {
      agg = createIncrementalAggregator();
      agg.initialize([], {
        fields: [{ field: 'v', functions: ['variance', 'stddev'] }],
      });
      expect(agg.getResult().fieldResults.v.variance).toBeNull();
      expect(agg.getResult().fieldResults.v.stddev).toBeNull();
    });

    it('should handle variance after removing values', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 40 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['variance'] }],
      });
      agg.removeRow({ v: 40 });
      // Sample variance of [10,20,30] = 100
      expect(agg.getResult().fieldResults.v.variance).toBeCloseTo(100, 1);
    });
  });

  describe('countDistinct', () => {
    it('should compute count of distinct values', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'category', functions: ['countDistinct'] }],
      });
      expect(agg.getResult().fieldResults.category.countDistinct).toBe(3);
    });

    it('should update countDistinct on add/remove', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'category', functions: ['countDistinct'] }],
      });
      agg.addRow({ category: 'D' });
      expect(agg.getResult().fieldResults.category.countDistinct).toBe(4);
      agg.removeRow({ category: 'D' });
      expect(agg.getResult().fieldResults.category.countDistinct).toBe(3);
    });

    it('should not decrement countDistinct below unique count', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'category', functions: ['countDistinct'] }],
      });
      // Remove one of two 'A' rows — countDistinct should stay at 3
      agg.removeRow({ category: 'A' });
      expect(agg.getResult().fieldResults.category.countDistinct).toBe(3);
      // Remove the other 'A' row — now 'A' is gone, countDistinct drops to 2
      agg.removeRow({ category: 'A' });
      expect(agg.getResult().fieldResults.category.countDistinct).toBe(2);
    });
  });

  describe('median', () => {
    it('should compute median for odd count', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 1 }, { v: 3 }, { v: 5 }, { v: 7 }, { v: 9 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['median'] }],
      });
      expect(agg.getResult().fieldResults.v.median).toBe(5);
    });

    it('should compute median for even count', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 40 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['median'] }],
      });
      expect(agg.getResult().fieldResults.v.median).toBe(25);
    });

    it('should update median on addRow', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 1 }, { v: 3 }, { v: 5 }, { v: 7 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['median'] }],
      });
      // median of [1,3,5,7] = (3+5)/2 = 4
      expect(agg.getResult().fieldResults.v.median).toBe(4);
      agg.addRow({ v: 9 });
      // median of [1,3,5,7,9] = 5
      expect(agg.getResult().fieldResults.v.median).toBe(5);
    });

    it('should update median on removeRow', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 1 }, { v: 3 }, { v: 5 }, { v: 7 }, { v: 9 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['median'] }],
      });
      agg.removeRow({ v: 9 });
      // median of [1,3,5,7] = (3+5)/2 = 4
      expect(agg.getResult().fieldResults.v.median).toBe(4);
    });
  });

  describe('first/last', () => {
    it('should track first and last values', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 'alpha' }, { v: 'beta' }, { v: 'gamma' }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['first', 'last'] }],
      });
      expect(agg.getResult().fieldResults.v.first).toBe('alpha');
      expect(agg.getResult().fieldResults.v.last).toBe('gamma');
    });

    it('should update last on addRow', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 'alpha' }, { v: 'beta' }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['first', 'last'] }],
      });
      agg.addRow({ v: 'delta' });
      expect(agg.getResult().fieldResults.v.first).toBe('alpha');
      expect(agg.getResult().fieldResults.v.last).toBe('delta');
    });
  });

  describe('empty data', () => {
    it('should handle empty initial data', () => {
      agg = createIncrementalAggregator();
      agg.initialize([], {
        fields: [{ field: 'value', functions: ['sum', 'count', 'avg'] }],
      });
      expect(agg.getResult().fieldResults.value.sum).toBeNull();
      expect(agg.getResult().fieldResults.value.count).toBe(0);
      expect(agg.getResult().fieldResults.value.avg).toBeNull();
    });

    it('should handle adding to empty aggregator', () => {
      agg = createIncrementalAggregator();
      agg.initialize([], {
        fields: [{ field: 'value', functions: ['sum', 'count', 'min', 'max'] }],
      });
      agg.addRow({ value: 42 });
      expect(agg.getResult().fieldResults.value.sum).toBe(42);
      expect(agg.getResult().fieldResults.value.count).toBe(1);
      expect(agg.getResult().fieldResults.value.min).toBe(42);
      expect(agg.getResult().fieldResults.value.max).toBe(42);
    });
  });

  describe('getRowCount', () => {
    it('should track row count', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum'] }],
      });
      expect(agg.getRowCount()).toBe(4);
      agg.addRow({ value: 50 });
      expect(agg.getRowCount()).toBe(5);
    });

    it('should decrement on removeRow', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum'] }],
      });
      agg.removeRow({ value: 10 });
      expect(agg.getRowCount()).toBe(3);
    });
  });

  describe('multiple fields', () => {
    it('should track aggregations across multiple fields', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [
          { field: 'value', functions: ['sum', 'avg'] },
          { field: 'category', functions: ['countDistinct', 'count'] },
        ],
      });
      const result = agg.getResult();
      expect(result.fieldResults.value.sum).toBe(100);
      expect(result.fieldResults.value.avg).toBe(25);
      expect(result.fieldResults.category.countDistinct).toBe(3);
      expect(result.fieldResults.category.count).toBe(4);
    });
  });

  describe('null/undefined handling', () => {
    it('should skip null values', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 10 }, { v: null }, { v: 20 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['sum', 'count'] }],
      });
      expect(agg.getResult().fieldResults.v.sum).toBe(30);
      expect(agg.getResult().fieldResults.v.count).toBe(2);
    });

    it('should skip undefined values', () => {
      agg = createIncrementalAggregator();
      const data = [{ v: 10 }, {}, { v: 20 }];
      agg.initialize(data, {
        fields: [{ field: 'v', functions: ['sum', 'count'] }],
      });
      expect(agg.getResult().fieldResults.v.sum).toBe(30);
      expect(agg.getResult().fieldResults.v.count).toBe(2);
    });
  });

  describe('re-initialize', () => {
    it('should reset state on re-initialize', () => {
      agg = createIncrementalAggregator();
      agg.initialize(baseData, {
        fields: [{ field: 'value', functions: ['sum'] }],
      });
      expect(agg.getResult().fieldResults.value.sum).toBe(100);

      agg.initialize([{ value: 5 }], {
        fields: [{ field: 'value', functions: ['sum'] }],
      });
      expect(agg.getResult().fieldResults.value.sum).toBe(5);
      expect(agg.getRowCount()).toBe(1);
    });
  });
});
