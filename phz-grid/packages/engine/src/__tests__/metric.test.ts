import { describe, it, expect } from 'vitest';
import { createMetricCatalog } from '../metric.js';
import type { MetricDef } from '../metric.js';
import { metricId, dataProductId } from '../types.js';

const salesRows = [
  { region: 'North', amount: 100, category: 'A' },
  { region: 'South', amount: 200, category: 'B' },
  { region: 'North', amount: 150, category: 'A' },
  { region: 'South', amount: 300, category: 'A' },
];

function makeSimpleMetric(): MetricDef {
  return {
    id: metricId('total-sales'),
    name: 'Total Sales',
    dataProductId: dataProductId('sales'),
    formula: { type: 'simple', field: 'amount', aggregation: 'sum' },
  };
}

function makeConditionalMetric(): MetricDef {
  return {
    id: metricId('north-sales'),
    name: 'North Sales',
    dataProductId: dataProductId('sales'),
    formula: {
      type: 'conditional',
      field: 'amount',
      condition: { field: 'region', operator: 'equals', value: 'North' },
      aggregation: 'sum',
    },
  };
}

describe('MetricCatalog', () => {
  it('registers and retrieves a metric', () => {
    const catalog = createMetricCatalog();
    const metric = makeSimpleMetric();
    catalog.register(metric);
    expect(catalog.get(metricId('total-sales'))).toEqual(metric);
  });

  it('lists all metrics', () => {
    const catalog = createMetricCatalog();
    catalog.register(makeSimpleMetric());
    catalog.register(makeConditionalMetric());
    expect(catalog.list()).toHaveLength(2);
  });

  it('lists by data product', () => {
    const catalog = createMetricCatalog();
    catalog.register(makeSimpleMetric());
    catalog.register({
      id: metricId('other'),
      name: 'Other',
      dataProductId: dataProductId('other'),
      formula: { type: 'simple', field: 'x', aggregation: 'count' },
    });
    expect(catalog.listByDataProduct(dataProductId('sales'))).toHaveLength(1);
  });

  it('removes a metric', () => {
    const catalog = createMetricCatalog();
    catalog.register(makeSimpleMetric());
    catalog.remove(metricId('total-sales'));
    expect(catalog.get(metricId('total-sales'))).toBeUndefined();
  });

  it('validates — missing fields', () => {
    const catalog = createMetricCatalog();
    const result = catalog.validate({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('validates — complete metric passes', () => {
    const catalog = createMetricCatalog();
    const result = catalog.validate(makeSimpleMetric());
    expect(result.valid).toBe(true);
  });
});

describe('MetricCatalog.evaluate', () => {
  it('evaluates simple sum', () => {
    const catalog = createMetricCatalog();
    const result = catalog.evaluate(makeSimpleMetric(), salesRows);
    expect(result).toBe(750);
  });

  it('evaluates simple avg', () => {
    const catalog = createMetricCatalog();
    const metric: MetricDef = {
      ...makeSimpleMetric(),
      formula: { type: 'simple', field: 'amount', aggregation: 'avg' },
    };
    expect(catalog.evaluate(metric, salesRows)).toBe(187.5);
  });

  it('evaluates simple count', () => {
    const catalog = createMetricCatalog();
    const metric: MetricDef = {
      ...makeSimpleMetric(),
      formula: { type: 'simple', field: 'amount', aggregation: 'count' },
    };
    expect(catalog.evaluate(metric, salesRows)).toBe(4);
  });

  it('evaluates conditional metric', () => {
    const catalog = createMetricCatalog();
    const result = catalog.evaluate(makeConditionalMetric(), salesRows);
    expect(result).toBe(250); // North: 100 + 150
  });

  it('returns null for empty rows', () => {
    const catalog = createMetricCatalog();
    expect(catalog.evaluate(makeSimpleMetric(), [])).toBe(null);
  });

  it('evaluates composite metric combining two base metrics', () => {
    const catalog = createMetricCatalog();

    const totalSales: MetricDef = {
      id: metricId('total-sales'),
      name: 'Total Sales',
      dataProductId: dataProductId('sales'),
      formula: { type: 'simple', field: 'amount', aggregation: 'sum' },
    };

    const totalCount: MetricDef = {
      id: metricId('total-count'),
      name: 'Total Count',
      dataProductId: dataProductId('sales'),
      formula: { type: 'simple', field: 'amount', aggregation: 'count' },
    };

    const avgSales: MetricDef = {
      id: metricId('avg-sales'),
      name: 'Average Sales',
      dataProductId: dataProductId('sales'),
      formula: {
        type: 'composite',
        expression: 'total-sales / total-count',
        fields: ['total-sales', 'total-count'],
      },
    };

    catalog.register(totalSales);
    catalog.register(totalCount);
    catalog.register(avgSales);

    // salesRows: amounts = [100, 200, 150, 300] => sum=750, count=4, avg=187.5
    const result = catalog.evaluate(avgSales, salesRows);
    expect(result).toBe(187.5);
  });

  it('evaluates composite metric with multiplication', () => {
    const catalog = createMetricCatalog();

    const totalSales: MetricDef = {
      id: metricId('total-sales'),
      name: 'Total Sales',
      dataProductId: dataProductId('sales'),
      formula: { type: 'simple', field: 'amount', aggregation: 'sum' },
    };

    const markup: MetricDef = {
      id: metricId('markup'),
      name: 'Markup Value',
      dataProductId: dataProductId('sales'),
      formula: {
        type: 'composite',
        expression: 'total-sales * 1.15',
        fields: ['total-sales'],
      },
    };

    catalog.register(totalSales);
    catalog.register(markup);

    // 750 * 1.15 = 862.5
    const result = catalog.evaluate(markup, salesRows);
    expect(result).toBeCloseTo(862.5);
  });

  it('returns null for composite metric with unresolvable dependency', () => {
    const catalog = createMetricCatalog();

    const composite: MetricDef = {
      id: metricId('broken'),
      name: 'Broken',
      dataProductId: dataProductId('sales'),
      formula: {
        type: 'composite',
        expression: 'missing-metric * 2',
        fields: ['missing-metric'],
      },
    };

    catalog.register(composite);
    expect(catalog.evaluate(composite, salesRows)).toBe(null);
  });
});
