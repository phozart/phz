/**
 * @phozart/workspace — Widget Library
 *
 * Curated list of addable widgets with metadata for the "Add Widget" UI.
 * Static data — no side effects.
 */

import type { MorphGroup } from './dashboard-editor-state.js';

export type WidgetCategory = 'chart' | 'single-value' | 'tabular' | 'text' | 'navigation';

export interface WidgetLibraryEntry {
  type: string;
  name: string;
  icon: string;
  category: WidgetCategory;
  morphGroup: MorphGroup;
  description: string;
  defaultSize: { colSpan: number; rowSpan: number };
}

const LIBRARY: WidgetLibraryEntry[] = [
  // Charts (category-chart morph group)
  { type: 'bar-chart', name: 'Bar Chart', icon: 'bar-chart', category: 'chart', morphGroup: 'category-chart', description: 'Horizontal or vertical bars for comparing categories', defaultSize: { colSpan: 4, rowSpan: 3 } },
  { type: 'line-chart', name: 'Line Chart', icon: 'line-chart', category: 'chart', morphGroup: 'category-chart', description: 'Lines showing trends over time or ordered categories', defaultSize: { colSpan: 4, rowSpan: 3 } },
  { type: 'area-chart', name: 'Area Chart', icon: 'area-chart', category: 'chart', morphGroup: 'category-chart', description: 'Filled area under lines for volume comparison', defaultSize: { colSpan: 4, rowSpan: 3 } },
  { type: 'pie-chart', name: 'Pie Chart', icon: 'pie-chart', category: 'chart', morphGroup: 'category-chart', description: 'Proportional slices showing part-to-whole relationships', defaultSize: { colSpan: 3, rowSpan: 3 } },

  // Single value (single-value morph group)
  { type: 'kpi-card', name: 'KPI Card', icon: 'kpi', category: 'single-value', morphGroup: 'single-value', description: 'Single metric with optional delta and sparkline', defaultSize: { colSpan: 2, rowSpan: 1 } },
  { type: 'gauge', name: 'Gauge', icon: 'gauge', category: 'single-value', morphGroup: 'single-value', description: 'Dial gauge showing value against a target range', defaultSize: { colSpan: 2, rowSpan: 2 } },
  { type: 'kpi-scorecard', name: 'KPI Scorecard', icon: 'scorecard', category: 'single-value', morphGroup: 'single-value', description: 'Multiple KPIs in a compact card layout', defaultSize: { colSpan: 4, rowSpan: 2 } },
  { type: 'trend-line', name: 'Trend Line', icon: 'trend', category: 'single-value', morphGroup: 'single-value', description: 'Sparkline trend with value and delta', defaultSize: { colSpan: 2, rowSpan: 1 } },

  // Tabular (tabular morph group)
  { type: 'data-table', name: 'Data Table', icon: 'table', category: 'tabular', morphGroup: 'tabular', description: 'Interactive data grid with sorting and filtering', defaultSize: { colSpan: 6, rowSpan: 4 } },
  { type: 'pivot-table', name: 'Pivot Table', icon: 'pivot', category: 'tabular', morphGroup: 'tabular', description: 'Cross-tabulation with row and column dimensions', defaultSize: { colSpan: 6, rowSpan: 4 } },

  // Text (text morph group)
  { type: 'text-block', name: 'Text Block', icon: 'text', category: 'text', morphGroup: 'text', description: 'Rich text annotation or instructions', defaultSize: { colSpan: 3, rowSpan: 1 } },
  { type: 'heading', name: 'Heading', icon: 'heading', category: 'text', morphGroup: 'text', description: 'Section heading or title', defaultSize: { colSpan: 6, rowSpan: 1 } },

  // Navigation (navigation morph group)
  { type: 'drill-link', name: 'Drill Link', icon: 'link', category: 'navigation', morphGroup: 'navigation', description: 'Navigation link to another report or dashboard', defaultSize: { colSpan: 2, rowSpan: 1 } },
];

export function getWidgetLibrary(): WidgetLibraryEntry[] {
  return [...LIBRARY];
}

export function getWidgetsByCategory(): Map<WidgetCategory, WidgetLibraryEntry[]> {
  const map = new Map<WidgetCategory, WidgetLibraryEntry[]>();
  for (const entry of LIBRARY) {
    let list = map.get(entry.category);
    if (!list) {
      list = [];
      map.set(entry.category, list);
    }
    list.push(entry);
  }
  return map;
}

export function getWidgetByType(type: string): WidgetLibraryEntry | undefined {
  return LIBRARY.find(e => e.type === type);
}

export function getWidgetsInMorphGroup(morphGroup: MorphGroup): WidgetLibraryEntry[] {
  return LIBRARY.filter(e => e.morphGroup === morphGroup);
}
