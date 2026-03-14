/**
 * @phozart/workspace — Shortcut Mode State (UX-019)
 *
 * Pure functions for a vim-style shortcut overlay in the report/dashboard
 * designer. The user activates shortcut mode (e.g., pressing '?'), types a
 * key sequence, and the matching action is auto-executed when the sequence
 * is unambiguous. State is immutable; no-op calls return the same reference.
 */

// ========================================================================
// Types
// ========================================================================

export type ShortcutCategory =
  | 'column'
  | 'filter'
  | 'sort'
  | 'format'
  | 'panel'
  | 'view'
  | 'widget'
  | 'canvas';

export interface ShortcutSequence {
  keys: string;
  action: string;
  label: string;
  category: ShortcutCategory;
  editorScope: 'report' | 'dashboard' | 'both';
}

export interface ShortcutModeState {
  active: boolean;
  inputBuffer: string;
  matchedSequences: ShortcutSequence[];
  executedAction: string | null;
  timeoutMs: number;
  editorScope: 'report' | 'dashboard';
}

// ========================================================================
// Sequence Catalog
// ========================================================================

export const DEFAULT_SHORTCUT_SEQUENCES: readonly ShortcutSequence[] = [
  // Column
  { keys: 'ac', action: 'add-column', label: 'Add Column', category: 'column', editorScope: 'both' },
  { keys: 'rc', action: 'remove-column', label: 'Remove Column', category: 'column', editorScope: 'both' },
  { keys: 'tc', action: 'toggle-column-visibility', label: 'Toggle Column Visibility', category: 'column', editorScope: 'both' },
  { keys: 'pc', action: 'pin-column', label: 'Pin Column', category: 'column', editorScope: 'both' },

  // Filter
  { keys: 'af', action: 'add-filter', label: 'Add Filter', category: 'filter', editorScope: 'both' },
  { keys: 'rf', action: 'remove-filter', label: 'Remove Filter', category: 'filter', editorScope: 'both' },

  // Sort
  { keys: 'sa', action: 'sort-ascending', label: 'Sort Ascending', category: 'sort', editorScope: 'both' },
  { keys: 'sd', action: 'sort-descending', label: 'Sort Descending', category: 'sort', editorScope: 'both' },

  // Format
  { keys: 'cf', action: 'conditional-format', label: 'Conditional Format', category: 'format', editorScope: 'both' },
  { keys: 'dc', action: 'density-compact', label: 'Density: Compact', category: 'format', editorScope: 'both' },
  { keys: 'dd', action: 'density-comfortable', label: 'Density: Comfortable', category: 'format', editorScope: 'both' },

  // Panel (report only)
  { keys: 'p1', action: 'panel-columns', label: 'Panel: Columns', category: 'panel', editorScope: 'report' },
  { keys: 'p2', action: 'panel-filters', label: 'Panel: Filters', category: 'panel', editorScope: 'report' },
  { keys: 'p3', action: 'panel-style', label: 'Panel: Style', category: 'panel', editorScope: 'report' },
  { keys: 'p4', action: 'panel-formatting', label: 'Panel: Formatting', category: 'panel', editorScope: 'report' },
  { keys: 'p5', action: 'panel-drill', label: 'Panel: Drill', category: 'panel', editorScope: 'report' },
  { keys: 'p6', action: 'panel-chart', label: 'Panel: Chart', category: 'panel', editorScope: 'report' },

  // View
  { keys: 'tp', action: 'toggle-preview', label: 'Toggle Preview', category: 'view', editorScope: 'both' },
  { keys: 'cb', action: 'cycle-breakpoint', label: 'Cycle Breakpoint', category: 'view', editorScope: 'both' },

  // Widget (dashboard only)
  { keys: 'aw', action: 'add-widget', label: 'Add Widget', category: 'widget', editorScope: 'dashboard' },
  { keys: 'dw', action: 'duplicate-widget', label: 'Duplicate Widget', category: 'widget', editorScope: 'dashboard' },
  { keys: 'rw', action: 'remove-widget', label: 'Remove Widget', category: 'widget', editorScope: 'dashboard' },

  // Canvas (dashboard only)
  { keys: 'zi', action: 'zoom-in', label: 'Zoom In', category: 'canvas', editorScope: 'dashboard' },
  { keys: 'zo', action: 'zoom-out', label: 'Zoom Out', category: 'canvas', editorScope: 'dashboard' },
  { keys: 'zr', action: 'zoom-reset', label: 'Zoom Reset', category: 'canvas', editorScope: 'dashboard' },
  { keys: 'gs', action: 'toggle-grid-snap', label: 'Toggle Grid Snap', category: 'canvas', editorScope: 'dashboard' },
];

