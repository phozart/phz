/**
 * @phozart/engine — Dependency Graph
 *
 * Tracks dependencies between entities in the 5-layer computation DAG.
 * Provides cycle detection, topological sort, and deletion safety checks.
 */
import type { ExpressionNode } from './expression-types.js';
import type { DashboardDataModel } from './expression-types.js';
import type { MetricDef } from './metric.js';
import type { KPIDefinition } from './kpi.js';
export type DependencyNodeType = 'field' | 'parameter' | 'calculated_field' | 'metric' | 'kpi';
export interface DependencyRef {
    id: string;
    type: DependencyNodeType;
}
export interface DependencyNode {
    id: string;
    type: DependencyNodeType;
    dependsOn: DependencyRef[];
}
export interface CanDeleteResult {
    canDelete: boolean;
    dependents: DependencyRef[];
}
export interface DependencyGraph {
    addNode(node: DependencyNode): void;
    removeNode(id: string, type: DependencyNodeType): void;
    getNode(id: string, type: DependencyNodeType): DependencyNode | undefined;
    getDependencies(id: string, type: DependencyNodeType): DependencyRef[];
    getDependents(id: string, type: DependencyNodeType): DependencyRef[];
    canDelete(id: string, type: DependencyNodeType): CanDeleteResult;
    detectCycles(): DependencyRef[][];
    topologicalSort(): DependencyNode[];
    buildFromDataModel(model: DashboardDataModel, metrics?: MetricDef[], kpis?: KPIDefinition[]): void;
    clear(): void;
}
export declare function extractDependencies(expr: ExpressionNode): DependencyRef[];
export declare function createDependencyGraph(): DependencyGraph;
//# sourceMappingURL=dependency-graph.d.ts.map