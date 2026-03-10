/**
 * @phozart/phz-workspace — Unified Workspace State Machine
 *
 * Single-view workspace: one artifact at a time, with an artifact selector
 * bar, navigation history, and a context-sensitive data panel.
 *
 * Pure functions — no DOM, no side effects — testable in Node.
 */
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_HISTORY = 20;
const MAX_RECENT = 10;
const DATA_PANEL_MIN = 200;
const DATA_PANEL_MAX = 480;
const DRAWER_MIN = 280;
const DRAWER_MAX = 600;
const CATALOG_VIEW = {
    type: 'catalog',
    label: 'Catalog',
    icon: 'catalog',
};
// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
/** Returns default state: catalog view, data panel open, no drawer. */
export function initialUnifiedWorkspaceState() {
    return {
        activeView: { ...CATALOG_VIEW },
        isDirty: false,
        navigationHistory: [],
        dataPanelOpen: true,
        dataPanelTab: 'data',
        dataPanelWidth: 280,
        activeDrawer: null,
        drawerWidth: 360,
        recentArtifacts: [],
    };
}
// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
/**
 * Navigates to a new view. Pushes the current view onto the history stack
 * (unless it's the same view). Resets dirty state and data panel tab.
 * Adds artifact views to recentArtifacts.
 */
export function navigateToView(state, view) {
    // No-op if already on this view
    if (isSameView(state.activeView, view))
        return state;
    // Push current view onto history stack
    const history = [state.activeView, ...state.navigationHistory].slice(0, MAX_HISTORY);
    const wasAuthoring = isAuthoringViewType(state.activeView.type);
    const nowAuthoring = isAuthoringViewType(view.type);
    let next = {
        ...state,
        activeView: { ...view },
        isDirty: false,
        navigationHistory: history,
        dataPanelTab: 'data',
    };
    // Auto-manage data panel: hide for authoring, show for non-authoring
    if (!wasAuthoring && nowAuthoring) {
        next = { ...next, dataPanelOpen: false };
    }
    else if (wasAuthoring && !nowAuthoring) {
        next = { ...next, dataPanelOpen: true };
    }
    // Track in recent artifacts
    if (view.artifactId) {
        next = addWorkspaceRecentArtifact(next, {
            id: view.artifactId,
            type: view.type,
            name: view.label,
        });
    }
    return next;
}
/**
 * Navigates back to the previous view. No-op if history is empty.
 * Resets dirty state.
 */
export function navigateBack(state) {
    if (state.navigationHistory.length === 0)
        return state;
    const [previous, ...rest] = state.navigationHistory;
    const wasAuthoring = isAuthoringViewType(state.activeView.type);
    const nowAuthoring = isAuthoringViewType(previous.type);
    let next = {
        ...state,
        activeView: { ...previous },
        isDirty: false,
        navigationHistory: rest,
        dataPanelTab: 'data',
    };
    // Auto-manage data panel: hide for authoring, show for non-authoring
    if (!wasAuthoring && nowAuthoring) {
        next = { ...next, dataPanelOpen: false };
    }
    else if (wasAuthoring && !nowAuthoring) {
        next = { ...next, dataPanelOpen: true };
    }
    return next;
}
/** Whether we can navigate back (history is non-empty). */
export function canNavigateBack(state) {
    return state.navigationHistory.length > 0;
}
/** Marks the current view as dirty (unsaved changes) or clean. */
export function setWorkspaceViewDirty(state, isDirty) {
    if (state.isDirty === isDirty)
        return state;
    return { ...state, isDirty };
}
/** Updates the active view's label (e.g., after user renames an artifact). */
export function renameWorkspaceView(state, newLabel) {
    return { ...state, activeView: { ...state.activeView, label: newLabel } };
}
// ---------------------------------------------------------------------------
// Data Panel
// ---------------------------------------------------------------------------
/** Toggles dataPanelOpen. */
export function toggleWorkspaceDataPanel(state) {
    return { ...state, dataPanelOpen: !state.dataPanelOpen };
}
/** Switches the active sub-tab in the data panel. */
export function setWorkspaceDataPanelTab(state, tab) {
    if (tab === state.dataPanelTab)
        return state;
    const available = getAvailableDataPanelTabs(state);
    if (!available.includes(tab))
        return state;
    return { ...state, dataPanelTab: tab };
}
/**
 * Returns which data panel tabs are available based on the active view.
 * The workspace data panel only shows data — filters and settings live
 * inside the authoring editors themselves.
 */
export function getAvailableDataPanelTabs(_state) {
    return ['data'];
}
/** Sets data panel width, clamped between 200 and 480. */
export function setWorkspaceDataPanelWidth(state, width) {
    return { ...state, dataPanelWidth: clamp(width, DATA_PANEL_MIN, DATA_PANEL_MAX) };
}
// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------
/** Opens drawer. If same drawer is already open, closes it (toggle). */
export function openWorkspaceDrawer(state, panel) {
    if (state.activeDrawer === panel) {
        return { ...state, activeDrawer: null };
    }
    return { ...state, activeDrawer: panel };
}
/** Closes drawer. */
export function closeWorkspaceDrawer(state) {
    return { ...state, activeDrawer: null };
}
/** Sets drawer width, clamped between 280 and 600. */
export function setWorkspaceDrawerWidth(state, width) {
    return { ...state, drawerWidth: clamp(width, DRAWER_MIN, DRAWER_MAX) };
}
// ---------------------------------------------------------------------------
// Recent Artifacts
// ---------------------------------------------------------------------------
/**
 * Adds to front of recent artifacts, deduplicates by id, max 10.
 */
export function addWorkspaceRecentArtifact(state, artifact) {
    const entry = { ...artifact, openedAt: Date.now() };
    const deduped = state.recentArtifacts.filter((a) => a.id !== artifact.id);
    const recentArtifacts = [entry, ...deduped].slice(0, MAX_RECENT);
    return { ...state, recentArtifacts };
}
// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
/** Returns the current active view. */
export function getActiveWorkspaceView(state) {
    return state.activeView;
}
/** Check if the active view is an authoring view (report/dashboard/explore). */
export function isAuthoringView(state) {
    return isAuthoringViewType(state.activeView.type);
}
/** Whether the workspace data panel should be visible (hidden for authoring views). */
export function shouldShowDataPanel(state) {
    return !isAuthoringView(state);
}
/** Whether the workspace selector bar should be visible (hidden for authoring views). */
export function shouldShowSelectorBar(state) {
    return !isAuthoringView(state);
}
// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------
function isAuthoringViewType(type) {
    return type === 'report' || type === 'dashboard' || type === 'explore';
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function isSameView(a, b) {
    if (a.type !== b.type)
        return false;
    if (a.artifactId || b.artifactId)
        return a.artifactId === b.artifactId;
    return true;
}
//# sourceMappingURL=unified-workspace-state.js.map