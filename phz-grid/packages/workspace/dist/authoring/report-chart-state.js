/**
 * @phozart/phz-workspace — Report Chart State
 *
 * Pure functions for managing chart toggle, chart type selection, and
 * visual encoding channels in the report editor.
 *
 * Chart types align with the WidgetType union from @phozart/phz-engine/widget
 * and the suggestChartType output from @phozart/phz-engine/explorer/chart-suggest.
 */
import { resolveSemanticRole } from '@phozart/phz-shared';
// ========================================================================
// Factory
// ========================================================================
export function initialReportChartState() {
    return {
        previewMode: 'table',
        chartType: 'bar-chart',
        encoding: { value: [], tooltip: [] },
    };
}
// ========================================================================
// Preview Mode
// ========================================================================
export function setPreviewMode(state, mode) {
    return { ...state, previewMode: mode };
}
// ========================================================================
// Chart Type
// ========================================================================
export function overrideChartType(state, chartType) {
    return { ...state, chartOverride: chartType };
}
export function getEffectiveChartType(state) {
    return state.chartOverride ?? state.chartType ?? 'bar-chart';
}
// ========================================================================
// Encoding Channels
// ========================================================================
export function setEncoding(state, channel, field) {
    const enc = { ...state.encoding };
    switch (channel) {
        case 'category':
            enc.category = field;
            break;
        case 'value':
            if (!enc.value.includes(field)) {
                enc.value = [...enc.value, field];
            }
            break;
        case 'color':
            enc.color = field;
            break;
        case 'size':
            enc.size = field;
            break;
        case 'detail':
            enc.detail = field;
            break;
        case 'tooltip':
            if (!enc.tooltip.includes(field)) {
                enc.tooltip = [...enc.tooltip, field];
            }
            break;
    }
    return { ...state, encoding: enc };
}
export function removeEncoding(state, channel, field) {
    const enc = { ...state.encoding };
    switch (channel) {
        case 'category':
            if (enc.category === field)
                enc.category = undefined;
            break;
        case 'value':
            enc.value = enc.value.filter(v => v !== field);
            break;
        case 'color':
            if (enc.color === field)
                enc.color = undefined;
            break;
        case 'size':
            if (enc.size === field)
                enc.size = undefined;
            break;
        case 'detail':
            if (enc.detail === field)
                enc.detail = undefined;
            break;
        case 'tooltip':
            enc.tooltip = enc.tooltip.filter(t => t !== field);
            break;
    }
    return { ...state, encoding: enc };
}
// ========================================================================
// Auto-Mapping
// ========================================================================
export function autoMapColumnsToEncoding(state, fields) {
    const dims = [];
    const measures = [];
    for (const f of fields) {
        const role = resolveSemanticRole(f);
        if (role === 'measure') {
            measures.push(f.name);
        }
        else if (role === 'dimension' || role === 'time') {
            dims.push(f.name);
        }
        // identifiers are skipped — not useful for chart encoding
    }
    const encoding = {
        category: dims[0],
        value: measures,
        color: dims[1],
        detail: dims[2],
        tooltip: [],
    };
    return { ...state, encoding };
}
// ========================================================================
// Chart Type Availability
// ========================================================================
export function getChartTypeAvailability(encoding) {
    const hasValue = encoding.value.length > 0;
    const hasCat = encoding.category != null;
    return {
        'bar-chart': hasValue && hasCat,
        line: hasValue && hasCat,
        area: hasValue && hasCat,
        pie: hasValue && hasCat,
        scatter: hasValue && hasCat,
        gauge: hasValue,
        'kpi-card': hasValue,
        'trend-line': hasValue,
    };
}
//# sourceMappingURL=report-chart-state.js.map