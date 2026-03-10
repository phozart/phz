/**
 * Tests for widget-data-processor.ts
 */

import { describe, it, expect } from 'vitest';
import { processWidgetData } from '../widget-data-processor.js';
import type { WidgetDataConfig } from '../widget-config-enhanced.js';

const SAMPLE_DATA: Record<string, unknown>[] = [
  { name: 'Alice', department: 'Engineering', region: 'East', salary: 90000, attendance: 95 },
  { name: 'Bob', department: 'Engineering', region: 'West', salary: 85000, attendance: 88 },
  { name: 'Charlie', department: 'Sales', region: 'East', salary: 70000, attendance: 92 },
  { name: 'Diana', department: 'Sales', region: 'West', salary: 72000, attendance: 78 },
  { name: 'Eve', department: 'Marketing', region: 'East', salary: 80000, attendance: 96 },
  { name: 'Frank', department: 'Marketing', region: 'West', salary: 75000, attendance: 85 },
  { name: 'Grace', department: 'HR', region: 'East', salary: 65000, attendance: 91 },
  { name: 'Henry', department: 'HR', region: 'West', salary: 68000, attendance: 82 },
];

describe('processWidgetData', () => {

  // --- Filter tests ---

  describe('filters', () => {
    it('should apply eq filter', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
        filters: [{ field: 'region', operator: 'eq', value: 'East' }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // East: Engineering(Alice), Sales(Charlie), Marketing(Eve), HR(Grace)
      expect(result.rows.length).toBe(4);
    });

    it('should apply neq filter', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
        filters: [{ field: 'region', operator: 'neq', value: 'East' }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // West: Bob, Diana, Frank, Henry → 4 departments
      expect(result.rows.length).toBe(4);
    });

    it('should apply gt filter', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'name' }, values: [{ fieldKey: 'salary', aggregation: 'sum' }] },
        filters: [{ field: 'salary', operator: 'gt', value: 80000 }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // Alice(90k), Bob(85k), Eve(80k not > 80k) → 2
      expect(result.rows.length).toBe(2);
    });

    it('should apply contains filter (case-insensitive)', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'name' }, values: [{ fieldKey: 'salary', aggregation: 'sum' }] },
        filters: [{ field: 'name', operator: 'contains', value: 'ar' }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // Charlie → 1
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].label).toBe('Charlie');
    });

    it('should apply in filter', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'name' }, values: [{ fieldKey: 'salary', aggregation: 'sum' }] },
        filters: [{ field: 'department', operator: 'in', value: ['Engineering', 'HR'] }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // Alice, Bob, Grace, Henry → 4
      expect(result.rows.length).toBe(4);
    });

    it('should apply between filter', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'name' }, values: [{ fieldKey: 'salary', aggregation: 'sum' }] },
        filters: [{ field: 'salary', operator: 'between', value: 70000, value2: 80000 }],
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // Charlie(70k), Diana(72k), Eve(80k), Frank(75k) → 4
      expect(result.rows.length).toBe(4);
    });
  });

  // --- Grouping tests ---

  describe('grouping & aggregation', () => {
    it('should group by category and compute avg', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows.length).toBe(4);
      const eng = result.rows.find(r => r.label === 'Engineering');
      expect(eng).toBeDefined();
      expect(eng!.values.salary).toBe(87500); // (90000+85000)/2
    });

    it('should group by category and compute sum', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'sum' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      const eng = result.rows.find(r => r.label === 'Engineering');
      expect(eng!.values.salary).toBe(175000);
    });

    it('should compute count aggregation', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'count' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      const eng = result.rows.find(r => r.label === 'Engineering');
      expect(eng!.values.salary).toBe(2);
    });

    it('should compute min/max aggregation', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [
          { fieldKey: 'salary', aggregation: 'min' },
          { fieldKey: 'attendance', aggregation: 'max' },
        ] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      const eng = result.rows.find(r => r.label === 'Engineering');
      expect(eng!.values.salary).toBe(85000);
      expect(eng!.values.attendance).toBe(95);
    });
  });

  // --- Sort tests ---

  describe('sorting', () => {
    it('should sort descending by default', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      // Desc: Engineering(87500) > Marketing(77500) > Sales(71000) > HR(66500)
      expect(result.rows[0].label).toBe('Engineering');
      expect(result.rows[result.rows.length - 1].label).toBe('HR');
    });

    it('should sort ascending when specified', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
        sort: { field: 'salary', direction: 'asc' },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows[0].label).toBe('HR');
    });
  });

  // --- Limit tests ---

  describe('limit with Others', () => {
    it('should limit results', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
        limit: 2,
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows.length).toBe(2);
    });

    it('should group remaining into Others when groupOthers=true', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
        limit: 2,
        groupOthers: true,
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows.length).toBe(3); // 2 + Others
      const others = result.rows.find(r => r.label === 'Others');
      expect(others).toBeDefined();
      expect(others!.children).toBeDefined();
      expect(others!.children!.length).toBe(2); // Sales + HR
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
      };
      const result = processWidgetData([], config);
      expect(result.rows.length).toBe(0);
    });

    it('should handle missing category field', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows.length).toBe(0);
    });

    it('should handle non-chart bindings', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'kpi', kpiId: 'test' as any },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.rows.length).toBe(8);
    });

    it('should compute totals', () => {
      const config: WidgetDataConfig = {
        bindings: { type: 'chart', category: { fieldKey: 'department' }, values: [{ fieldKey: 'salary', aggregation: 'avg' }] },
      };
      const result = processWidgetData(SAMPLE_DATA, config);
      expect(result.totals).toBeDefined();
      // avg salary across all 8 employees
      const totalAvg = (90000 + 85000 + 70000 + 72000 + 80000 + 75000 + 65000 + 68000) / 8;
      expect(result.totals!.salary).toBeCloseTo(totalAvg, 0);
    });
  });
});
