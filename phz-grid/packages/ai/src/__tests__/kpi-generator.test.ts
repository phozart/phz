/**
 * @phozart/ai — KPI Generator Tests
 *
 * Tests for generating KPI configs from NL descriptions + schema.
 */

import { describe, it, expect } from 'vitest';
import { generateKPIConfig } from '../kpi-generator.js';
import type { GeneratedKPIConfig, KPIGeneratorSchema } from '../kpi-generator.js';

describe('generateKPIConfig', () => {
  const salesSchema: KPIGeneratorSchema = [
    { name: 'revenue', type: 'number' },
    { name: 'cost', type: 'number' },
    { name: 'quantity', type: 'number' },
    { name: 'region', type: 'string' },
    { name: 'date', type: 'date' },
    { name: 'customer_id', type: 'string' },
  ];

  it('generates a KPI config from "total revenue above $1M"', () => {
    const result = generateKPIConfig('total revenue above $1M', salesSchema);
    expect(result.name).toBeTruthy();
    expect(result.field).toBe('revenue');
    expect(result.aggregation).toBe('sum');
    expect(result.target).toBe(1000000);
    expect(result.direction).toBe('higher_is_better');
    expect(result.unit).toBe('currency');
    expect(result.thresholds).toBeDefined();
    expect(result.thresholds.ok).toBeGreaterThan(0);
    expect(result.thresholds.warn).toBeGreaterThan(0);
  });

  it('matches field by fuzzy name', () => {
    const result = generateKPIConfig('average order value', [
      { name: 'order_value', type: 'number' },
      { name: 'order_date', type: 'date' },
    ]);
    expect(result.field).toBe('order_value');
    expect(result.aggregation).toBe('avg');
  });

  it('generates thresholds based on target and direction', () => {
    const result = generateKPIConfig('total revenue above $1M', salesSchema);
    // higher_is_better: ok threshold should be high, warn lower
    expect(result.thresholds.ok).toBeGreaterThanOrEqual(result.thresholds.warn);
  });

  it('generates thresholds for lower_is_better', () => {
    const result = generateKPIConfig('error rate below 5%', [
      { name: 'error_rate', type: 'number' },
    ]);
    expect(result.direction).toBe('lower_is_better');
    // lower_is_better: ok threshold should be lower than warn
    expect(result.thresholds.ok).toBeLessThanOrEqual(result.thresholds.warn);
  });

  it('generates a KPI ID from the name', () => {
    const result = generateKPIConfig('monthly revenue', salesSchema);
    expect(result.id).toBeTruthy();
    expect(typeof result.id).toBe('string');
    expect(result.id).not.toContain(' ');
  });

  it('sets unit to percent when % is in description', () => {
    const result = generateKPIConfig('conversion rate above 15%', [
      { name: 'conversion_rate', type: 'number' },
    ]);
    expect(result.unit).toBe('percent');
  });

  it('sets unit to count for count aggregation', () => {
    const result = generateKPIConfig('count of orders', [
      { name: 'orders', type: 'number' },
      { name: 'order_id', type: 'string' },
    ]);
    expect(result.unit).toBe('count');
  });

  it('uses first numeric field when no match found', () => {
    const result = generateKPIConfig('total foo', [
      { name: 'sales_amount', type: 'number' },
      { name: 'region', type: 'string' },
    ]);
    expect(result.field).toBe('sales_amount');
  });

  it('sets dataSource with score endpoint', () => {
    const result = generateKPIConfig('total revenue', salesSchema);
    expect(result.dataSource).toBeDefined();
    expect(result.dataSource.scoreEndpoint).toBeTruthy();
  });

  it('sets deltaComparison to previous_period by default', () => {
    const result = generateKPIConfig('total revenue', salesSchema);
    expect(result.deltaComparison).toBe('previous_period');
  });

  it('sets dimensions from schema dimension fields', () => {
    const result = generateKPIConfig('total revenue', salesSchema);
    expect(result.dimensions).toBeDefined();
    expect(Array.isArray(result.dimensions)).toBe(true);
  });

  it('handles description with no matching fields gracefully', () => {
    const result = generateKPIConfig('total xyz', [
      { name: 'abc', type: 'string' },
    ]);
    // Should still produce a result, even if field is empty/fallback
    expect(result.name).toBeTruthy();
    expect(result.aggregation).toBe('sum');
  });
});
