/**
 * @phozart/engine/explorer — Explore → Pivot Converter
 *
 * Converts an ExploreQuery with column fields (from DropZoneState)
 * into a PivotConfig suitable for the pivot engine.
 */

import type { PivotConfig } from '@phozart/core';
import type { DropZoneState } from './phz-drop-zones.js';

/**
 * Convert a DropZoneState into a PivotConfig when column fields are present.
 * Returns null if the state has no column fields (not a pivot query).
 */
export function exploreQueryToPivot(state: DropZoneState): PivotConfig | null {
  if (state.columns.length === 0) return null;
  if (state.values.length === 0) return null;

  return {
    rowFields: state.rows.map(r => r.field),
    columnFields: state.columns.map(c => c.field),
    valueFields: state.values.map(v => ({
      field: v.field,
      aggregation: v.aggregation as any, // DropZoneState uses string, PivotConfig uses AggregationFunction
    })),
  };
}
