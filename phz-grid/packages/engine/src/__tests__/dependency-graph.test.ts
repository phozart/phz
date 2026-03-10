import { describe, it, expect, beforeEach } from 'vitest';
import { createDependencyGraph, extractDependencies } from '../dependency-graph.js';
import type { DependencyGraph, DependencyNode } from '../dependency-graph.js';
import type { ExpressionNode, DashboardDataModel } from '../expression-types.js';
import { parameterId, calculatedFieldId } from '../expression-types.js';
import { metricId, kpiId } from '../types.js';
import type { MetricDef } from '../metric.js';
import type { KPIDefinition } from '../kpi.js';

describe('extractDependencies', () => {
  it('extracts field references', () => {
    const expr: ExpressionNode = { kind: 'field_ref', fieldName: 'salary' };
    const deps = extractDependencies(expr);
    expect(deps).toEqual([{ id: 'salary', type: 'field' }]);
  });

  it('extracts param references', () => {
    const expr: ExpressionNode = { kind: 'param_ref', parameterId: 'target' };
    const deps = extractDependencies(expr);
    expect(deps).toEqual([{ id: 'target', type: 'parameter' }]);
  });

  it('extracts metric references', () => {
    const expr: ExpressionNode = { kind: 'metric_ref', metricId: 'avg_salary' };
    const deps = extractDependencies(expr);
    expect(deps).toEqual([{ id: 'avg_salary', type: 'metric' }]);
  });

  it('extracts calc field references', () => {
    const expr: ExpressionNode = { kind: 'calc_ref', calculatedFieldId: 'score' };
    const deps = extractDependencies(expr);
    expect(deps).toEqual([{ id: 'score', type: 'calculated_field' }]);
  });

  it('extracts from binary ops', () => {
    const expr: ExpressionNode = {
      kind: 'binary_op',
      operator: '+',
      left: { kind: 'field_ref', fieldName: 'a' },
      right: { kind: 'field_ref', fieldName: 'b' },
    };
    const deps = extractDependencies(expr);
    expect(deps).toHaveLength(2);
    expect(deps).toContainEqual({ id: 'a', type: 'field' });
    expect(deps).toContainEqual({ id: 'b', type: 'field' });
  });

  it('extracts from conditional nodes', () => {
    const expr: ExpressionNode = {
      kind: 'conditional',
      condition: { kind: 'field_ref', fieldName: 'active' },
      thenBranch: { kind: 'field_ref', fieldName: 'salary' },
      elseBranch: { kind: 'literal', value: 0 },
    };
    const deps = extractDependencies(expr);
    expect(deps).toHaveLength(2);
  });

  it('extracts from function calls', () => {
    const expr: ExpressionNode = {
      kind: 'function_call',
      functionName: 'COALESCE',
      args: [
        { kind: 'field_ref', fieldName: 'primary' },
        { kind: 'field_ref', fieldName: 'fallback' },
      ],
    };
    const deps = extractDependencies(expr);
    expect(deps).toHaveLength(2);
  });

  it('extracts from null check', () => {
    const expr: ExpressionNode = {
      kind: 'null_check',
      operand: { kind: 'field_ref', fieldName: 'email' },
      isNull: true,
    };
    const deps = extractDependencies(expr);
    expect(deps).toEqual([{ id: 'email', type: 'field' }]);
  });

  it('returns empty for literals', () => {
    const expr: ExpressionNode = { kind: 'literal', value: 42 };
    expect(extractDependencies(expr)).toEqual([]);
  });
});

