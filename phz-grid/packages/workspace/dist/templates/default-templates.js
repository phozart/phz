/**
 * @phozart/workspace — Default Templates
 *
 * 9 built-in dashboard templates covering common BI scenarios.
 */
import { templateId } from '../types.js';
function grid(children, minItemWidth = 200, gap = 16) {
    return { kind: 'auto-grid', minItemWidth, gap, children };
}
function widget(widgetId, weight) {
    return { kind: 'widget', widgetId, weight };
}
function sections(secs) {
    return { kind: 'sections', sections: secs.map(s => ({ ...s })) };
}
export const DEFAULT_TEMPLATES = [
    {
        id: templateId('tpl-kpi-overview'),
        name: 'KPI Overview',
        description: 'Top-level KPI cards with a supporting trend chart',
        category: 'overview',
        layout: sections([
            { title: 'Key Metrics', children: [grid([widget('kpi-1'), widget('kpi-2'), widget('kpi-3')])] },
            { title: 'Trend', children: [widget('trend-1')] },
        ]),
        widgetSlots: [
            { slotId: 'kpi-1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
            { slotId: 'kpi-2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_2' } },
            { slotId: 'kpi-3', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_3' } },
            { slotId: 'trend-1', widgetType: 'trend-line', defaultConfig: {}, fieldBindings: { value: 'measure_1', date: 'date_field' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 10, rationale: 'Has numeric data for KPIs' },
        ],
        tags: ['kpi', 'overview', 'executive'],
        builtIn: true,
    },
    {
        id: templateId('tpl-comparison-board'),
        name: 'Comparison Board',
        description: 'Side-by-side bar charts comparing categories across measures',
        category: 'analytics',
        layout: grid([widget('bar-1', 2), widget('bar-2', 2)]),
        widgetSlots: [
            { slotId: 'bar-1', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
            { slotId: 'bar-2', widgetType: 'bar-chart', defaultConfig: {}, fieldBindings: { value: 'measure_2', category: 'dimension_1' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 2 }], weight: 10, rationale: 'Multiple measures to compare' },
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 5, rationale: 'Has categories for grouping' },
        ],
        tags: ['comparison', 'bar-chart', 'analytics'],
        builtIn: true,
    },
    {
        id: templateId('tpl-time-series'),
        name: 'Time Series Dashboard',
        description: 'Line and area charts showing metrics over time',
        category: 'analytics',
        layout: sections([
            { title: 'Overview', children: [grid([widget('kpi-1'), widget('kpi-2')])] },
            { title: 'Trends', children: [widget('line-1'), widget('area-1')] },
        ]),
        widgetSlots: [
            { slotId: 'kpi-1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
            { slotId: 'kpi-2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_2' } },
            { slotId: 'line-1', widgetType: 'line-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', date: 'date_field' } },
            { slotId: 'area-1', widgetType: 'area-chart', defaultConfig: {}, fieldBindings: { value: 'measure_2', date: 'date_field' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'date', minCount: 1 }], weight: 15, rationale: 'Has date field for time series' },
            { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 5, rationale: 'Has numeric measures' },
        ],
        tags: ['time-series', 'line-chart', 'trend'],
        builtIn: true,
    },
    {
        id: templateId('tpl-tabular-report'),
        name: 'Tabular Report',
        description: 'Data table with summary KPIs at the top',
        category: 'reports',
        layout: sections([
            { title: 'Summary', children: [grid([widget('kpi-1')])] },
            { title: 'Detail', children: [widget('table-1')] },
        ]),
        widgetSlots: [
            { slotId: 'kpi-1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
            { slotId: 'table-1', widgetType: 'data-table', defaultConfig: {}, fieldBindings: { columns: 'all' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 10, rationale: 'Has categorical data for table columns' },
        ],
        tags: ['table', 'report', 'tabular'],
        builtIn: true,
    },
    {
        id: templateId('tpl-scorecard'),
        name: 'Scorecard',
        description: 'KPI scorecard with multiple metrics and thresholds',
        category: 'overview',
        layout: grid([widget('scorecard-1')], 300),
        widgetSlots: [
            { slotId: 'scorecard-1', widgetType: 'kpi-scorecard', defaultConfig: {}, fieldBindings: { value: 'measure_1', label: 'dimension_1' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 2 }], weight: 10, rationale: 'Multiple KPI values' },
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 5, rationale: 'Labels for KPIs' },
        ],
        tags: ['scorecard', 'kpi', 'metrics'],
        builtIn: true,
    },
    {
        id: templateId('tpl-executive-summary'),
        name: 'Executive Summary',
        description: 'High-level KPIs, pie chart distribution, and trend',
        category: 'overview',
        layout: sections([
            { title: 'Headlines', children: [grid([widget('kpi-1'), widget('kpi-2'), widget('kpi-3')])] },
            { title: 'Distribution', children: [grid([widget('pie-1'), widget('trend-1')])] },
        ]),
        widgetSlots: [
            { slotId: 'kpi-1', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
            { slotId: 'kpi-2', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_2' } },
            { slotId: 'kpi-3', widgetType: 'kpi-card', defaultConfig: {}, fieldBindings: { value: 'measure_3' } },
            { slotId: 'pie-1', widgetType: 'pie-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
            { slotId: 'trend-1', widgetType: 'trend-line', defaultConfig: {}, fieldBindings: { value: 'measure_1', date: 'date_field' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 2 }], weight: 10, rationale: 'Multiple metrics for executive view' },
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 5, rationale: 'Categories for distribution' },
        ],
        tags: ['executive', 'overview', 'summary'],
        builtIn: true,
    },
    {
        id: templateId('tpl-detail-drill'),
        name: 'Detail Drill',
        description: 'Table with drill links for navigating to detail views',
        category: 'reports',
        layout: sections([
            { title: 'Navigation', children: [grid([widget('drill-1'), widget('drill-2')])] },
            { title: 'Data', children: [widget('table-1')] },
        ]),
        widgetSlots: [
            { slotId: 'drill-1', widgetType: 'drill-link', defaultConfig: { label: 'View Details' }, fieldBindings: {} },
            { slotId: 'drill-2', widgetType: 'drill-link', defaultConfig: { label: 'View Summary' }, fieldBindings: {} },
            { slotId: 'table-1', widgetType: 'data-table', defaultConfig: {}, fieldBindings: { columns: 'all' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'string', minCount: 2 }], weight: 10, rationale: 'Rich categorical data for drill-down' },
        ],
        tags: ['drill', 'detail', 'navigation'],
        builtIn: true,
    },
    {
        id: templateId('tpl-distribution'),
        name: 'Distribution Analysis',
        description: 'Pie charts and bottom-N rankings for distribution analysis',
        category: 'analytics',
        layout: grid([widget('pie-1', 2), widget('bottom-1', 2)]),
        widgetSlots: [
            { slotId: 'pie-1', widgetType: 'pie-chart', defaultConfig: {}, fieldBindings: { value: 'measure_1', category: 'dimension_1' } },
            { slotId: 'bottom-1', widgetType: 'bottom-n', defaultConfig: {}, fieldBindings: { value: 'measure_1', label: 'dimension_1' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 1 }], weight: 5, rationale: 'Has values to distribute' },
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 10, rationale: 'Has categories for distribution' },
        ],
        tags: ['distribution', 'pie-chart', 'ranking'],
        builtIn: true,
    },
    {
        id: templateId('tpl-operational-monitor'),
        name: 'Operational Monitor',
        description: 'Real-time gauges with status table for operational monitoring',
        category: 'operations',
        layout: sections([
            { title: 'Gauges', children: [grid([widget('gauge-1'), widget('gauge-2')])] },
            { title: 'Status', children: [widget('status-1')] },
        ]),
        widgetSlots: [
            { slotId: 'gauge-1', widgetType: 'gauge', defaultConfig: {}, fieldBindings: { value: 'measure_1' } },
            { slotId: 'gauge-2', widgetType: 'gauge', defaultConfig: {}, fieldBindings: { value: 'measure_2' } },
            { slotId: 'status-1', widgetType: 'status-table', defaultConfig: {}, fieldBindings: { label: 'dimension_1', status: 'status_field' } },
        ],
        matchRules: [
            { requiredFieldTypes: [{ type: 'number', minCount: 2 }], weight: 10, rationale: 'Multiple gauges needed' },
            { requiredFieldTypes: [{ type: 'string', minCount: 1 }], weight: 5, rationale: 'Status labels' },
        ],
        tags: ['operational', 'monitoring', 'gauge', 'status'],
        builtIn: true,
    },
];
export function registerDefaultTemplates(target) {
    target.push(...DEFAULT_TEMPLATES);
}
//# sourceMappingURL=default-templates.js.map