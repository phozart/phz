/**
 * @phozart/phz-engine — Filter Definition Registry
 *
 * Reusable, artefact-independent filter definitions with dependency
 * graph validation (cycle detection + topological sort).
 */

import type { FilterDefinition, FilterDefinitionId, SelectionFieldType } from '@phozart/phz-core';
import { filterDefinitionId } from '@phozart/phz-core';

// --- Registry Interface ---

export interface FilterRegistry {
  register(def: FilterDefinition): void;
  get(id: FilterDefinitionId): FilterDefinition | undefined;
  getAll(): FilterDefinition[];
  update(id: FilterDefinitionId, patch: Partial<Omit<FilterDefinition, 'id' | 'createdAt'>>): void;
  deprecate(id: FilterDefinitionId): void;
  remove(id: FilterDefinitionId): void;
  validateDependencyGraph(): FilterDefinitionId[][];
}

// --- Factory ---

export function createFilterRegistry(): FilterRegistry {
  const definitions = new Map<FilterDefinitionId, FilterDefinition>();

  return {
    register(def: FilterDefinition): void {
      if (definitions.has(def.id)) {
        throw new Error(`Filter definition "${def.id}" already registered`);
      }
      definitions.set(def.id, { ...def });
    },

    get(id: FilterDefinitionId): FilterDefinition | undefined {
      const def = definitions.get(id);
      return def ? { ...def } : undefined;
    },

    getAll(): FilterDefinition[] {
      return Array.from(definitions.values()).map(d => ({ ...d }));
    },

    update(id: FilterDefinitionId, patch: Partial<Omit<FilterDefinition, 'id' | 'createdAt'>>): void {
      const existing = definitions.get(id);
      if (!existing) {
        throw new Error(`Filter definition "${id}" not found`);
      }
      definitions.set(id, { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: Date.now() });
    },

    deprecate(id: FilterDefinitionId): void {
      const existing = definitions.get(id);
      if (!existing) {
        throw new Error(`Filter definition "${id}" not found`);
      }
      definitions.set(id, { ...existing, deprecated: true, updatedAt: Date.now() });
    },

    remove(id: FilterDefinitionId): void {
      if (!definitions.has(id)) {
        throw new Error(`Filter definition "${id}" not found`);
      }
      definitions.delete(id);
    },

    validateDependencyGraph(): FilterDefinitionId[][] {
      return detectDependencyCycles(Array.from(definitions.values()));
    },
  };
}

// --- Cycle Detection (DFS-based) ---

export function detectDependencyCycles(definitions: FilterDefinition[]): FilterDefinitionId[][] {
  const adjMap = new Map<FilterDefinitionId, FilterDefinitionId[]>();
  for (const def of definitions) {
    adjMap.set(def.id, def.dependsOn ?? []);
  }

  const cycles: FilterDefinitionId[][] = [];
  const visited = new Set<FilterDefinitionId>();
  const inStack = new Set<FilterDefinitionId>();
  const stack: FilterDefinitionId[] = [];

  function dfs(node: FilterDefinitionId): void {
    if (inStack.has(node)) {
      // Found a cycle — extract it from the stack
      const cycleStart = stack.indexOf(node);
      cycles.push(stack.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const neighbors = adjMap.get(node) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const def of definitions) {
    dfs(def.id);
  }

  return cycles;
}

// --- Topological Sort (Kahn's algorithm) ---

export function topologicalSortFilters(definitions: FilterDefinition[]): FilterDefinition[] {
  const defMap = new Map<FilterDefinitionId, FilterDefinition>();
  const inDegree = new Map<FilterDefinitionId, number>();
  const adjList = new Map<FilterDefinitionId, FilterDefinitionId[]>();

  for (const def of definitions) {
    defMap.set(def.id, def);
    inDegree.set(def.id, 0);
    adjList.set(def.id, []);
  }

  // Build adjacency: if A depends on B, edge B→A (B must come before A)
  for (const def of definitions) {
    const deps = def.dependsOn ?? [];
    for (const dep of deps) {
      if (defMap.has(dep)) {
        adjList.get(dep)!.push(def.id);
        inDegree.set(def.id, (inDegree.get(def.id) ?? 0) + 1);
      }
    }
  }

  const queue: FilterDefinitionId[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: FilterDefinition[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(defMap.get(current)!);

    for (const neighbor of adjList.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If sorted length < definitions length, there's a cycle — return what we can
  return sorted;
}
