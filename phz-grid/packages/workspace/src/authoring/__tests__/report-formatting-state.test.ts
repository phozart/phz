import { describe, it, expect } from 'vitest';
import {
  initialReportFormattingState,
  addFormattingRule,
  removeFormattingRule,
  updateFormattingRule,
  reorderRules,
  startEditFormattingRule,
  commitFormattingRule,
  type FormattingRule,
} from '../report-formatting-state.js';

function makeRule(id: string, field: string, priority = 0): FormattingRule {
  return {
    id,
    field,
    condition: 'greaterThan',
    value: 100,
    style: { backgroundColor: '#ff0000', color: '#fff' },
    priority,
    enabled: true,
  };
}

describe('ReportFormattingState', () => {
  describe('initialReportFormattingState', () => {
    it('starts with empty rules', () => {
      const s = initialReportFormattingState();
      expect(s.rules).toEqual([]);
    });

    it('starts with no editing state', () => {
      const s = initialReportFormattingState();
      expect(s.editingRuleId).toBeUndefined();
      expect(s.ruleDraft).toBeUndefined();
    });
  });

  describe('addFormattingRule', () => {
    it('adds a rule', () => {
      const s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      expect(s.rules).toHaveLength(1);
      expect(s.rules[0].id).toBe('r-1');
    });

    it('prevents duplicate rules by id', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      s = addFormattingRule(s, makeRule('r-1', 'quantity'));
      expect(s.rules).toHaveLength(1);
    });

    it('returns same reference for duplicate', () => {
      const s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      const s2 = addFormattingRule(s, makeRule('r-1', 'revenue'));
      expect(s2).toBe(s);
    });

    it('does not mutate original state', () => {
      const original = initialReportFormattingState();
      addFormattingRule(original, makeRule('r-1', 'x'));
      expect(original.rules).toHaveLength(0);
    });
  });

  describe('removeFormattingRule', () => {
    it('removes a rule by id', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = addFormattingRule(s, makeRule('r-2', 'b'));
      s = removeFormattingRule(s, 'r-1');
      expect(s.rules).toHaveLength(1);
      expect(s.rules[0].id).toBe('r-2');
    });

    it('clears editing state when removing the edited rule', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = startEditFormattingRule(s, 'r-1');
      s = removeFormattingRule(s, 'r-1');
      expect(s.editingRuleId).toBeUndefined();
      expect(s.ruleDraft).toBeUndefined();
    });

    it('preserves editing state when removing a different rule', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = addFormattingRule(s, makeRule('r-2', 'b'));
      s = startEditFormattingRule(s, 'r-1');
      s = removeFormattingRule(s, 'r-2');
      expect(s.editingRuleId).toBe('r-1');
    });
  });

  describe('updateFormattingRule', () => {
    it('updates partial properties', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      s = updateFormattingRule(s, 'r-1', { condition: 'lessThan', value: 50 });
      expect(s.rules[0].condition).toBe('lessThan');
      expect(s.rules[0].value).toBe(50);
    });

    it('preserves the id even if updates try to override it', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      s = updateFormattingRule(s, 'r-1', { id: 'hacked' } as Partial<FormattingRule>);
      expect(s.rules[0].id).toBe('r-1');
    });

    it('does not affect other rules', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = addFormattingRule(s, makeRule('r-2', 'b'));
      s = updateFormattingRule(s, 'r-1', { enabled: false });
      expect(s.rules[1].enabled).toBe(true);
    });
  });

  describe('reorderRules', () => {
    it('moves a rule from one position to another', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = addFormattingRule(s, makeRule('r-2', 'b'));
      s = addFormattingRule(s, makeRule('r-3', 'c'));
      s = reorderRules(s, 0, 2);
      expect(s.rules.map(r => r.id)).toEqual(['r-2', 'r-3', 'r-1']);
    });

    it('returns state unchanged for out-of-bounds fromIndex', () => {
      const s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      const s2 = reorderRules(s, -1, 0);
      expect(s2).toBe(s);
    });

    it('returns state unchanged for out-of-bounds toIndex', () => {
      const s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      const s2 = reorderRules(s, 0, 5);
      expect(s2).toBe(s);
    });

    it('does not mutate original array', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'a'));
      s = addFormattingRule(s, makeRule('r-2', 'b'));
      const original = s.rules.map(r => r.id);
      reorderRules(s, 0, 1);
      expect(s.rules.map(r => r.id)).toEqual(original);
    });
  });

  describe('startEditFormattingRule / commitRule', () => {
    it('startEditRule sets editing state', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      s = startEditFormattingRule(s, 'r-1');
      expect(s.editingRuleId).toBe('r-1');
      expect(s.ruleDraft?.field).toBe('revenue');
    });

    it('startEditFormattingRule returns state for nonexistent id', () => {
      const s = initialReportFormattingState();
      const s2 = startEditFormattingRule(s, 'nonexistent');
      expect(s2.editingRuleId).toBeUndefined();
    });

    it('commitFormattingRule applies draft and clears editing state', () => {
      let s = addFormattingRule(initialReportFormattingState(), makeRule('r-1', 'revenue'));
      s = startEditFormattingRule(s, 'r-1');
      s = { ...s, ruleDraft: { ...s.ruleDraft, condition: 'lessThan' as const, value: 50 } };
      s = commitFormattingRule(s);
      expect(s.rules[0].condition).toBe('lessThan');
      expect(s.rules[0].value).toBe(50);
      expect(s.editingRuleId).toBeUndefined();
      expect(s.ruleDraft).toBeUndefined();
    });

    it('commitFormattingRule is a no-op when no editing state', () => {
      const s = initialReportFormattingState();
      const s2 = commitFormattingRule(s);
      expect(s2).toBe(s);
    });
  });
});
