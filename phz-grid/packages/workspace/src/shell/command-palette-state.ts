/**
 * @phozart/phz-workspace — Command Palette State (B-3.11)
 *
 * Pure functions for the Ctrl+K command palette.
 * Supports quick search across artifacts, actions, and settings,
 * keyboard-driven navigation, recent items, and action categories.
 */

import type { ArtifactMeta, ArtifactType } from '../types.js';

// ========================================================================
// Types
// ========================================================================

export type ActionCategory = 'navigate' | 'create' | 'configure' | 'export' | 'help';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  category: ActionCategory;
  keywords: string[];
  shortcut?: string;
  icon?: string;
  handler: () => void;
}

export interface CommandResult {
  type: 'artifact' | 'action' | 'recent';
  artifact?: ArtifactMeta;
  action?: CommandAction;
  score: number;
}

export interface CommandPaletteState {
  open: boolean;
  query: string;
  results: CommandResult[];
  selectedIndex: number;
  recentItems: CommandResult[];
  maxRecentItems: number;
  registeredActions: CommandAction[];
}

// ========================================================================
// Factory
// ========================================================================

export function initialCommandPaletteState(
  actions: CommandAction[] = [],
): CommandPaletteState {
  return {
    open: false,
    query: '',
    results: [],
    selectedIndex: 0,
    recentItems: [],
    maxRecentItems: 10,
    registeredActions: actions,
  };
}

// ========================================================================
// Open / close
// ========================================================================

export function openPalette(state: CommandPaletteState): CommandPaletteState {
  return {
    ...state,
    open: true,
    query: '',
    results: state.recentItems.length > 0 ? state.recentItems : [],
    selectedIndex: 0,
  };
}

export function closePalette(state: CommandPaletteState): CommandPaletteState {
  return { ...state, open: false, query: '', results: [], selectedIndex: 0 };
}

export function togglePalette(state: CommandPaletteState): CommandPaletteState {
  return state.open ? closePalette(state) : openPalette(state);
}

// ========================================================================
// Action registration
// ========================================================================

export function registerAction(
  state: CommandPaletteState,
  action: CommandAction,
): CommandPaletteState {
  const filtered = state.registeredActions.filter(a => a.id !== action.id);
  return { ...state, registeredActions: [...filtered, action] };
}

export function unregisterAction(
  state: CommandPaletteState,
  actionId: string,
): CommandPaletteState {
  return {
    ...state,
    registeredActions: state.registeredActions.filter(a => a.id !== actionId),
  };
}

// ========================================================================
// Search
// ========================================================================

export function setQuery(
  state: CommandPaletteState,
  query: string,
  artifacts: ArtifactMeta[] = [],
): CommandPaletteState {
  const results = search(query, artifacts, state.registeredActions);
  return { ...state, query, results, selectedIndex: 0 };
}

function search(
  query: string,
  artifacts: ArtifactMeta[],
  actions: CommandAction[],
): CommandResult[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const results: CommandResult[] = [];

  // Search artifacts
  for (const artifact of artifacts) {
    const nameMatch = artifact.name.toLowerCase().includes(q);
    const descMatch = artifact.description?.toLowerCase().includes(q) ?? false;
    const typeMatch = artifact.type.toLowerCase().includes(q);

    if (nameMatch || descMatch || typeMatch) {
      const score = nameMatch
        ? (artifact.name.toLowerCase().startsWith(q) ? 100 : 80)
        : (descMatch ? 60 : 40);
      results.push({ type: 'artifact', artifact, score });
    }
  }

  // Search actions
  for (const action of actions) {
    const labelMatch = action.label.toLowerCase().includes(q);
    const keywordMatch = action.keywords.some(k => k.toLowerCase().includes(q));
    const descMatch = action.description?.toLowerCase().includes(q) ?? false;
    const catMatch = action.category.toLowerCase().includes(q);

    if (labelMatch || keywordMatch || descMatch || catMatch) {
      const score = labelMatch
        ? (action.label.toLowerCase().startsWith(q) ? 95 : 75)
        : (keywordMatch ? 70 : 50);
      results.push({ type: 'action', action, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ========================================================================
// Keyboard navigation
// ========================================================================

export function moveSelectionUp(
  state: CommandPaletteState,
): CommandPaletteState {
  if (state.results.length === 0) return state;
  const index = state.selectedIndex <= 0
    ? state.results.length - 1
    : state.selectedIndex - 1;
  return { ...state, selectedIndex: index };
}

export function moveSelectionDown(
  state: CommandPaletteState,
): CommandPaletteState {
  if (state.results.length === 0) return state;
  const index = state.selectedIndex >= state.results.length - 1
    ? 0
    : state.selectedIndex + 1;
  return { ...state, selectedIndex: index };
}

export function getSelectedResult(
  state: CommandPaletteState,
): CommandResult | undefined {
  return state.results[state.selectedIndex];
}

// ========================================================================
// Execute selection
// ========================================================================

export function executeSelected(
  state: CommandPaletteState,
): CommandPaletteState {
  const selected = getSelectedResult(state);
  if (!selected) return closePalette(state);

  // Add to recent items
  const recentItems = addToRecent(state.recentItems, selected, state.maxRecentItems);

  // Execute the action handler if it's an action
  if (selected.type === 'action' && selected.action) {
    selected.action.handler();
  }

  return closePalette({ ...state, recentItems });
}

function addToRecent(
  recentItems: CommandResult[],
  item: CommandResult,
  max: number,
): CommandResult[] {
  // Remove existing duplicate (compare by id regardless of result type)
  const filtered = recentItems.filter(r => {
    if (item.artifact && r.artifact) {
      return r.artifact.id !== item.artifact.id;
    }
    if (item.action && r.action) {
      return r.action.id !== item.action.id;
    }
    return true;
  });

  const asRecent: CommandResult = { ...item, type: 'recent' };
  return [asRecent, ...filtered].slice(0, max);
}

// ========================================================================
// Categorized results
// ========================================================================

export function getResultsByCategory(
  results: CommandResult[],
): Map<string, CommandResult[]> {
  const groups = new Map<string, CommandResult[]>();

  for (const result of results) {
    let category: string;
    if (result.type === 'artifact') {
      category = 'Artifacts';
    } else if (result.type === 'action') {
      category = result.action?.category ?? 'Other';
    } else {
      category = 'Recent';
    }

    const group = groups.get(category) ?? [];
    group.push(result);
    groups.set(category, group);
  }

  return groups;
}

// ========================================================================
// Filter by category
// ========================================================================

export function filterResultsByCategory(
  state: CommandPaletteState,
  category: ActionCategory,
): CommandResult[] {
  return state.results.filter(
    r => r.type === 'action' && r.action?.category === category,
  );
}
