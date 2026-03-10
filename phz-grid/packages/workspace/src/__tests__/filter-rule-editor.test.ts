/**
 * Sprint U.4 — FilterRule editor component
 *
 * Tests: form validation, condition building, action selection, event dispatch.
 * Vitest (node, no DOM rendering) — tests headless logic only.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createFilterRuleEditorState,
  addCondition,
  removeCondition,
  updateCondition,
  addAction,
  removeAction,
  updateAction,
  getRuleFromState,
  validateRuleState,
  type FilterRuleEditorState,
} from '../filters/filter-rule-editor.js';
import type { FilterRule, FilterRuleCondition, FilterRuleAction } from '../filters/filter-rule-engine.js';
import type { FilterDefinition } from '../filters/filter-definition.js';

function makeDef(id: string): FilterDefinition {
  return {
    id,
    label: `Filter ${id}`,
    filterType: 'select',
    valueSource: { type: 'static', values: ['A', 'B', 'C'] },
    bindings: [],
  };
}

describe('FilterRuleEditor (U.4)', () => {
  // ── State creation ──
  describe('createFilterRuleEditorState', () => {
    it('creates default empty state', () => {
      const state = createFilterRuleEditorState();
      expect(state.name).toBe('');
      expect(state.priority).toBe(10);
      expect(state.enabled).toBe(true);
      expect(state.conditions).toEqual([]);
      expect(state.actions).toEqual([]);
      expect(state.conditionLogic).toBe('and');
    });

    it('creates state from existing rule', () => {
      const rule: FilterRule = {
        id: 'rule-1',
        name: 'Existing Rule',
        priority: 5,
        enabled: false,
        conditionLogic: 'or',
        conditions: [
          { type: 'field-value', filterDefinitionId: 'fd-1', operator: 'eq', value: 'X' },
        ],
        actions: [
          { type: 'hide', filterDefinitionId: 'fd-2' },
        ],
      };
      const state = createFilterRuleEditorState(rule);
      expect(state.name).toBe('Existing Rule');
      expect(state.priority).toBe(5);
      expect(state.enabled).toBe(false);
      expect(state.conditionLogic).toBe('or');
      expect(state.conditions).toHaveLength(1);
      expect(state.actions).toHaveLength(1);
    });
  });

  // ── Condition management ──
  describe('condition management', () => {
    it('adds a condition', () => {
      let state = createFilterRuleEditorState();
      const cond: FilterRuleCondition = {
        type: 'field-value',
        filterDefinitionId: 'fd-1',
        operator: 'eq',
        value: 'A',
      };
      state = addCondition(state, cond);
      expect(state.conditions).toHaveLength(1);
      expect(state.conditions[0]).toEqual(cond);
    });

    it('removes a condition by index', () => {
      let state = createFilterRuleEditorState();
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'b', operator: 'eq', value: 2 });
      state = removeCondition(state, 0);
      expect(state.conditions).toHaveLength(1);
      expect((state.conditions[0] as any).filterDefinitionId).toBe('b');
    });

    it('updates a condition by index', () => {
      let state = createFilterRuleEditorState();
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      state = updateCondition(state, 0, { type: 'field-value', filterDefinitionId: 'a', operator: 'neq', value: 1 });
      expect((state.conditions[0] as any).operator).toBe('neq');
    });

    it('ignores removal of out-of-bounds index', () => {
      let state = createFilterRuleEditorState();
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      state = removeCondition(state, 5);
      expect(state.conditions).toHaveLength(1);
    });
  });

  // ── Action management ──
  describe('action management', () => {
    it('adds an action', () => {
      let state = createFilterRuleEditorState();
      const action: FilterRuleAction = { type: 'hide', filterDefinitionId: 'fd-1' };
      state = addAction(state, action);
      expect(state.actions).toHaveLength(1);
    });

    it('removes an action by index', () => {
      let state = createFilterRuleEditorState();
      state = addAction(state, { type: 'hide', filterDefinitionId: 'a' });
      state = addAction(state, { type: 'hide', filterDefinitionId: 'b' });
      state = removeAction(state, 0);
      expect(state.actions).toHaveLength(1);
      expect(state.actions[0].filterDefinitionId).toBe('b');
    });

    it('updates an action by index', () => {
      let state = createFilterRuleEditorState();
      state = addAction(state, { type: 'hide', filterDefinitionId: 'a' });
      state = updateAction(state, 0, { type: 'disable', filterDefinitionId: 'a', message: 'nope' });
      expect(state.actions[0].type).toBe('disable');
    });
  });

  // ── Rule extraction ──
  describe('getRuleFromState', () => {
    it('builds a FilterRule from editor state', () => {
      let state = createFilterRuleEditorState();
      state = { ...state, name: 'My Rule', priority: 3 };
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'fd-1', operator: 'eq', value: 'X' });
      state = addAction(state, { type: 'hide', filterDefinitionId: 'fd-2' });

      const rule = getRuleFromState(state);
      expect(rule.name).toBe('My Rule');
      expect(rule.priority).toBe(3);
      expect(rule.conditions).toHaveLength(1);
      expect(rule.actions).toHaveLength(1);
      expect(rule.enabled).toBe(true);
      expect(rule.id).toBeTruthy();
    });

    it('preserves existing rule ID if provided', () => {
      const existing: FilterRule = {
        id: 'rule-existing',
        name: 'X',
        priority: 1,
        enabled: true,
        conditions: [],
        actions: [],
      };
      const state = createFilterRuleEditorState(existing);
      const rule = getRuleFromState(state);
      expect(rule.id).toBe('rule-existing');
    });
  });

  // ── Validation ──
  describe('validateRuleState', () => {
    it('validates a complete rule state', () => {
      let state = createFilterRuleEditorState();
      state = { ...state, name: 'My Rule' };
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      state = addAction(state, { type: 'hide', filterDefinitionId: 'b' });
      const result = validateRuleState(state);
      expect(result.valid).toBe(true);
    });

    it('fails when name is empty', () => {
      let state = createFilterRuleEditorState();
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      state = addAction(state, { type: 'hide', filterDefinitionId: 'b' });
      const result = validateRuleState(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name is required');
    });

    it('fails when no conditions', () => {
      let state = createFilterRuleEditorState();
      state = { ...state, name: 'X' };
      state = addAction(state, { type: 'hide', filterDefinitionId: 'b' });
      const result = validateRuleState(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('at least one condition is required');
    });

    it('fails when no actions', () => {
      let state = createFilterRuleEditorState();
      state = { ...state, name: 'X' };
      state = addCondition(state, { type: 'field-value', filterDefinitionId: 'a', operator: 'eq', value: 1 });
      const result = validateRuleState(state);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('at least one action is required');
    });
  });
});
