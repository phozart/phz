/**
 * @phozart/workspace — Dashboard Editor State (UX-010)
 *
 * Pure, headless state machine for the unified dashboard editor.
 * Merges Builder (simple) and Studio (advanced) into a single progressive
 * disclosure model. All functions are immutable reducers — they accept state
 * and return a new state object without mutating the input.
 *
 * - `simple` mode: 3-panel builder (catalog | canvas | config)
 * - `advanced` mode: full studio (toolbar, data model sidebar, global filters)
 *
 * The UI component reads this state and conditionally renders advanced chrome.
 */

// ── Types ──

/** Editor mode — controls which UI chrome is available. */
export type DashboardEditorMode = 'simple' | 'advanced';

/** A widget placed on the dashboard canvas. */
export interface EditorWidgetPlacement {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

/** A global filter applied across all widgets. */
export interface EditorGlobalFilter {
  id: string;
  field: string;
  operator: string;
  value: unknown;
}

/** Root state for the dashboard editor. */
export interface DashboardEditorState {
  /** Current editing mode. */
  mode: DashboardEditorMode;
  /** Dashboard display name. */
  name: string;
  /** Dashboard description / subtitle. */
  description: string;
  /** Number of layout columns in the grid. */
  layoutColumns: number;
  /** Ordered list of widgets on the canvas. */
  widgets: EditorWidgetPlacement[];
  /** Currently selected widget, or null if none. */
  selectedWidgetId: string | null;
  /** Whether the data model sidebar is visible (advanced mode only). */
  showDataModel: boolean;
  /** Whether the toolbar is visible (advanced mode only). */
  showToolbar: boolean;
  /** Dashboard-level filters that apply to all widgets (advanced mode). */
  globalFilters: EditorGlobalFilter[];
}

// ── Factory ──

/**
 * Create a fresh dashboard editor state.
 * @param mode - Starting mode. Defaults to `'simple'`.
 */
export function createDashboardEditorState(
  mode: DashboardEditorMode = 'simple',
): DashboardEditorState {
  return {
    mode,
    name: '',
    description: '',
    layoutColumns: 3,
    widgets: [],
    selectedWidgetId: null,
    showDataModel: false,
    showToolbar: false,
    globalFilters: [],
  };
}

// ── Mode transitions ──

/**
 * Switch the editor to advanced mode. Enables the toolbar.
 * No-op if already in advanced mode (returns same reference).
 */
export function enableAdvancedMode(
  state: DashboardEditorState,
): DashboardEditorState {
  if (state.mode === 'advanced') return state;
  return { ...state, mode: 'advanced', showToolbar: true };
}

/**
 * Toggle the data model sidebar visibility.
 * Only effective in advanced mode — returns same reference in simple mode.
 */
export function toggleDataModel(
  state: DashboardEditorState,
): DashboardEditorState {
  if (state.mode !== 'advanced') return state;
  return { ...state, showDataModel: !state.showDataModel };
}

/**
 * Toggle the toolbar visibility.
 * Only effective in advanced mode — returns same reference in simple mode.
 */
export function toggleToolbar(
  state: DashboardEditorState,
): DashboardEditorState {
  if (state.mode !== 'advanced') return state;
  return { ...state, showToolbar: !state.showToolbar };
}

// ── Widget CRUD ──

/**
 * Append a widget to the canvas and auto-select it.
 */
export function addWidget(
  state: DashboardEditorState,
  widget: EditorWidgetPlacement,
): DashboardEditorState {
  return {
    ...state,
    widgets: [...state.widgets, widget],
    selectedWidgetId: widget.id,
  };
}

/**
 * Remove a widget by id. Clears selection if the removed widget was selected.
 * Safe to call with a non-existent id — returns same reference.
 */
export function removeWidget(
  state: DashboardEditorState,
  widgetId: string,
): DashboardEditorState {
  const idx = state.widgets.findIndex((w) => w.id === widgetId);
  if (idx === -1) return state;

  const widgets = state.widgets.filter((w) => w.id !== widgetId);
  const selectedWidgetId =
    state.selectedWidgetId === widgetId ? null : state.selectedWidgetId;

  return { ...state, widgets, selectedWidgetId };
}

/**
 * Set the selected widget id. Pass `null` to clear selection.
 */
export function selectWidget(
  state: DashboardEditorState,
  widgetId: string | null,
): DashboardEditorState {
  return { ...state, selectedWidgetId: widgetId };
}

/**
 * Merge additional config keys into a widget's config.
 * Safe to call with a non-existent widget id — returns same reference.
 */
export function updateWidgetConfig(
  state: DashboardEditorState,
  widgetId: string,
  config: Record<string, unknown>,
): DashboardEditorState {
  const idx = state.widgets.findIndex((w) => w.id === widgetId);
  if (idx === -1) return state;

  const widget = state.widgets[idx];
  const updatedWidget: EditorWidgetPlacement = {
    ...widget,
    config: { ...widget.config, ...config },
  };
  const widgets = [
    ...state.widgets.slice(0, idx),
    updatedWidget,
    ...state.widgets.slice(idx + 1),
  ];
  return { ...state, widgets };
}

// ── Metadata ──

/** Set the dashboard name. */
export function setName(
  state: DashboardEditorState,
  name: string,
): DashboardEditorState {
  return { ...state, name };
}

/** Set the dashboard description. */
export function setDescription(
  state: DashboardEditorState,
  description: string,
): DashboardEditorState {
  return { ...state, description };
}

// ── Queries ──

/**
 * Returns `true` if the current state uses any advanced-only feature.
 * Useful for warning users before downgrading to simple mode.
 */
export function isAdvancedFeatureUsed(state: DashboardEditorState): boolean {
  if (state.globalFilters.length > 0) return true;
  if (state.showDataModel) return true;
  return false;
}
