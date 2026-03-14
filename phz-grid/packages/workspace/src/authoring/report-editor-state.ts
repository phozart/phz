/**
 * @phozart/workspace — Report Editor State
 *
 * Pure functions for configuring a report (a configured <phz-grid>).
 * Manages columns, filters, sorting, grouping, conditional formatting, and density.
 */

import type { FilterValue } from '../types.js';
import type { ReportChartState } from './report-chart-state.js';
import type { JoinType } from '@phozart/shared/types';

export interface ReportColumnConfig {
  field: string;
  label: string;
  width?: number;
  visible: boolean;
  pinned?: 'left' | 'right';
  format?: string;
  aggregation?: string;
}

export interface ConditionalFormatRule {
  id: string;
  field: string;
  operator: 'greaterThan' | 'lessThan' | 'equals' | 'between';
  value: unknown;
  style: Record<string, string>;  // e.g. { backgroundColor: '#ff0000', color: '#fff' }
}

export interface ReportAdditionalSourceConfig {
  slotId: string;
  dataSourceId: string;
  alias: string;
  joinKeys: Array<{ localField: string; remoteField: string }>;
  joinType: JoinType;
}

export interface ReportEditorState {
  name: string;
  dataSourceId: string;
  columns: ReportColumnConfig[];
  filters: FilterValue[];
  sorting: Array<{ field: string; direction: 'asc' | 'desc' }>;
  grouping: string[];
  formatting: ConditionalFormatRule[];
  density: 'compact' | 'dense' | 'comfortable';
  configPanelTab: 'columns' | 'filters' | 'style' | 'formatting' | 'drill' | 'chart';
  selectedColumnField?: string;
  additionalSources: ReportAdditionalSourceConfig[];
  chartConfig?: ReportChartState;
}

export function initialReportEditorState(name: string, dataSourceId: string): ReportEditorState {
  return {
    name, dataSourceId,
    columns: [], filters: [], sorting: [], grouping: [], formatting: [], additionalSources: [],
    density: 'comfortable',
    configPanelTab: 'columns',
  };
}

export function addColumn(state: ReportEditorState, field: string, label?: string): ReportEditorState {
  if (state.columns.some(c => c.field === field)) return state; // no duplicates
  const col: ReportColumnConfig = { field, label: label ?? field, visible: true };
  return { ...state, columns: [...state.columns, col] };
}

export function removeColumn(state: ReportEditorState, field: string): ReportEditorState {
  return { ...state, columns: state.columns.filter(c => c.field !== field) };
}

export function reorderColumns(state: ReportEditorState, fromIndex: number, toIndex: number): ReportEditorState {
  if (fromIndex < 0 || fromIndex >= state.columns.length || toIndex < 0 || toIndex >= state.columns.length) return state;
  const cols = [...state.columns];
  const [moved] = cols.splice(fromIndex, 1);
  cols.splice(toIndex, 0, moved);
  return { ...state, columns: cols };
}

export function updateColumn(state: ReportEditorState, field: string, updates: Partial<ReportColumnConfig>): ReportEditorState {
  return {
    ...state,
    columns: state.columns.map(c => c.field === field ? { ...c, ...updates, field: c.field } : c),
  };
}

export function toggleColumnVisibility(state: ReportEditorState, field: string): ReportEditorState {
  return updateColumn(state, field, { visible: !state.columns.find(c => c.field === field)?.visible });
}

export function pinColumn(state: ReportEditorState, field: string, side?: 'left' | 'right'): ReportEditorState {
  return updateColumn(state, field, { pinned: side });
}

export function addFilter(state: ReportEditorState, filter: FilterValue): ReportEditorState {
  // Replace existing filter for same filterId if present
  const filters = state.filters.filter(f => f.filterId !== filter.filterId);
  return { ...state, filters: [...filters, filter] };
}

export function removeFilter(state: ReportEditorState, filterId: string): ReportEditorState {
  return { ...state, filters: state.filters.filter(f => f.filterId !== filterId) };
}

export function setSorting(state: ReportEditorState, sorting: Array<{ field: string; direction: 'asc' | 'desc' }>): ReportEditorState {
  return { ...state, sorting };
}

export function setGrouping(state: ReportEditorState, fields: string[]): ReportEditorState {
  return { ...state, grouping: fields };
}

export function addConditionalFormat(state: ReportEditorState, rule: ConditionalFormatRule): ReportEditorState {
  return { ...state, formatting: [...state.formatting, rule] };
}

export function removeConditionalFormat(state: ReportEditorState, ruleId: string): ReportEditorState {
  return { ...state, formatting: state.formatting.filter(r => r.id !== ruleId) };
}

export function setDensity(state: ReportEditorState, density: ReportEditorState['density']): ReportEditorState {
  return { ...state, density };
}

export function setConfigPanelTab(state: ReportEditorState, tab: ReportEditorState['configPanelTab']): ReportEditorState {
  return { ...state, configPanelTab: tab };
}

export function selectColumn(state: ReportEditorState, field?: string): ReportEditorState {
  return { ...state, selectedColumnField: field };
}

// Convert to a phz-grid compatible config object
export interface GridConfig {
  columns: Array<{ field: string; headerName: string; width?: number; hide?: boolean; pinned?: string; }>;
  filters: FilterValue[];
  sorting: Array<{ field: string; direction: 'asc' | 'desc' }>;
  grouping: string[];
  density: string;
}

export function toGridConfig(state: ReportEditorState): GridConfig {
  return {
    columns: state.columns.map(c => ({
      field: c.field,
      headerName: c.label,
      width: c.width,
      hide: !c.visible ? true : undefined,
      pinned: c.pinned,
    })),
    filters: state.filters,
    sorting: state.sorting,
    grouping: state.grouping,
    density: state.density,
  };
}

// ========================================================================
// Multi-source report functions
// ========================================================================

let reportSourceCounter = 0;

export function addReportSource(
  state: ReportEditorState,
  dataSourceId: string,
  alias: string,
  joinKeys: Array<{ localField: string; remoteField: string }>,
  joinType: JoinType = 'inner',
): ReportEditorState {
  reportSourceCounter++;
  const slotId = `rpt_src_${Date.now()}_${reportSourceCounter}`;
  const source: ReportAdditionalSourceConfig = { slotId, dataSourceId, alias, joinKeys, joinType };
  return { ...state, additionalSources: [...state.additionalSources, source] };
}

export function removeReportSource(
  state: ReportEditorState,
  slotId: string,
): ReportEditorState {
  return { ...state, additionalSources: state.additionalSources.filter(s => s.slotId !== slotId) };
}

export function updateReportSource(
  state: ReportEditorState,
  slotId: string,
  updates: Partial<Omit<ReportAdditionalSourceConfig, 'slotId'>>,
): ReportEditorState {
  return {
    ...state,
    additionalSources: state.additionalSources.map(s =>
      s.slotId === slotId ? { ...s, ...updates, slotId } : s,
    ),
  };
}

/**
 * Reset the report source counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetReportSourceCounter(): void {
  reportSourceCounter = 0;
}
