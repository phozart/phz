/**
 * @phozart/phz-workspace — Chart Tooltip Editor State
 *
 * Pure state machine for CRUD operations on chart tooltip configuration
 * within the dashboard/report authoring environment.
 */

import type { AutoTooltipConfig, TooltipField } from '@phozart/phz-engine';

// ========================================================================
// State
// ========================================================================

export interface ChartTooltipEditorState {
  mode: 'auto' | 'custom';
  autoConfig: AutoTooltipConfig;
  customFields: TooltipField[];
  editingFieldIndex?: number;
}

// ========================================================================
// Factory
// ========================================================================

export function initialChartTooltipEditorState(): ChartTooltipEditorState {
  return {
    mode: 'auto',
    autoConfig: {
      showCategory: true,
      showValue: true,
      showPercentage: false,
      showDelta: false,
    },
    customFields: [],
  };
}

// ========================================================================
// Mode
// ========================================================================

export function setTooltipMode(
  state: ChartTooltipEditorState,
  mode: 'auto' | 'custom',
): ChartTooltipEditorState {
  if (state.mode === mode) return state;
  return { ...state, mode };
}

// ========================================================================
// Auto Config
// ========================================================================

export function updateAutoConfig(
  state: ChartTooltipEditorState,
  patch: Partial<AutoTooltipConfig>,
): ChartTooltipEditorState {
  return { ...state, autoConfig: { ...state.autoConfig, ...patch } };
}

// ========================================================================
// Custom Fields CRUD
// ========================================================================

export function addCustomField(
  state: ChartTooltipEditorState,
  field: TooltipField,
): ChartTooltipEditorState {
  return { ...state, customFields: [...state.customFields, field] };
}

export function removeCustomField(
  state: ChartTooltipEditorState,
  index: number,
): ChartTooltipEditorState {
  if (index < 0 || index >= state.customFields.length) return state;
  const next = state.customFields.filter((_, i) => i !== index);
  return { ...state, customFields: next };
}

export function updateCustomField(
  state: ChartTooltipEditorState,
  index: number,
  patch: Partial<TooltipField>,
): ChartTooltipEditorState {
  if (index < 0 || index >= state.customFields.length) return state;
  const next = state.customFields.map((f, i) => (i === index ? { ...f, ...patch } : f));
  return { ...state, customFields: next };
}

export function reorderCustomFields(
  state: ChartTooltipEditorState,
  newOrder: number[],
): ChartTooltipEditorState {
  const reordered = newOrder
    .filter(i => i >= 0 && i < state.customFields.length)
    .map((srcIdx, newIdx) => ({ ...state.customFields[srcIdx], order: newIdx }));
  return { ...state, customFields: reordered };
}

// ========================================================================
// Edit Tracking
// ========================================================================

export function startEditField(
  state: ChartTooltipEditorState,
  index: number,
): ChartTooltipEditorState {
  return { ...state, editingFieldIndex: index };
}

export function commitField(state: ChartTooltipEditorState): ChartTooltipEditorState {
  return { ...state, editingFieldIndex: undefined };
}
