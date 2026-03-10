/**
 * @phozart/phz-engine — Dashboard Configuration & Layout
 *
 * Dashboards are collections of widgets arranged in a responsive grid layout.
 */

import type { DashboardId, WidgetId, ValidationResult } from './types.js';
import type { WidgetPlacement, WidgetConfig } from './widget.js';
import type { CriteriaConfig } from '@phozart/phz-core';
import type { EnhancedDashboardConfig, DashboardWidgetPlacement } from './dashboard-enhanced.js';
import type { EnhancedWidgetConfig } from './widget-config-enhanced.js';
import { DEFAULT_DASHBOARD_THEME } from './dashboard-enhanced.js';

// --- Layout ---

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  gap: number;
  responsive?: boolean;
}

export interface DashboardCrossFilterConfig {
  sourceWidget: WidgetId;
  targetWidgets: WidgetId[];
  filterField: string;
}

export interface ResolvedLayout {
  containerWidth: number;
  columnWidth: number;
  positions: Array<{
    widgetId: WidgetId;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

// --- Dashboard Config ---

/**
 * @deprecated Use `EnhancedDashboardConfig` (version 2) instead.
 * Call `upgradeDashboardConfig()` to convert.
 */
export interface DashboardConfig {
  id: DashboardId;
  name: string;
  description?: string;
  selectionFields?: string[];
  layout: DashboardLayout;
  widgets: WidgetPlacement[];
  crossFilter?: DashboardCrossFilterConfig;
  created: number;
  updated: number;
  createdBy?: string;
  permissions?: string[];
  autoRefreshInterval?: number;
  criteriaConfig?: CriteriaConfig;
}

// --- Dashboard Config Store ---

export interface DashboardConfigStore {
  save(config: DashboardConfig): void;
  get(id: DashboardId): DashboardConfig | undefined;
  list(): DashboardConfig[];
  delete(id: DashboardId): void;
  validate(config: Partial<DashboardConfig>): ValidationResult;
  addWidget(dashboardId: DashboardId, widget: WidgetPlacement): void;
  removeWidget(dashboardId: DashboardId, widgetId: WidgetId): void;
  updateWidget(dashboardId: DashboardId, widgetId: WidgetId, updates: Partial<WidgetPlacement>): void;
  resolveLayout(config: DashboardConfig, containerWidth: number): ResolvedLayout;
}

export function createDashboardConfigStore(): DashboardConfigStore {
  const dashboards = new Map<DashboardId, DashboardConfig>();

  return {
    save(config: DashboardConfig): void {
      dashboards.set(config.id, { ...config, updated: Date.now() });
    },

    get(id: DashboardId): DashboardConfig | undefined {
      return dashboards.get(id);
    },

    list(): DashboardConfig[] {
      return Array.from(dashboards.values());
    },

    delete(id: DashboardId): void {
      dashboards.delete(id);
    },

    validate(config: Partial<DashboardConfig>): ValidationResult {
      const errors: { path: string; message: string }[] = [];

      if (!config.id) errors.push({ path: 'id', message: 'ID is required' });
      if (!config.name) errors.push({ path: 'name', message: 'Name is required' });
      if (!config.layout) {
        errors.push({ path: 'layout', message: 'Layout is required' });
      } else {
        if (!config.layout.columns || config.layout.columns < 1) {
          errors.push({ path: 'layout.columns', message: 'Columns must be at least 1' });
        }
        if (!config.layout.rowHeight || config.layout.rowHeight < 1) {
          errors.push({ path: 'layout.rowHeight', message: 'Row height must be positive' });
        }
      }

      return { valid: errors.length === 0, errors };
    },

    addWidget(dashboardId: DashboardId, widget: WidgetPlacement): void {
      const dashboard = dashboards.get(dashboardId);
      if (!dashboard) return;
      dashboard.widgets.push(widget);
      dashboard.updated = Date.now();
    },

    removeWidget(dashboardId: DashboardId, widgetId: WidgetId): void {
      const dashboard = dashboards.get(dashboardId);
      if (!dashboard) return;
      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      dashboard.updated = Date.now();
    },

    updateWidget(dashboardId: DashboardId, widgetId: WidgetId, updates: Partial<WidgetPlacement>): void {
      const dashboard = dashboards.get(dashboardId);
      if (!dashboard) return;
      const idx = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (idx === -1) return;
      dashboard.widgets[idx] = { ...dashboard.widgets[idx], ...updates };
      dashboard.updated = Date.now();
    },

    resolveLayout(config: DashboardConfig, containerWidth: number): ResolvedLayout {
      const { columns, rowHeight, gap } = config.layout;
      const totalGap = gap * (columns - 1);
      const columnWidth = (containerWidth - totalGap) / columns;

      const positions = config.widgets.map(widget => ({
        widgetId: widget.id,
        x: widget.position.col * (columnWidth + gap),
        y: widget.position.row * (rowHeight + gap),
        width: widget.position.colSpan * columnWidth + (widget.position.colSpan - 1) * gap,
        height: widget.position.rowSpan * rowHeight + (widget.position.rowSpan - 1) * gap,
      }));

      return { containerWidth, columnWidth, positions };
    },
  };
}

/**
 * Converts a legacy `DashboardConfig` (v1) to `EnhancedDashboardConfig` (v2).
 *
 * Mapping:
 * - `layout.columns` and `layout.gap` carry over directly
 * - Each `WidgetPlacement` becomes a `DashboardWidgetPlacement` with column/order derived from position
 * - `widgets` array is populated with minimal `EnhancedWidgetConfig` entries
 * - `created`/`updated` timestamps carry over into `metadata`
 * - `autoRefreshInterval` carries over
 * - `crossFilter` is dropped (no v2 equivalent — use globalFilters instead)
 */
export function upgradeDashboardConfig(legacy: DashboardConfig): EnhancedDashboardConfig {
  const placements: DashboardWidgetPlacement[] = legacy.widgets.map((w, i) => ({
    widgetId: w.id,
    column: w.position.col,
    order: i,
    colSpan: w.position.colSpan,
    heightOverride: w.position.rowSpan > 1
      ? w.position.rowSpan * legacy.layout.rowHeight + (w.position.rowSpan - 1) * legacy.layout.gap
      : undefined,
  }));

  const widgets: EnhancedWidgetConfig[] = legacy.widgets.map(w => ({
    id: w.id,
    type: w.widgetType,
    name: (w.config as any)?.title ?? w.widgetType,
    data: {} as any,
    appearance: {} as any,
    behaviour: {} as any,
  }));

  return {
    version: 2,
    id: legacy.id,
    name: legacy.name,
    description: legacy.description,
    layout: {
      columns: legacy.layout.columns,
      gap: legacy.layout.gap,
    },
    widgets,
    placements,
    globalFilters: [],
    theme: { ...DEFAULT_DASHBOARD_THEME },
    metadata: {
      created: legacy.created,
      updated: legacy.updated,
      createdBy: legacy.createdBy,
    },
    autoRefreshInterval: legacy.autoRefreshInterval,
  };
}
