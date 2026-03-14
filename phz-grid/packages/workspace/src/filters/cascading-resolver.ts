/**
 * @phozart/workspace — Cascading Filter Resolver (O.2)
 *
 * Manages parent-child filter dependencies with topological ordering
 * and uses DataAdapter.getDistinctValues() for data-driven cascading.
 */

import type { FilterDependency, DashboardFilterDef } from '../types.js';
import type { DataAdapter } from '../data-adapter.js';

// ========================================================================
// Dependency Graph
// ========================================================================

export interface DependencyGraph {
  /** Topologically sorted filter IDs (parents before children) */
  order: string[];
  /** parent -> child[] mapping */
  children: Map<string, string[]>;
  /** child -> parent mapping */
  parents: Map<string, string>;
}

export function buildDependencyGraph(deps: FilterDependency[]): DependencyGraph {
  const children = new Map<string, string[]>();
  const parents = new Map<string, string>();
  const allNodes = new Set<string>();

  for (const dep of deps) {
    allNodes.add(dep.parentFilterId);
    allNodes.add(dep.childFilterId);

    const existing = children.get(dep.parentFilterId) ?? [];
    existing.push(dep.childFilterId);
    children.set(dep.parentFilterId, existing);

    parents.set(dep.childFilterId, dep.parentFilterId);
  }

  // Topological sort using Kahn's algorithm
  const inDegree = new Map<string, number>();
  for (const node of allNodes) {
    inDegree.set(node, 0);
  }
  for (const dep of deps) {
    inDegree.set(dep.childFilterId, (inDegree.get(dep.childFilterId) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);

    for (const child of children.get(node) ?? []) {
      const newDegree = (inDegree.get(child) ?? 1) - 1;
      inDegree.set(child, newDegree);
      if (newDegree === 0) {
        queue.push(child);
      }
    }
  }

  if (order.length !== allNodes.size) {
    throw new Error(
      `Cycle detected in filter dependencies. Expected ${allNodes.size} nodes, but topological sort yielded ${order.length}.`,
    );
  }

  return { order, children, parents };
}

// ========================================================================
// Cascading Resolution
// ========================================================================

export interface CascadingResult {
  values: unknown[];
  totalCount: number;
  truncated: boolean;
}

export async function resolveCascadingDependency(
  adapter: DataAdapter,
  filterDef: DashboardFilterDef,
  dependency: FilterDependency,
  parentValue: unknown,
  options?: { search?: string; limit?: number },
): Promise<CascadingResult> {
  if (parentValue === null || parentValue === undefined) {
    return { values: [], totalCount: 0, truncated: false };
  }

  const result = await adapter.getDistinctValues(
    filterDef.dataSourceId,
    filterDef.field,
    {
      search: options?.search,
      limit: options?.limit,
      filters: {
        [dependency.parentFilterId]: parentValue,
      },
    },
  );

  return {
    values: result.values,
    totalCount: result.totalCount,
    truncated: result.truncated,
  };
}
