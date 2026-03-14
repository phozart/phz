/**
 * @phozart/viewer — Viewer Shell State Machine
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
import type { ViewerContext } from '@phozart/shared/adapters';
import type { FilterContextManager } from '@phozart/shared/coordination';
import type { ErrorState, EmptyState } from '@phozart/shared/types';
export type ViewerScreen = 'catalog' | 'dashboard' | 'report' | 'explorer';
export interface NavigationEntry {
    screen: ViewerScreen;
    artifactId: string | null;
    artifactType: string | null;
}
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
/**
 * Create an initial ViewerShellState with sensible defaults.
 * The shell starts on the catalog screen with no active artifact.
 */
export declare function createViewerShellState(config?: Partial<ViewerShellState>): ViewerShellState;
/**
 * Navigate to a new screen, optionally targeting a specific artifact.
 * Truncates forward history (like a browser).
 */
export declare function navigateTo(state: ViewerShellState, screen: ViewerScreen, artifactId?: string, artifactType?: string): ViewerShellState;
/**
 * Navigate back in the history stack.
 * Returns the same state if already at the beginning.
 */
export declare function navigateBack(state: ViewerShellState): ViewerShellState;
/**
 * Navigate forward in the history stack.
 * Returns the same state if already at the end.
 */
export declare function navigateForward(state: ViewerShellState): ViewerShellState;
export declare function canGoBack(state: ViewerShellState): boolean;
export declare function canGoForward(state: ViewerShellState): boolean;
export declare function setError(state: ViewerShellState, error: ErrorState | null): ViewerShellState;
export declare function setEmpty(state: ViewerShellState, empty: EmptyState | null): ViewerShellState;
export declare function setLoading(state: ViewerShellState, loading: boolean): ViewerShellState;
export declare function setAttentionCount(state: ViewerShellState, count: number): ViewerShellState;
export declare function setViewerContext(state: ViewerShellState, viewerContext: ViewerContext | null): ViewerShellState;
export declare function setFilterContext(state: ViewerShellState, filterContext: FilterContextManager | null): ViewerShellState;
export declare function setMobileLayout(state: ViewerShellState, mobileLayout: boolean): ViewerShellState;
//# sourceMappingURL=viewer-state.d.ts.map