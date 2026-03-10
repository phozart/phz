import { describe, it, expect, beforeEach } from 'vitest';
import { createDashboardDataModelStore } from '../dashboard-data-model.js';
import type { DashboardDataModelStore } from '../dashboard-data-model.js';
import { parameterId, calculatedFieldId } from '../expression-types.js';
import type { DataModelField, ParameterDef, CalculatedFieldDef, ExpressionNode } from '../expression-types.js';
import { createMetricCatalog } from '../metric.js';
import { metricId } from '../types.js';

const fields: DataModelField[] = [
  { name: 'salary', type: 'number' },
  { name: 'rating', type: 'number' },
  { name: 'max_rating', type: 'number' },
  { name: 'department', type: 'string' },
];

describe('DashboardDataModelStore', () => {
  let store: DashboardDataModelStore;

  beforeEach(() => {
    store = createDashboardDataModelStore(fields);
  });

  it('returns initial fields', () => {
    expect(store.getFields()).toHaveLength(4);
  });

  // --- Parameter CRUD ---

  it('adds and retrieves a parameter', () => {
    const param: ParameterDef = {
      id: parameterId('target'),
      name: 'Target %',
      type: 'number',
      defaultValue: 90,
    };
    store.addParameter(param);
    expect(store.getParameter(parameterId('target'))).toBeDefined();
    expect(store.listParameters()).toHaveLength(1);
  });

  it('throws on duplicate parameter', () => {
    const param: ParameterDef = { id: parameterId('p1'), name: 'P1', type: 'number', defaultValue: 0 };
    store.addParameter(param);
    expect(() => store.addParameter(param)).toThrow('already exists');
  });

  it('updates a parameter', () => {
    store.addParameter({ id: parameterId('p1'), name: 'P1', type: 'number', defaultValue: 0 });
    store.updateParameter(parameterId('p1'), { name: 'Updated', defaultValue: 50 });
    expect(store.getParameter(parameterId('p1'))!.name).toBe('Updated');
    expect(store.getParameter(parameterId('p1'))!.defaultValue).toBe(50);
  });

  it('removes a parameter with no dependents', () => {
    store.addParameter({ id: parameterId('p1'), name: 'P1', type: 'number', defaultValue: 0 });
    const result = store.removeParameter(parameterId('p1'));
    expect(result.removed).toBe(true);
    expect(store.listParameters()).toHaveLength(0);
  });

  // --- Calculated Field CRUD ---

  it('adds and retrieves a calculated field', () => {
    const calc: CalculatedFieldDef = {
      id: calculatedFieldId('score'),
      name: 'Performance Score',
      outputType: 'number',
      expression: {
        kind: 'binary_op', operator: '*',
        left: {
          kind: 'binary_op', operator: '/',
          left: { kind: 'field_ref', fieldName: 'rating' },
          right: { kind: 'field_ref', fieldName: 'max_rating' },
        },
        right: { kind: 'literal', value: 100 },
      },
    };
    store.addCalculatedField(calc);
    expect(store.getCalculatedField(calculatedFieldId('score'))).toBeDefined();
    expect(store.listCalculatedFields()).toHaveLength(1);
  });

  it('throws on duplicate calculated field', () => {
    const calc: CalculatedFieldDef = {
      id: calculatedFieldId('c1'), name: 'C1', outputType: 'number',
      expression: { kind: 'literal', value: 0 },
    };
    store.addCalculatedField(calc);
    expect(() => store.addCalculatedField(calc)).toThrow('already exists');
  });

  it('updates a calculated field', () => {
    store.addCalculatedField({
      id: calculatedFieldId('c1'), name: 'C1', outputType: 'number',
      expression: { kind: 'literal', value: 0 },
    });
    store.updateCalculatedField(calculatedFieldId('c1'), { name: 'Updated' });
    expect(store.getCalculatedField(calculatedFieldId('c1'))!.name).toBe('Updated');
  });

  it('removes a calculated field with no dependents', () => {
    store.addCalculatedField({
      id: calculatedFieldId('c1'), name: 'C1', outputType: 'number',
      expression: { kind: 'literal', value: 0 },
    });
    const result = store.removeCalculatedField(calculatedFieldId('c1'));
    expect(result.removed).toBe(true);
  });

  // --- Computation Pipeline ---

  it('computes calculated fields per row', () => {
    store.addCalculatedField({
      id: calculatedFieldId('score'),
      name: 'score',
      outputType: 'number',
      expression: {
        kind: 'binary_op', operator: '*',
        left: {
          kind: 'binary_op', operator: '/',
          left: { kind: 'field_ref', fieldName: 'rating' },
          right: { kind: 'field_ref', fieldName: 'max_rating' },
        },
        right: { kind: 'literal', value: 100 },
      },
    });

    // Need to rebuild graph manually since fields + calc fields need to be in it
    store.rebuildGraph();

    const rows = [
      { salary: 50000, rating: 4, max_rating: 5, department: 'Eng' },
      { salary: 60000, rating: 3, max_rating: 5, department: 'Sales' },
    ];

    const result = store.computeCalculatedFields(rows, {});
    expect(result[0].score).toBe(80);
    expect(result[1].score).toBe(60);
  });

  it('computes with parameter values', () => {
    store.addParameter({ id: parameterId('multiplier'), name: 'Multiplier', type: 'number', defaultValue: 10 });
    store.addCalculatedField({
      id: calculatedFieldId('adjusted'),
      name: 'adjusted',
      outputType: 'number',
      expression: {
        kind: 'binary_op', operator: '*',
        left: { kind: 'field_ref', fieldName: 'salary' },
        right: { kind: 'param_ref', parameterId: 'multiplier' },
      },
    });
    store.rebuildGraph();

    const rows = [{ salary: 100, rating: 0, max_rating: 0, department: '' }];
    const result = store.computeCalculatedFields(rows, { multiplier: 2 });
    expect(result[0].adjusted).toBe(200);
  });

  it('computes metrics including expression type', () => {
    const catalog = createMetricCatalog();
    catalog.register({
      id: metricId('avg_salary'),
      name: 'Average Salary',
      dataProductId: 'dp1' as any,
      formula: { type: 'simple', field: 'salary', aggregation: 'avg' },
    });
    catalog.register({
      id: metricId('count'),
      name: 'Headcount',
      dataProductId: 'dp1' as any,
      formula: { type: 'simple', field: 'salary', aggregation: 'count' },
    });
    catalog.register({
      id: metricId('weighted'),
      name: 'Weighted',
      dataProductId: 'dp1' as any,
      formula: {
        type: 'expression',
        expression: {
          kind: 'binary_op', operator: '*',
          left: { kind: 'metric_ref', metricId: 'avg_salary' },
          right: { kind: 'metric_ref', metricId: 'count' },
        },
      },
    });

    store.rebuildGraph(catalog.list());

    const rows = [
      { salary: 50000, rating: 4, max_rating: 5, department: 'Eng' },
      { salary: 60000, rating: 3, max_rating: 5, department: 'Sales' },
    ];

    const result = store.computeMetrics(rows, {}, catalog);
    expect(result['avg_salary']).toBe(55000);
    expect(result['count']).toBe(2);
    expect(result['weighted']).toBe(110000);
  });

  it('resolves threshold bands', () => {
    store.addParameter({ id: parameterId('target'), name: 'Target', type: 'number', defaultValue: 90 });

    const kpi = {
      id: 'kpi1' as any,
      name: 'KPI',
      target: 100,
      unit: 'percent' as const,
      direction: 'higher_is_better' as const,
      thresholds: { ok: 90, warn: 70 },
      deltaComparison: 'none' as const,
      dimensions: [],
      dataSource: { scoreEndpoint: '/api' },
      bands: [
        { label: 'Critical', color: '#DC2626', upTo: { type: 'static' as const, value: 70 } },
        { label: 'Warning', color: '#D97706', upTo: { type: 'parameter' as const, parameterId: 'target' } },
        { label: 'On Track', color: '#16A34A', upTo: { type: 'static' as const, value: 100 } },
      ],
    };

    const resolved = store.resolveThresholdBands(kpi, { target: 85 }, {});
    expect(resolved).toHaveLength(3);
    expect(resolved[0].upTo).toBe(70);
    expect(resolved[1].upTo).toBe(85); // resolved from param
    expect(resolved[2].upTo).toBe(100);
  });

  // --- Serialization ---

  it('serializes and loads round-trip', () => {
    store.addParameter({ id: parameterId('p1'), name: 'P1', type: 'number', defaultValue: 0 });
    store.addCalculatedField({
      id: calculatedFieldId('c1'), name: 'C1', outputType: 'number',
      expression: { kind: 'literal', value: 42 },
    });

    const serialized = store.serialize();
    expect(serialized.fields).toHaveLength(4);
    expect(serialized.parameters).toHaveLength(1);
    expect(serialized.calculatedFields).toHaveLength(1);

    const store2 = createDashboardDataModelStore();
    store2.load(serialized);
    expect(store2.getFields()).toHaveLength(4);
    expect(store2.listParameters()).toHaveLength(1);
    expect(store2.listCalculatedFields()).toHaveLength(1);
  });
});
