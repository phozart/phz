/**
 * @phozart/workspace — Widget Config Panel State
 *
 * Pure functions for the 3-tab widget configuration panel
 * used in the dashboard editor.
 */

import type { ExploreFieldSlot, ExploreValueSlot } from '../explore-types.js';
import type { FilterValue, WidgetManifest } from '../types.js';
import type { DashboardWidgetState } from './dashboard-editor-state.js';

export interface WidgetConfigPanelState {
  activeTab: 'data' | 'style' | 'filters';
  widgetId: string;
  widgetType: string;

  // Data tab
  dimensions: ExploreFieldSlot[];
  measures: ExploreValueSlot[];
  aggregations: Record<string, string>;

  // Style tab
  title: string;
  subtitle?: string;
  colorScheme?: string;
  density: 'compact' | 'default';
  padding: 'none' | 'compact' | 'default';
  showLegend?: boolean;
  showLabels?: boolean;

  // Filters tab
  widgetFilters: FilterValue[];
}

export function createConfigForWidget(
  widget: DashboardWidgetState,
  _manifest?: WidgetManifest,
): WidgetConfigPanelState {
  const aggregations: Record<string, string> = {};
  for (const m of widget.dataConfig.measures) {
    aggregations[m.field] = m.aggregation;
  }

  return {
    activeTab: 'data',
    widgetId: widget.id,
    widgetType: widget.type,
    dimensions: [...widget.dataConfig.dimensions],
    measures: [...widget.dataConfig.measures],
    aggregations,
    title: (widget.config.title as string) ?? '',
    subtitle: widget.config.subtitle as string | undefined,
    colorScheme: widget.config.colorScheme as string | undefined,
    density: (widget.config.density as 'compact' | 'default') ?? 'default',
    padding: (widget.config.padding as 'none' | 'compact' | 'default') ?? 'default',
    showLegend: widget.config.showLegend as boolean | undefined,
    showLabels: widget.config.showLabels as boolean | undefined,
    widgetFilters: [],
  };
}

export function setActiveTab(
  state: WidgetConfigPanelState,
  tab: WidgetConfigPanelState['activeTab'],
): WidgetConfigPanelState {
  return { ...state, activeTab: tab };
}

export function updateDataConfig(
  state: WidgetConfigPanelState,
  updates: { dimensions?: ExploreFieldSlot[]; measures?: ExploreValueSlot[] },
): WidgetConfigPanelState {
  const result = { ...state };
  if (updates.dimensions) result.dimensions = updates.dimensions;
  if (updates.measures) {
    result.measures = updates.measures;
    // Sync aggregations
    const agg = { ...result.aggregations };
    for (const m of updates.measures) {
      agg[m.field] = m.aggregation;
    }
    result.aggregations = agg;
  }
  return result;
}

export function updateStyleConfig(
  state: WidgetConfigPanelState,
  updates: Partial<Pick<WidgetConfigPanelState, 'title' | 'subtitle' | 'colorScheme' | 'density' | 'padding' | 'showLegend' | 'showLabels'>>,
): WidgetConfigPanelState {
  return { ...state, ...updates };
}

export function addWidgetFilter(
  state: WidgetConfigPanelState,
  filter: FilterValue,
): WidgetConfigPanelState {
  const filters = state.widgetFilters.filter(f => f.filterId !== filter.filterId);
  return { ...state, widgetFilters: [...filters, filter] };
}

export function removeWidgetFilter(
  state: WidgetConfigPanelState,
  filterId: string,
): WidgetConfigPanelState {
  return { ...state, widgetFilters: state.widgetFilters.filter(f => f.filterId !== filterId) };
}

export function applyConfigToWidget(
  config: WidgetConfigPanelState,
  widget: DashboardWidgetState,
): DashboardWidgetState {
  return {
    ...widget,
    dataConfig: {
      dimensions: config.dimensions,
      measures: config.measures,
      filters: widget.dataConfig.filters, // preserve existing explore filters
    },
    config: {
      ...widget.config,
      title: config.title,
      subtitle: config.subtitle,
      colorScheme: config.colorScheme,
      density: config.density,
      padding: config.padding,
      showLegend: config.showLegend,
      showLabels: config.showLabels,
    },
  };
}

export function getAvailableAggregations(manifest?: WidgetManifest): string[] {
  if (manifest?.supportedAggregations?.length) {
    return manifest.supportedAggregations;
  }
  return ['sum', 'avg', 'min', 'max', 'count', 'count_distinct'];
}
