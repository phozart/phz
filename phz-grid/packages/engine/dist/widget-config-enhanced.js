/**
 * @phozart/phz-engine — Enhanced Widget Configuration Types
 *
 * Rich per-widget configuration: data bindings, appearance, behaviour.
 * These extend the existing WidgetConfig types without breaking them.
 */
// --- Smart Defaults per Widget Type ---
function defaultContainer() {
    return { shadow: 'sm', borderRadius: 8, background: '#FFFFFF', border: false };
}
function defaultTitleBar(title) {
    return { show: true, title, fontSize: 14, fontWeight: 600, color: '#1C1917' };
}
function defaultBehaviour() {
    return { onClick: 'none', exportPng: true, exportCsv: false, autoRefresh: false };
}
export const SMART_DEFAULTS = {
    'kpi-card': () => ({
        type: 'kpi-card',
        name: 'KPI Card',
        data: { bindings: { type: 'kpi', kpiId: '' } },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('KPI Card'),
            kpi: { valueSize: 28, layout: 'vertical', alignment: 'center', showTrend: true, showTarget: true, showSparkline: true },
        },
        behaviour: defaultBehaviour(),
    }),
    'kpi-scorecard': () => ({
        type: 'kpi-scorecard',
        name: 'Scorecard',
        data: { bindings: { type: 'scorecard', kpiIds: [] } },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('KPI Scorecard'),
            scorecard: { density: 'compact', rowBanding: true, stickyHeader: true },
        },
        behaviour: defaultBehaviour(),
    }),
    'bar-chart': () => ({
        type: 'bar-chart',
        name: 'Bar Chart',
        data: {
            bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
            sort: { field: '', direction: 'desc' },
            limit: 10,
            groupOthers: false,
        },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Bar Chart'),
            chart: {
                height: 300, padding: 16,
                xAxis: { show: true, gridLines: false },
                yAxis: { show: true, gridLines: true },
                legend: { show: false, position: 'top' },
                dataLabels: { show: true, position: 'outside' },
                tooltip: { enabled: true },
                palette: 'phz-default',
                bar: { orientation: 'horizontal', gap: 4 },
            },
        },
        behaviour: { ...defaultBehaviour(), onClick: 'filter-others' },
    }),
    'trend-line': () => ({
        type: 'trend-line',
        name: 'Trend Line',
        data: {
            bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
        },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Trend Line'),
            chart: {
                height: 200, padding: 16,
                xAxis: { show: true, gridLines: false },
                yAxis: { show: true, gridLines: true },
                legend: { show: false, position: 'top' },
                dataLabels: { show: false, position: 'top' },
                tooltip: { enabled: true },
                palette: 'phz-default',
                line: { curve: 'smooth', strokeWidth: 2, showDots: true, fill: false },
            },
        },
        behaviour: defaultBehaviour(),
    }),
    'bottom-n': () => ({
        type: 'bottom-n',
        name: 'Bottom N',
        data: {
            bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
            limit: 5,
        },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Bottom N'),
            bottomN: { mode: 'bottom', count: 5, showRankNumber: true, highlightFirst: true },
        },
        behaviour: defaultBehaviour(),
    }),
    'pivot-table': () => ({
        type: 'pivot-table',
        name: 'Pivot Table',
        data: {
            bindings: { type: 'data-table', columns: [] },
        },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Pivot Table'),
        },
        behaviour: defaultBehaviour(),
    }),
    'data-table': () => ({
        type: 'data-table',
        name: 'Data Table',
        data: {
            bindings: { type: 'data-table', columns: [] },
        },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Data Table'),
        },
        behaviour: { ...defaultBehaviour(), exportCsv: true },
    }),
    'status-table': () => ({
        type: 'status-table',
        name: 'Status Table',
        data: { bindings: { type: 'status-table', entityField: { fieldKey: '' }, kpiIds: [] } },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Status Table'),
            scorecard: { density: 'compact', rowBanding: true, stickyHeader: true },
        },
        behaviour: defaultBehaviour(),
    }),
    'drill-link': () => ({
        type: 'drill-link',
        name: 'Drill Link',
        data: { bindings: { type: 'drill-link', targetReportId: '', label: 'View Details' } },
        appearance: {
            container: { shadow: 'none', borderRadius: 8, background: 'transparent', border: true, borderColor: '#D6D3D1' },
            titleBar: { show: false },
        },
        behaviour: { ...defaultBehaviour(), onClick: 'open-detail' },
    }),
    'custom': () => ({
        type: 'custom',
        name: 'Custom Widget',
        data: { bindings: { type: 'data-table', columns: [] } },
        appearance: {
            container: defaultContainer(),
            titleBar: defaultTitleBar('Custom'),
        },
        behaviour: defaultBehaviour(),
    }),
};
//# sourceMappingURL=widget-config-enhanced.js.map