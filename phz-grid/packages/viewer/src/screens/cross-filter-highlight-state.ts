/** @phozart/viewer — Cross-Filter Highlight State (UX-024) */

// ========================================================================
// Types
// ========================================================================

export type WidgetHighlightRole = 'source' | 'target' | 'none';

export interface CrossFilterHighlightState {
  /** Whether cross-filter highlighting is currently active. */
  active: boolean;
  /** The widget that initiated the cross-filter. */
  sourceWidgetId: string | null;
  /** The set of widget IDs that are targets of the cross-filter. */
  targetWidgetIds: ReadonlySet<string>;
  /** The field on the source widget being filtered. */
  sourceField: string | null;
  /** The widget currently being hovered (for visual feedback). */
  hoverWidgetId: string | null;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Creates the default (inactive) cross-filter highlight state.
 */
export function createCrossFilterHighlightState(): CrossFilterHighlightState {
  return {
    active: false,
    sourceWidgetId: null,
    targetWidgetIds: new Set<string>(),
    sourceField: null,
    hoverWidgetId: null,
  };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Activates cross-filter highlighting for a source widget and its targets.
 * Clears any existing hover state.
 */
export function activateHighlighting(
  state: CrossFilterHighlightState,
  sourceWidgetId: string,
  targetWidgetIds: string[],
  sourceField: string,
): CrossFilterHighlightState {
  return {
    active: true,
    sourceWidgetId,
    targetWidgetIds: new Set(targetWidgetIds),
    sourceField,
    hoverWidgetId: null,
  };
}

/**
 * Deactivates cross-filter highlighting and clears all fields.
 * No-op (returns same reference) if already inactive.
 */
export function deactivateHighlighting(
  state: CrossFilterHighlightState,
): CrossFilterHighlightState {
  if (!state.active) return state;
  return createCrossFilterHighlightState();
}

/**
 * Sets the currently hovered widget ID for visual feedback.
 * No-op (returns same reference) if highlighting is not active or
 * the widget ID is already the current hover target.
 */
export function setHoverWidget(
  state: CrossFilterHighlightState,
  widgetId: string,
): CrossFilterHighlightState {
  if (!state.active) return state;
  if (state.hoverWidgetId === widgetId) return state;
  return { ...state, hoverWidgetId: widgetId };
}

/**
 * Clears the hover widget ID.
 * No-op (returns same reference) if already null.
 */
export function clearHoverWidget(
  state: CrossFilterHighlightState,
): CrossFilterHighlightState {
  if (state.hoverWidgetId === null) return state;
  return { ...state, hoverWidgetId: null };
}

// ========================================================================
// Selectors
// ========================================================================

/**
 * Returns the role of a widget in the current cross-filter highlighting.
 */
export function getWidgetRole(
  state: CrossFilterHighlightState,
  widgetId: string,
): WidgetHighlightRole {
  if (!state.active) return 'none';
  if (widgetId === state.sourceWidgetId) return 'source';
  if (state.targetWidgetIds.has(widgetId)) return 'target';
  return 'none';
}

/**
 * Returns whether cross-filter highlighting is currently active.
 */
export function isHighlightActive(state: CrossFilterHighlightState): boolean {
  return state.active;
}

/**
 * Returns all highlighted widget IDs (source + targets).
 * Returns empty array if highlighting is not active.
 */
export function getHighlightedWidgetIds(state: CrossFilterHighlightState): string[] {
  if (!state.active) return [];
  const ids = new Set<string>(state.targetWidgetIds);
  if (state.sourceWidgetId !== null) {
    ids.add(state.sourceWidgetId);
  }
  return Array.from(ids);
}
