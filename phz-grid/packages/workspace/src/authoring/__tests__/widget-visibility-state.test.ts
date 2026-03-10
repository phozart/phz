import { describe, it, expect } from 'vitest';
import {
  type WidgetVisibilityCondition,
  type WidgetVisibilityState,
  type VisibilityExpression,
  initialWidgetVisibilityState,
  setVisibilityCondition,
  removeVisibilityCondition,
  startEditCondition,
  commitCondition,
  cancelEditCondition,
  evaluateVisibility,
  getVisibleWidgets,
} from '../widget-visibility-state.js';
import type { BaseWidgetConfig } from '@phozart/phz-engine';

// --- Fixtures ---

function makeCondition(
  overrides?: Partial<WidgetVisibilityCondition>,
): WidgetVisibilityCondition {
  return {
    expression: { field: 'region', operator: 'eq', value: 'US' },
    evaluateAgainst: 'filter-state',
    hiddenBehavior: 'collapse',
    ...overrides,
  };
}

function makeWidget(id: string, title = 'Widget'): BaseWidgetConfig {
  return {
    id: id as BaseWidgetConfig['id'],
    type: 'kpi-card',
    title,
    position: { row: 0, col: 0, colSpan: 2, rowSpan: 1 },
  };
}

describe('widget-visibility-state', () => {
  // ========================================================================
  // CRUD operations
  // ========================================================================

  describe('setVisibilityCondition / removeVisibilityCondition', () => {
    it('should set a visibility condition for a widget', () => {
      const state = initialWidgetVisibilityState();
      const condition = makeCondition();
      const next = setVisibilityCondition(state, 'w-1', condition);

      expect(next.conditions['w-1']).toEqual(condition);
      // Original state should not be mutated
      expect(state.conditions['w-1']).toBeUndefined();
    });

    it('should overwrite an existing condition', () => {
      let state = initialWidgetVisibilityState();
      state = setVisibilityCondition(state, 'w-1', makeCondition());
      const updated = makeCondition({
        expression: { field: 'status', operator: 'ne', value: 'inactive' },
      });
      const next = setVisibilityCondition(state, 'w-1', updated);

      expect(next.conditions['w-1']?.expression.field).toBe('status');
    });

    it('should remove a visibility condition', () => {
      let state = initialWidgetVisibilityState();
      state = setVisibilityCondition(state, 'w-1', makeCondition());
      const next = removeVisibilityCondition(state, 'w-1');

      expect(next.conditions['w-1']).toBeUndefined();
    });

    it('should be a no-op when removing a non-existent condition', () => {
      const state = initialWidgetVisibilityState();
      const next = removeVisibilityCondition(state, 'w-99');
      expect(next).toEqual(state);
    });
  });

  // ========================================================================
  // Edit flow
  // ========================================================================

  describe('edit flow (start → commit / cancel)', () => {
    it('should start editing a widget condition', () => {
      let state = initialWidgetVisibilityState();
      const condition = makeCondition();
      state = setVisibilityCondition(state, 'w-1', condition);
      const next = startEditCondition(state, 'w-1');

      expect(next.editingWidgetId).toBe('w-1');
      expect(next.editingDraft).toEqual(condition);
    });

    it('should start editing with empty draft when no condition exists', () => {
      const state = initialWidgetVisibilityState();
      const next = startEditCondition(state, 'w-new');

      expect(next.editingWidgetId).toBe('w-new');
      expect(next.editingDraft).toBeDefined();
      expect(next.editingDraft?.expression.field).toBe('');
    });

    it('should commit the draft to conditions', () => {
      let state = initialWidgetVisibilityState();
      state = startEditCondition(state, 'w-1');
      // Simulate the user modifying the draft
      state = {
        ...state,
        editingDraft: makeCondition({
          expression: { field: 'country', operator: 'eq', value: 'CA' },
        }),
      };
      const next = commitCondition(state);

      expect(next.conditions['w-1']?.expression.field).toBe('country');
      expect(next.editingWidgetId).toBeUndefined();
      expect(next.editingDraft).toBeUndefined();
    });

    it('should discard the draft on cancel', () => {
      let state = initialWidgetVisibilityState();
      state = setVisibilityCondition(state, 'w-1', makeCondition());
      state = startEditCondition(state, 'w-1');
      const next = cancelEditCondition(state);

      expect(next.editingWidgetId).toBeUndefined();
      expect(next.editingDraft).toBeUndefined();
      // Original condition should be unchanged
      expect(next.conditions['w-1']?.expression.field).toBe('region');
    });
  });

  // ========================================================================
  // evaluateVisibility
  // ========================================================================

  describe('evaluateVisibility', () => {
    it('should evaluate eq operator correctly', () => {
      const expr: VisibilityExpression = { field: 'region', operator: 'eq', value: 'US' };
      expect(evaluateVisibility({ expression: expr, evaluateAgainst: 'filter-state', hiddenBehavior: 'collapse' }, { region: 'US' })).toBe(true);
      expect(evaluateVisibility({ expression: expr, evaluateAgainst: 'filter-state', hiddenBehavior: 'collapse' }, { region: 'EU' })).toBe(false);
    });

    it('should evaluate ne operator correctly', () => {
      const cond = makeCondition({
        expression: { field: 'status', operator: 'ne', value: 'draft' },
      });
      expect(evaluateVisibility(cond, { status: 'active' })).toBe(true);
      expect(evaluateVisibility(cond, { status: 'draft' })).toBe(false);
    });

    it('should evaluate gt / lt / gte / lte operators', () => {
      const gtCond = makeCondition({ expression: { field: 'score', operator: 'gt', value: 50 } });
      expect(evaluateVisibility(gtCond, { score: 75 })).toBe(true);
      expect(evaluateVisibility(gtCond, { score: 50 })).toBe(false);
      expect(evaluateVisibility(gtCond, { score: 25 })).toBe(false);

      const ltCond = makeCondition({ expression: { field: 'score', operator: 'lt', value: 50 } });
      expect(evaluateVisibility(ltCond, { score: 25 })).toBe(true);
      expect(evaluateVisibility(ltCond, { score: 50 })).toBe(false);

      const gteCond = makeCondition({ expression: { field: 'score', operator: 'gte', value: 50 } });
      expect(evaluateVisibility(gteCond, { score: 50 })).toBe(true);

      const lteCond = makeCondition({ expression: { field: 'score', operator: 'lte', value: 50 } });
      expect(evaluateVisibility(lteCond, { score: 50 })).toBe(true);
    });

    it('should evaluate in operator with array values', () => {
      const cond = makeCondition({
        expression: { field: 'region', operator: 'in', value: ['US', 'CA', 'MX'] },
      });
      expect(evaluateVisibility(cond, { region: 'US' })).toBe(true);
      expect(evaluateVisibility(cond, { region: 'EU' })).toBe(false);
    });

    it('should evaluate in operator with single value', () => {
      const cond = makeCondition({
        expression: { field: 'region', operator: 'in', value: 'US' },
      });
      expect(evaluateVisibility(cond, { region: 'US' })).toBe(true);
      expect(evaluateVisibility(cond, { region: 'EU' })).toBe(false);
    });

    it('should evaluate not-in operator', () => {
      const cond = makeCondition({
        expression: { field: 'region', operator: 'not-in', value: ['US', 'CA'] },
      });
      expect(evaluateVisibility(cond, { region: 'EU' })).toBe(true);
      expect(evaluateVisibility(cond, { region: 'US' })).toBe(false);
    });

    it('should evaluate is-set operator — false for null, undefined, and empty string', () => {
      const cond = makeCondition({
        expression: { field: 'region', operator: 'is-set' },
      });
      expect(evaluateVisibility(cond, { region: 'US' })).toBe(true);
      expect(evaluateVisibility(cond, { region: null })).toBe(false);
      expect(evaluateVisibility(cond, { region: undefined })).toBe(false);
      expect(evaluateVisibility(cond, { region: '' })).toBe(false);
      // Missing field entirely
      expect(evaluateVisibility(cond, {})).toBe(false);
    });

    it('should evaluate is-not-set operator', () => {
      const cond = makeCondition({
        expression: { field: 'region', operator: 'is-not-set' },
      });
      expect(evaluateVisibility(cond, { region: null })).toBe(true);
      expect(evaluateVisibility(cond, { region: undefined })).toBe(true);
      expect(evaluateVisibility(cond, { region: '' })).toBe(true);
      expect(evaluateVisibility(cond, {})).toBe(true);
      expect(evaluateVisibility(cond, { region: 'US' })).toBe(false);
    });

    it('should handle null/undefined field values gracefully for comparison operators', () => {
      const cond = makeCondition({
        expression: { field: 'score', operator: 'gt', value: 50 },
      });
      expect(evaluateVisibility(cond, { score: null })).toBe(false);
      expect(evaluateVisibility(cond, { score: undefined })).toBe(false);
      expect(evaluateVisibility(cond, {})).toBe(false);
    });

    it('should use strict comparison — number vs string returns false', () => {
      const cond = makeCondition({
        expression: { field: 'code', operator: 'eq', value: 42 },
      });
      expect(evaluateVisibility(cond, { code: '42' })).toBe(false);
      expect(evaluateVisibility(cond, { code: 42 })).toBe(true);
    });
  });

  // ========================================================================
  // getVisibleWidgets
  // ========================================================================

  describe('getVisibleWidgets', () => {
    it('should return all widgets when no conditions are set', () => {
      const widgets = [makeWidget('w-1'), makeWidget('w-2')];
      const result = getVisibleWidgets(widgets, {}, {});

      expect(result).toHaveLength(2);
    });

    it('should filter out widgets whose condition evaluates to false', () => {
      const widgets = [makeWidget('w-1'), makeWidget('w-2'), makeWidget('w-3')];
      const conditions: Record<string, WidgetVisibilityCondition> = {
        'w-2': makeCondition({
          expression: { field: 'region', operator: 'eq', value: 'EU' },
        }),
      };

      const result = getVisibleWidgets(widgets, conditions, { region: 'US' });

      expect(result).toHaveLength(2);
      expect(result.map(w => w.id)).toEqual(['w-1', 'w-3']);
    });

    it('should NOT mutate the input array', () => {
      const widgets = [makeWidget('w-1'), makeWidget('w-2')];
      const original = [...widgets];
      const conditions: Record<string, WidgetVisibilityCondition> = {
        'w-1': makeCondition({
          expression: { field: 'x', operator: 'eq', value: 'hide' },
        }),
      };

      getVisibleWidgets(widgets, conditions, { x: 'show' });

      expect(widgets).toEqual(original);
    });

    it('should include widgets whose condition evaluates to true', () => {
      const widgets = [makeWidget('w-1'), makeWidget('w-2')];
      const conditions: Record<string, WidgetVisibilityCondition> = {
        'w-1': makeCondition({
          expression: { field: 'region', operator: 'eq', value: 'US' },
        }),
        'w-2': makeCondition({
          expression: { field: 'region', operator: 'eq', value: 'US' },
        }),
      };

      const result = getVisibleWidgets(widgets, conditions, { region: 'US' });
      expect(result).toHaveLength(2);
    });
  });
});
