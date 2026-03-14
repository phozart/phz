/**
 * @phozart/ai — Natural Language Parser Tests
 *
 * Tests for parsing KPI descriptions into structured components.
 */

import { describe, it, expect } from 'vitest';
import { parseKPIDescription } from '../nl-parser.js';
import type { ParsedKPIDescription } from '../nl-parser.js';

describe('parseKPIDescription', () => {
  describe('aggregation recognition', () => {
    it('recognizes "total" as sum', () => {
      const result = parseKPIDescription('total revenue');
      expect(result.aggregation).toBe('sum');
      expect(result.fieldHint).toBe('revenue');
    });

    it('recognizes "average" as avg', () => {
      const result = parseKPIDescription('average order value');
      expect(result.aggregation).toBe('avg');
      expect(result.fieldHint).toBe('order value');
    });

    it('recognizes "count" as count', () => {
      const result = parseKPIDescription('count of orders');
      expect(result.aggregation).toBe('count');
      expect(result.fieldHint).toBe('orders');
    });

    it('recognizes "sum" as sum', () => {
      const result = parseKPIDescription('sum of sales');
      expect(result.aggregation).toBe('sum');
      expect(result.fieldHint).toBe('sales');
    });

    it('recognizes "maximum" as max', () => {
      const result = parseKPIDescription('maximum transaction amount');
      expect(result.aggregation).toBe('max');
      expect(result.fieldHint).toBe('transaction amount');
    });

    it('recognizes "minimum" as min', () => {
      const result = parseKPIDescription('minimum response time');
      expect(result.aggregation).toBe('min');
      expect(result.fieldHint).toBe('response time');
    });

    it('defaults to sum when no aggregation word found', () => {
      const result = parseKPIDescription('revenue');
      expect(result.aggregation).toBe('sum');
    });
  });

  describe('comparison recognition', () => {
    it('recognizes "above" with threshold', () => {
      const result = parseKPIDescription('total revenue above 1000000');
      expect(result.comparison).toBe('above');
      expect(result.threshold).toBe(1000000);
    });

    it('recognizes "below" with threshold', () => {
      const result = parseKPIDescription('churn rate below 5%');
      expect(result.comparison).toBe('below');
      expect(result.threshold).toBe(5);
      expect(result.unit).toBe('percent');
    });

    it('recognizes "at least" with threshold', () => {
      const result = parseKPIDescription('at least 100 orders');
      expect(result.comparison).toBe('above');
      expect(result.threshold).toBe(100);
    });

    it('recognizes "no more than" with threshold', () => {
      const result = parseKPIDescription('no more than 50 defects');
      expect(result.comparison).toBe('below');
      expect(result.threshold).toBe(50);
    });

    it('handles dollar amounts', () => {
      const result = parseKPIDescription('monthly revenue above $1M');
      expect(result.threshold).toBe(1000000);
      expect(result.unit).toBe('currency');
    });

    it('handles K suffix', () => {
      const result = parseKPIDescription('total users above 10K');
      expect(result.threshold).toBe(10000);
    });
  });

  describe('period recognition', () => {
    it('recognizes "monthly"', () => {
      const result = parseKPIDescription('monthly revenue');
      expect(result.period).toBe('monthly');
    });

    it('recognizes "daily"', () => {
      const result = parseKPIDescription('daily active users');
      expect(result.period).toBe('daily');
    });

    it('recognizes "weekly"', () => {
      const result = parseKPIDescription('weekly sales');
      expect(result.period).toBe('weekly');
    });

    it('recognizes "quarterly"', () => {
      const result = parseKPIDescription('quarterly earnings');
      expect(result.period).toBe('quarterly');
    });

    it('recognizes "yearly" / "annual"', () => {
      const result = parseKPIDescription('yearly growth rate');
      expect(result.period).toBe('yearly');
      const result2 = parseKPIDescription('annual revenue');
      expect(result2.period).toBe('yearly');
    });

    it('returns undefined period when none specified', () => {
      const result = parseKPIDescription('total revenue');
      expect(result.period).toBeUndefined();
    });
  });

  describe('direction inference', () => {
    it('infers higher_is_better for revenue', () => {
      const result = parseKPIDescription('total revenue above $1M');
      expect(result.direction).toBe('higher_is_better');
    });

    it('infers lower_is_better for "below" comparison', () => {
      const result = parseKPIDescription('error rate below 1%');
      expect(result.direction).toBe('lower_is_better');
    });

    it('infers lower_is_better for cost-like fields', () => {
      const result = parseKPIDescription('total cost');
      expect(result.direction).toBe('lower_is_better');
    });

    it('infers lower_is_better for churn', () => {
      const result = parseKPIDescription('customer churn rate');
      expect(result.direction).toBe('lower_is_better');
    });
  });

  describe('name extraction', () => {
    it('extracts a readable KPI name', () => {
      const result = parseKPIDescription('monthly revenue above $1M');
      expect(result.name).toBeTruthy();
      expect(typeof result.name).toBe('string');
    });

    it('capitalizes the name', () => {
      const result = parseKPIDescription('total revenue');
      expect(result.name[0]).toBe(result.name[0].toUpperCase());
    });
  });

  describe('complex descriptions', () => {
    it('parses "monthly revenue above $1M"', () => {
      const result = parseKPIDescription('monthly revenue above $1M');
      expect(result.aggregation).toBe('sum');
      expect(result.period).toBe('monthly');
      expect(result.comparison).toBe('above');
      expect(result.threshold).toBe(1000000);
      expect(result.unit).toBe('currency');
      expect(result.direction).toBe('higher_is_better');
    });

    it('parses "customer churn rate below 5%"', () => {
      const result = parseKPIDescription('customer churn rate below 5%');
      expect(result.comparison).toBe('below');
      expect(result.threshold).toBe(5);
      expect(result.unit).toBe('percent');
      expect(result.direction).toBe('lower_is_better');
    });

    it('parses "average response time below 200ms"', () => {
      const result = parseKPIDescription('average response time below 200');
      expect(result.aggregation).toBe('avg');
      expect(result.comparison).toBe('below');
      expect(result.threshold).toBe(200);
      expect(result.direction).toBe('lower_is_better');
    });
  });
});
