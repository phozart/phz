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
import type { ThresholdBand } from './expression-types.js';

// --- Types ---

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
  buildFromDataModel(
    model: DashboardDataModel,
    metrics?: MetricDef[],
    kpis?: KPIDefinition[],
  ): void;
  clear(): void;
}

// --- Extract Dependencies from AST ---

export function extractDependencies(expr: ExpressionNode): DependencyRef[] {
  const refs: DependencyRef[] = [];

  function walk(node: ExpressionNode): void {
    switch (node.kind) {
      case 'field_ref':
        refs.push({ id: node.fieldName, type: 'field' });
        break;
      case 'param_ref':
        refs.push({ id: node.parameterId, type: 'parameter' });
        break;
      case 'metric_ref':
        refs.push({ id: node.metricId, type: 'metric' });
        break;
      case 'calc_ref':
        refs.push({ id: node.calculatedFieldId, type: 'calculated_field' });
        break;
      case 'literal':
        break;
      case 'unary_op':
        walk(node.operand);
        break;
      case 'binary_op':
        walk(node.left);
        walk(node.right);
        break;
      case 'conditional':
        walk(node.condition);
        walk(node.thenBranch);
        walk(node.elseBranch);
        break;
      case 'function_call':
        for (const arg of node.args) walk(arg);
        break;
      case 'null_check':
        walk(node.operand);
        break;
    }
  }

  walk(expr);
  return refs;
}

// --- Composite key helper ---

function nodeKey(id: string, type: DependencyNodeType): string {
  return `${type}::${id}`;
}

// --- Factory ---

export function createDependencyGraph(): DependencyGraph {
  const nodes = new Map<string, DependencyNode>();

  function addNode(node: DependencyNode): void {
    nodes.set(nodeKey(node.id, node.type), node);
  }

  function removeNode(id: string, type: DependencyNodeType): void {
    nodes.delete(nodeKey(id, type));
  }

  function getNode(id: string, type: DependencyNodeType): DependencyNode | undefined {
    return nodes.get(nodeKey(id, type));
  }

  function getDependencies(id: string, type: DependencyNodeType): DependencyRef[] {
    const node = nodes.get(nodeKey(id, type));
    return node?.dependsOn ?? [];
  }

  function getDependents(id: string, type: DependencyNodeType): DependencyRef[] {
    const key = nodeKey(id, type);
    const dependents: DependencyRef[] = [];
    for (const node of nodes.values()) {
      if (node.dependsOn.some(d => nodeKey(d.id, d.type) === key)) {
        dependents.push({ id: node.id, type: node.type });
      }
    }
    return dependents;
  }

  function canDelete(id: string, type: DependencyNodeType): CanDeleteResult {
    const dependents = getDependents(id, type);
    return {
      canDelete: dependents.length === 0,
      dependents,
    };
  }

  function detectCycles(): DependencyRef[][] {
    const cycles: DependencyRef[][] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const stack: DependencyRef[] = [];

    function dfs(ref: DependencyRef): void {
      const key = nodeKey(ref.id, ref.type);
      if (inStack.has(key)) {
        const cycleStart = stack.findIndex(s => nodeKey(s.id, s.type) === key);
        cycles.push(stack.slice(cycleStart));
        return;
      }
      if (visited.has(key)) return;

      visited.add(key);
      inStack.add(key);
      stack.push(ref);

      const node = nodes.get(key);
      if (node) {
        for (const dep of node.dependsOn) {
          dfs(dep);
        }
      }

      stack.pop();
      inStack.delete(key);
    }

    for (const node of nodes.values()) {
      dfs({ id: node.id, type: node.type });
    }

    return cycles;
  }

  function topologicalSort(): DependencyNode[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const node of nodes.values()) {
      const key = nodeKey(node.id, node.type);
      if (!inDegree.has(key)) inDegree.set(key, 0);
      if (!adjList.has(key)) adjList.set(key, []);
    }

    for (const node of nodes.values()) {
      const key = nodeKey(node.id, node.type);
      for (const dep of node.dependsOn) {
        const depKey = nodeKey(dep.id, dep.type);
        if (nodes.has(depKey)) {
          if (!adjList.has(depKey)) adjList.set(depKey, []);
          adjList.get(depKey)!.push(key);
          inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [key, deg] of inDegree) {
      if (deg === 0) queue.push(key);
    }

    const sorted: DependencyNode[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodes.get(current);
      if (node) sorted.push(node);

      for (const neighbor of adjList.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  function buildFromDataModel(
    model: DashboardDataModel,
    metrics?: MetricDef[],
    kpis?: KPIDefinition[],
  ): void {
    nodes.clear();

    // Layer 1: Fields (no dependencies)
    for (const field of model.fields) {
      addNode({ id: field.name, type: 'field', dependsOn: [] });
    }

    // Layer 2: Parameters (no dependencies)
    for (const param of model.parameters) {
      addNode({ id: param.id, type: 'parameter', dependsOn: [] });
    }

    // Layer 3: Calculated Fields (depend on fields, params, other calc fields)
    for (const calc of model.calculatedFields) {
      const deps = extractDependencies(calc.expression);
      addNode({ id: calc.id, type: 'calculated_field', dependsOn: deps });
    }

    // Layer 4: Metrics (depend on fields, params, other metrics via expression formulas)
    if (metrics) {
      for (const metric of metrics) {
        const deps: DependencyRef[] = [];
        if (metric.formula.type === 'simple' || metric.formula.type === 'conditional') {
          deps.push({ id: metric.formula.field, type: 'field' });
        } else if (metric.formula.type === 'expression') {
          const exprFormula = metric.formula as { type: 'expression'; expression: ExpressionNode };
          deps.push(...extractDependencies(exprFormula.expression));
        }
        addNode({ id: metric.id, type: 'metric', dependsOn: deps });
      }
    }

    // Layer 5: KPIs (depend on metrics, params via threshold bands)
    if (kpis) {
      for (const kpi of kpis) {
        const deps: DependencyRef[] = [];
        if ((kpi as any).metricId) {
          deps.push({ id: (kpi as any).metricId, type: 'metric' });
        }
        if ((kpi as any).bands) {
          for (const band of (kpi as any).bands as ThresholdBand[]) {
            if (band.upTo.type === 'parameter' && band.upTo.parameterId) {
              deps.push({ id: band.upTo.parameterId, type: 'parameter' });
            }
            if (band.upTo.type === 'metric' && band.upTo.metricId) {
              deps.push({ id: band.upTo.metricId, type: 'metric' });
            }
          }
        }
        addNode({ id: kpi.id, type: 'kpi', dependsOn: deps });
      }
    }
  }

  return {
    addNode,
    removeNode,
    getNode,
    getDependencies,
    getDependents,
    canDelete,
    detectCycles,
    topologicalSort,
    buildFromDataModel,
    clear() { nodes.clear(); },
  };
}
