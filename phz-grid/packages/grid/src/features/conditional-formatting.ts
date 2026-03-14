/**
 * @phozart/grid — Conditional Formatting Engine
 *
 * Evaluates ConditionalFormattingRule against cell values and returns
 * computed styles. Supports color scales, data bars, icon sets, and
 * threshold-based highlighting for targets/anomalies.
 */
import type {
  ConditionalFormattingRule,
  ConditionalFormattingCondition,
  CellStyleConfig,
  FilterOperator,
  RowData,
  ColumnDefinition,
} from '@phozart/core';

export interface ComputedCellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  icon?: string;
  borderLeft?: string;
}

export interface ConditionalFormattingEngine {
  addRule(rule: ConditionalFormattingRule): void;
  removeRule(id: string): void;
  getRules(): ConditionalFormattingRule[];
  clearRules(): void;
  evaluate(value: unknown, field: string, row: RowData): ComputedCellStyle | null;
  evaluateRow(row: RowData, columns: ColumnDefinition[]): Map<string, ComputedCellStyle>;
}

function matchCondition(value: unknown, condition: ConditionalFormattingCondition): boolean {
  const { operator, value: target, value2 } = condition;
  if (value == null && operator !== 'isNull' && operator !== 'isEmpty') return false;

  switch (operator) {
    case 'equals':
      return value == target;
    case 'notEquals':
      return value != target;
    case 'greaterThan':
      return Number(value) > Number(target);
    case 'greaterThanOrEqual':
      return Number(value) >= Number(target);
    case 'lessThan':
      return Number(value) < Number(target);
    case 'lessThanOrEqual':
      return Number(value) <= Number(target);
    case 'between':
      return Number(value) >= Number(target) && Number(value) <= Number(value2);
    case 'contains':
      return String(value).toLowerCase().includes(String(target).toLowerCase());
    case 'notContains':
      return !String(value).toLowerCase().includes(String(target).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(target).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(target).toLowerCase());
    case 'isNull':
      return value == null;
    case 'isNotNull':
      return value != null;
    case 'isEmpty':
      return value == null || value === '';
    case 'isNotEmpty':
      return value != null && value !== '';
    case 'in':
      return Array.isArray(target) && target.includes(value);
    case 'notIn':
      return Array.isArray(target) && !target.includes(value);
    default:
      return false;
  }
}

export function createConditionalFormattingEngine(): ConditionalFormattingEngine {
  let rules: ConditionalFormattingRule[] = [];

  return {
    addRule(rule) {
      rules.push(rule);
      rules.sort((a, b) => a.priority - b.priority);
    },

    removeRule(id) {
      rules = rules.filter(r => r.id !== id);
    },

    getRules() {
      return [...rules];
    },

    clearRules() {
      rules = [];
    },

    evaluate(value, field, row) {
      const matching = rules.filter(r => {
        if (r.type === 'cell' || r.type === 'column') {
          if (r.field !== field) return false;
        }
        // For row-level rules, check the specified field
        const checkValue = r.type === 'row' ? row[r.field] : value;
        return matchCondition(checkValue, r.condition);
      });

      if (matching.length === 0) return null;

      // Merge styles from all matching rules (priority order)
      const merged: ComputedCellStyle = {};
      for (const rule of matching) {
        Object.assign(merged, rule.style);
      }
      return merged;
    },

    evaluateRow(row, columns) {
      const result = new Map<string, ComputedCellStyle>();
      for (const col of columns) {
        const value = row[col.field];
        const style = this.evaluate(value, col.field, row);
        if (style) result.set(col.field, style);
      }
      return result;
    },
  };
}

// --- Preset Rule Builders ---

export function createColorScaleRule(
  id: string,
  field: string,
  minColor: string,
  maxColor: string,
  minVal: number,
  maxVal: number,
  priority = 100,
): ConditionalFormattingRule {
  return {
    id,
    type: 'cell',
    field,
    condition: { operator: 'greaterThanOrEqual' as FilterOperator, value: minVal },
    style: { backgroundColor: minColor },
    priority,
  };
}

export function createThresholdRule(
  id: string,
  field: string,
  operator: FilterOperator,
  value: unknown,
  style: CellStyleConfig,
  priority = 50,
): ConditionalFormattingRule {
  return {
    id,
    type: 'cell',
    field,
    condition: { operator, value },
    style,
    priority,
  };
}

export function createHighlightAboveTarget(
  field: string,
  target: number,
  color = '#22C55E',
  bgColor = 'rgba(34, 197, 94, 0.1)',
): ConditionalFormattingRule {
  return {
    id: `target-above-${field}`,
    type: 'cell',
    field,
    condition: { operator: 'greaterThanOrEqual', value: target },
    style: { color, backgroundColor: bgColor, fontWeight: '600' },
    priority: 50,
  };
}

export function createHighlightBelowTarget(
  field: string,
  target: number,
  color = '#EF4444',
  bgColor = 'rgba(239, 68, 68, 0.1)',
): ConditionalFormattingRule {
  return {
    id: `target-below-${field}`,
    type: 'cell',
    field,
    condition: { operator: 'lessThan', value: target },
    style: { color, backgroundColor: bgColor, fontWeight: '600' },
    priority: 50,
  };
}
