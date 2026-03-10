/**
 * Integration test: Full data model pipeline
 *
 * create model → add layers → compute pipeline → verify results
 */

import { describe, it, expect } from 'vitest';
import { createDashboardDataModelStore } from '../dashboard-data-model.js';
import { createMetricCatalog } from '../metric.js';
import { createKPIRegistry } from '../kpi.js';
import { computeStatus } from '../status.js';
import { parameterId, calculatedFieldId } from '../expression-types.js';
import { metricId, kpiId } from '../types.js';
import type { DataModelField, ExpressionNode } from '../expression-types.js';
import { createBIEngine } from '../engine.js';

const fields: DataModelField[] = [
  { name: 'salary', type: 'number' },
  { name: 'rating', type: 'number' },
  { name: 'max_rating', type: 'number' },
  { name: 'department', type: 'string' },
];

const rows = [
  { salary: 50000, rating: 4, max_rating: 5, department: 'Engineering' },
  { salary: 60000, rating: 3, max_rating: 5, department: 'Sales' },
  { salary: 45000, rating: 5, max_rating: 5, department: 'Engineering' },
  { salary: 70000, rating: 2, max_rating: 5, department: 'Sales' },
  { salary: 55000, rating: 4, max_rating: 5, department: 'Engineering' },
];

