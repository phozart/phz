/**
 * @phozart/phz-engine/explorer — Widget Suggestion for Dashboard Field Drops
 *
 * Pure function: given a dropped field, existing widgets, and available fields,
 * suggests the best widget type and encoding for a new dashboard widget.
 * Internally delegates to suggestChartType() for chart-type selection.
 */
import { suggestChartType } from './chart-suggest.js';
// Date-like field name patterns (same heuristic as chart-suggest)
const DATE_PATTERNS = /(?:date|_at$|_on$|timestamp|_time$|month|year|quarter|week|day)/i;
/** Map suggestChartType short names to dashboard WidgetType names. */
function chartTypeToWidgetType(chartType) {
    switch (chartType) {
        case 'bar':
        case 'grouped-bar':
        case 'stacked-bar':
            return 'bar-chart';
        case 'line':
        case 'multi-line':
            return 'trend-line';
        case 'kpi':
            return 'kpi-card';
        case 'table':
            return 'data-table';
        default:
            return 'data-table';
    }
}
function isMeasureField(field) {
    return (field.dataType === 'number' ||
        field.semanticHint === 'measure' ||
        field.semanticHint === 'currency' ||
        field.semanticHint === 'percentage');
}
function isDateLikeField(field) {
    if (field.dataType === 'date' || field.semanticHint === 'timestamp')
        return true;
    return DATE_PATTERNS.test(field.name);
}
/**
 * Suggest the best widget type when a field is dropped onto the dashboard canvas.
 *
 * Logic:
 * 1. Single measure with no existing charts → kpi-card (confidence 1.0)
 * 2. Date/time field → trend-line (confidence 0.8)
 * 3. Categorical dimension with measures available → bar-chart via suggestChartType (confidence 0.7)
 * 4. Dimension dropped alongside existing measure widgets → bar-chart (confidence 0.6)
 * 5. Measure dropped alongside existing dimension chart → bar-chart (confidence 0.7)
 * 6. Boolean or unknown → data-table fallback (confidence 0.3)
 */
export function suggestWidgetForFieldDrop(field, existingWidgets, availableFields) {
    const isMeasure = isMeasureField(field);
    const isDate = isDateLikeField(field);
    // ---- Case 1: Single measure, no existing chart widgets → kpi-card ----
    if (isMeasure && existingWidgets.length === 0) {
        return {
            widgetType: 'kpi-card',
            encoding: { measureField: field.name, aggregation: 'sum' },
            confidence: 1.0,
        };
    }
    // ---- Case 2: Date/time field → trend-line ----
    if (isDate) {
        return {
            widgetType: 'trend-line',
            encoding: { dimensionField: field.name },
            confidence: 0.8,
        };
    }
    // ---- Case 3: Categorical dimension with measures available ----
    if (!isMeasure && !isDate && field.dataType !== 'boolean') {
        const availableMeasures = availableFields.filter(isMeasureField);
        if (availableMeasures.length > 0) {
            // Build a synthetic ExploreQuery to delegate to suggestChartType
            const explore = {
                dimensions: [{ field: field.name }],
                measures: availableMeasures.slice(0, 1).map(m => ({
                    field: m.name,
                    aggregation: 'sum',
                })),
                filters: [],
            };
            const chartType = suggestChartType(explore);
            return {
                widgetType: chartTypeToWidgetType(chartType),
                encoding: {
                    dimensionField: field.name,
                    measureField: availableMeasures[0]?.name,
                },
                confidence: 0.7,
            };
        }
        // Dimension but no measures available → still suggest bar-chart
        return {
            widgetType: 'bar-chart',
            encoding: { dimensionField: field.name },
            confidence: 0.5,
        };
    }
    // ---- Case 4: Measure with existing widgets that have dimensions ----
    if (isMeasure && existingWidgets.length > 0) {
        const existingWithDims = existingWidgets.find(w => w.dimensions.length > 0);
        if (existingWithDims) {
            return {
                widgetType: 'bar-chart',
                encoding: {
                    measureField: field.name,
                    dimensionField: existingWithDims.dimensions[0]?.field,
                    aggregation: 'sum',
                },
                confidence: 0.7,
            };
        }
        // Existing widgets but none with dimensions → another kpi-card
        return {
            widgetType: 'kpi-card',
            encoding: { measureField: field.name, aggregation: 'sum' },
            confidence: 0.6,
        };
    }
    // ---- Fallback: data-table ----
    return {
        widgetType: 'data-table',
        encoding: {},
        confidence: 0.3,
    };
}
//# sourceMappingURL=widget-suggestion.js.map