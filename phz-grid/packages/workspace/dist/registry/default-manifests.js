/**
 * @phozart/phz-workspace — Default Widget Manifests
 *
 * Full WidgetManifest definitions for all 13 built-in widget types.
 */
export const DEFAULT_WIDGET_TYPES = [
    'kpi-card', 'kpi-scorecard',
    'bar-chart', 'pie-chart', 'trend-line', 'bottom-n',
    'gauge', 'line-chart', 'area-chart',
    'data-table', 'pivot-table', 'status-table',
    'drill-link',
];
const kpiCard = {
    type: 'kpi-card',
    category: 'kpis',
    name: 'KPI Card',
    description: 'Single metric display with optional trend indicator and comparison',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max', 'last'],
    minSize: { cols: 1, rows: 1 },
    preferredSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 4 },
    supportedInteractions: ['click-detail', 'drill-through'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Simple metric value', presetConfig: {} },
        { id: 'trend', name: 'With Trend', description: 'Metric with sparkline trend', presetConfig: { showTrend: true } },
        { id: 'comparison', name: 'With Comparison', description: 'Metric with period-over-period comparison', presetConfig: { showComparison: true } },
        { id: 'gauge', name: 'Gauge KPI', description: 'Metric displayed as gauge', presetConfig: { displayMode: 'gauge' } },
    ],
    responsiveBehavior: {
        compactBelow: 200,
        compactBehavior: { simplifyToSingleValue: true },
    },
};
const kpiScorecard = {
    type: 'kpi-scorecard',
    category: 'kpis',
    name: 'KPI Scorecard',
    description: 'Multiple KPIs in a grid layout with thresholds and status colors',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'label', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 6, rows: 3 },
    maxSize: { cols: 12, rows: 6 },
    supportedInteractions: ['click-detail', 'drill-through'],
    variants: [
        { id: 'grid', name: 'Grid Layout', description: 'KPIs in a grid', presetConfig: { layout: 'grid' } },
        { id: 'row', name: 'Row Layout', description: 'KPIs in a single row', presetConfig: { layout: 'row' } },
    ],
    responsiveBehavior: {
        compactBelow: 400,
        compactBehavior: { collapseToSummary: true },
    },
};
const barChart = {
    type: 'bar-chart',
    category: 'charts',
    name: 'Bar Chart',
    description: 'Vertical or horizontal bar chart with stacking and grouping options',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'category', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 4, rows: 3 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-csv', 'export-png'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Vertical bar chart', presetConfig: {} },
        { id: 'stacked', name: 'Stacked', description: 'Stacked bars', presetConfig: { stacked: true } },
        { id: 'grouped', name: 'Grouped', description: 'Side-by-side grouped bars', presetConfig: { grouped: true } },
        { id: 'horizontal', name: 'Horizontal', description: 'Horizontal bar chart', presetConfig: { horizontal: true } },
    ],
    responsiveBehavior: {
        compactBelow: 300,
        compactBehavior: { hideLegend: true, hideDataLabels: true },
    },
};
const pieChart = {
    type: 'pie-chart',
    category: 'charts',
    name: 'Pie Chart',
    description: 'Circular chart showing proportional data distribution',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'category', dataType: 'string', role: 'category', required: true },
    ],
    supportedAggregations: ['sum', 'count'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 4, rows: 4 },
    maxSize: { cols: 8, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-png'],
    variants: [
        { id: 'standard', name: 'Pie', description: 'Standard pie chart', presetConfig: {} },
        { id: 'donut', name: 'Donut', description: 'Donut chart with center hole', presetConfig: { donut: true } },
        { id: 'semi', name: 'Semi-Circle', description: 'Half-circle chart', presetConfig: { semiCircle: true } },
    ],
    responsiveBehavior: {
        compactBelow: 250,
        compactBehavior: { hideLegend: true, hideDataLabels: true },
        minAspectRatio: 0.8,
        maxAspectRatio: 1.2,
    },
};
const trendLine = {
    type: 'trend-line',
    category: 'charts',
    name: 'Trend Line',
    description: 'Compact sparkline trend visualization for inline use',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'date', dataType: 'date', role: 'time', required: true },
    ],
    supportedAggregations: ['sum', 'avg'],
    minSize: { cols: 1, rows: 1 },
    preferredSize: { cols: 3, rows: 1 },
    maxSize: { cols: 6, rows: 2 },
    supportedInteractions: ['click-detail'],
    variants: [
        { id: 'line', name: 'Line', description: 'Simple trend line', presetConfig: {} },
        { id: 'area', name: 'Area Fill', description: 'Filled area trend', presetConfig: { fill: true } },
    ],
    responsiveBehavior: {
        compactBelow: 150,
        compactBehavior: { hideAxisLabels: true },
    },
};
const bottomN = {
    type: 'bottom-n',
    category: 'charts',
    name: 'Top/Bottom N',
    description: 'Ranked list showing top or bottom N values',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'label', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'max', 'min'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 3, rows: 4 },
    maxSize: { cols: 6, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter'],
    variants: [
        { id: 'bar', name: 'Bar List', description: 'Horizontal bars with labels', presetConfig: { display: 'bar' } },
        { id: 'list', name: 'Simple List', description: 'Ranked text list', presetConfig: { display: 'list' } },
    ],
    responsiveBehavior: {
        compactBelow: 250,
        compactBehavior: { collapseToSummary: true },
    },
};
const gaugeWidget = {
    type: 'gauge',
    category: 'charts',
    name: 'Gauge',
    description: 'Radial gauge showing a value against a target or range',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'last'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 3, rows: 3 },
    maxSize: { cols: 6, rows: 6 },
    supportedInteractions: ['click-detail'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Full circle gauge', presetConfig: {} },
        { id: 'half', name: 'Half Gauge', description: 'Semi-circle gauge', presetConfig: { half: true } },
    ],
    responsiveBehavior: {
        compactBelow: 200,
        compactBehavior: { simplifyToSingleValue: true },
        minAspectRatio: 0.8,
    },
};
const lineChart = {
    type: 'line-chart',
    category: 'charts',
    name: 'Line Chart',
    description: 'Time series or continuous data visualization with multiple series support',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'date', dataType: 'date', role: 'time', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max'],
    minSize: { cols: 3, rows: 2 },
    preferredSize: { cols: 6, rows: 4 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-csv', 'export-png'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Straight line segments', presetConfig: {} },
        { id: 'smooth', name: 'Smooth', description: 'Curved interpolation', presetConfig: { smooth: true } },
        { id: 'stepped', name: 'Stepped', description: 'Step-function lines', presetConfig: { stepped: true } },
    ],
    responsiveBehavior: {
        compactBelow: 350,
        compactBehavior: { hideLegend: true, hideAxisLabels: true },
    },
};
const areaChart = {
    type: 'area-chart',
    category: 'charts',
    name: 'Area Chart',
    description: 'Filled area chart for showing volume over time',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'date', dataType: 'date', role: 'time', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count'],
    minSize: { cols: 3, rows: 2 },
    preferredSize: { cols: 6, rows: 4 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-csv', 'export-png'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Filled area', presetConfig: {} },
        { id: 'stacked', name: 'Stacked', description: 'Stacked area layers', presetConfig: { stacked: true } },
    ],
    responsiveBehavior: {
        compactBelow: 350,
        compactBehavior: { hideLegend: true },
    },
};
const dataTable = {
    type: 'data-table',
    category: 'tables',
    name: 'Data Table',
    description: 'Tabular data display with sorting, filtering, and pagination',
    requiredFields: [
        { name: 'columns', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max'],
    minSize: { cols: 3, rows: 3 },
    preferredSize: { cols: 6, rows: 5 },
    maxSize: { cols: 12, rows: 12 },
    supportedInteractions: ['drill-through', 'cross-filter', 'export-csv'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Default table', presetConfig: {} },
        { id: 'compact', name: 'Compact', description: 'Dense row display', presetConfig: { density: 'compact' } },
    ],
    responsiveBehavior: {
        compactBelow: 500,
        compactBehavior: { collapseToSummary: true },
    },
};
const pivotTable = {
    type: 'pivot-table',
    category: 'tables',
    name: 'Pivot Table',
    description: 'Cross-tabulation with row and column grouping and aggregation',
    requiredFields: [
        { name: 'value', dataType: 'number', role: 'measure', required: true },
        { name: 'rowGroup', dataType: 'string', role: 'dimension', required: true },
    ],
    supportedAggregations: ['sum', 'avg', 'count', 'min', 'max'],
    minSize: { cols: 4, rows: 4 },
    preferredSize: { cols: 8, rows: 6 },
    maxSize: { cols: 12, rows: 12 },
    supportedInteractions: ['drill-through', 'export-csv'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Default pivot layout', presetConfig: {} },
        { id: 'heatmap', name: 'Heatmap', description: 'Color-coded cell values', presetConfig: { heatmap: true } },
    ],
    responsiveBehavior: {
        compactBelow: 600,
        compactBehavior: { collapseToSummary: true },
    },
};
const statusTable = {
    type: 'status-table',
    category: 'tables',
    name: 'Status Table',
    description: 'Table with conditional formatting, status indicators, and RAG colors',
    requiredFields: [
        { name: 'label', dataType: 'string', role: 'dimension', required: true },
        { name: 'status', dataType: 'string', role: 'category', required: true },
    ],
    supportedAggregations: ['count'],
    minSize: { cols: 3, rows: 2 },
    preferredSize: { cols: 5, rows: 4 },
    maxSize: { cols: 12, rows: 10 },
    supportedInteractions: ['click-detail', 'drill-through'],
    variants: [
        { id: 'standard', name: 'Standard', description: 'Status badges in table', presetConfig: {} },
        { id: 'card', name: 'Card View', description: 'Status cards layout', presetConfig: { display: 'card' } },
    ],
    responsiveBehavior: {
        compactBelow: 400,
        compactBehavior: { collapseToSummary: true },
    },
};
const drillLink = {
    type: 'drill-link',
    category: 'navigation',
    name: 'Drill Link',
    description: 'Navigation tile linking to another dashboard or report',
    requiredFields: [],
    supportedAggregations: [],
    minSize: { cols: 1, rows: 1 },
    preferredSize: { cols: 2, rows: 1 },
    maxSize: { cols: 4, rows: 2 },
    supportedInteractions: ['click-detail'],
    variants: [
        { id: 'tile', name: 'Tile', description: 'Standard navigation tile', presetConfig: {} },
        { id: 'button', name: 'Button', description: 'Styled as a button', presetConfig: { display: 'button' } },
    ],
    responsiveBehavior: {
        compactBelow: 120,
        compactBehavior: { simplifyToSingleValue: true },
    },
};
const ALL_MANIFESTS = [
    kpiCard, kpiScorecard,
    barChart, pieChart, trendLine, bottomN,
    gaugeWidget, lineChart, areaChart,
    dataTable, pivotTable, statusTable,
    drillLink,
];
export function registerDefaultManifests(registry) {
    for (const manifest of ALL_MANIFESTS) {
        registry.registerManifest(manifest);
    }
}
//# sourceMappingURL=default-manifests.js.map