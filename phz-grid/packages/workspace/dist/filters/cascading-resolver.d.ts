/**
 * @phozart/workspace — Cascading Filter Resolver (O.2)
 *
 * Manages parent-child filter dependencies with topological ordering
 * and uses DataAdapter.getDistinctValues() for data-driven cascading.
 */
import type { FilterDependency, DashboardFilterDef } from '../types.js';
import type { DataAdapter } from '../data-adapter.js';
export interface DependencyGraph {
    /** Topologically sorted filter IDs (parents before children) */
    order: string[];
    /** parent -> child[] mapping */
    children: Map<string, string[]>;
    /** child -> parent mapping */
    parents: Map<string, string>;
}
export declare function buildDependencyGraph(deps: FilterDependency[]): DependencyGraph;
export interface CascadingResult {
    values: unknown[];
    totalCount: number;
    truncated: boolean;
}
export declare function resolveCascadingDependency(adapter: DataAdapter, filterDef: DashboardFilterDef, dependency: FilterDependency, parentValue: unknown, options?: {
    search?: string;
    limit?: number;
}): Promise<CascadingResult>;
//# sourceMappingURL=cascading-resolver.d.ts.map