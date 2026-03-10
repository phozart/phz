/**
 * @phozart/phz-engine — Config Merge / Layering
 *
 * 3-layer merge: Admin (L0) → Super User (L1) → Personal User View (L2).
 */

import type { ConfigLayer } from './types.js';
import type { ReportConfig } from './report.js';
import type { DashboardConfig } from './dashboard.js';

// --- User View Config ---

export interface UserViewConfig {
  id: string;
  userId: string;
  sourceType: 'report' | 'dashboard';
  sourceId: string;
  overrides: {
    selection?: Record<string, string | string[] | null>;
    sort?: { columns: Array<{ field: string; direction: 'asc' | 'desc' }> };
    columnWidths?: Record<string, number>;
    expandedGroups?: string[];
    visualization?: Record<string, unknown>;
  };
  name?: string;
  isDefault?: boolean;
}

// --- Config Layer ---

export interface ConfigLayerDef<T> {
  layer: ConfigLayer;
  config: Partial<T>;
}

// --- Deep Merge ---

export function deepMerge<T>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const key of Object.keys(override) as Array<keyof T>) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    const overrideVal = override[key];
    const baseVal = result[key];

    if (overrideVal === undefined) continue;

    if (
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as any,
        overrideVal as any,
      ) as T[keyof T];
    } else {
      result[key] = overrideVal as T[keyof T];
    }
  }

  return result;
}

// --- Report Config Merge ---

export function mergeReportConfigs(layers: ConfigLayerDef<ReportConfig>[]): ReportConfig {
  // Sort by layer priority: system first, then admin, then user
  const priority: Record<ConfigLayer, number> = { system: 0, admin: 1, user: 2 };
  const sorted = [...layers].sort((a, b) => priority[a.layer] - priority[b.layer]);

  let result = sorted[0]?.config as ReportConfig;
  for (let i = 1; i < sorted.length; i++) {
    result = deepMerge(result, sorted[i].config as Partial<ReportConfig>);
  }

  return result;
}

// --- Dashboard Config Merge ---

export function mergeDashboardConfigs(layers: ConfigLayerDef<DashboardConfig>[]): DashboardConfig {
  const priority: Record<ConfigLayer, number> = { system: 0, admin: 1, user: 2 };
  const sorted = [...layers].sort((a, b) => priority[a.layer] - priority[b.layer]);

  let result = sorted[0]?.config as DashboardConfig;
  for (let i = 1; i < sorted.length; i++) {
    result = deepMerge(result, sorted[i].config as Partial<DashboardConfig>);
  }

  return result;
}

// --- Config Layer Manager ---

export interface ConfigLayerManager<T> {
  setLayer(layer: ConfigLayer, config: Partial<T>): void;
  getLayer(layer: ConfigLayer): Partial<T> | undefined;
  removeLayer(layer: ConfigLayer): void;
  getMerged(): T;
  getLayers(): ConfigLayerDef<T>[];
}

export function createConfigLayerManager<T>(): ConfigLayerManager<T> {
  const layers = new Map<ConfigLayer, Partial<T>>();

  return {
    setLayer(layer: ConfigLayer, config: Partial<T>): void {
      layers.set(layer, config);
    },

    getLayer(layer: ConfigLayer): Partial<T> | undefined {
      return layers.get(layer);
    },

    removeLayer(layer: ConfigLayer): void {
      layers.delete(layer);
    },

    getMerged(): T {
      const priority: Record<ConfigLayer, number> = { system: 0, admin: 1, user: 2 };
      const sorted = Array.from(layers.entries())
        .sort(([a], [b]) => priority[a] - priority[b]);

      if (sorted.length === 0) return {} as T;

      let result = sorted[0][1] as T;
      for (let i = 1; i < sorted.length; i++) {
        result = deepMerge(result, sorted[i][1]);
      }

      return result;
    },

    getLayers(): ConfigLayerDef<T>[] {
      return Array.from(layers.entries()).map(([layer, config]) => ({ layer, config }));
    },
  };
}
