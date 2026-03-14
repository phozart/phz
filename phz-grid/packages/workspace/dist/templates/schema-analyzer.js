/**
 * @phozart/workspace — Schema Analyzer
 *
 * Analyzes a DataSourceSchema and produces a FieldProfile describing
 * the data's characteristics for template matching and auto-binding.
 */
const MEASURE_NAME_PATTERNS = [
    /revenue/i, /cost/i, /amount/i, /total/i, /count/i, /price/i,
    /profit/i, /margin/i, /sum/i, /avg/i, /sales/i, /quantity/i,
    /budget/i, /spend/i, /rate/i, /score/i, /value/i,
];
function isMeasureByName(name) {
    return MEASURE_NAME_PATTERNS.some(p => p.test(name));
}
function isMeasureField(field) {
    if (field.semanticHint === 'measure' || field.semanticHint === 'currency' || field.semanticHint === 'percentage')
        return true;
    if (field.dataType === 'number' && isMeasureByName(field.name))
        return true;
    return false;
}
function isDimensionField(field) {
    if (field.semanticHint === 'dimension' || field.semanticHint === 'category')
        return true;
    if (field.dataType === 'string' && (field.cardinality === 'low' || field.cardinality === 'medium'))
        return true;
    return false;
}
export function analyzeSchema(schema) {
    const numericFields = [];
    const categoricalFields = [];
    const dateFields = [];
    const identifierFields = [];
    const suggestedMeasures = [];
    const suggestedDimensions = [];
    for (const field of schema.fields) {
        if (field.dataType === 'number')
            numericFields.push(field.name);
        if (field.dataType === 'date')
            dateFields.push(field.name);
        if (field.semanticHint === 'identifier') {
            identifierFields.push(field.name);
        }
        else if (field.dataType === 'string' && field.cardinality !== 'high') {
            categoricalFields.push(field.name);
        }
        if (isMeasureField(field)) {
            suggestedMeasures.push(field.name);
        }
        if (isDimensionField(field)) {
            suggestedDimensions.push(field.name);
        }
    }
    return {
        numericFields,
        categoricalFields,
        dateFields,
        identifierFields,
        suggestedMeasures,
        suggestedDimensions,
        hasTimeSeries: dateFields.length > 0,
        hasCategorical: categoricalFields.length > 0,
        hasMultipleMeasures: suggestedMeasures.length > 1,
    };
}
//# sourceMappingURL=schema-analyzer.js.map