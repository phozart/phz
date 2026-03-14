/**
 * dashboard-editor-wiring — Pure functions that translate data source panel
 * events into dashboard editor state transitions.
 *
 * Bridges <phz-data-source-panel> field-add/field-remove events with the
 * dashboard editor's widget data config. When a field is added, it's placed
 * into the selected widget's dimensions or measures based on data type.
 *
 * Tasks: 1.2, 1.5 (WB-004)
 */

import type { FieldMetadata } from '@phozart/shared';
import type { WidgetManifest } from '../types.js';
import { suggestWidgetForFieldDrop, type WidgetSuggestion } from '@phozart/engine';
import {
  addWidget,
  selectWidget,
  updateWidgetData,
  getWidgetSourceSlot,
  type DashboardEditorState,
  type DashboardWidgetState,
  type DashboardSourceEntry,
} from './dashboard-editor-state.js';

/**
 * Handle a field-add event from the data source panel.
 * Adds the field to the selected widget's data config:
 * - number/measure → measures (with default aggregation 'sum')
 * - string/date/boolean → dimensions
 */
export function handleDashboardFieldAdd(
  state: DashboardEditorState,
  fieldName: string,
  metadata: Pick<FieldMetadata, 'name' | 'dataType' | 'semanticHint'>,
): DashboardEditorState {
  if (!state.selectedWidgetId) return state;

  const widget = state.widgets.find(w => w.id === state.selectedWidgetId);
  if (!widget) return state;

  const isMeasure = metadata.dataType === 'number' ||
    metadata.semanticHint === 'measure' ||
    metadata.semanticHint === 'currency' ||
    metadata.semanticHint === 'percentage';

  if (isMeasure) {
    // Check for duplicates
    if (widget.dataConfig.measures.some(m => m.field === fieldName)) return state;

    const newMeasures = [
      ...widget.dataConfig.measures,
      { field: fieldName, aggregation: 'sum' as const },
    ];
    return updateWidgetData(state, widget.id, {
      ...widget.dataConfig,
      measures: newMeasures,
    });
  } else {
    // Dimension
    if (widget.dataConfig.dimensions.some(d => d.field === fieldName)) return state;

    const newDimensions = [
      ...widget.dataConfig.dimensions,
      { field: fieldName },
    ];
    return updateWidgetData(state, widget.id, {
      ...widget.dataConfig,
      dimensions: newDimensions,
    });
  }
}

/**
 * Handle a field-remove event from the data source panel.
 * Removes the field from the selected widget's dimensions and measures.
 */
export function handleDashboardFieldRemove(
  state: DashboardEditorState,
  fieldName: string,
): DashboardEditorState {
  if (!state.selectedWidgetId) return state;

  const widget = state.widgets.find(w => w.id === state.selectedWidgetId);
  if (!widget) return state;

  const newDimensions = widget.dataConfig.dimensions.filter(d => d.field !== fieldName);
  const newMeasures = widget.dataConfig.measures.filter(m => m.field !== fieldName);

  // Only update if something actually changed
  if (
    newDimensions.length === widget.dataConfig.dimensions.length &&
    newMeasures.length === widget.dataConfig.measures.length
  ) {
    return state;
  }

  return updateWidgetData(state, widget.id, {
    ...widget.dataConfig,
    dimensions: newDimensions,
    measures: newMeasures,
  });
}

/**
 * Suggest a widget type to auto-create when a field is added
 * but no widget is selected. Delegates to suggestWidgetForFieldDrop()
 * for context-aware chart type selection.
 */
export function autoCreateWidgetForField(
  metadata: Pick<FieldMetadata, 'name' | 'dataType' | 'semanticHint'>,
  existingWidgets?: ReadonlyArray<DashboardWidgetState>,
  availableFields?: ReadonlyArray<FieldMetadata>,
): WidgetSuggestion {
  const field: FieldMetadata = {
    name: metadata.name,
    dataType: metadata.dataType,
    nullable: false,
    semanticHint: metadata.semanticHint,
  };
  const widgets = (existingWidgets ?? []).map(w => ({
    type: w.type,
    dimensions: w.dataConfig.dimensions,
    measures: w.dataConfig.measures,
  }));
  return suggestWidgetForFieldDrop(field, widgets, availableFields ?? []);
}

/**
 * Create a widget from the palette gallery using manifest metadata.
 * Uses the manifest's preferredSize for initial placement, distinct from
 * the field-drop-based autoCreateWidgetForField path.
 */
export function createWidgetFromPalette(
  state: DashboardEditorState,
  widgetType: string,
  position: { row: number; col: number },
  manifest?: WidgetManifest,
  sourceSlotId?: string,
): DashboardEditorState {
  const colSpan = manifest?.preferredSize?.cols ?? 4;
  const rowSpan = manifest?.preferredSize?.rows ?? 3;
  const fullPosition = { row: position.row, col: position.col, colSpan, rowSpan };

  let next = addWidget(state, widgetType, fullPosition, sourceSlotId);
  const newWidget = next.widgets[next.widgets.length - 1];
  if (newWidget) {
    next = selectWidget(next, newWidget.id);
  }
  return next;
}

/**
 * Resolves the data source entry for the currently selected widget.
 * Returns the widget's bound source, or the dashboard's primary source.
 */
export function getSelectedWidgetSource(
  state: DashboardEditorState,
): DashboardSourceEntry | undefined {
  const slotId = state.selectedWidgetId
    ? getWidgetSourceSlot(state, state.selectedWidgetId)
    : state.dataSources[0]?.slotId;
  return state.dataSources.find(s => s.slotId === slotId);
}
