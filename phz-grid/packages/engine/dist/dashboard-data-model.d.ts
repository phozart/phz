/**
 * @phozart/engine — Dashboard Data Model Store
 *
 * Manages the 5-layer computation DAG: Fields → Parameters → Calculated Fields → Metrics → KPIs.
 * Provides CRUD for parameters and calculated fields, and computation pipeline.
 */
import type { DashboardDataModel, DataModelField, ParameterDef, ParameterId, CalculatedFieldDef, CalculatedFieldId } from './expression-types.js';
import type { DependencyGraph, CanDeleteResult } from './dependency-graph.js';
import type { MetricDef } from './metric.js';
import type { KPIDefinition } from './kpi.js';
export interface DashboardDataModelStore {
    getFields(): DataModelField[];
    addParameter(param: ParameterDef): void;
    updateParameter(id: ParameterId, patch: Partial<Omit<ParameterDef, 'id'>>): void;
    removeParameter(id: ParameterId): CanDeleteResult & {
        removed: boolean;
    };
    getParameter(id: ParameterId): ParameterDef | undefined;
    listParameters(): ParameterDef[];
    addCalculatedField(calc: CalculatedFieldDef): void;
    updateCalculatedField(id: CalculatedFieldId, patch: Partial<Omit<CalculatedFieldDef, 'id'>>): void;
    removeCalculatedField(id: CalculatedFieldId): CanDeleteResult & {
        removed: boolean;
    };
    getCalculatedField(id: CalculatedFieldId): CalculatedFieldDef | undefined;
    listCalculatedFields(): CalculatedFieldDef[];
    computeCalculatedFields(rows: Record<string, unknown>[], paramValues: Record<string, unknown>): Record<string, unknown>[];
    computeMetrics(rows: Record<string, unknown>[], paramValues: Record<string, unknown>, metricCatalog: {
        list(): MetricDef[];
        evaluate(metric: MetricDef, rows: Record<string, unknown>[], metricValues?: Record<string, number | null>, params?: Record<string, unknown>): number | null;
    }): Record<string, number | null>;
    resolveThresholdBands(kpi: KPIDefinition, paramValues: Record<string, unknown>, metricValues: Record<string, number | null>): Array<{
        label: string;
        color: string;
        upTo: number | null;
    }>;
    getGraph(): DependencyGraph;
    rebuildGraph(metrics?: MetricDef[], kpis?: KPIDefinition[]): void;
    serialize(): DashboardDataModel;
    load(model: DashboardDataModel): void;
}
export declare function createDashboardDataModelStore(initialFields?: DataModelField[]): DashboardDataModelStore;
//# sourceMappingURL=dashboard-data-model.d.ts.map