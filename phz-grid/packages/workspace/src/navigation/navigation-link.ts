/**
 * @phozart/workspace — NavigationLink (V.1)
 *
 * Defines cross-artifact drill-through navigation links.
 * A NavigationLink connects a source artifact (e.g. dashboard) to a
 * target artifact (e.g. report), optionally mapping filter values
 * from the source context to the target's filter definitions.
 */

import type { ArtifactType } from '../types.js';

// ========================================================================
// NavigationFilterMapping
// ========================================================================

export interface NavigationFilterMapping {
  sourceField: string;
  targetFilterDefinitionId: string;
  transform: 'passthrough' | 'lookup' | 'expression';
  transformExpr?: string;
}

// ========================================================================
// NavigationSource (context about where a navigation was triggered)
// ========================================================================

export interface NavigationSource {
  artifactId: string;
  artifactType: ArtifactType;
  widgetId?: string;
  field?: string;
  value?: unknown;
}

// ========================================================================
// NavigationLink
// ========================================================================

export type NavigationOpenBehavior = 'same-panel' | 'new-tab' | 'modal' | 'slide-over';

export interface NavigationLink {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  targetArtifactType: ArtifactType;
  label: string;
  description?: string;
  filterMappings: NavigationFilterMapping[];
  openBehavior?: NavigationOpenBehavior;
  icon?: string;
}

// ========================================================================
// Type guard
// ========================================================================

export function isNavigationLink(obj: unknown): obj is NavigationLink {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.sourceArtifactId === 'string' &&
    typeof o.targetArtifactId === 'string' &&
    typeof o.targetArtifactType === 'string' &&
    typeof o.label === 'string' &&
    Array.isArray(o.filterMappings)
  );
}

// ========================================================================
// Factory
// ========================================================================

let counter = 0;
function generateId(): string {
  return `nl_${Date.now()}_${++counter}`;
}

export function createNavigationLink(
  input: Omit<NavigationLink, 'id' | 'filterMappings' | 'openBehavior'> & {
    id?: string;
    filterMappings?: NavigationFilterMapping[];
    openBehavior?: NavigationOpenBehavior;
  },
): NavigationLink {
  return {
    id: input.id ?? generateId(),
    sourceArtifactId: input.sourceArtifactId,
    targetArtifactId: input.targetArtifactId,
    targetArtifactType: input.targetArtifactType,
    label: input.label,
    description: input.description,
    filterMappings: input.filterMappings ? [...input.filterMappings] : [],
    openBehavior: input.openBehavior ?? 'same-panel',
    icon: input.icon,
  };
}

// ========================================================================
// Filter resolution
// ========================================================================

export function resolveNavigationFilters(
  mappings: NavigationFilterMapping[],
  sourceValues: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    const value = sourceValues[mapping.sourceField];
    if (value === undefined) continue;

    // For now, passthrough is the primary transform. Lookup and expression
    // transforms are resolved at the data layer.
    result[mapping.targetFilterDefinitionId] = value;
  }

  return result;
}

// ========================================================================
// Circular link detection (DFS cycle detection)
// ========================================================================

export function detectCircularLinks(links: NavigationLink[]): string[][] {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  for (const link of links) {
    const existing = graph.get(link.sourceArtifactId) ?? [];
    existing.push(link.targetArtifactId);
    graph.set(link.sourceArtifactId, existing);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    if (inStack.has(node)) {
      // Found a cycle — extract it from the path
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), node]);
      } else {
        cycles.push([node]);
      }
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    path.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node);
  }

  return cycles;
}
