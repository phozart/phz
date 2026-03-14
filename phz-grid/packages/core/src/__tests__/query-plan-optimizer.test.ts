import { describe, it, expect } from 'vitest';
import { QueryPlanner, PlanOptimizer } from '../query-planner.js';
import type { PlanContext, PipelineCapabilities } from '../query-planner.js';

describe('PlanOptimizer', () => {
  const optimizer = new PlanOptimizer();
  const planner = new QueryPlanner();

  function createPlan(caps: PipelineCapabilities) {
    return planner.createPlan(caps);
  }

  describe('filter-pushdown hint', () => {
    it('should add filter-pushdown hint when filters are active', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 100, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 3,
        activeSort: false,
        activeGrouping: false,
        pivotActive: false,
        usedFields: [],
        totalFields: 10,
      };
      const optimized = optimizer.optimize(plan, context);
      const hint = optimized.hints.find(h => h.type === 'filter-pushdown');
      expect(hint).toBeDefined();
      if (hint && hint.type === 'filter-pushdown') {
        expect(hint.filterCount).toBe(3);
      }
    });

    it('should not add filter-pushdown hint when no filters', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 100, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 0,
        activeSort: false,
        activeGrouping: false,
        pivotActive: false,
        usedFields: [],
        totalFields: 10,
      };
      const optimized = optimizer.optimize(plan, context);
      expect(optimized.hints.find(h => h.type === 'filter-pushdown')).toBeUndefined();
    });
  });

  describe('projection-pushdown hint', () => {
    it('should add projection-pushdown hint when subset of fields used', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 100, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 0,
        activeSort: false,
        activeGrouping: false,
        pivotActive: true,
        usedFields: ['revenue', 'category', 'region'],
        totalFields: 50,
      };
      const optimized = optimizer.optimize(plan, context);
      const hint = optimized.hints.find(h => h.type === 'projection-pushdown');
      expect(hint).toBeDefined();
      if (hint && hint.type === 'projection-pushdown') {
        expect(hint.fields).toEqual(['revenue', 'category', 'region']);
      }
    });

    it('should not add projection-pushdown hint when all fields used', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 100, enableWorkers: false });
      const fields = ['a', 'b', 'c'];
      const context: PlanContext = {
        activeFilters: 0,
        activeSort: false,
        activeGrouping: false,
        pivotActive: false,
        usedFields: fields,
        totalFields: 3,
      };
      const optimized = optimizer.optimize(plan, context);
      expect(optimized.hints.find(h => h.type === 'projection-pushdown')).toBeUndefined();
    });
  });

  describe('short-circuit hint', () => {
    it('should add short-circuit hint when filter yields 0 rows', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 0, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 2,
        activeSort: true,
        activeGrouping: true,
        pivotActive: true,
        usedFields: [],
        totalFields: 10,
      };
      const optimized = optimizer.optimize(plan, context);
      const hint = optimized.hints.find(h => h.type === 'short-circuit');
      expect(hint).toBeDefined();
    });
  });

  describe('combine-stages hint', () => {
    it('should add combine-stages hint for DuckDB with multiple active stages', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: true, rowCount: 50000, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 2,
        activeSort: true,
        activeGrouping: true,
        pivotActive: false,
        usedFields: [],
        totalFields: 10,
      };
      const optimized = optimizer.optimize(plan, context);
      const hint = optimized.hints.find(h => h.type === 'combine-stages');
      expect(hint).toBeDefined();
      if (hint && hint.type === 'combine-stages') {
        expect(hint.stages).toContain('filter');
        expect(hint.stages).toContain('sort');
        expect(hint.stages).toContain('group');
      }
    });

    it('should not add combine-stages hint for JS engine', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: false, rowCount: 100, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 2,
        activeSort: true,
        activeGrouping: true,
        pivotActive: false,
        usedFields: [],
        totalFields: 10,
      };
      const optimized = optimizer.optimize(plan, context);
      expect(optimized.hints.find(h => h.type === 'combine-stages')).toBeUndefined();
    });
  });

  describe('multiple hints', () => {
    it('should produce multiple hints when applicable', () => {
      const plan = createPlan({ hasAsyncDataSource: false, hasDuckDB: true, rowCount: 50000, enableWorkers: false });
      const context: PlanContext = {
        activeFilters: 3,
        activeSort: true,
        activeGrouping: false,
        pivotActive: true,
        usedFields: ['a', 'b'],
        totalFields: 20,
      };
      const optimized = optimizer.optimize(plan, context);
      expect(optimized.hints.length).toBeGreaterThanOrEqual(2);
    });
  });
});
