/**
 * @phozart/phz-viewer — Viewer Shell State Machine
 *
 * Headless state management for the viewer shell. Pure functions
 * operating on immutable ViewerShellState. No DOM dependency.
 *
 * Manages:
 * - Current screen (catalog, dashboard, report, explorer)
 * - Navigation history with back/forward
 * - Active artifact tracking
 * - Filter context delegation
 * - Loading / error / empty states
 * - Attention items count
 */

import type { ViewerContext } from '@phozart/phz-shared/adapters';
import type { FilterContextManager } from '@phozart/phz-shared/coordination';
import type { ErrorState, EmptyState } from '@phozart/phz-shared/types';

// ========================================================================
// ViewerScreen — the four primary screens
// ========================================================================

export type ViewerScreen = 'catalog' | 'dashboard' | 'report' | 'explorer';

// ========================================================================
// Navigation entry
// ========================================================================

export interface NavigationEntry {
  screen: ViewerScreen;
  artifactId: string | null;
  artifactType: string | null;
}

// ========================================================================
// ViewerShellState — the complete viewer state
// ========================================================================

export interface ViewerShellState {
  /** The currently displayed screen. */
  currentScreen: ViewerScreen;
  /** ID of the artifact being viewed (null when on catalog). */
  activeArtifactId: string | null;
  /** Type of the active artifact (e.g., 'dashboard', 'report', 'grid-definition'). */
  activeArtifactType: string | null;
  /** Ordered navigation history for back/forward. */
  navigationHistory: NavigationEntry[];
  /** Current position within the navigation history. */
  historyIndex: number;
  /** Reference to the active filter context manager (if any). */
  filterContext: FilterContextManager | null;
  /** Whether data is currently loading. */
  loading: boolean;
  /** Current error state (null if no error). */
  error: ErrorState | null;
  /** Current empty state (null if content is available). */
  empty: EmptyState | null;
  /** Count of unread attention items (alerts, notifications). */
  attentionCount: number;
  /** The current viewer's identity and roles. */
  viewerContext: ViewerContext | null;
  /** Whether the shell is in mobile layout mode. */
  mobileLayout: boolean;
}

// ========================================================================
// Factory: createViewerShellState
// ========================================================================

/**
 * Create an initial ViewerShellState with sensible defaults.
 * The shell starts on the catalog screen with no active artifact.
 */
export function createViewerShellState(
  config?: Partial<ViewerShellState>,
): ViewerShellState {
  const initialScreen = config?.currentScreen ?? 'catalog';
  const initialArtifactId = config?.activeArtifactId ?? null;
  const initialArtifactType = config?.activeArtifactType ?? null;

  return {
    currentScreen: initialScreen,
    activeArtifactId: initialArtifactId,
    activeArtifactType: initialArtifactType,
    navigationHistory: config?.navigationHistory ?? [
      { screen: initialScreen, artifactId: initialArtifactId, artifactType: initialArtifactType },
    ],
    historyIndex: config?.historyIndex ?? 0,
    filterContext: config?.filterContext ?? null,
    loading: config?.loading ?? false,
    error: config?.error ?? null,
    empty: config?.empty ?? null,
    attentionCount: config?.attentionCount ?? 0,
    viewerContext: config?.viewerContext ?? null,
    mobileLayout: config?.mobileLayout ?? false,
  };
}

// ========================================================================
// Navigation: navigateTo
// ========================================================================

/**
 * Navigate to a new screen, optionally targeting a specific artifact.
 * Truncates forward history (like a browser).
 */
export function navigateTo(
  state: ViewerShellState,
  screen: ViewerScreen,
  artifactId?: string,
  artifactType?: string,
): ViewerShellState {
  const entry: NavigationEntry = {
    screen,
    artifactId: artifactId ?? null,
    artifactType: artifactType ?? null,
  };

  // Truncate any forward history from the current position, cap at 50 entries
  const MAX_HISTORY = 50;
  const truncatedHistory = state.navigationHistory.slice(0, state.historyIndex + 1);
  const newHistory = [...truncatedHistory, entry].slice(-MAX_HISTORY);

  return {
    ...state,
    currentScreen: screen,
    activeArtifactId: entry.artifactId,
    activeArtifactType: entry.artifactType,
    navigationHistory: newHistory,
    historyIndex: newHistory.length - 1,
    // Clear error/empty when navigating to a new screen
    error: null,
    empty: null,
    loading: false,
  };
}

// ========================================================================
// Navigation: navigateBack / navigateForward
// ========================================================================

/**
 * Navigate back in the history stack.
 * Returns the same state if already at the beginning.
 */
export function navigateBack(state: ViewerShellState): ViewerShellState {
  if (!canGoBack(state)) return state;

  const newIndex = state.historyIndex - 1;
  const entry = state.navigationHistory[newIndex];

  return {
    ...state,
    currentScreen: entry.screen,
    activeArtifactId: entry.artifactId,
    activeArtifactType: entry.artifactType,
    historyIndex: newIndex,
    error: null,
    empty: null,
    loading: false,
  };
}

/**
 * Navigate forward in the history stack.
 * Returns the same state if already at the end.
 */
export function navigateForward(state: ViewerShellState): ViewerShellState {
  if (!canGoForward(state)) return state;

  const newIndex = state.historyIndex + 1;
  const entry = state.navigationHistory[newIndex];

  return {
    ...state,
    currentScreen: entry.screen,
    activeArtifactId: entry.artifactId,
    activeArtifactType: entry.artifactType,
    historyIndex: newIndex,
    error: null,
    empty: null,
    loading: false,
  };
}

// ========================================================================
// Navigation predicates
// ========================================================================

export function canGoBack(state: ViewerShellState): boolean {
  return state.historyIndex > 0;
}

export function canGoForward(state: ViewerShellState): boolean {
  return state.historyIndex < state.navigationHistory.length - 1;
}

// ========================================================================
// State setters (immutable)
// ========================================================================

export function setError(
  state: ViewerShellState,
  error: ErrorState | null,
): ViewerShellState {
  return { ...state, error, loading: false };
}

export function setEmpty(
  state: ViewerShellState,
  empty: EmptyState | null,
): ViewerShellState {
  return { ...state, empty };
}

export function setLoading(
  state: ViewerShellState,
  loading: boolean,
): ViewerShellState {
  return {
    ...state,
    loading,
    // Clear error when starting a new load
    error: loading ? null : state.error,
  };
}

export function setAttentionCount(
  state: ViewerShellState,
  count: number,
): ViewerShellState {
  return { ...state, attentionCount: Math.max(0, count) };
}

export function setViewerContext(
  state: ViewerShellState,
  viewerContext: ViewerContext | null,
): ViewerShellState {
  return { ...state, viewerContext };
}

export function setFilterContext(
  state: ViewerShellState,
  filterContext: FilterContextManager | null,
): ViewerShellState {
  return { ...state, filterContext };
}

export function setMobileLayout(
  state: ViewerShellState,
  mobileLayout: boolean,
): ViewerShellState {
  return { ...state, mobileLayout };
}
