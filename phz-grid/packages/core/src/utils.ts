/**
 * @phozart/phz-core — Immutable Utility Functions
 */

import type { TreeNode, TreeLevelConfig } from './types/selection-context.js';

export function immutableUpdate<T extends object>(obj: T, updates: Partial<T>): T {
  return { ...obj, ...updates };
}

export function immutableArrayUpdate<T>(
  arr: ReadonlyArray<T>,
  index: number,
  update: Partial<T>,
): ReadonlyArray<T> {
  const result = [...arr];
  result[index] = { ...result[index], ...update };
  return result;
}

export function immutableArrayInsert<T>(
  arr: ReadonlyArray<T>,
  index: number,
  item: T,
): ReadonlyArray<T> {
  const result = [...arr];
  result.splice(index, 0, item);
  return result;
}

export function immutableArrayRemove<T>(
  arr: ReadonlyArray<T>,
  index: number,
): ReadonlyArray<T> {
  const result = [...arr];
  result.splice(index, 1);
  return result;
}

export function immutableMapUpdate<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
  value: V,
): ReadonlyMap<K, V> {
  const result = new Map(map);
  result.set(key, value);
  return result;
}

export function immutableMapDelete<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
): ReadonlyMap<K, V> {
  const result = new Map(map);
  result.delete(key);
  return result;
}

export function immutableSetAdd<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const result = new Set(set);
  result.add(item);
  return result;
}

export function immutableSetDelete<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const result = new Set(set);
  result.delete(item);
  return result;
}

let idCounter = 0;
export function generateRowId(): string {
  return `row-${++idCounter}-${Date.now().toString(36)}`;
}

export function serializeCellPosition(pos: { rowId: string | number; field: string }): string {
  return `${pos.rowId}:${pos.field}`;
}

export function deserializeCellPosition(key: string): { rowId: string; field: string } {
  const separatorIndex = key.indexOf(':');
  return {
    rowId: key.slice(0, separatorIndex),
    field: key.slice(separatorIndex + 1),
  };
}

export function resolveLabelTemplate(
  template: string,
  row: Record<string, unknown>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, field) => {
    const val = row[field];
    return val != null ? String(val) : '';
  });
}

export function buildTreeFromSource(
  rows: Record<string, unknown>[],
  levels: TreeLevelConfig[],
): TreeNode[] {
  if (levels.length === 0 || rows.length === 0) return [];

  const level = levels[0];
  const remaining = levels.slice(1);

  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const raw = row[level.field];
    if (raw == null || raw === '') continue;
    const key = String(raw);
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(row);
  }

  const nodes: TreeNode[] = [];
  for (const [key, groupRows] of groups) {
    const label = level.labelTemplate
      ? resolveLabelTemplate(level.labelTemplate, groupRows[0])
      : key;
    const node: TreeNode = { value: key, label };
    if (remaining.length > 0) {
      node.children = buildTreeFromSource(groupRows, remaining);
    }
    nodes.push(node);
  }

  nodes.sort((a, b) => a.label.localeCompare(b.label));
  return nodes;
}
