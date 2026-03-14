/**
 * @phozart/engine — Dashboard Data Model Store
 *
 * Manages the 5-layer computation DAG: Fields → Parameters → Calculated Fields → Metrics → KPIs.
 * Provides CRUD for parameters and calculated fields, and computation pipeline.
 */

import type {
  DashboardDataModel, DataModelField,
  ParameterDef, ParameterId,
  CalculatedFieldDef, CalculatedFieldId,
  ThresholdBand,
} from './expression-types.js';
import { parameterId, calculatedFieldId } from './expression-types.js';
import { createDependencyGraph, extractDependencies } from './dependency-graph.js';
import type { DependencyGraph, CanDeleteResult } from './dependency-graph.js';
import { evaluateRowExpression, evaluateMetricExpression } from './expression-evaluator.js';
import type { MetricDef } from './metric.js';
import type { KPIDefinition } from './kpi.js';
import { resolveThresholdValue } from './status.js';

// --- Store Interface ---

export interface DashboardDataModelStore {
  // Fields (read-only, set at construction)
  getFields(): DataModelField[];

  // Parameter CRUD
  addParameter(param: ParameterDef): void;
  updateParameter(id: ParameterId, patch: Partial<Omit<ParameterDef, 'id'>>): void;
  removeParameter(id: ParameterId): CanDeleteResult & { removed: boolean };
  getParameter(id: ParameterId): ParameterDef | undefined;
  listParameters(): ParameterDef[];

  // Calculated Field CRUD
  addCalculatedField(calc: CalculatedFieldDef): void;
  updateCalculatedField(id: CalculatedFieldId, patch: Partial<Omit<CalculatedFieldDef, 'id'>>): void;
  removeCalculatedField(id: CalculatedFieldId): CanDeleteResult & { removed: boolean };
  getCalculatedField(id: CalculatedFieldId): CalculatedFieldDef | undefined;
  listCalculatedFields(): CalculatedFieldDef[];

  // Computation pipeline
  computeCalculatedFields(
    rows: Record<string, unknown>[],
    paramValues: Record<string, unknown>,
  ): Record<string, unknown>[];

  computeMetrics(
    rows: Record<string, unknown>[],
    paramValues: Record<string, unknown>,
    metricCatalog: { list(): MetricDef[]; evaluate(metric: MetricDef, rows: Record<string, unknown>[], metricValues?: Record<string, number | null>, params?: Record<string, unknown>): number | null },
  ): Record<string, number | null>;

  resolveThresholdBands(
    kpi: KPIDefinition,
    paramValues: Record<string, unknown>,
    metricValues: Record<string, number | null>,
  ): Array<{ label: string; color: string; upTo: number | null }>;

  // Dependency graph
  getGraph(): DependencyGraph;
  rebuildGraph(metrics?: MetricDef[], kpis?: KPIDefinition[]): void;

  // Serialization
  serialize(): DashboardDataModel;
  load(model: DashboardDataModel): void;
}

// --- Factory ---

