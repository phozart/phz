import { describe, it, expect, beforeEach } from 'vitest';
import { inferFilterDefaults, createFilterFromEntry, finalizeFilter, createDashboardFilterDef, _resetFilterIdCounter, } from '../filter-authoring.js';
describe('FilterAuthoring', () => {
    beforeEach(() => {
        _resetFilterIdCounter();
    });
    describe('inferFilterDefaults', () => {
        it('returns equals + boolean-toggle for boolean', () => {
            const result = inferFilterDefaults('boolean');
            expect(result).toEqual({ operator: 'equals', uiType: 'boolean-toggle' });
        });
        it('returns between + date-range for date', () => {
            const result = inferFilterDefaults('date');
            expect(result).toEqual({ operator: 'between', uiType: 'date-range' });
        });
        it('returns between + numeric-range for number', () => {
            const result = inferFilterDefaults('number');
            expect(result).toEqual({ operator: 'between', uiType: 'numeric-range' });
        });
        it('returns contains + search for string with no cardinality', () => {
            const result = inferFilterDefaults('string');
            expect(result).toEqual({ operator: 'contains', uiType: 'search' });
        });
        it('returns in + select for string with low cardinality', () => {
            const result = inferFilterDefaults('string', 'low');
            expect(result).toEqual({ operator: 'in', uiType: 'select' });
        });
        it('returns in + chip-select for string with medium cardinality', () => {
            const result = inferFilterDefaults('string', 'medium');
            expect(result).toEqual({ operator: 'in', uiType: 'chip-select' });
        });
        it('returns contains + search for string with high cardinality', () => {
            const result = inferFilterDefaults('string', 'high');
            expect(result).toEqual({ operator: 'contains', uiType: 'search' });
        });
        it('returns contains + search for unknown data type', () => {
            const result = inferFilterDefaults('unknown-type');
            expect(result).toEqual({ operator: 'contains', uiType: 'search' });
        });
    });
    describe('createFilterFromEntry', () => {
        it('uses "equals" for context-menu-filter-by-value with a value', () => {
            const state = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', 'US', 'low');
            expect(state.suggestedOperator).toBe('equals');
        });
        it('uses inferred operator for context-menu-filter-by-value without value', () => {
            const state = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', undefined, 'low');
            expect(state.suggestedOperator).toBe('in');
        });
        it('uses inferred operator for drag-field-to-filter-bar', () => {
            const state = createFilterFromEntry('drag-field-to-filter-bar', 'amount', 'number');
            expect(state.suggestedOperator).toBe('between');
            expect(state.suggestedUIType).toBe('numeric-range');
        });
        it('uses inferred operator for config-panel-filters-tab', () => {
            const state = createFilterFromEntry('config-panel-filters-tab', 'active', 'boolean');
            expect(state.suggestedOperator).toBe('equals');
            expect(state.suggestedUIType).toBe('boolean-toggle');
        });
        it('uses inferred operator for filter-bar-add-button', () => {
            const state = createFilterFromEntry('filter-bar-add-button', 'order_date', 'date');
            expect(state.suggestedOperator).toBe('between');
            expect(state.suggestedUIType).toBe('date-range');
        });
        it('uses inferred operator for context-menu-add-filter', () => {
            const state = createFilterFromEntry('context-menu-add-filter', 'category', 'string', undefined, 'medium');
            expect(state.suggestedOperator).toBe('in');
            expect(state.suggestedUIType).toBe('chip-select');
        });
        it('includes prefilledValue in the state', () => {
            const state = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', 'US');
            expect(state.prefilledValue).toBe('US');
        });
        it('sets prefilledValue to undefined when not provided', () => {
            const state = createFilterFromEntry('filter-bar-add-button', 'region', 'string');
            expect(state.prefilledValue).toBeUndefined();
        });
        it('preserves all entry point properties', () => {
            const entryPoints = [
                'drag-field-to-filter-bar',
                'context-menu-filter-by-value',
                'context-menu-add-filter',
                'config-panel-filters-tab',
                'filter-bar-add-button',
            ];
            for (const ep of entryPoints) {
                const state = createFilterFromEntry(ep, 'field', 'string');
                expect(state.entryPoint).toBe(ep);
                expect(state.field).toBe('field');
                expect(state.dataType).toBe('string');
            }
        });
    });
    describe('finalizeFilter', () => {
        it('creates FilterValue with unique filterId', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'region', 'string', 'US', 'low');
            const f1 = finalizeFilter(creation);
            const f2 = finalizeFilter(creation);
            expect(f1.filterId).not.toBe(f2.filterId);
        });
        it('uses suggested operator when no userChoices', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'amount', 'number');
            const result = finalizeFilter(creation);
            expect(result.operator).toBe('between');
        });
        it('uses userChoices operator when provided', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'amount', 'number');
            const result = finalizeFilter(creation, { operator: 'greaterThan' });
            expect(result.operator).toBe('greaterThan');
        });
        it('uses userChoices value when provided', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'amount', 'number');
            const result = finalizeFilter(creation, { value: 100 });
            expect(result.value).toBe(100);
        });
        it('falls back to prefilledValue when no userChoices value', () => {
            const creation = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', 'US');
            const result = finalizeFilter(creation);
            expect(result.value).toBe('US');
        });
        it('falls back to null when no prefilledValue and no userChoices value', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'region', 'string');
            const result = finalizeFilter(creation);
            expect(result.value).toBeNull();
        });
        it('sets field from creation state', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'category', 'string');
            const result = finalizeFilter(creation);
            expect(result.field).toBe('category');
        });
        it('formats label with "between" operator for array value', () => {
            const creation = {
                entryPoint: 'filter-bar-add-button',
                field: 'amount',
                dataType: 'number',
                suggestedOperator: 'between',
                suggestedUIType: 'numeric-range',
            };
            const result = finalizeFilter(creation, { value: [10, 100] });
            expect(result.label).toBe('amount: 10 \u2013 100');
        });
        it('formats label with "in" operator for array value', () => {
            const creation = {
                entryPoint: 'filter-bar-add-button',
                field: 'region',
                dataType: 'string',
                suggestedOperator: 'in',
                suggestedUIType: 'select',
            };
            const result = finalizeFilter(creation, { value: ['US', 'EU', 'APAC'] });
            expect(result.label).toBe('region: US, EU, APAC');
        });
        it('formats label with simple string value', () => {
            const creation = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', 'US');
            const result = finalizeFilter(creation);
            expect(result.label).toBe('region: US');
        });
        it('formats label with operator when value is null', () => {
            const creation = createFilterFromEntry('filter-bar-add-button', 'region', 'string');
            const result = finalizeFilter(creation);
            expect(result.label).toBe('region: contains');
        });
    });
    describe('createDashboardFilterDef', () => {
        it('creates DashboardFilterDef with default values', () => {
            const def = createDashboardFilterDef('region', 'ds-1');
            expect(def.field).toBe('region');
            expect(def.dataSourceId).toBe('ds-1');
            expect(def.label).toBe('region');
            expect(def.required).toBe(false);
            expect(def.appliesTo).toEqual([]);
            expect(def.id).toMatch(/^df_/);
        });
        it('uses provided label', () => {
            const def = createDashboardFilterDef('region', 'ds-1', { label: 'Region' });
            expect(def.label).toBe('Region');
        });
        it('uses provided filterType', () => {
            const def = createDashboardFilterDef('region', 'ds-1', { filterType: 'multi-select' });
            expect(def.filterType).toBe('multi-select');
        });
        it('uses default filterType when not provided', () => {
            const def = createDashboardFilterDef('region', 'ds-1');
            // inferFilterDefaults('string') returns { uiType: 'search' }
            expect(def.filterType).toBe('search');
        });
        it('uses provided required flag', () => {
            const def = createDashboardFilterDef('region', 'ds-1', { required: true });
            expect(def.required).toBe(true);
        });
        it('uses provided appliesTo list', () => {
            const def = createDashboardFilterDef('region', 'ds-1', {
                appliesTo: ['w-1', 'w-2'],
            });
            expect(def.appliesTo).toEqual(['w-1', 'w-2']);
        });
        it('generates unique ids', () => {
            const def1 = createDashboardFilterDef('a', 'ds');
            const def2 = createDashboardFilterDef('b', 'ds');
            expect(def1.id).not.toBe(def2.id);
        });
    });
    describe('all entry points produce valid FilterCreationState', () => {
        const entryPoints = [
            'drag-field-to-filter-bar',
            'context-menu-filter-by-value',
            'context-menu-add-filter',
            'config-panel-filters-tab',
            'filter-bar-add-button',
        ];
        for (const ep of entryPoints) {
            it(`${ep} produces valid state`, () => {
                const state = createFilterFromEntry(ep, 'test_field', 'string');
                expect(state.entryPoint).toBe(ep);
                expect(state.field).toBe('test_field');
                expect(state.dataType).toBe('string');
                expect(state.suggestedOperator).toBeDefined();
                expect(state.suggestedUIType).toBeDefined();
            });
        }
    });
});
//# sourceMappingURL=filter-authoring.test.js.map