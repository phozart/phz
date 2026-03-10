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
// ========================================================================
// Factory: createViewerShellState
// ========================================================================
/**
 * Create an initial ViewerShellState with sensible defaults.
 * The shell starts on the catalog screen with no active artifact.
 */
export function createViewerShellState(config) {
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
export function navigateTo(state, screen, artifactId, artifactType) {
    const entry = {
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
export function navigateBack(state) {
    if (!canGoBack(state))
        return state;
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
export function navigateForward(state) {
    if (!canGoForward(state))
        return state;
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
export function canGoBack(state) {
    return state.historyIndex > 0;
}
export function canGoForward(state) {
    return state.historyIndex < state.navigationHistory.length - 1;
}
// ========================================================================
// State setters (immutable)
// ========================================================================
export function setError(state, error) {
    return { ...state, error, loading: false };
}
export function setEmpty(state, empty) {
    return { ...state, empty };
}
export function setLoading(state, loading) {
    return {
        ...state,
        loading,
        // Clear error when starting a new load
        error: loading ? null : state.error,
    };
}
export function setAttentionCount(state, count) {
    return { ...state, attentionCount: Math.max(0, count) };
}
export function setViewerContext(state, viewerContext) {
    return { ...state, viewerContext };
}
export function setFilterContext(state, filterContext) {
    return { ...state, filterContext };
}
export function setMobileLayout(state, mobileLayout) {
    return { ...state, mobileLayout };
}
//# sourceMappingURL=viewer-state.js.map