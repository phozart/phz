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
    dimensions: ExploreFieldSlot[];
    measures: ExploreValueSlot[];
    aggregations: Record<string, string>;
    title: string;
    subtitle?: string;
    colorScheme?: string;
    density: 'compact' | 'default';
    padding: 'none' | 'compact' | 'default';
    showLegend?: boolean;
    showLabels?: boolean;
    widgetFilters: FilterValue[];
}
export declare function createConfigForWidget(widget: DashboardWidgetState, _manifest?: WidgetManifest): WidgetConfigPanelState;
export declare function setActiveTab(state: WidgetConfigPanelState, tab: WidgetConfigPanelState['activeTab']): WidgetConfigPanelState;
export declare function updateDataConfig(state: WidgetConfigPanelState, updates: {
    dimensions?: ExploreFieldSlot[];
    measures?: ExploreValueSlot[];
}): WidgetConfigPanelState;
export declare function updateStyleConfig(state: WidgetConfigPanelState, updates: Partial<Pick<WidgetConfigPanelState, 'title' | 'subtitle' | 'colorScheme' | 'density' | 'padding' | 'showLegend' | 'showLabels'>>): WidgetConfigPanelState;
export declare function addWidgetFilter(state: WidgetConfigPanelState, filter: FilterValue): WidgetConfigPanelState;
export declare function removeWidgetFilter(state: WidgetConfigPanelState, filterId: string): WidgetConfigPanelState;
export declare function applyConfigToWidget(config: WidgetConfigPanelState, widget: DashboardWidgetState): DashboardWidgetState;
export declare function getAvailableAggregations(manifest?: WidgetManifest): string[];
//# sourceMappingURL=widget-config-state.d.ts.map