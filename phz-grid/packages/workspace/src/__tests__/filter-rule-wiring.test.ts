/**
 * Tests for Tasks 2.3 + 2.4:
 * - 2.3: FilterRuleEngine activation on filter change
 * - 2.4: Cross-filter: widget selection → filter context → sibling refresh
 */

import { describe, it, expect, vi } from 'vitest';
import {
  filterValuesToStateRecord,
  evaluateRulesFromContext,
  collectRuleActions,
  applyCrossFilterFromWidget,
  type FilterRuleActionMap,
} from '../filters/filter-rule-wiring.js';
import { createFilterContext } from '@phozart/phz-shared';
import type { FilterRule } from '../filters/filter-rule-engine.js';

describe('filter-rule-wiring', () => {
  describe('filterValuesToStateRecord', () => {
    it('converts FilterValue[] to Record<filterId, value>', () => {
      const values = [
        { filterId: 'region', field: 'region', operator: 'equals' as const, value: 'US', label: 'r' },
        { filterId: 'year', field: 'year', operator: 'equals' as const, value: 2026, label: 'y' },
      ];

      const record = filterValuesToStateRecord(values);
      expect(record).toEqual({ region: 'US', year: 2026 });
    });

    it('returns empty object for empty input', () => {
      expect(filterValuesToStateRecord([])).toEqual({});
    });
  });

  describe('evaluateRulesFromContext', () => {
    const rules: FilterRule[] = [
      {
        id: 'r1',
        name: 'EU restricts product',
        priority: 1,
        enabled: true,
        conditions: [
          { type: 'field-value', filterDefinitionId: 'region', operator: 'eq', value: 'EU' },
        ],
        actions: [
          { type: 'restrict', filterDefinitionId: 'product', allowedValues: ['A', 'B'] },
        ],
      },
      {
        id: 'r2',
        name: 'Disabled rule',
        priority: 2,
        enabled: false,
        conditions: [],
        actions: [{ type: 'hide', filterDefinitionId: 'secret' }],
      },
    ];

    it('evaluates rules against current filter context', () => {
      const ctx = createFilterContext();
      ctx.setFilter({ filterId: 'region', field: 'region', operator: 'equals', value: 'EU', label: 'r' });

      const results = evaluateRulesFromContext(rules, ctx);

      expect(results).toHaveLength(1); // disabled rule excluded
      expect(results[0].matched).toBe(true);
      expect(results[0].actions).toHaveLength(1);
      expect(results[0].actions[0].type).toBe('restrict');
    });

    it('no match when filter value differs', () => {
      const ctx = createFilterContext();
      ctx.setFilter({ filterId: 'region', field: 'region', operator: 'equals', value: 'US', label: 'r' });

      const results = evaluateRulesFromContext(rules, ctx);

      expect(results[0].matched).toBe(false);
      expect(results[0].actions).toHaveLength(0);
    });
  });

  describe('collectRuleActions', () => {
    it('groups actions by filter definition ID', () => {
      const results = [
        {
          ruleId: 'r1', ruleName: 'r1', matched: true,
          actions: [
            { type: 'restrict' as const, filterDefinitionId: 'product', allowedValues: ['A'] },
            { type: 'disable' as const, filterDefinitionId: 'channel', message: 'Not available' },
          ],
        },
        {
          ruleId: 'r2', ruleName: 'r2', matched: true,
          actions: [
            { type: 'hide' as const, filterDefinitionId: 'product' },
          ],
        },
      ];

      const map = collectRuleActions(results);

      expect(map.product).toHaveLength(2); // restrict + hide
      expect(map.channel).toHaveLength(1); // disable
    });

    it('skips unmatched rules', () => {
      const results = [
        {
          ruleId: 'r1', ruleName: 'r1', matched: false,
          actions: [],
        },
      ];

      const map = collectRuleActions(results);
      expect(Object.keys(map)).toHaveLength(0);
    });
  });

  describe('applyCrossFilterFromWidget', () => {
    it('applies a cross-filter entry to filter context', () => {
      const ctx = createFilterContext();

      applyCrossFilterFromWidget(ctx, 'widget-1', 'category', 'Electronics');

      const filters = ctx.resolveFilters('widget-2');
      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('category');
      expect(filters[0].value).toBe('Electronics');
      expect(filters[0].operator).toBe('equals');
    });

    it('cross-filter excluded from source widget queries', () => {
      const ctx = createFilterContext();

      applyCrossFilterFromWidget(ctx, 'widget-1', 'category', 'Food');

      // Should not appear for the widget that set it
      const filtersForSource = ctx.resolveFilters('widget-1');
      expect(filtersForSource).toHaveLength(0);

      // Should appear for other widgets
      const filtersForSibling = ctx.resolveFilters('widget-2');
      expect(filtersForSibling).toHaveLength(1);
    });

    it('clearing cross-filter removes it from context', () => {
      const ctx = createFilterContext();

      applyCrossFilterFromWidget(ctx, 'widget-1', 'region', 'US');
      ctx.clearCrossFilter('widget-1');

      const filters = ctx.resolveFilters('widget-2');
      expect(filters).toHaveLength(0);
    });
  });
});