// ========================================================================
// Internal helpers
// ========================================================================

function filterSequencesForScope(
  scope: 'report' | 'dashboard',
): ShortcutSequence[] {
  return DEFAULT_SHORTCUT_SEQUENCES.filter(
    s => s.editorScope === scope || s.editorScope === 'both',
  );
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create an initial shortcut mode state for the given editor scope.
 * Starts inactive with empty matchedSequences (populated on activation).
 */
export function createShortcutModeState(
  editorScope: 'report' | 'dashboard',
): ShortcutModeState {
  return {
    active: false,
    inputBuffer: '',
    matchedSequences: [],
    executedAction: null,
    timeoutMs: 3000,
    editorScope,
  };
}

// ========================================================================
// Transitions
// ========================================================================

/**
 * Activate shortcut mode. Resets buffer and populates matched sequences.
 * No-op if already active (returns same reference).
 */
export function activateShortcutMode(state: ShortcutModeState): ShortcutModeState {
  if (state.active) return state;
  return {
    ...state,
    active: true,
    inputBuffer: '',
    matchedSequences: filterSequencesForScope(state.editorScope),
    executedAction: null,
  };
}

/**
 * Deactivate shortcut mode. Clears buffer, matchedSequences, and executedAction.
 * No-op if already inactive (returns same reference).
 */
export function deactivateShortcutMode(state: ShortcutModeState): ShortcutModeState {
  if (!state.active) return state;
  return {
    ...state,
    active: false,
    inputBuffer: '',
    matchedSequences: [],
    executedAction: null,
  };
}

/**
 * Process a single key press while shortcut mode is active.
 *
 * - Appends the key to the input buffer.
 * - Filters matchedSequences to those whose keys start with the new buffer.
 * - If no matches remain, deactivates (invalid sequence).
 * - If exactly one match AND the buffer equals its keys, auto-executes.
 * - No-op if not active (returns same reference).
 */
export function processKey(state: ShortcutModeState, key: string): ShortcutModeState {
  if (!state.active) return state;

  const newBuffer = state.inputBuffer + key;
  const filtered = state.matchedSequences.filter(s => s.keys.startsWith(newBuffer));

  // No matches — deactivate
  if (filtered.length === 0) {
    return {
      ...state,
      active: false,
      inputBuffer: '',
      matchedSequences: [],
      executedAction: null,
    };
  }

  // Exact match with exactly one candidate — auto-execute
  if (filtered.length === 1 && filtered[0].keys === newBuffer) {
    return {
      ...state,
      active: false,
      inputBuffer: '',
      matchedSequences: [],
      executedAction: filtered[0].action,
    };
  }

  // Partial match — narrow down
  return {
    ...state,
    inputBuffer: newBuffer,
    matchedSequences: filtered,
  };
}

/**
 * Execute a named action explicitly (e.g., user clicked a sequence from the overlay).
 * Sets executedAction and deactivates.
 */
export function executeSequence(state: ShortcutModeState, action: string): ShortcutModeState {
  return {
    ...state,
    active: false,
    inputBuffer: '',
    matchedSequences: [],
    executedAction: action,
  };
}

/**
 * Clear the input buffer and repopulate matchedSequences for the current scope.
 * Keeps the mode active. No-op if not active (returns same reference).
 */
export function resetBuffer(state: ShortcutModeState): ShortcutModeState {
  if (!state.active) return state;
  return {
    ...state,
    inputBuffer: '',
    matchedSequences: filterSequencesForScope(state.editorScope),
  };
}

// ========================================================================
// Queries
// ========================================================================

/**
 * Return the currently matched sequences (already computed in state).
 */
export function getMatchingSequences(state: ShortcutModeState): ShortcutSequence[] {
  return state.matchedSequences;
}

/**
 * Check if the current input buffer exactly matches one sequence's keys.
 */
export function isExactMatch(state: ShortcutModeState): boolean {
  if (!state.active || state.inputBuffer === '') return false;
  return state.matchedSequences.some(s => s.keys === state.inputBuffer);
}

/**
 * Group the current matchedSequences by category.
 * Returns a record with all categories (empty arrays for categories with no matches).
 */
export function getSequencesByCategory(
  state: ShortcutModeState,
): Record<ShortcutCategory, ShortcutSequence[]> {
  const result: Record<ShortcutCategory, ShortcutSequence[]> = {
    column: [],
    filter: [],
    sort: [],
    format: [],
    panel: [],
    view: [],
    widget: [],
    canvas: [],
  };

  for (const seq of state.matchedSequences) {
    result[seq.category].push(seq);
  }

  return result;
}
