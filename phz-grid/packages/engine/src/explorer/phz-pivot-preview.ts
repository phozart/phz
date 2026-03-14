/**
 * @phozart/engine/explorer — Pivot Preview Controller
 *
 * Headless controller for preview mode (table/chart/sql).
 * Also converts DropZoneState -> ExploreQuery.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */

import type { ExploreQuery, ExploreFieldSlot, ExploreValueSlot, ExploreFilterSlot } from './explore-types.js';
import type { DataResult } from '@phozart/shared/adapters';
import type { DropZoneState } from './phz-drop-zones.js';

// ========================================================================
// Preview mode
// ========================================================================

export type PreviewMode = 'table' | 'chart' | 'sql';

// ========================================================================
// toExploreQuery — convert drop zone state to ExploreQuery
// ========================================================================

export interface QueryOptions {
  limit?: number;
}

export function toExploreQuery(
  state: DropZoneState,
  options?: QueryOptions,
): ExploreQuery {
  const dimensions: ExploreFieldSlot[] = [
    ...state.rows.map(r => ({ field: r.field })),
    ...state.columns.map(c => ({ field: c.field })),
  ];

  const measures: ExploreValueSlot[] = state.values.map(v => ({
    field: v.field,
    aggregation: v.aggregation as ExploreValueSlot['aggregation'],
  }));

  const filters: ExploreFilterSlot[] = state.filters.map(f => ({
    field: f.field,
    operator: f.operator as ExploreFilterSlot['operator'],
    value: f.value,
  }));

  return {
    dimensions,
    measures,
    filters,
    limit: options?.limit ?? 10000,
  };
}

// ========================================================================
// PreviewController
// ========================================================================

export interface PreviewController {
  getMode(): PreviewMode;
  setMode(mode: PreviewMode): void;
  isLoading(): boolean;
  setLoading(loading: boolean): void;
  getResult(): DataResult | null;
  setResult(result: DataResult): void;
  subscribe(listener: () => void): () => void;
}

export function createPreviewController(): PreviewController {
  let mode: PreviewMode = 'table';
  let loading = false;
  let result: DataResult | null = null;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    getMode: () => mode,
    setMode(m: PreviewMode) {
      mode = m;
      notify();
    },
    isLoading: () => loading,
    setLoading(l: boolean) {
      loading = l;
    },
    getResult: () => result,
    setResult(r: DataResult) {
      result = r;
      notify();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