describe('Data Model Integration', () => {
  it('full pipeline: parameter → calc field → metrics → KPI with bands', () => {
    const store = createDashboardDataModelStore(fields);

    // Layer 2: Parameter
    store.addParameter({
      id: parameterId('target'),
      name: 'Target %',
      type: 'number',
      defaultValue: 90,
    });

    // Layer 3: Calculated Field — performance_score = rating / max_rating * 100
    store.addCalculatedField({
      id: calculatedFieldId('performance_score'),
      name: 'performance_score',
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

    // Compute calculated fields
    store.rebuildGraph();
    const augmentedRows = store.computeCalculatedFields(rows, { target: 90 });

    // Verify calculated field values
    expect(augmentedRows[0].performance_score).toBe(80); // 4/5 * 100
    expect(augmentedRows[1].performance_score).toBe(60); // 3/5 * 100
    expect(augmentedRows[2].performance_score).toBe(100); // 5/5 * 100

    // Layer 4: Metrics
    const catalog = createMetricCatalog();

    catalog.register({
      id: metricId('avg_salary'),
      name: 'Average Salary',
      dataProductId: 'dp1' as any,
      formula: { type: 'simple', field: 'salary', aggregation: 'avg' },
    });

    catalog.register({
      id: metricId('headcount'),
      name: 'Headcount',
      dataProductId: 'dp1' as any,
      formula: { type: 'simple', field: 'salary', aggregation: 'count' },
    });

    catalog.register({
      id: metricId('total_salary'),
      name: 'Total Salary',
      dataProductId: 'dp1' as any,
      formula: { type: 'simple', field: 'salary', aggregation: 'sum' },
    });

    // Composite metric: weighted_avg = @avg_salary * @headcount / @total_salary * 100
    catalog.register({
      id: metricId('weighted_avg'),
      name: 'Weighted Average',
      dataProductId: 'dp1' as any,
      formula: {
        type: 'expression',
        expression: {
          kind: 'binary_op', operator: '*',
          left: {
            kind: 'binary_op', operator: '/',
            left: {
              kind: 'binary_op', operator: '*',
              left: { kind: 'metric_ref', metricId: 'avg_salary' },
              right: { kind: 'metric_ref', metricId: 'headcount' },
            },
            right: { kind: 'metric_ref', metricId: 'total_salary' },
          },
          right: { kind: 'literal', value: 100 },
        },
      },
    });

    store.rebuildGraph(catalog.list());
    const metricValues = store.computeMetrics(augmentedRows, { target: 90 }, catalog);

    expect(metricValues['avg_salary']).toBe(56000); // (50000+60000+45000+70000+55000)/5
    expect(metricValues['headcount']).toBe(5);
    expect(metricValues['total_salary']).toBe(280000);
    // weighted_avg = 56000 * 5 / 280000 * 100 = 100
    expect(metricValues['weighted_avg']).toBe(100);

    // Layer 5: KPI with threshold bands
    const kpiRegistry = createKPIRegistry();
    const perfKpi = {
      id: kpiId('perf_kpi'),
      name: 'Performance',
      target: 90,
      unit: 'percent' as const,
      direction: 'higher_is_better' as const,
      thresholds: { ok: 90, warn: 70 },
      deltaComparison: 'none' as const,
      dimensions: [],
      dataSource: { scoreEndpoint: '/api' },
      metricId: metricId('avg_salary'),
      bands: [
        { label: 'Critical', color: '#DC2626', upTo: { type: 'static' as const, value: 70 } },
        { label: 'Warning', color: '#D97706', upTo: { type: 'parameter' as const, parameterId: 'target' } },
        { label: 'On Track', color: '#16A34A', upTo: { type: 'static' as const, value: 100 } },
      ],
    };
    kpiRegistry.register(perfKpi);

    // Resolve threshold bands
    const resolvedBands = store.resolveThresholdBands(perfKpi, { target: 85 }, metricValues);
    expect(resolvedBands).toHaveLength(3);
    expect(resolvedBands[0].upTo).toBe(70);
    expect(resolvedBands[1].upTo).toBe(85); // from parameter
    expect(resolvedBands[2].upTo).toBe(100);

    // Compute status with bands
    const status = computeStatus(75, perfKpi, { target: 85 }, metricValues);
    expect(status.label).toBe('Warning');
    expect(status.color).toBe('#D97706');

    const critStatus = computeStatus(60, perfKpi, { target: 85 }, metricValues);
    expect(critStatus.label).toBe('Critical');
    expect(critStatus.color).toBe('#DC2626');

    const okStatus = computeStatus(95, perfKpi, { target: 85 }, metricValues);
    expect(okStatus.label).toBe('On Track');
    expect(okStatus.color).toBe('#16A34A');
  });

  it('BIEngine includes dataModel store', () => {
    const engine = createBIEngine({
      initialDataModel: {
        fields: [{ name: 'x', type: 'number' }],
        parameters: [{ id: parameterId('p1'), name: 'P1', type: 'number', defaultValue: 10 }],
        calculatedFields: [],
      },
    });

    expect(engine.dataModel).toBeDefined();
    expect(engine.dataModel.getFields()).toHaveLength(1);
    expect(engine.dataModel.listParameters()).toHaveLength(1);
  });

  it('serialization round-trip preserves all layers', () => {
    const store = createDashboardDataModelStore(fields);

    store.addParameter({
      id: parameterId('threshold'),
      name: 'Threshold',
      type: 'number',
      defaultValue: 50,
    });

    store.addCalculatedField({
      id: calculatedFieldId('doubled'),
      name: 'doubled',
      outputType: 'number',
      expression: {
        kind: 'binary_op', operator: '*',
        left: { kind: 'field_ref', fieldName: 'salary' },
        right: { kind: 'literal', value: 2 },
      },
    });

    const serialized = store.serialize();

    const store2 = createDashboardDataModelStore();
    store2.load(serialized);

    expect(store2.getFields()).toHaveLength(4);
    expect(store2.listParameters()).toHaveLength(1);
    expect(store2.listCalculatedFields()).toHaveLength(1);

    // Compute on restored store
    store2.rebuildGraph();
    const result = store2.computeCalculatedFields(rows, { threshold: 50 });
    expect(result[0].doubled).toBe(100000);
  });

  it('dependency graph prevents deleting referenced entities', () => {
    const store = createDashboardDataModelStore(fields);

    store.addParameter({
      id: parameterId('factor'),
      name: 'Factor',
      type: 'number',
      defaultValue: 2,
    });

    store.addCalculatedField({
      id: calculatedFieldId('adjusted'),
      name: 'adjusted',
      outputType: 'number',
      expression: {
        kind: 'binary_op', operator: '*',
        left: { kind: 'field_ref', fieldName: 'salary' },
        right: { kind: 'param_ref', parameterId: 'factor' },
      },
    });

    store.rebuildGraph();

    // Can't delete parameter that's referenced by calculated field
    const result = store.removeParameter(parameterId('factor'));
    expect(result.removed).toBe(false);
    expect(result.dependents.length).toBeGreaterThan(0);

    // But can delete the calc field first, then the parameter
    const calcResult = store.removeCalculatedField(calculatedFieldId('adjusted'));
    expect(calcResult.removed).toBe(true);

    store.rebuildGraph();
    const paramResult = store.removeParameter(parameterId('factor'));
    expect(paramResult.removed).toBe(true);
  });
});
