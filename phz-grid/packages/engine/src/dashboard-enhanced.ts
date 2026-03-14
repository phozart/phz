/**
 * @phozart/engine — Enhanced Dashboard Configuration Types
 *
 * Extends existing DashboardConfig with global filters, themes,
 * and full serialization format.
 */

import type { DashboardId, WidgetId } from './types.js';
import type { EnhancedWidgetConfig } from './widget-config-enhanced.js';
import type { KPIDefinition } from './kpi.js';
import type { MetricDef } from './metric.js';
import type { DashboardDataModel } from './expression-types.js';

// --- Global Filters ---

export type GlobalFilterType = 'select' | 'multi-select' | 'date-range' | 'text-search' | 'number-range';

export interface GlobalFilter {
  id: string;
  label: string;
  fieldKey: string;
  filterType: GlobalFilterType;
  defaultValue?: unknown;
  /** If empty, filter applies to all widgets */
  targetWidgetIds?: WidgetId[];
}

// --- Dashboard Theme ---

export interface DashboardTheme {
  mode: 'light' | 'dark';
  background: string;
  cardBackground: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  accentColor: string;
}

export const DEFAULT_DASHBOARD_THEME: DashboardTheme = {
  mode: 'light',
  background: '#F5F5F4',
  cardBackground: '#FFFFFF',
  textColor: '#1C1917',
  mutedColor: '#78716C',
  borderColor: '#E7E5E4',
  accentColor: '#3B82F6',
};

// --- Widget Placement (enhanced) ---

export interface DashboardWidgetPlacement {
  widgetId: WidgetId;
  column: number;
  order: number;
  colSpan: number;
  heightOverride?: number;
}

// --- Enhanced Dashboard Config ---

export interface EnhancedDashboardConfig {
  version: 2;
  id: DashboardId;
  name: string;
  description?: string;
  layout: {
    columns: number;
    gap: number;
  };
  widgets: EnhancedWidgetConfig[];
  placements: DashboardWidgetPlacement[];
  globalFilters: GlobalFilter[];
  theme: DashboardTheme;
  metadata: {
    created: number;
    updated: number;
    createdBy?: string;
  };
  autoRefreshInterval?: number;
  /** Optional data model for expression-based computed metrics/KPIs */
  dataModel?: DashboardDataModel;
}

// --- Serialization Format ---

export interface DashboardSerializationFormat {
  version: 2;
  dashboard: {
    id: string;
    name: string;
    description?: string;
    layout: { columns: number; gap: number };
    theme: DashboardTheme;
    autoRefreshInterval?: number;
  };
  widgets: EnhancedWidgetConfig[];
  placements: DashboardWidgetPlacement[];
  globalFilters: GlobalFilter[];
  kpis: KPIDefinition[];
  metrics: MetricDef[];
  datasetSchema: { fieldKey: string; type: string }[];
}

// --- Factory ---

export function createEnhancedDashboardConfig(
  id: DashboardId,
  name: string,
): EnhancedDashboardConfig {
  return {
    version: 2,
    id,
    name,
    layout: { columns: 3, gap: 16 },
    widgets: [],
    placements: [],
    globalFilters: [],
    theme: { ...DEFAULT_DASHBOARD_THEME },
    metadata: { created: Date.now(), updated: Date.now() },
  };
}

// --- Serialization helpers ---

export function serializeDashboard(
  config: EnhancedDashboardConfig,
  kpis: KPIDefinition[],
  metrics: MetricDef[],
  datasetSchema: { fieldKey: string; type: string }[],
): DashboardSerializationFormat {
  return {
    version: 2,
    dashboard: {
      id: config.id as string,
      name: config.name,
      description: config.description,
      layout: config.layout,
      theme: config.theme,
      autoRefreshInterval: config.autoRefreshInterval,
    },
    widgets: config.widgets,
    placements: config.placements,
    globalFilters: config.globalFilters,
    kpis,
    metrics,
    datasetSchema,
  };
}

/**
 * Detect whether a config object is an enhanced (v2) dashboard.
 */
export function isEnhancedDashboard(config: unknown): config is EnhancedDashboardConfig {
  return typeof config === 'object' && config !== null && (config as any).version === 2;
}
