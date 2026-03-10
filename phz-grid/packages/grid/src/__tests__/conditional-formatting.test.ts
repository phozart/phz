/**
 * @phozart/phz-grid — Conditional Formatting Engine Tests
 */
import { describe, it, expect } from 'vitest';
import {
  createConditionalFormattingEngine,
  createThresholdRule,
  createHighlightAboveTarget,
  createHighlightBelowTarget,
  createColorScaleRule,
} from '../features/conditional-formatting.js';
import type { ConditionalFormattingRule, ColumnDefinition, RowData } from '@phozart/phz-core';

function makeRule(overrides: Partial<ConditionalFormattingRule> = {}): ConditionalFormattingRule {
  return {
    id: 'rule-1',
    type: 'cell',
    field: 'score',
    condition: { operator: 'greaterThan', value: 80 },
    style: { backgroundColor: '#22C55E' },
    priority: 50,
    ...overrides,
  };
}

describe('ConditionalFormattingEngine', () => {
  it('adds and retrieves rules', () => {
    const engine = createConditionalFormattingEngine();
    engine.addRule(makeRule({ id: 'r1', priority: 10 }));
    engine.addRule(makeRule({ id: 'r2', priority: 5 }));
    const rules = engine.getRules();
    expect(rules).toHaveLength(2);
    // Should be sorted by priority
    expect(rules[0].id).toBe('r2');
    expect(rules[1].id).toBe('r1');
  });

  it('removes a rule by id', () => {
    const engine = createConditionalFormattingEngine();
    engine.addRule(makeRule({ id: 'r1' }));
    engine.addRule(makeRule({ id: 'r2' }));
    engine.removeRule('r1');
    expect(engine.getRules()).toHaveLength(1);
    expect(engine.getRules()[0].id).toBe('r2');
  });

  it('clears all rules', () => {
    const engine = createConditionalFormattingEngine();
    engine.addRule(makeRule({ id: 'r1' }));
    engine.addRule(makeRule({ id: 'r2' }));
    engine.clearRules();
    expect(engine.getRules()).toHaveLength(0);
  });

  describe('evaluate — condition matching', () => {
    it('matches greaterThan', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'greaterThan', value: 80 } }));
      expect(engine.evaluate(90, 'score', { __id: '1', score: 90 })).not.toBeNull();
      expect(engine.evaluate(70, 'score', { __id: '1', score: 70 })).toBeNull();
    });

    it('matches greaterThanOrEqual', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'greaterThanOrEqual', value: 80 } }));
      expect(engine.evaluate(80, 'score', { __id: '1', score: 80 })).not.toBeNull();
    });

    it('matches lessThan', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'lessThan', value: 50 } }));
      expect(engine.evaluate(30, 'score', { __id: '1', score: 30 })).not.toBeNull();
      expect(engine.evaluate(60, 'score', { __id: '1', score: 60 })).toBeNull();
    });

    it('matches lessThanOrEqual', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'lessThanOrEqual', value: 50 } }));
      expect(engine.evaluate(50, 'score', { __id: '1', score: 50 })).not.toBeNull();
    });

    it('matches equals', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'equals', value: 'Active' }, field: 'status' }));
      expect(engine.evaluate('Active', 'status', { __id: '1', status: 'Active' })).not.toBeNull();
      expect(engine.evaluate('Inactive', 'status', { __id: '1', status: 'Inactive' })).toBeNull();
    });

    it('matches notEquals', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'notEquals', value: 'Active' }, field: 'status' }));
      expect(engine.evaluate('Inactive', 'status', { __id: '1', status: 'Inactive' })).not.toBeNull();
    });

    it('matches contains (case-insensitive)', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'contains', value: 'error' }, field: 'msg' }));
      expect(engine.evaluate('Error occurred', 'msg', { __id: '1', msg: 'Error occurred' })).not.toBeNull();
      expect(engine.evaluate('All good', 'msg', { __id: '1', msg: 'All good' })).toBeNull();
    });

    it('matches notContains', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'notContains', value: 'error' }, field: 'msg' }));
      expect(engine.evaluate('All good', 'msg', { __id: '1', msg: 'All good' })).not.toBeNull();
    });

    it('matches startsWith', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'startsWith', value: 'err' }, field: 'msg' }));
      expect(engine.evaluate('Error!', 'msg', { __id: '1', msg: 'Error!' })).not.toBeNull();
      expect(engine.evaluate('No error', 'msg', { __id: '1', msg: 'No error' })).toBeNull();
    });

    it('matches endsWith', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'endsWith', value: 'ok' }, field: 'msg' }));
      expect(engine.evaluate('All ok', 'msg', { __id: '1', msg: 'All ok' })).not.toBeNull();
    });

    it('matches isNull', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'isNull', value: null }, field: 'val' }));
      expect(engine.evaluate(null, 'val', { __id: '1', val: null })).not.toBeNull();
      expect(engine.evaluate(42, 'val', { __id: '1', val: 42 })).toBeNull();
    });

    it('matches isNotNull', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'isNotNull', value: null }, field: 'val' }));
      expect(engine.evaluate(42, 'val', { __id: '1', val: 42 })).not.toBeNull();
    });

    it('matches isEmpty', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'isEmpty', value: null }, field: 'val' }));
      expect(engine.evaluate('', 'val', { __id: '1', val: '' })).not.toBeNull();
      expect(engine.evaluate(null, 'val', { __id: '1', val: null })).not.toBeNull();
    });

    it('matches isNotEmpty', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'isNotEmpty', value: null }, field: 'val' }));
      expect(engine.evaluate('hello', 'val', { __id: '1', val: 'hello' })).not.toBeNull();
      expect(engine.evaluate('', 'val', { __id: '1', val: '' })).toBeNull();
    });

    it('matches in', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'in', value: ['A', 'B', 'C'] }, field: 'status' }));
      expect(engine.evaluate('B', 'status', { __id: '1', status: 'B' })).not.toBeNull();
      expect(engine.evaluate('D', 'status', { __id: '1', status: 'D' })).toBeNull();
    });

    it('matches notIn', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'notIn', value: ['A', 'B'] }, field: 'status' }));
      expect(engine.evaluate('C', 'status', { __id: '1', status: 'C' })).not.toBeNull();
      expect(engine.evaluate('A', 'status', { __id: '1', status: 'A' })).toBeNull();
    });

    it('returns null for null values with non-null operators', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'greaterThan', value: 50 } }));
      expect(engine.evaluate(null, 'score', { __id: '1', score: null })).toBeNull();
    });

    it('returns null for unknown operator', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ condition: { operator: 'unknownOp' as any, value: 50 } }));
      expect(engine.evaluate(60, 'score', { __id: '1', score: 60 })).toBeNull();
    });
  });

  describe('evaluate — field matching', () => {
    it('only matches rules for the correct field', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ field: 'score' }));
      expect(engine.evaluate(90, 'score', { __id: '1', score: 90 })).not.toBeNull();
      expect(engine.evaluate(90, 'otherField', { __id: '1', score: 90, otherField: 90 })).toBeNull();
    });
  });

  describe('evaluate — row-level rules', () => {
    it('evaluates row-level rule checking a different field', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({
        type: 'row',
        field: 'status',
        condition: { operator: 'equals', value: 'Critical' },
        style: { backgroundColor: '#EF4444' },
      }));
      const row: RowData = { __id: '1', score: 90, status: 'Critical' };
      // Row-level rule applies to any column
      expect(engine.evaluate(90, 'score', row)).not.toBeNull();
    });
  });

  describe('evaluateRow', () => {
    it('returns computed styles for each matching column', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ field: 'score', condition: { operator: 'greaterThan', value: 80 }, style: { backgroundColor: 'green' } }));
      engine.addRule(makeRule({ id: 'r2', field: 'status', condition: { operator: 'equals', value: 'Active' }, style: { color: 'blue' } }));

      const row: RowData = { __id: '1', score: 90, status: 'Active' };
      const cols: ColumnDefinition[] = [
        { field: 'score', header: 'Score', type: 'number' },
        { field: 'status', header: 'Status', type: 'string' },
      ];

      const result = engine.evaluateRow(row, cols);
      expect(result.size).toBe(2);
      expect(result.get('score')?.backgroundColor).toBe('green');
      expect(result.get('status')?.color).toBe('blue');
    });
  });

  describe('merging multiple rules', () => {
    it('merges styles from multiple matching rules', () => {
      const engine = createConditionalFormattingEngine();
      engine.addRule(makeRule({ id: 'r1', priority: 10, condition: { operator: 'greaterThan', value: 50 }, style: { backgroundColor: 'yellow' } }));
      engine.addRule(makeRule({ id: 'r2', priority: 20, condition: { operator: 'greaterThan', value: 80 }, style: { fontWeight: 'bold' } }));

      const style = engine.evaluate(90, 'score', { __id: '1', score: 90 });
      expect(style?.backgroundColor).toBe('yellow');
      expect(style?.fontWeight).toBe('bold');
    });
  });
});

describe('preset rule builders', () => {
  it('createThresholdRule creates a valid rule', () => {
    const rule = createThresholdRule('t1', 'score', 'greaterThan', 80, { backgroundColor: 'green' });
    expect(rule.id).toBe('t1');
    expect(rule.type).toBe('cell');
    expect(rule.field).toBe('score');
    expect(rule.condition.operator).toBe('greaterThan');
    expect(rule.condition.value).toBe(80);
  });

  it('createHighlightAboveTarget creates a rule with defaults', () => {
    const rule = createHighlightAboveTarget('score', 90);
    expect(rule.field).toBe('score');
    expect(rule.condition.operator).toBe('greaterThanOrEqual');
    expect(rule.condition.value).toBe(90);
    expect(rule.style.fontWeight).toBe('600');
  });

  it('createHighlightBelowTarget creates a rule', () => {
    const rule = createHighlightBelowTarget('score', 50);
    expect(rule.condition.operator).toBe('lessThan');
    expect(rule.condition.value).toBe(50);
  });

  it('createColorScaleRule creates a rule', () => {
    const rule = createColorScaleRule('cs1', 'score', '#ff0', '#0f0', 0, 100);
    expect(rule.id).toBe('cs1');
    expect(rule.field).toBe('score');
  });
});
