import { describe, it, expect } from 'vitest';
import { getWidgetLibrary, getWidgetsByCategory, getWidgetByType, getWidgetsInMorphGroup, } from '../widget-library.js';
describe('widget-library', () => {
    describe('getWidgetLibrary', () => {
        it('returns all 13 widgets', () => {
            const lib = getWidgetLibrary();
            expect(lib).toHaveLength(13);
        });
        it('returns a copy, not a reference to the internal array', () => {
            const a = getWidgetLibrary();
            const b = getWidgetLibrary();
            expect(a).not.toBe(b);
            expect(a).toEqual(b);
        });
        it('mutating the returned array does not affect subsequent calls', () => {
            const first = getWidgetLibrary();
            first.push({
                type: 'custom',
                name: 'Custom',
                icon: 'custom',
                category: 'chart',
                morphGroup: 'category-chart',
                description: 'Custom widget',
                defaultSize: { colSpan: 1, rowSpan: 1 },
            });
            const second = getWidgetLibrary();
            expect(second).toHaveLength(13);
        });
        it('every widget has all required fields', () => {
            const lib = getWidgetLibrary();
            for (const entry of lib) {
                expect(entry.type).toBeTruthy();
                expect(entry.name).toBeTruthy();
                expect(entry.icon).toBeTruthy();
                expect(entry.category).toBeTruthy();
                expect(entry.morphGroup).toBeTruthy();
                expect(entry.description).toBeTruthy();
                expect(entry.defaultSize).toBeDefined();
                expect(entry.defaultSize.colSpan).toBeDefined();
                expect(entry.defaultSize.rowSpan).toBeDefined();
            }
        });
        it('every widget has positive colSpan and rowSpan', () => {
            const lib = getWidgetLibrary();
            for (const entry of lib) {
                expect(entry.defaultSize.colSpan).toBeGreaterThan(0);
                expect(entry.defaultSize.rowSpan).toBeGreaterThan(0);
            }
        });
        it('all widget types are unique', () => {
            const lib = getWidgetLibrary();
            const types = lib.map(e => e.type);
            expect(new Set(types).size).toBe(types.length);
        });
    });
    describe('getWidgetsByCategory', () => {
        it('groups into 5 categories', () => {
            const map = getWidgetsByCategory();
            expect(map.size).toBe(5);
        });
        it('has 4 chart widgets', () => {
            const map = getWidgetsByCategory();
            expect(map.get('chart')).toHaveLength(4);
        });
        it('has 4 single-value widgets', () => {
            const map = getWidgetsByCategory();
            expect(map.get('single-value')).toHaveLength(4);
        });
        it('has 2 tabular widgets', () => {
            const map = getWidgetsByCategory();
            expect(map.get('tabular')).toHaveLength(2);
        });
        it('has 2 text widgets', () => {
            const map = getWidgetsByCategory();
            expect(map.get('text')).toHaveLength(2);
        });
        it('has 1 navigation widget', () => {
            const map = getWidgetsByCategory();
            expect(map.get('navigation')).toHaveLength(1);
        });
        it('category totals sum to 13', () => {
            const map = getWidgetsByCategory();
            let total = 0;
            for (const [, entries] of map) {
                total += entries.length;
            }
            expect(total).toBe(13);
        });
        it('chart widgets include bar-chart, line-chart, area-chart, pie-chart', () => {
            const map = getWidgetsByCategory();
            const chartTypes = map.get('chart').map(e => e.type);
            expect(chartTypes).toContain('bar-chart');
            expect(chartTypes).toContain('line-chart');
            expect(chartTypes).toContain('area-chart');
            expect(chartTypes).toContain('pie-chart');
        });
    });
    describe('morph group consistency', () => {
        it('all chart widgets have category-chart morph group', () => {
            const map = getWidgetsByCategory();
            for (const entry of map.get('chart')) {
                expect(entry.morphGroup).toBe('category-chart');
            }
        });
        it('all single-value widgets have single-value morph group', () => {
            const map = getWidgetsByCategory();
            for (const entry of map.get('single-value')) {
                expect(entry.morphGroup).toBe('single-value');
            }
        });
        it('all tabular widgets have tabular morph group', () => {
            const map = getWidgetsByCategory();
            for (const entry of map.get('tabular')) {
                expect(entry.morphGroup).toBe('tabular');
            }
        });
        it('all text widgets have text morph group', () => {
            const map = getWidgetsByCategory();
            for (const entry of map.get('text')) {
                expect(entry.morphGroup).toBe('text');
            }
        });
        it('all navigation widgets have navigation morph group', () => {
            const map = getWidgetsByCategory();
            for (const entry of map.get('navigation')) {
                expect(entry.morphGroup).toBe('navigation');
            }
        });
    });
    describe('getWidgetByType', () => {
        it('finds bar-chart', () => {
            const entry = getWidgetByType('bar-chart');
            expect(entry).toBeDefined();
            expect(entry.name).toBe('Bar Chart');
            expect(entry.category).toBe('chart');
        });
        it('finds kpi-card', () => {
            const entry = getWidgetByType('kpi-card');
            expect(entry).toBeDefined();
            expect(entry.name).toBe('KPI Card');
            expect(entry.morphGroup).toBe('single-value');
        });
        it('finds data-table', () => {
            const entry = getWidgetByType('data-table');
            expect(entry).toBeDefined();
            expect(entry.category).toBe('tabular');
        });
        it('finds drill-link', () => {
            const entry = getWidgetByType('drill-link');
            expect(entry).toBeDefined();
            expect(entry.category).toBe('navigation');
        });
        it('returns undefined for unknown type', () => {
            const entry = getWidgetByType('non-existent-widget');
            expect(entry).toBeUndefined();
        });
        it('returns undefined for empty string', () => {
            const entry = getWidgetByType('');
            expect(entry).toBeUndefined();
        });
    });
    describe('getWidgetsInMorphGroup', () => {
        it('returns 4 widgets for category-chart', () => {
            const widgets = getWidgetsInMorphGroup('category-chart');
            expect(widgets).toHaveLength(4);
            const types = widgets.map(w => w.type);
            expect(types).toContain('bar-chart');
            expect(types).toContain('line-chart');
            expect(types).toContain('area-chart');
            expect(types).toContain('pie-chart');
        });
        it('returns 4 widgets for single-value', () => {
            const widgets = getWidgetsInMorphGroup('single-value');
            expect(widgets).toHaveLength(4);
            const types = widgets.map(w => w.type);
            expect(types).toContain('kpi-card');
            expect(types).toContain('gauge');
            expect(types).toContain('kpi-scorecard');
            expect(types).toContain('trend-line');
        });
        it('returns 2 widgets for tabular', () => {
            const widgets = getWidgetsInMorphGroup('tabular');
            expect(widgets).toHaveLength(2);
            const types = widgets.map(w => w.type);
            expect(types).toContain('data-table');
            expect(types).toContain('pivot-table');
        });
        it('returns 2 widgets for text', () => {
            const widgets = getWidgetsInMorphGroup('text');
            expect(widgets).toHaveLength(2);
            const types = widgets.map(w => w.type);
            expect(types).toContain('text-block');
            expect(types).toContain('heading');
        });
        it('returns 1 widget for navigation', () => {
            const widgets = getWidgetsInMorphGroup('navigation');
            expect(widgets).toHaveLength(1);
            expect(widgets[0].type).toBe('drill-link');
        });
        it('all returned widgets have the requested morph group', () => {
            const groups = ['category-chart', 'single-value', 'tabular', 'text', 'navigation'];
            for (const group of groups) {
                const widgets = getWidgetsInMorphGroup(group);
                for (const w of widgets) {
                    expect(w.morphGroup).toBe(group);
                }
            }
        });
    });
});
//# sourceMappingURL=widget-library.test.js.map