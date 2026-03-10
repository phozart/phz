/**
 * @phozart/phz-ai — Schema Analyzer
 *
 * Classifies data fields as measure/dimension/temporal/categorical/identifier
 * and suggests widgets and layout based on the analysis.
 */
// --- Identifier Detection ---
const ID_PATTERNS = /^(id|_id|uuid|guid)$|_id$|Id$|_key$|Key$/;
function isIdentifier(name) {
    return ID_PATTERNS.test(name);
}
// --- Schema Analysis ---
export function analyzeSchema(fields) {
    const measures = [];
    const dimensions = [];
    const temporal = [];
    const categorical = [];
    const identifiers = [];
    for (const field of fields) {
        if (isIdentifier(field.name)) {
            identifiers.push({ name: field.name, type: field.type, role: 'identifier' });
            continue;
        }
        if (field.type === 'date') {
            temporal.push({ name: field.name, type: field.type, role: 'temporal' });
        }
        else if (field.type === 'boolean') {
            categorical.push({ name: field.name, type: field.type, role: 'categorical' });
        }
        else if (field.type === 'number') {
            measures.push({ name: field.name, type: field.type, role: 'measure' });
        }
        else if (field.type === 'string') {
            if (field.cardinality !== undefined && field.cardinality <= 20) {
                categorical.push({ name: field.name, type: field.type, role: 'categorical' });
            }
            else {
                dimensions.push({ name: field.name, type: field.type, role: 'dimension' });
            }
        }
    }
    return { measures, dimensions, temporal, categorical, identifiers };
}
// --- Widget Suggestion ---
export function suggestWidgets(analysis) {
    const suggestions = [];
    const { measures, dimensions, temporal, categorical } = analysis;
    if (measures.length === 0 && dimensions.length === 0 && temporal.length === 0 && categorical.length === 0) {
        return [];
    }
    let priority = 0;
    // KPI cards for each measure
    for (const measure of measures) {
        suggestions.push({
            widgetType: 'kpi-card',
            title: toTitleCase(measure.name),
            fields: [measure.name],
            priority: priority++,
        });
    }
    // Trend lines: measure x temporal
    if (temporal.length > 0) {
        const timeField = temporal[0];
        for (const measure of measures) {
            suggestions.push({
                widgetType: 'trend-line',
                title: `${toTitleCase(measure.name)} Trend`,
                fields: [measure.name, timeField.name],
                priority: priority++,
            });
        }
    }
    // Bar charts: measure x dimension
    const allDimensions = [...dimensions, ...categorical];
    if (allDimensions.length > 0) {
        for (const measure of measures) {
            for (const dim of allDimensions) {
                suggestions.push({
                    widgetType: 'bar-chart',
                    title: `${toTitleCase(measure.name)} by ${toTitleCase(dim.name)}`,
                    fields: [measure.name, dim.name],
                    priority: priority++,
                });
            }
        }
    }
    // Bottom-N: measure x dimension
    if (allDimensions.length > 0 && measures.length > 0) {
        suggestions.push({
            widgetType: 'bottom-n',
            title: `Bottom ${toTitleCase(allDimensions[0].name)} by ${toTitleCase(measures[0].name)}`,
            fields: [measures[0].name, allDimensions[0].name],
            priority: priority++,
        });
    }
    // Data table fallback when no measures
    if (measures.length === 0 && allDimensions.length > 0) {
        suggestions.push({
            widgetType: 'data-table',
            title: 'Data Table',
            fields: allDimensions.map(d => d.name),
            priority: priority++,
        });
    }
    return suggestions;
}
// --- Layout Suggestion ---
const WIDGET_SPANS = {
    'kpi-card': 1,
    'trend-line': 2,
    'bar-chart': 2,
    'bottom-n': 1,
    'data-table': 3,
    'kpi-scorecard': 3,
    'pivot-table': 3,
    'status-table': 2,
};
export function suggestLayout(widgets) {
    const columns = 3;
    if (widgets.length === 0) {
        return { columns, placements: [] };
    }
    const sorted = [...widgets].sort((a, b) => a.priority - b.priority);
    const placements = [];
    let currentCol = 0;
    let order = 0;
    for (const widget of sorted) {
        const span = Math.min(WIDGET_SPANS[widget.widgetType] ?? 1, columns);
        if (currentCol + span > columns) {
            currentCol = 0;
        }
        placements.push({
            widgetType: widget.widgetType,
            column: currentCol,
            order: order++,
            colSpan: span,
        });
        currentCol += span;
        if (currentCol >= columns) {
            currentCol = 0;
        }
    }
    return { columns, placements };
}
// --- Helpers ---
function toTitleCase(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}
//# sourceMappingURL=schema-analyzer.js.map