import { describe, it, expect } from 'vitest';
import { initialCrossFilterRuleState, addRule, removeRule, updateRule, startEditRule, commitRule, cancelEditRule, autoSuggestFieldMapping, validateRules, getCrossFilterMatrix, } from '../cross-filter-rule-state.js';
function makeRule(overrides = {}) {
    return {
        id: 'r-1',
        sourceWidgetId: 'w-a',
        targetWidgetId: 'w-b',
        fieldMapping: [{ sourceField: 'region', targetField: 'region' }],
        bidirectional: false,
        enabled: true,
        ...overrides,
    };
}
const widgetIds = ['w-a', 'w-b', 'w-c', 'w-d'];
describe('CrossFilterRuleState', () => {
    // ── CRUD ──────────────────────────────────────────────────────
    describe('initialCrossFilterRuleState', () => {
        it('creates empty state', () => {
            const s = initialCrossFilterRuleState();
            expect(s.rules).toEqual([]);
            expect(s.editingRuleId).toBeUndefined();
            expect(s.editingDraft).toBeUndefined();
            expect(s.validationErrors).toEqual([]);
        });
    });
    describe('addRule', () => {
        it('appends a rule to the list', () => {
            const s = addRule(initialCrossFilterRuleState(), makeRule());
            expect(s.rules).toHaveLength(1);
            expect(s.rules[0].id).toBe('r-1');
        });
        it('does not mutate original state', () => {
            const original = initialCrossFilterRuleState();
            addRule(original, makeRule());
            expect(original.rules).toHaveLength(0);
        });
    });
    describe('removeRule', () => {
        it('removes a rule by id', () => {
            let s = addRule(initialCrossFilterRuleState(), makeRule({ id: 'r-1' }));
            s = addRule(s, makeRule({ id: 'r-2', sourceWidgetId: 'w-c' }));
            s = removeRule(s, 'r-1');
            expect(s.rules).toHaveLength(1);
            expect(s.rules[0].id).toBe('r-2');
        });
        it('returns state unchanged for nonexistent id', () => {
            const s = addRule(initialCrossFilterRuleState(), makeRule());
            const s2 = removeRule(s, 'nonexistent');
            expect(s2.rules).toHaveLength(1);
        });
    });
    describe('updateRule', () => {
        it('partially updates a rule', () => {
            let s = addRule(initialCrossFilterRuleState(), makeRule());
            s = updateRule(s, 'r-1', { enabled: false });
            expect(s.rules[0].enabled).toBe(false);
            expect(s.rules[0].sourceWidgetId).toBe('w-a');
        });
        it('returns state unchanged for nonexistent id', () => {
            const s = addRule(initialCrossFilterRuleState(), makeRule());
            const s2 = updateRule(s, 'nonexistent', { enabled: false });
            expect(s2).toBe(s);
        });
    });
    // ── Edit flow ─────────────────────────────────────────────────
    describe('edit flow', () => {
        it('startEditRule loads draft from existing rule', () => {
            let s = addRule(initialCrossFilterRuleState(), makeRule());
            s = startEditRule(s, 'r-1');
            expect(s.editingRuleId).toBe('r-1');
            expect(s.editingDraft).toBeDefined();
            expect(s.editingDraft?.sourceWidgetId).toBe('w-a');
        });
        it('commitRule saves draft back into rules', () => {
            let s = addRule(initialCrossFilterRuleState(), makeRule());
            s = startEditRule(s, 'r-1');
            s = {
                ...s,
                editingDraft: { ...s.editingDraft, bidirectional: true },
            };
            s = commitRule(s);
            expect(s.rules[0].bidirectional).toBe(true);
            expect(s.editingRuleId).toBeUndefined();
            expect(s.editingDraft).toBeUndefined();
        });
        it('cancelEditRule discards draft', () => {
            let s = addRule(initialCrossFilterRuleState(), makeRule());
            s = startEditRule(s, 'r-1');
            s = cancelEditRule(s);
            expect(s.editingRuleId).toBeUndefined();
            expect(s.editingDraft).toBeUndefined();
            expect(s.rules[0].bidirectional).toBe(false); // unchanged
        });
        it('commitRule is no-op without draft', () => {
            const s = addRule(initialCrossFilterRuleState(), makeRule());
            const s2 = commitRule(s);
            expect(s2).toBe(s);
        });
    });
    // ── autoSuggestFieldMapping ───────────────────────────────────
    describe('autoSuggestFieldMapping', () => {
        it('matches fields by name (case-insensitive)', () => {
            const source = [
                { name: 'Region', dataType: 'string', nullable: false },
                { name: 'Amount', dataType: 'number', nullable: false },
            ];
            const target = [
                { name: 'region', dataType: 'string', nullable: false },
                { name: 'amount', dataType: 'number', nullable: false },
            ];
            const mappings = autoSuggestFieldMapping(source, target);
            expect(mappings).toHaveLength(2);
            expect(mappings[0]).toEqual({ sourceField: 'Region', targetField: 'region' });
            expect(mappings[1]).toEqual({ sourceField: 'Amount', targetField: 'amount' });
        });
        it('falls back to dataType + cardinality matching', () => {
            const source = [
                { name: 'sales_region', dataType: 'string', nullable: false, cardinality: 'low' },
            ];
            const target = [
                { name: 'area_code', dataType: 'string', nullable: false, cardinality: 'low' },
            ];
            const mappings = autoSuggestFieldMapping(source, target);
            expect(mappings).toHaveLength(1);
            expect(mappings[0]).toEqual({
                sourceField: 'sales_region',
                targetField: 'area_code',
            });
        });
        it('returns empty array when no matches found', () => {
            const source = [
                { name: 'foo', dataType: 'string', nullable: false, cardinality: 'high' },
            ];
            const target = [
                { name: 'bar', dataType: 'number', nullable: false, cardinality: 'low' },
            ];
            const mappings = autoSuggestFieldMapping(source, target);
            expect(mappings).toEqual([]);
        });
    });
    // ── validateRules ─────────────────────────────────────────────
    describe('validateRules', () => {
        it('returns valid for well-formed rules', () => {
            const rules = [makeRule()];
            const result = validateRules(rules, widgetIds);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('catches self-referencing rules', () => {
            const rules = [makeRule({ sourceWidgetId: 'w-a', targetWidgetId: 'w-a' })];
            const result = validateRules(rules, widgetIds);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('self-reference'))).toBe(true);
        });
        it('catches missing widget ids', () => {
            const rules = [makeRule({ sourceWidgetId: 'w-missing' })];
            const result = validateRules(rules, widgetIds);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('w-missing'))).toBe(true);
        });
        it('detects circular bidirectional chains', () => {
            const rules = [
                makeRule({ id: 'r-1', sourceWidgetId: 'w-a', targetWidgetId: 'w-b', bidirectional: true }),
                makeRule({ id: 'r-2', sourceWidgetId: 'w-b', targetWidgetId: 'w-c', bidirectional: true }),
                makeRule({ id: 'r-3', sourceWidgetId: 'w-c', targetWidgetId: 'w-a', bidirectional: true }),
            ];
            const result = validateRules(rules, widgetIds);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('circular'))).toBe(true);
        });
        it('allows wildcard target', () => {
            const rules = [makeRule({ targetWidgetId: '*' })];
            const result = validateRules(rules, widgetIds);
            expect(result.valid).toBe(true);
        });
    });
    // ── getCrossFilterMatrix ──────────────────────────────────────
    describe('getCrossFilterMatrix', () => {
        it('returns adjacency list for simple rules', () => {
            const rules = [makeRule({ sourceWidgetId: 'w-a', targetWidgetId: 'w-b' })];
            const matrix = getCrossFilterMatrix(rules, widgetIds);
            expect(matrix['w-a']).toEqual(['w-b']);
        });
        it('expands wildcard target to all other widgets', () => {
            const rules = [makeRule({ sourceWidgetId: 'w-a', targetWidgetId: '*' })];
            const matrix = getCrossFilterMatrix(rules, widgetIds);
            expect(matrix['w-a']).toEqual(['w-b', 'w-c', 'w-d']);
        });
        it('bidirectional rules create symmetric entries', () => {
            const rules = [makeRule({ sourceWidgetId: 'w-a', targetWidgetId: 'w-b', bidirectional: true })];
            const matrix = getCrossFilterMatrix(rules, widgetIds);
            expect(matrix['w-a']).toContain('w-b');
            expect(matrix['w-b']).toContain('w-a');
        });
        it('skips disabled rules', () => {
            const rules = [makeRule({ enabled: false })];
            const matrix = getCrossFilterMatrix(rules, widgetIds);
            expect(matrix['w-a']).toBeUndefined();
        });
    });
});
//# sourceMappingURL=cross-filter-rule-state.test.js.map