/**
 * @phozart/engine — Metric Catalog
 *
 * Metrics are computational definitions used by pivot tables and reports.
 * Distinct from KPIs which have targets/thresholds.
 */
import type { AggregationFunction, FilterOperator } from '@phozart/core';
import type { MetricId, DataProductId, ValidationResult } from './types.js';
import type { DataProductRegistry } from './data-product.js';
import type { ExpressionMetricFormula } from './expression-types.js';
export interface SimpleMetricFormula {
    type: 'simple';
    field: string;
    aggregation: AggregationFunction;
}
export interface ConditionalMetricFormula {
    type: 'conditional';
    field: string;
    condition: {
        field: string;
        operator: FilterOperator;
        value: unknown;
    };
    aggregation: AggregationFunction;
}
export interface CompositeMetricFormula {
    type: 'composite';
    expression: string;
    fields: string[];
}
export type { ExpressionMetricFormula } from './expression-types.js';
export type MetricFormula = SimpleMetricFormula | ConditionalMetricFormula | CompositeMetricFormula | ExpressionMetricFormula;
export interface MetricFormat {
    type: 'number' | 'currency' | 'percent';
    decimals?: number;
    prefix?: string;
    suffix?: string;
}
export interface MetricDef {
    id: MetricId;
    name: string;
    description?: string;
    dataProductId: DataProductId;
    formula: MetricFormula;
    format?: MetricFormat;
}
export interface MetricCatalog {
    register(metric: MetricDef): void;
    get(id: MetricId): MetricDef | undefined;
    list(): MetricDef[];
    listByDataProduct(dataProductId: DataProductId): MetricDef[];
    remove(id: MetricId): void;
    validate(metric: Partial<MetricDef>): ValidationResult;
    evaluate(metric: MetricDef, rows: Record<string, unknown>[], metricValues?: Record<string, number | null>, params?: Record<string, unknown>): number | null;
}
export declare function createMetricCatalog(registry?: DataProductRegistry): MetricCatalog;
//# sourceMappingURL=metric.d.ts.map