/** @phozart/viewer — Keyboard Shortcuts Help State (UX-023) */

// ========================================================================
// Types
// ========================================================================

export type HelpShortcutCategory = 'navigation' | 'editing' | 'selection' | 'clipboard' | 'general';

export interface HelpShortcutEntry {
  /** Key combination displayed to the user, e.g. "Ctrl+C", "Arrow Up". */
  keys: string;
  /** Human-readable label for the shortcut. */
  label: string;
  /** Category used for grouping and filtering. */
  category: HelpShortcutCategory;
  /** Optional longer description. */
  description?: string;
}

export interface KeyboardHelpState {
  /** Whether the help panel is open. */
  open: boolean;
  /** Current search query for filtering shortcuts. */
  searchQuery: string;
  /** Active category filter — null means show all. */
  activeCategory: HelpShortcutCategory | null;
  /** Full catalog of shortcuts. */
  shortcuts: readonly HelpShortcutEntry[];
}

// ========================================================================
// Default shortcuts catalog
// ========================================================================

export const DEFAULT_HELP_SHORTCUTS: readonly HelpShortcutEntry[] = [
  // navigation (7)
  { keys: 'Arrow Up', label: 'Move up one row', category: 'navigation' },
  { keys: 'Arrow Down', label: 'Move down one row', category: 'navigation' },
  { keys: 'Arrow Left', label: 'Move left one cell', category: 'navigation' },
  { keys: 'Arrow Right', label: 'Move right one cell', category: 'navigation' },
  { keys: 'Home', label: 'Go to first cell in row', category: 'navigation' },
  { keys: 'End', label: 'Go to last cell in row', category: 'navigation' },
  { keys: 'Page Down', label: 'Scroll down one page', category: 'navigation' },

  // editing (3)
  { keys: 'F2', label: 'Edit cell', category: 'editing' },
  { keys: 'Escape', label: 'Cancel editing', category: 'editing' },
  { keys: 'Enter', label: 'Confirm edit', category: 'editing' },

  // selection (3)
  { keys: 'Ctrl+A', label: 'Select all rows', category: 'selection' },
  { keys: 'Shift+Arrow', label: 'Extend selection', category: 'selection' },
  { keys: 'Ctrl+Click', label: 'Toggle row selection', category: 'selection' },

  // clipboard (2)
  { keys: 'Ctrl+C', label: 'Copy selection', category: 'clipboard' },
  { keys: 'Ctrl+V', label: 'Paste', category: 'clipboard' },

  // general (3)
  { keys: 'Ctrl+Z', label: 'Undo', category: 'general' },
  { keys: 'Ctrl+K', label: 'Open command palette', category: 'general' },
  { keys: '?', label: 'Show keyboard shortcuts', category: 'general' },
] as const;

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a new keyboard help state. Uses DEFAULT_HELP_SHORTCUTS unless
 * a custom shortcuts array is provided.
 */
export function createKeyboardHelpState(
  shortcuts?: readonly HelpShortcutEntry[],
): KeyboardHelpState {
  return {
    open: false,
    searchQuery: '',
    activeCategory: null,
    shortcuts: shortcuts ?? DEFAULT_HELP_SHORTCUTS,
  };
}

// ========================================================================
// Reducers
// ========================================================================

/**
 * Open the help panel. No-op if already open (returns same reference).
 */
export function openKeyboardHelp(state: KeyboardHelpState): KeyboardHelpState {
  if (state.open) return state;
  return { ...state, open: true };
}

/**
 * Close the help panel, clearing search query and active category.
 * No-op if already closed (returns same reference).
 */
export function closeKeyboardHelp(state: KeyboardHelpState): KeyboardHelpState {
  if (!state.open) return state;
  return { ...state, open: false, searchQuery: '', activeCategory: null };
}

/**
 * Toggle the help panel. If open, closes (clearing filters). If closed, opens.
 */
export function toggleKeyboardHelp(state: KeyboardHelpState): KeyboardHelpState {
  if (state.open) {
    return closeKeyboardHelp(state);
  }
  return openKeyboardHelp(state);
}

/**
 * Set the search query. No-op if same value (returns same reference).
 */
export function setHelpSearch(state: KeyboardHelpState, query: string): KeyboardHelpState {
  if (state.searchQuery === query) return state;
  return { ...state, searchQuery: query };
}

/**
 * Set the active category filter. Pass null to show all.
 * No-op if same value (returns same reference).
 */
export function setHelpCategory(
  state: KeyboardHelpState,
  category: HelpShortcutCategory | null,
): KeyboardHelpState {
  if (state.activeCategory === category) return state;
  return { ...state, activeCategory: category };
}

// ========================================================================
// Queries
// ========================================================================

/**
 * Get shortcuts filtered by activeCategory and searchQuery (AND logic).
 * Case-insensitive match on keys, label, or description.
 */
export function getFilteredShortcuts(state: KeyboardHelpState): HelpShortcutEntry[] {
  const { shortcuts, activeCategory, searchQuery } = state;
  const q = searchQuery.toLowerCase().trim();

  let result: HelpShortcutEntry[] = [...shortcuts];

  // Filter by category if set
  if (activeCategory !== null) {
    result = result.filter(s => s.category === activeCategory);
  }

  // Filter by search query if set
  if (q) {
    result = result.filter(s => {
      if (s.keys.toLowerCase().includes(q)) return true;
      if (s.label.toLowerCase().includes(q)) return true;
      if (s.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  return result;
}

/**
 * Get filtered shortcuts grouped by category. All 5 categories are always
 * present in the result (empty arrays for categories with no matches).
 */
export function getShortcutsByCategory(
  state: KeyboardHelpState,
): Record<HelpShortcutCategory, HelpShortcutEntry[]> {
  const filtered = getFilteredShortcuts(state);
  const grouped: Record<HelpShortcutCategory, HelpShortcutEntry[]> = {
    navigation: [],
    editing: [],
    selection: [],
    clipboard: [],
    general: [],
  };

  for (const entry of filtered) {
    grouped[entry.category].push(entry);
  }

  return grouped;
}
