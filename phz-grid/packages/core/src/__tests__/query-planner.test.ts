/**
 * TDD RED — Async Pipeline with Execution Engine (Item 6.7)
 *
 * Tests for QueryPlanner: generates query plans that route pipeline stages
 * to the appropriate execution engine (JS main thread, DuckDB, Server).
 */
import { describe, it, expect, vi } from 'vitest';
import {
  QueryPlanner,
  type QueryPlan,
  type PipelineCapabilities,
  type QueryPlanStage,
} from '../query-planner.js';

describe('QueryPlanner', () => {
  const defaultCaps: PipelineCapabilities = {
    hasAsyncDataSource: false,
    hasDuckDB: false,
    rowCount: 100,
    enableWorkers: false,
  };

  it('creates a JS-only plan for small datasets', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan(defaultCaps);
    expect(plan.engine).toBe('js');
    expect(plan.stages).toContain('filter');
    expect(plan.stages).toContain('sort');
    expect(plan.stages).toContain('group');
    expect(plan.cancellable).toBe(true);
  });

  it('routes to DuckDB for large datasets when available', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasDuckDB: true,
      rowCount: 50_000,
    });
    expect(plan.engine).toBe('duckdb');
  });

  it('routes to server for async data sources', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasAsyncDataSource: true,
    });
    expect(plan.engine).toBe('server');
  });

  it('prefers server over DuckDB when async source is present', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasAsyncDataSource: true,
      hasDuckDB: true,
      rowCount: 50_000,
    });
    expect(plan.engine).toBe('server');
  });

  it('JS plan includes all stages in order', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan(defaultCaps);
    const idx = (stage: QueryPlanStage) => plan.stages.indexOf(stage);
    expect(idx('filter')).toBeLessThan(idx('sort'));
    expect(idx('sort')).toBeLessThan(idx('group'));
    expect(idx('group')).toBeLessThan(idx('flatten'));
    expect(idx('flatten')).toBeLessThan(idx('virtualize'));
  });

  it('DuckDB plan skips virtualize (client-side only)', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasDuckDB: true,
      rowCount: 50_000,
    });
    // DuckDB handles filter/sort/group server-side
    // virtualize still happens client-side after data arrives
    expect(plan.stages).toContain('filter');
    expect(plan.stages).toContain('sort');
  });

  it('custom threshold overrides default', () => {
    const planner = new QueryPlanner({ duckdbThreshold: 500 });
    const plan = planner.createPlan({
      ...defaultCaps,
      hasDuckDB: true,
      rowCount: 600,
    });
    expect(plan.engine).toBe('duckdb');
  });

  it('falls back to JS when DuckDB available but below threshold', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasDuckDB: true,
      rowCount: 100,
    });
    expect(plan.engine).toBe('js');
  });

  it('plan includes metadata', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan(defaultCaps);
    expect(plan.rowCount).toBe(100);
    expect(typeof plan.createdAt).toBe('number');
  });
});

describe('QueryPlanner — worker engine selection', () => {
  const defaultCaps: PipelineCapabilities = {
    hasAsyncDataSource: false,
    hasDuckDB: false,
    rowCount: 100,
    enableWorkers: false,
  };

  it('selects worker engine when enableWorkers=true and rowCount >= workerThreshold', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: true,
      rowCount: 5_000,
    });
    expect(plan.engine).toBe('worker');
  });

  it('falls through to JS when enableWorkers=false', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: false,
      rowCount: 8_000,
    });
    expect(plan.engine).toBe('js');
  });

  it('prefers DuckDB over worker when hasDuckDB=true and above duckdb threshold', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: true,
      hasDuckDB: true,
      rowCount: 50_000,
    });
    expect(plan.engine).toBe('duckdb');
  });

  it('does not select worker when hasDuckDB=true (even below duckdb threshold)', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: true,
      hasDuckDB: true,
      rowCount: 6_000,
    });
    // hasDuckDB is true but below duckdbThreshold (10k), and worker check
    // requires !hasDuckDB, so falls to JS
    expect(plan.engine).toBe('js');
  });

  it('respects custom workerThreshold', () => {
    const planner = new QueryPlanner({ workerThreshold: 1_000 });
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: true,
      rowCount: 1_500,
    });
    expect(plan.engine).toBe('worker');
  });

  it('falls through to JS when below custom workerThreshold', () => {
    const planner = new QueryPlanner({ workerThreshold: 10_000 });
    const plan = planner.createPlan({
      ...defaultCaps,
      enableWorkers: true,
      rowCount: 5_000,
    });
    expect(plan.engine).toBe('js');
  });

  it('prefers server over worker when async data source is present', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      ...defaultCaps,
      hasAsyncDataSource: true,
      enableWorkers: true,
      rowCount: 8_000,
    });
    expect(plan.engine).toBe('server');
  });
});

describe('QueryPlanner — plan execution contract', () => {
  it('createPlan returns a cancellable plan', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      hasAsyncDataSource: false,
      hasDuckDB: false,
      rowCount: 100,
      enableWorkers: false,
    });
    expect(plan.cancellable).toBe(true);
    expect(plan.engine).toBeDefined();
    expect(plan.stages.length).toBeGreaterThan(0);
  });

  it('server plan has debounce hint', () => {
    const planner = new QueryPlanner();
    const plan = planner.createPlan({
      hasAsyncDataSource: true,
      hasDuckDB: false,
      rowCount: 0,
      enableWorkers: false,
    });
    expect(plan.engine).toBe('server');
    expect(plan.debounceMs).toBeGreaterThan(0);
  });
});
