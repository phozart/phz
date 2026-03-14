/**
 * @phozart/engine — Dashboard Data Model Store
 *
 * Manages the 5-layer computation DAG: Fields → Parameters → Calculated Fields → Metrics → KPIs.
 * Provides CRUD for parameters and calculated fields, and computation pipeline.
 */
import { createDependencyGraph } from './dependency-graph.js';
import { evaluateRowExpression } from './expression-evaluator.js';
import { resolveThresholdValue } from './status.js';
// --- Factory ---
export function createDashboardDataModelStore(initialFields = []) {
    let fields = [...initialFields];
    const parameters = new Map();
    const calculatedFields = new Map();
    const graph = createDependencyGraph();
    function rebuildGraph(metrics, kpis) {
        const model = serialize();
        graph.buildFromDataModel(model, metrics, kpis);
    }
    function serialize() {
        return {
            fields: [...fields],
            parameters: Array.from(parameters.values()),
            calculatedFields: Array.from(calculatedFields.values()),
        };
    }
    function getCalcFieldTopoOrder() {
        // Use the dependency graph's topological sort, filtered to calculated fields
        const sorted = graph.topologicalSort();
        const orderedIds = sorted
            .filter(n => n.type === 'calculated_field')
            .map(n => n.id);
        return orderedIds
            .map(id => calculatedFields.get(id))
            .filter((c) => c !== undefined);
    }
    return {
        getFields() {
            return [...fields];
        },
        // --- Parameter CRUD ---
        addParameter(param) {
            if (parameters.has(param.id)) {
                throw new Error(`Parameter "${param.id}" already exists`);
            }
            parameters.set(param.id, { ...param });
            rebuildGraph();
        },
        updateParameter(id, patch) {
            const existing = parameters.get(id);
            if (!existing)
                throw new Error(`Parameter "${id}" not found`);
            parameters.set(id, { ...existing, ...patch, id });
            rebuildGraph();
        },
        removeParameter(id) {
            const result = graph.canDelete(id, 'parameter');
            if (!result.canDelete)
                return { ...result, removed: false };
            parameters.delete(id);
            rebuildGraph();
            return { ...result, removed: true };
        },
        getParameter(id) {
            return parameters.get(id);
        },
        listParameters() {
            return Array.from(parameters.values());
        },
        // --- Calculated Field CRUD ---
        addCalculatedField(calc) {
            if (calculatedFields.has(calc.id)) {
                throw new Error(`Calculated field "${calc.id}" already exists`);
            }
            calculatedFields.set(calc.id, { ...calc });
            rebuildGraph();
        },
        updateCalculatedField(id, patch) {
            const existing = calculatedFields.get(id);
            if (!existing)
                throw new Error(`Calculated field "${id}" not found`);
            calculatedFields.set(id, { ...existing, ...patch, id });
            rebuildGraph();
        },
        removeCalculatedField(id) {
            const result = graph.canDelete(id, 'calculated_field');
            if (!result.canDelete)
                return { ...result, removed: false };
            calculatedFields.delete(id);
            rebuildGraph();
            return { ...result, removed: true };
        },
        getCalculatedField(id) {
            return calculatedFields.get(id);
        },
        listCalculatedFields() {
            return Array.from(calculatedFields.values());
        },
        // --- Computation Pipeline ---
        computeCalculatedFields(rows, paramValues) {
            const ordered = getCalcFieldTopoOrder();
            if (ordered.length === 0)
                return rows;
            return rows.map(row => {
                const augmented = { ...row };
                const calcValues = {};
                for (const calc of ordered) {
                    const value = evaluateRowExpression(calc.expression, {
                        row: augmented,
                        params: paramValues,
                        calculatedValues: calcValues,
                    });
                    calcValues[calc.id] = value;
                    augmented[calc.name] = value;
                }
                return augmented;
            });
        },
        computeMetrics(rows, paramValues, metricCatalog) {
            const allMetrics = metricCatalog.list();
            const metricValues = {};
            // Simple/conditional metrics first (no metric dependencies)
            const simpleMetrics = allMetrics.filter(m => m.formula.type !== 'expression');
            const exprMetrics = allMetrics.filter(m => m.formula.type === 'expression');
            for (const metric of simpleMetrics) {
                metricValues[metric.id] = metricCatalog.evaluate(metric, rows, metricValues, paramValues);
            }
            // Expression metrics in dependency order (use graph topo sort)
            const sorted = graph.topologicalSort();
            const metricOrder = sorted
                .filter(n => n.type === 'metric')
                .map(n => n.id);
            for (const id of metricOrder) {
                if (metricValues[id] !== undefined)
                    continue; // Already computed
                const metric = exprMetrics.find(m => m.id === id);
                if (metric) {
                    metricValues[metric.id] = metricCatalog.evaluate(metric, rows, metricValues, paramValues);
                }
            }
            // Any expression metrics not in graph (fallback)
            for (const metric of exprMetrics) {
                if (metricValues[metric.id] === undefined) {
                    metricValues[metric.id] = metricCatalog.evaluate(metric, rows, metricValues, paramValues);
                }
            }
            return metricValues;
        },
        resolveThresholdBands(kpi, paramValues, metricValues) {
            if (!kpi.bands)
                return [];
            return kpi.bands.map(band => ({
                label: band.label,
                color: band.color,
                upTo: resolveThresholdValue(band.upTo, paramValues, metricValues),
            }));
        },
        getGraph() {
            return graph;
        },
        rebuildGraph(metrics, kpis) {
            rebuildGraph(metrics, kpis);
        },
        serialize,
        load(model) {
            fields = [...model.fields];
            parameters.clear();
            calculatedFields.clear();
            for (const p of model.parameters)
                parameters.set(p.id, { ...p });
            for (const c of model.calculatedFields)
                calculatedFields.set(c.id, { ...c });
            rebuildGraph();
        },
    };
}
//# sourceMappingURL=dashboard-data-model.js.map