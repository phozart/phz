/**
 * @phozart/engine — Metric Catalog
 *
 * Metrics are computational definitions used by pivot tables and reports.
 * Distinct from KPIs which have targets/thresholds.
 */
import { evaluateMetricExpression } from './expression-evaluator.js';
export function createMetricCatalog(registry) {
    const metrics = new Map();
    function evaluateSimple(formula, rows) {
        const values = rows
            .map(r => r[formula.field])
            .filter((v) => typeof v === 'number');
        if (values.length === 0)
            return null;
        switch (formula.aggregation) {
            case 'sum': return values.reduce((a, b) => a + b, 0);
            case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
            case 'min': {
                let min = values[0];
                for (let i = 1; i < values.length; i++) {
                    if (values[i] < min)
                        min = values[i];
                }
                return min;
            }
            case 'max': {
                let max = values[0];
                for (let i = 1; i < values.length; i++) {
                    if (values[i] > max)
                        max = values[i];
                }
                return max;
            }
            case 'count': return values.length;
            case 'first': return values[0] ?? null;
            case 'last': return values[values.length - 1] ?? null;
            default: return null;
        }
    }
    function matchesCondition(row, condition) {
        const val = row[condition.field];
        switch (condition.operator) {
            case 'equals': return val === condition.value;
            case 'notEquals': return val !== condition.value;
            case 'greaterThan': return typeof val === 'number' && val > condition.value;
            case 'lessThan': return typeof val === 'number' && val < condition.value;
            case 'contains': return typeof val === 'string' && val.includes(condition.value);
            default: return true;
        }
    }
    return {
        register(metric) {
            metrics.set(metric.id, metric);
        },
        get(id) {
            return metrics.get(id);
        },
        list() {
            return Array.from(metrics.values());
        },
        listByDataProduct(dataProductId) {
            return Array.from(metrics.values()).filter(m => m.dataProductId === dataProductId);
        },
        remove(id) {
            metrics.delete(id);
        },
        validate(metric) {
            const errors = [];
            if (!metric.id)
                errors.push({ path: 'id', message: 'ID is required' });
            if (!metric.name)
                errors.push({ path: 'name', message: 'Name is required' });
            if (!metric.dataProductId)
                errors.push({ path: 'dataProductId', message: 'Data product ID is required' });
            if (!metric.formula) {
                errors.push({ path: 'formula', message: 'Formula is required' });
            }
            else {
                if (metric.formula.type === 'simple' && !metric.formula.field) {
                    errors.push({ path: 'formula.field', message: 'Field is required for simple formula' });
                }
            }
            return { valid: errors.length === 0, errors };
        },
        evaluate(metric, rows, metricValues, params) {
            if (rows.length === 0)
                return null;
            switch (metric.formula.type) {
                case 'simple':
                    return evaluateSimple(metric.formula, rows);
                case 'conditional': {
                    const formula = metric.formula;
                    const filteredRows = rows.filter(r => matchesCondition(r, formula.condition));
                    return evaluateSimple({ type: 'simple', field: formula.field, aggregation: formula.aggregation }, filteredRows);
                }
                case 'composite': {
                    const formula = metric.formula;
                    const resolvedValues = {};
                    for (const fieldId of formula.fields) {
                        const depMetric = metrics.get(fieldId);
                        if (!depMetric)
                            return null;
                        const depValue = this.evaluate(depMetric, rows, metricValues, params);
                        resolvedValues[fieldId] = depValue;
                        if (depValue === null)
                            return null;
                    }
                    // Replace metric references with values and evaluate
                    let expr = formula.expression;
                    // Sort by length descending to avoid partial replacements
                    const sortedFields = [...formula.fields].sort((a, b) => b.length - a.length);
                    for (const fieldId of sortedFields) {
                        expr = expr.split(fieldId).join(String(resolvedValues[fieldId]));
                    }
                    try {
                        // Evaluate simple arithmetic expression (only numbers and operators)
                        const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
                        if (sanitized !== expr.trim())
                            return null;
                        const result = Function(`"use strict"; return (${sanitized});`)();
                        return typeof result === 'number' && isFinite(result) ? result : null;
                    }
                    catch {
                        return null;
                    }
                }
                case 'expression': {
                    const exprFormula = metric.formula;
                    return evaluateMetricExpression(exprFormula.expression, {
                        metricValues: metricValues ?? {},
                        params: params ?? {},
                    });
                }
                default:
                    return null;
            }
        },
    };
}
//# sourceMappingURL=metric.js.map