/**
 * @phozart/viewer — Command Palette State
 *
 * Headless state machine for the command palette. Manages open/close,
 * fuzzy search filtering, keyboard navigation, and item selection.
 */

// ========================================================================
// Command item types
// ========================================================================

export interface CommandItem {
  /** Unique identifier for the command. */
  id: string;
  /** Display label shown in the palette. */
  label: string;
  /** Optional description shown below the label. */
  description?: string;
  /** Category used for visual grouping. */
  category: 'navigation' | 'artifact' | 'action';
  /** Optional icon identifier. */
  icon?: string;
  /** Additional keywords for search matching. */
  keywords?: string[];
}

// ========================================================================
// CommandPaletteState
// ========================================================================

export interface CommandPaletteState {
  /** Whether the palette is open. */
  open: boolean;
  /** Current search query. */
  query: string;
  /** All registered command items. */
  items: CommandItem[];
  /** Items matching the current query. */
  filteredItems: CommandItem[];
  /** Index of the currently highlighted item in filteredItems. */
  selectedIndex: number;
}

/** Grouped command items by category. */
export interface GroupedCommands {
  navigation: CommandItem[];
  artifact: CommandItem[];
  action: CommandItem[];
}

// ========================================================================
// Internal: filterItems
// ========================================================================

/**
 * Filter items by case-insensitive match on label, description, and keywords.
 */
function filterItems(items: CommandItem[], query: string): CommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [...items];

  return items.filter(item => {
    if (item.label.toLowerCase().includes(q)) return true;
    if (item.description?.toLowerCase().includes(q)) return true;
    if (item.keywords?.some(kw => kw.toLowerCase().includes(q))) return true;
    return false;
  });
}

// ========================================================================
// Factory: createCommandPaletteState
// ========================================================================

/**
 * Create a new command palette state with optional overrides.
 */
export function createCommandPaletteState(
  overrides?: Partial<CommandPaletteState>,
): CommandPaletteState {
  const items = overrides?.items ?? [];
  return {
    open: overrides?.open ?? false,
    query: overrides?.query ?? '',
    items,
    filteredItems: overrides?.filteredItems ?? [...items],
    selectedIndex: overrides?.selectedIndex ?? 0,
  };
}

// ========================================================================
// Reducers
// ========================================================================

/**
 * Open the palette, resetting query and selection.
 */
export function openPalette(state: CommandPaletteState): CommandPaletteState {
  return {
    ...state,
    open: true,
    query: '',
    selectedIndex: 0,
    filteredItems: filterItems(state.items, ''),
  };
}

/**
 * Close the palette.
 */
export function closePalette(state: CommandPaletteState): CommandPaletteState {
  return { ...state, open: false };
}

/**
 * Toggle the palette open/closed. Resets query and selection when opening.
 */
export function togglePalette(state: CommandPaletteState): CommandPaletteState {
  if (state.open) {
    return closePalette(state);
  }
  return openPalette(state);
}

/**
 * Set the search query, filter items, and reset selection.
 */
export function setQuery(state: CommandPaletteState, query: string): CommandPaletteState {
  const filteredItems = filterItems(state.items, query);
  return {
    ...state,
    query,
    filteredItems,
    selectedIndex: 0,
  };
}

/**
 * Move selection to the next item, wrapping at the end.
 */
export function selectNext(state: CommandPaletteState): CommandPaletteState {
  const count = state.filteredItems.length;
  if (count === 0) return { ...state, selectedIndex: 0 };
  return {
    ...state,
    selectedIndex: (state.selectedIndex + 1) % count,
  };
}

/**
 * Move selection to the previous item, wrapping at the beginning.
 */
export function selectPrevious(state: CommandPaletteState): CommandPaletteState {
  const count = state.filteredItems.length;
  if (count === 0) return { ...state, selectedIndex: 0 };
  return {
    ...state,
    selectedIndex: (state.selectedIndex - 1 + count) % count,
  };
}

/**
 * Return the currently selected item, or null if none.
 */
export function executeSelected(state: CommandPaletteState): CommandItem | null {
  const { filteredItems, selectedIndex } = state;
  if (filteredItems.length === 0 || selectedIndex < 0 || selectedIndex >= filteredItems.length) {
    return null;
  }
  return filteredItems[selectedIndex];
}

// ========================================================================
// Queries
// ========================================================================

/**
 * Return filtered items grouped by category.
 */
export function getFilteredCommands(state: CommandPaletteState): GroupedCommands {
  const grouped: GroupedCommands = {
    navigation: [],
    artifact: [],
    action: [],
  };
  for (const item of state.filteredItems) {
    grouped[item.category].push(item);
  }
  return grouped;
}