export function createDashboardDataModelStore(
  initialFields: DataModelField[] = [],
): DashboardDataModelStore {
  let fields: DataModelField[] = [...initialFields];
  const parameters = new Map<ParameterId, ParameterDef>();
  const calculatedFields = new Map<CalculatedFieldId, CalculatedFieldDef>();
  const graph = createDependencyGraph();

  function rebuildGraph(metrics?: MetricDef[], kpis?: KPIDefinition[]): void {
    const model = serialize();
    graph.buildFromDataModel(model, metrics, kpis);
  }

  function serialize(): DashboardDataModel {
    return {
      fields: [...fields],
      parameters: Array.from(parameters.values()),
      calculatedFields: Array.from(calculatedFields.values()),
    };
  }

  function getCalcFieldTopoOrder(): CalculatedFieldDef[] {
    // Use the dependency graph's topological sort, filtered to calculated fields
    const sorted = graph.topologicalSort();
    const orderedIds = sorted
      .filter(n => n.type === 'calculated_field')
      .map(n => n.id);

    return orderedIds
      .map(id => calculatedFields.get(id as CalculatedFieldId))
      .filter((c): c is CalculatedFieldDef => c !== undefined);
  }

  return {
    getFields() {
      return [...fields];
    },

    // --- Parameter CRUD ---

    addParameter(param: ParameterDef): void {
      if (parameters.has(param.id)) {
        throw new Error(`Parameter "${param.id}" already exists`);
      }
      parameters.set(param.id, { ...param });
      rebuildGraph();
    },

    updateParameter(id: ParameterId, patch: Partial<Omit<ParameterDef, 'id'>>): void {
      const existing = parameters.get(id);
      if (!existing) throw new Error(`Parameter "${id}" not found`);
      parameters.set(id, { ...existing, ...patch, id });
      rebuildGraph();
    },

    removeParameter(id: ParameterId): CanDeleteResult & { removed: boolean } {
      const result = graph.canDelete(id, 'parameter');
      if (!result.canDelete) return { ...result, removed: false };
      parameters.delete(id);
      rebuildGraph();
      return { ...result, removed: true };
    },

    getParameter(id: ParameterId): ParameterDef | undefined {
      return parameters.get(id);
    },

    listParameters(): ParameterDef[] {
      return Array.from(parameters.values());
    },

    // --- Calculated Field CRUD ---

    addCalculatedField(calc: CalculatedFieldDef): void {
      if (calculatedFields.has(calc.id)) {
        throw new Error(`Calculated field "${calc.id}" already exists`);
      }
      calculatedFields.set(calc.id, { ...calc });
      rebuildGraph();
    },

    updateCalculatedField(id: CalculatedFieldId, patch: Partial<Omit<CalculatedFieldDef, 'id'>>): void {
      const existing = calculatedFields.get(id);
      if (!existing) throw new Error(`Calculated field "${id}" not found`);
      calculatedFields.set(id, { ...existing, ...patch, id });
      rebuildGraph();
    },

    removeCalculatedField(id: CalculatedFieldId): CanDeleteResult & { removed: boolean } {
      const result = graph.canDelete(id, 'calculated_field');
      if (!result.canDelete) return { ...result, removed: false };
      calculatedFields.delete(id);
      rebuildGraph();
      return { ...result, removed: true };
    },

    getCalculatedField(id: CalculatedFieldId): CalculatedFieldDef | undefined {
      return calculatedFields.get(id);
    },

    listCalculatedFields(): CalculatedFieldDef[] {
      return Array.from(calculatedFields.values());
    },

    // --- Computation Pipeline ---

    computeCalculatedFields(
      rows: Record<string, unknown>[],
      paramValues: Record<string, unknown>,
    ): Record<string, unknown>[] {
      const ordered = getCalcFieldTopoOrder();
      if (ordered.length === 0) return rows;

      return rows.map(row => {
        const augmented = { ...row };
        const calcValues: Record<string, unknown> = {};

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

    computeMetrics(
      rows: Record<string, unknown>[],
      paramValues: Record<string, unknown>,
      metricCatalog: { list(): MetricDef[]; evaluate(metric: MetricDef, rows: Record<string, unknown>[], metricValues?: Record<string, number | null>, params?: Record<string, unknown>): number | null },
    ): Record<string, number | null> {
      const allMetrics = metricCatalog.list();
      const metricValues: Record<string, number | null> = {};

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
        if (metricValues[id] !== undefined) continue; // Already computed
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

    resolveThresholdBands(
      kpi: KPIDefinition,
      paramValues: Record<string, unknown>,
      metricValues: Record<string, number | null>,
    ): Array<{ label: string; color: string; upTo: number | null }> {
      if (!kpi.bands) return [];
      return kpi.bands.map(band => ({
        label: band.label,
        color: band.color,
        upTo: resolveThresholdValue(band.upTo, paramValues, metricValues),
      }));
    },

    getGraph() {
      return graph;
    },

    rebuildGraph(metrics?: MetricDef[], kpis?: KPIDefinition[]) {
      rebuildGraph(metrics, kpis);
    },

    serialize,

    load(model: DashboardDataModel): void {
      fields = [...model.fields];
      parameters.clear();
      calculatedFields.clear();
      for (const p of model.parameters) parameters.set(p.id, { ...p });
      for (const c of model.calculatedFields) calculatedFields.set(c.id, { ...c });
      rebuildGraph();
    },
  };
}
