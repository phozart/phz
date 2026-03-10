import { describe, it, expect, beforeEach } from 'vitest';
import { suggestTemplatesForSource, applyTemplate, saveAsTemplate, _resetTemplateWidgetCounter, } from '../template-selection.js';
import { templateId } from '../../types.js';
import { DEFAULT_TEMPLATES } from '../../templates/default-templates.js';
// --- Test Schema ---
const testSchema = {
    id: 'test-ds',
    name: 'Test Data',
    fields: [
        { name: 'region', dataType: 'string', nullable: false, cardinality: 'low', semanticHint: 'category' },
        { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
        { name: 'cost', dataType: 'number', nullable: false, semanticHint: 'measure' },
        { name: 'order_date', dataType: 'date', nullable: false, semanticHint: 'timestamp' },
    ],
};
const minimalSchema = {
    id: 'minimal-ds',
    name: 'Minimal Data',
    fields: [
        { name: 'id', dataType: 'string', nullable: false, cardinality: 'high', semanticHint: 'identifier' },
    ],
};
// --- Custom Templates for Testing ---
function makeTemplate(overrides) {
    return {
        id: templateId('tpl-test'),
        name: 'Test Template',
        description: 'A test template',
        category: 'test',
        layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [] },
        widgetSlots: [
            {
                slotId: 'slot-1',
                widgetType: 'bar-chart',
                defaultConfig: { stacked: false },
                fieldBindings: { value: 'measure_1', category: 'dimension_1' },
            },
        ],
        matchRules: [
            {
                requiredFieldTypes: [{ type: 'number', minCount: 1 }],
                weight: 10,
                rationale: 'Has numeric data',
            },
        ],
        tags: ['test'],
        builtIn: false,
        ...overrides,
    };
}
function makeZeroScoreTemplate() {
    return makeTemplate({
        id: templateId('tpl-zero'),
        name: 'Zero Score Template',
        matchRules: [], // no rules = zero total weight = score 0
    });
}
// --- Tests ---
describe('TemplateSelection', () => {
    beforeEach(() => {
        _resetTemplateWidgetCounter();
    });
    describe('suggestTemplatesForSource', () => {
        it('analyzes schema and returns ranked suggestions', () => {
            const suggestions = suggestTemplatesForSource(testSchema);
            expect(suggestions.length).toBeGreaterThan(0);
            // Should be sorted by score descending
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
            }
        });
        it('filters out score=0 templates', () => {
            const templates = [makeTemplate(), makeZeroScoreTemplate()];
            const suggestions = suggestTemplatesForSource(testSchema, templates);
            const ids = suggestions.map(s => s.template.id);
            expect(ids).not.toContain('tpl-zero');
        });
        it('uses DEFAULT_TEMPLATES when none provided', () => {
            const suggestions = suggestTemplatesForSource(testSchema);
            const templateIds = suggestions.map(s => s.template.id);
            // Some default templates should match the testSchema
            expect(templateIds.length).toBeGreaterThan(0);
            // Verify these come from defaults
            const defaultIds = new Set(DEFAULT_TEMPLATES.map(t => t.id));
            for (const id of templateIds) {
                expect(defaultIds.has(id)).toBe(true);
            }
        });
        it('uses custom templates when provided', () => {
            const custom = makeTemplate({ id: templateId('tpl-custom-1'), name: 'Custom' });
            const suggestions = suggestTemplatesForSource(testSchema, [custom]);
            expect(suggestions).toHaveLength(1);
            expect(suggestions[0].template.id).toBe('tpl-custom-1');
        });
        it('includes rationale from matched rules', () => {
            const template = makeTemplate({
                matchRules: [
                    { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'Has numeric data' },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].rationale).toContain('Has numeric data');
        });
        it('uses "General match" as rationale when no rationales', () => {
            const template = makeTemplate({
                matchRules: [
                    { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: '' },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].rationale).toBe('General match');
        });
        it('returns empty array when no templates match', () => {
            const template = makeTemplate({
                matchRules: [
                    { requiredFieldTypes: [{ type: 'boolean', minCount: 5 }], weight: 10, rationale: 'Needs booleans' },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions).toHaveLength(0);
        });
    });
    describe('buildPreviewDescription', () => {
        it('includes widget count', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('2 widgets');
        });
        it('includes singular "widget" for single-widget template', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toMatch(/\b1 widget\b/);
        });
        it('includes KPI cards when present', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('KPI cards');
        });
        it('includes charts when chart types present', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'line-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('charts');
        });
        it('includes data table when present', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'data-table', defaultConfig: {}, fieldBindings: { columns: 'all' } },
                ],
            });
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('data table');
        });
        it('includes time series when schema has date fields', () => {
            const template = makeTemplate();
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('time series');
        });
        it('includes multi-measure when schema has multiple measures', () => {
            const template = makeTemplate();
            const suggestions = suggestTemplatesForSource(testSchema, [template]);
            expect(suggestions[0].previewDescription).toContain('multi-measure');
        });
    });
    describe('applyTemplate', () => {
        it('creates DashboardEditorState with widgets from template', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.widgets).toHaveLength(2);
            expect(state.widgets[0].type).toBe('bar-chart');
            expect(state.widgets[1].type).toBe('kpi-card');
        });
        it('sets name from template', () => {
            const template = makeTemplate({ name: 'My Template' });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.name).toBe('My Template');
        });
        it('sets dataSourceId', () => {
            const template = makeTemplate();
            const state = applyTemplate(template, testSchema, 'ds-main');
            expect(state.dataSourceId).toBe('ds-main');
        });
        it('sets layout from template', () => {
            const layout = { kind: 'auto-grid', minItemWidth: 300, gap: 8, children: [] };
            const template = makeTemplate({ layout });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.layout).toEqual(layout);
        });
        it('binds fields from schema to widget data configs', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            const widget = state.widgets[0];
            // Revenue and cost are suggestedMeasures; region is suggestedDimension
            // autoBindFields maps 'value' -> first measure, 'category' -> first dimension
            const measureFields = widget.dataConfig.measures.map(m => m.field);
            const dimensionFields = widget.dataConfig.dimensions.map(d => d.field);
            // At least some fields should be bound
            expect(measureFields.length + dimensionFields.length).toBeGreaterThan(0);
        });
        it('assigns positions to widgets', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's3', widgetType: 'pie-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's4', widgetType: 'line-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            // Verify positions are assigned with the grid pattern
            expect(state.widgets[0].position).toEqual({ row: 0, col: 0, colSpan: 4, rowSpan: 2 });
            expect(state.widgets[1].position).toEqual({ row: 0, col: 4, colSpan: 4, rowSpan: 2 });
            expect(state.widgets[2].position).toEqual({ row: 0, col: 8, colSpan: 4, rowSpan: 2 });
            // 4th widget wraps to row 1
            expect(state.widgets[3].position).toEqual({ row: 1, col: 0, colSpan: 4, rowSpan: 2 });
        });
        it('generates unique widget ids', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.widgets[0].id).not.toBe(state.widgets[1].id);
            expect(state.widgets[0].id).toMatch(/^tpl_w_/);
        });
        it('sets morphGroup for each widget', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.widgets[0].morphGroup).toBe('category-chart');
            expect(state.widgets[1].morphGroup).toBe('single-value');
        });
        it('sets widget title from widget type', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.widgets[0].config.title).toBe('bar chart');
        });
        it('preserves defaultConfig from template slot', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: { stacked: true, horizontal: false }, fieldBindings: { value: 'm' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.widgets[0].config.stacked).toBe(true);
            expect(state.widgets[0].config.horizontal).toBe(false);
        });
        it('initializes filter bar config', () => {
            const template = makeTemplate();
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.filters.filters).toEqual([]);
            expect(state.filters.position).toBe('top');
            expect(state.filters.collapsible).toBe(true);
        });
        it('sets editor defaults', () => {
            const template = makeTemplate();
            const state = applyTemplate(template, testSchema, 'ds-1');
            expect(state.configPanelTab).toBe('data');
            expect(state.showFieldPalette).toBe(true);
            expect(state.showConfigPanel).toBe(false);
            expect(state.canvasZoom).toBe(1);
            expect(state.gridSnap).toBe(true);
        });
        it('skips "all" field binding (used for data-table columns)', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'data-table', defaultConfig: {}, fieldBindings: { columns: 'all' } },
                ],
            });
            const state = applyTemplate(template, testSchema, 'ds-1');
            const widget = state.widgets[0];
            // 'all' binding should not appear in dimensions or measures
            const allDims = widget.dataConfig.dimensions.map(d => d.field);
            const allMeasures = widget.dataConfig.measures.map(m => m.field);
            expect(allDims).not.toContain('all');
            expect(allMeasures).not.toContain('all');
        });
    });
    describe('saveAsTemplate', () => {
        it('creates TemplateDefinition from dashboard state', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'My Custom',
                description: 'A custom template',
                category: 'custom',
            });
            expect(saved.name).toBe('My Custom');
            expect(saved.description).toBe('A custom template');
            expect(saved.category).toBe('custom');
        });
        it('has builtIn=false', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.builtIn).toBe(false);
        });
        it('preserves layout from dashboard state', () => {
            const layout = { kind: 'auto-grid', minItemWidth: 300, gap: 8, children: [] };
            const template = makeTemplate({ layout });
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.layout).toEqual(layout);
        });
        it('creates widget slots from dashboard widgets', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'm', category: 'd' } },
                    { slotId: 's2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'm' } },
                ],
            });
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.widgetSlots).toHaveLength(2);
            expect(saved.widgetSlots[0].widgetType).toBe('bar-chart');
            expect(saved.widgetSlots[1].widgetType).toBe('kpi-card');
        });
        it('preserves widget configs in slot defaultConfig', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: { stacked: true }, fieldBindings: { value: 'm' } },
                ],
            });
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.widgetSlots[0].defaultConfig.stacked).toBe(true);
        });
        it('builds field bindings from widget data config', () => {
            const template = makeTemplate({
                widgetSlots: [
                    { slotId: 's1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
                ],
            });
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            // The saved template should have field bindings reflecting what was bound
            const fb = saved.widgetSlots[0].fieldBindings;
            expect(typeof fb).toBe('object');
        });
        it('has empty matchRules for custom templates', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.matchRules).toEqual([]);
        });
        it('uses provided tags', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
                tags: ['sales', 'quarterly'],
            });
            expect(saved.tags).toEqual(['sales', 'quarterly']);
        });
        it('defaults tags to empty array', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.tags).toEqual([]);
        });
        it('generates a template id', () => {
            const template = makeTemplate();
            const dashState = applyTemplate(template, testSchema, 'ds-1');
            const saved = saveAsTemplate(dashState, {
                name: 'Custom',
                description: 'desc',
                category: 'cat',
            });
            expect(saved.id).toMatch(/^tpl_custom_/);
        });
    });
});
//# sourceMappingURL=template-selection.test.js.map