describe('createDependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = createDependencyGraph();
  });

  it('adds and retrieves nodes', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    const node = graph.getNode('salary', 'field');
    expect(node).toBeDefined();
    expect(node!.id).toBe('salary');
  });

  it('removes nodes', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    graph.removeNode('salary', 'field');
    expect(graph.getNode('salary', 'field')).toBeUndefined();
  });

  it('returns dependencies', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    graph.addNode({
      id: 'score',
      type: 'calculated_field',
      dependsOn: [{ id: 'salary', type: 'field' }],
    });
    const deps = graph.getDependencies('score', 'calculated_field');
    expect(deps).toEqual([{ id: 'salary', type: 'field' }]);
  });

  it('returns dependents', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    graph.addNode({
      id: 'score',
      type: 'calculated_field',
      dependsOn: [{ id: 'salary', type: 'field' }],
    });
    const dependents = graph.getDependents('salary', 'field');
    expect(dependents).toEqual([{ id: 'score', type: 'calculated_field' }]);
  });

  it('canDelete returns true when no dependents', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    const result = graph.canDelete('salary', 'field');
    expect(result.canDelete).toBe(true);
    expect(result.dependents).toEqual([]);
  });

  it('canDelete returns false with dependents', () => {
    graph.addNode({ id: 'salary', type: 'field', dependsOn: [] });
    graph.addNode({
      id: 'score',
      type: 'calculated_field',
      dependsOn: [{ id: 'salary', type: 'field' }],
    });
    const result = graph.canDelete('salary', 'field');
    expect(result.canDelete).toBe(false);
    expect(result.dependents).toHaveLength(1);
  });

  it('detects cycles', () => {
    graph.addNode({ id: 'a', type: 'calculated_field', dependsOn: [{ id: 'b', type: 'calculated_field' }] });
    graph.addNode({ id: 'b', type: 'calculated_field', dependsOn: [{ id: 'a', type: 'calculated_field' }] });
    const cycles = graph.detectCycles();
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('returns no cycles for acyclic graph', () => {
    graph.addNode({ id: 'x', type: 'field', dependsOn: [] });
    graph.addNode({ id: 'y', type: 'calculated_field', dependsOn: [{ id: 'x', type: 'field' }] });
    const cycles = graph.detectCycles();
    expect(cycles).toEqual([]);
  });

  it('topological sort respects dependencies', () => {
    graph.addNode({ id: 'x', type: 'field', dependsOn: [] });
    graph.addNode({ id: 'y', type: 'calculated_field', dependsOn: [{ id: 'x', type: 'field' }] });
    graph.addNode({ id: 'z', type: 'metric', dependsOn: [{ id: 'y', type: 'calculated_field' }] });
    const sorted = graph.topologicalSort();
    const ids = sorted.map(n => n.id);
    expect(ids.indexOf('x')).toBeLessThan(ids.indexOf('y'));
    expect(ids.indexOf('y')).toBeLessThan(ids.indexOf('z'));
  });

  it('topological sort handles independent nodes', () => {
    graph.addNode({ id: 'a', type: 'field', dependsOn: [] });
    graph.addNode({ id: 'b', type: 'field', dependsOn: [] });
    const sorted = graph.topologicalSort();
    expect(sorted).toHaveLength(2);
  });

  it('clear removes all nodes', () => {
    graph.addNode({ id: 'a', type: 'field', dependsOn: [] });
    graph.clear();
    expect(graph.getNode('a', 'field')).toBeUndefined();
  });
});

describe('buildFromDataModel', () => {
  it('builds graph from a complete data model', () => {
    const graph = createDependencyGraph();
    const model: DashboardDataModel = {
      fields: [
        { name: 'salary', type: 'number' },
        { name: 'rating', type: 'number' },
        { name: 'max_rating', type: 'number' },
      ],
      parameters: [
        { id: parameterId('target'), name: 'Target %', type: 'number', defaultValue: 90 },
      ],
      calculatedFields: [
        {
          id: calculatedFieldId('score'),
          name: 'Performance Score',
          outputType: 'number',
          expression: {
            kind: 'binary_op',
            operator: '*',
            left: {
              kind: 'binary_op',
              operator: '/',
              left: { kind: 'field_ref', fieldName: 'rating' },
              right: { kind: 'field_ref', fieldName: 'max_rating' },
            },
            right: { kind: 'literal', value: 100 },
          },
        },
      ],
    };

    const metrics: MetricDef[] = [
      {
        id: metricId('avg_salary'),
        name: 'Average Salary',
        dataProductId: 'dp1' as any,
        formula: { type: 'simple', field: 'salary', aggregation: 'avg' },
      },
    ];

    const kpis: KPIDefinition[] = [
      {
        id: kpiId('perf_kpi'),
        name: 'Performance',
        target: 90,
        unit: 'percent',
        direction: 'higher_is_better',
        thresholds: { ok: 90, warn: 70 },
        deltaComparison: 'none',
        dimensions: [],
        dataSource: { scoreEndpoint: '/api/score' },
        metricId: metricId('avg_salary'),
        bands: [
          { label: 'Critical', color: '#DC2626', upTo: { type: 'static', value: 70 } },
          { label: 'Warning', color: '#D97706', upTo: { type: 'parameter', parameterId: 'target' } },
          { label: 'On Track', color: '#16A34A', upTo: { type: 'static', value: 100 } },
        ],
      },
    ];

    graph.buildFromDataModel(model, metrics, kpis);

    // Fields should have no dependencies
    expect(graph.getDependencies('salary', 'field')).toEqual([]);

    // Calc field depends on rating and max_rating
    const calcDeps = graph.getDependencies('score', 'calculated_field');
    expect(calcDeps).toContainEqual({ id: 'rating', type: 'field' });
    expect(calcDeps).toContainEqual({ id: 'max_rating', type: 'field' });

    // Metric depends on salary field
    expect(graph.getDependencies('avg_salary', 'metric')).toContainEqual({ id: 'salary', type: 'field' });

    // KPI depends on metric and parameter
    const kpiDeps = graph.getDependencies('perf_kpi', 'kpi');
    expect(kpiDeps).toContainEqual({ id: 'avg_salary', type: 'metric' });
    expect(kpiDeps).toContainEqual({ id: 'target', type: 'parameter' });

    // No cycles in a properly layered model
    expect(graph.detectCycles()).toEqual([]);
  });
});
