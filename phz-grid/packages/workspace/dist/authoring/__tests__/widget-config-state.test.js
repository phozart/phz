import { describe, it, expect } from 'vitest';
import { createConfigForWidget, setActiveTab, updateDataConfig, updateStyleConfig, addWidgetFilter, removeWidgetFilter, applyConfigToWidget, getAvailableAggregations, } from '../widget-config-state.js';
// --- Fixtures ---
function makeWidget(overrides) {
    return {
        id: 'w-1',
        type: 'bar-chart',
        morphGroup: 'category-chart',
        config: {
            title: 'Revenue by Region',
            subtitle: 'Q1 2026',
            colorScheme: 'blue',
            density: 'compact',
            padding: 'compact',
            showLegend: true,
            showLabels: false,
        },
        dataConfig: {
            dimensions: [{ field: 'region' }],
            measures: [
                { field: 'revenue', aggregation: 'sum' },
                { field: 'cost', aggregation: 'avg' },
            ],
            filters: [{ field: 'status', operator: 'eq', value: 'active' }],
        },
        position: { row: 0, col: 0, colSpan: 4, rowSpan: 2 },
        ...overrides,
    };
}
function makeFilter(id, field = 'region') {
    return {
        filterId: id,
        field,
        operator: 'equals',
        value: 'US',
        label: `${field}: US`,
    };
}
function makeManifest(overrides) {
    return {
        type: 'bar-chart',
        category: 'chart',
        name: 'Bar Chart',
        description: 'A bar chart',
        requiredFields: [],
        supportedAggregations: ['sum', 'avg', 'count'],
        minSize: { cols: 2, rows: 2 },
        preferredSize: { cols: 4, rows: 3 },
        maxSize: { cols: 12, rows: 6 },
        supportedInteractions: [],
        variants: [],
        ...overrides,
    };
}
// --- Tests ---
describe('WidgetConfigPanelState', () => {
    describe('createConfigForWidget', () => {
        it('extracts dimensions from widget dataConfig', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            expect(config.dimensions).toEqual([{ field: 'region' }]);
        });
        it('extracts measures from widget dataConfig', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            expect(config.measures).toEqual([
                { field: 'revenue', aggregation: 'sum' },
                { field: 'cost', aggregation: 'avg' },
            ]);
        });
        it('builds aggregations map from measures', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            expect(config.aggregations).toEqual({ revenue: 'sum', cost: 'avg' });
        });
        it('reads title from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.title).toBe('Revenue by Region');
        });
        it('reads subtitle from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.subtitle).toBe('Q1 2026');
        });
        it('reads colorScheme from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.colorScheme).toBe('blue');
        });
        it('reads density from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.density).toBe('compact');
        });
        it('reads padding from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.padding).toBe('compact');
        });
        it('reads showLegend and showLabels from widget.config', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.showLegend).toBe(true);
            expect(config.showLabels).toBe(false);
        });
        it('defaults title to empty string when absent', () => {
            const widget = makeWidget({ config: {} });
            const config = createConfigForWidget(widget);
            expect(config.title).toBe('');
        });
        it('defaults density to "default" when absent', () => {
            const widget = makeWidget({ config: {} });
            const config = createConfigForWidget(widget);
            expect(config.density).toBe('default');
        });
        it('defaults padding to "default" when absent', () => {
            const widget = makeWidget({ config: {} });
            const config = createConfigForWidget(widget);
            expect(config.padding).toBe('default');
        });
        it('starts with activeTab "data"', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.activeTab).toBe('data');
        });
        it('starts with empty widgetFilters', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.widgetFilters).toEqual([]);
        });
        it('sets widgetId and widgetType', () => {
            const config = createConfigForWidget(makeWidget());
            expect(config.widgetId).toBe('w-1');
            expect(config.widgetType).toBe('bar-chart');
        });
        it('copies dimensions by value (not by reference)', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            config.dimensions.push({ field: 'extra' });
            expect(widget.dataConfig.dimensions).toHaveLength(1);
        });
    });
    describe('setActiveTab', () => {
        it('changes active tab to style', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = setActiveTab(base, 'style');
            expect(updated.activeTab).toBe('style');
        });
        it('changes active tab to filters', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = setActiveTab(base, 'filters');
            expect(updated.activeTab).toBe('filters');
        });
        it('does not mutate original state', () => {
            const base = createConfigForWidget(makeWidget());
            setActiveTab(base, 'style');
            expect(base.activeTab).toBe('data');
        });
    });
    describe('updateDataConfig', () => {
        it('updates dimensions when provided', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateDataConfig(base, {
                dimensions: [{ field: 'country' }, { field: 'city' }],
            });
            expect(updated.dimensions).toEqual([{ field: 'country' }, { field: 'city' }]);
        });
        it('preserves measures when only dimensions are updated', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateDataConfig(base, {
                dimensions: [{ field: 'country' }],
            });
            expect(updated.measures).toEqual(base.measures);
        });
        it('updates measures and syncs aggregations', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateDataConfig(base, {
                measures: [{ field: 'profit', aggregation: 'max' }],
            });
            expect(updated.measures).toEqual([{ field: 'profit', aggregation: 'max' }]);
            expect(updated.aggregations.profit).toBe('max');
        });
        it('preserves existing aggregation keys when adding new measures', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateDataConfig(base, {
                measures: [
                    { field: 'revenue', aggregation: 'sum' },
                    { field: 'profit', aggregation: 'min' },
                ],
            });
            expect(updated.aggregations.revenue).toBe('sum');
            expect(updated.aggregations.profit).toBe('min');
            // Old keys from prior measures are preserved
            expect(updated.aggregations.cost).toBe('avg');
        });
        it('does not mutate original state', () => {
            const base = createConfigForWidget(makeWidget());
            const originalDims = [...base.dimensions];
            updateDataConfig(base, { dimensions: [{ field: 'new' }] });
            expect(base.dimensions).toEqual(originalDims);
        });
    });
    describe('updateStyleConfig', () => {
        it('updates title', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateStyleConfig(base, { title: 'New Title' });
            expect(updated.title).toBe('New Title');
        });
        it('updates multiple style fields at once', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateStyleConfig(base, {
                density: 'default',
                showLegend: false,
                colorScheme: 'green',
            });
            expect(updated.density).toBe('default');
            expect(updated.showLegend).toBe(false);
            expect(updated.colorScheme).toBe('green');
        });
        it('preserves non-updated fields', () => {
            const base = createConfigForWidget(makeWidget());
            const updated = updateStyleConfig(base, { title: 'X' });
            expect(updated.subtitle).toBe('Q1 2026');
            expect(updated.density).toBe('compact');
        });
        it('does not mutate original state', () => {
            const base = createConfigForWidget(makeWidget());
            updateStyleConfig(base, { title: 'X' });
            expect(base.title).toBe('Revenue by Region');
        });
    });
    describe('addWidgetFilter', () => {
        it('adds a new filter', () => {
            const base = createConfigForWidget(makeWidget());
            const filter = makeFilter('f1');
            const updated = addWidgetFilter(base, filter);
            expect(updated.widgetFilters).toHaveLength(1);
            expect(updated.widgetFilters[0]).toEqual(filter);
        });
        it('replaces existing filter with same filterId', () => {
            const base = createConfigForWidget(makeWidget());
            const filter1 = makeFilter('f1', 'region');
            const withFilter = addWidgetFilter(base, filter1);
            const filter2 = { ...filter1, value: 'EU', label: 'region: EU' };
            const updated = addWidgetFilter(withFilter, filter2);
            expect(updated.widgetFilters).toHaveLength(1);
            expect(updated.widgetFilters[0].value).toBe('EU');
        });
        it('appends when filterId differs', () => {
            const base = createConfigForWidget(makeWidget());
            const f1 = makeFilter('f1', 'region');
            const f2 = makeFilter('f2', 'country');
            const updated = addWidgetFilter(addWidgetFilter(base, f1), f2);
            expect(updated.widgetFilters).toHaveLength(2);
        });
        it('does not mutate original state', () => {
            const base = createConfigForWidget(makeWidget());
            addWidgetFilter(base, makeFilter('f1'));
            expect(base.widgetFilters).toEqual([]);
        });
    });
    describe('removeWidgetFilter', () => {
        it('removes filter by filterId', () => {
            let state = createConfigForWidget(makeWidget());
            state = addWidgetFilter(state, makeFilter('f1'));
            state = addWidgetFilter(state, makeFilter('f2', 'country'));
            const updated = removeWidgetFilter(state, 'f1');
            expect(updated.widgetFilters).toHaveLength(1);
            expect(updated.widgetFilters[0].filterId).toBe('f2');
        });
        it('returns unchanged state when filterId not found', () => {
            let state = createConfigForWidget(makeWidget());
            state = addWidgetFilter(state, makeFilter('f1'));
            const updated = removeWidgetFilter(state, 'nonexistent');
            expect(updated.widgetFilters).toHaveLength(1);
        });
        it('does not mutate original state', () => {
            let state = createConfigForWidget(makeWidget());
            state = addWidgetFilter(state, makeFilter('f1'));
            const original = [...state.widgetFilters];
            removeWidgetFilter(state, 'f1');
            expect(state.widgetFilters).toEqual(original);
        });
    });
    describe('applyConfigToWidget', () => {
        it('writes dimensions and measures back to widget', () => {
            const widget = makeWidget();
            let config = createConfigForWidget(widget);
            config = updateDataConfig(config, {
                dimensions: [{ field: 'country' }],
                measures: [{ field: 'profit', aggregation: 'max' }],
            });
            const result = applyConfigToWidget(config, widget);
            expect(result.dataConfig.dimensions).toEqual([{ field: 'country' }]);
            expect(result.dataConfig.measures).toEqual([{ field: 'profit', aggregation: 'max' }]);
        });
        it('preserves existing explore filters from widget', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            const result = applyConfigToWidget(config, widget);
            expect(result.dataConfig.filters).toEqual([
                { field: 'status', operator: 'eq', value: 'active' },
            ]);
        });
        it('writes style properties to widget.config', () => {
            const widget = makeWidget();
            let config = createConfigForWidget(widget);
            config = updateStyleConfig(config, { title: 'Updated', density: 'default' });
            const result = applyConfigToWidget(config, widget);
            expect(result.config.title).toBe('Updated');
            expect(result.config.density).toBe('default');
        });
        it('preserves non-style config keys in widget.config', () => {
            const widget = makeWidget({ config: { title: 'Old', customKey: 42 } });
            const config = createConfigForWidget(widget);
            const result = applyConfigToWidget(config, widget);
            expect(result.config.customKey).toBe(42);
        });
        it('does not mutate the original widget', () => {
            const widget = makeWidget();
            const config = createConfigForWidget(widget);
            applyConfigToWidget(updateStyleConfig(config, { title: 'New' }), widget);
            expect(widget.config.title).toBe('Revenue by Region');
        });
    });
    describe('getAvailableAggregations', () => {
        it('returns manifest supportedAggregations when provided', () => {
            const manifest = makeManifest({ supportedAggregations: ['sum', 'avg', 'count'] });
            expect(getAvailableAggregations(manifest)).toEqual(['sum', 'avg', 'count']);
        });
        it('returns defaults when manifest is undefined', () => {
            expect(getAvailableAggregations()).toEqual([
                'sum', 'avg', 'min', 'max', 'count', 'count_distinct',
            ]);
        });
        it('returns defaults when manifest has empty supportedAggregations', () => {
            const manifest = makeManifest({ supportedAggregations: [] });
            expect(getAvailableAggregations(manifest)).toEqual([
                'sum', 'avg', 'min', 'max', 'count', 'count_distinct',
            ]);
        });
    });
});
//# sourceMappingURL=widget-config-state.test.js.map