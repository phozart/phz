/**
 * @phozart/phz-workspace — Unified Workspace State Machine
 *
 * Single-view workspace: one artifact at a time, with an artifact selector
 * bar, navigation history, and a context-sensitive data panel.
 *
 * Pure functions — no DOM, no side effects — testable in Node.
 */
export type WorkspaceViewType = 'catalog' | 'report' | 'dashboard' | 'explore' | 'data-sources';
/** @deprecated Use WorkspaceViewType instead. */
export type WorkspaceTabType = WorkspaceViewType;
export interface WorkspaceView {
    type: WorkspaceViewType;
    label: string;
    icon: string;
    /** For report/dashboard views that edit a specific artifact. */
    artifactId?: string;
}
export type DrawerPanel = 'hierarchies' | 'connectors' | 'alerts' | 'permissions' | 'lineage' | 'preferences';
export type DataPanelTab = 'data';
export interface RecentArtifact {
    id: string;
    type: string;
    name: string;
    openedAt: number;
}
export interface UnifiedWorkspaceState {
    /** The single active view — only one artifact on screen at a time. */
    activeView: WorkspaceView;
    /** Whether the current artifact has unsaved changes. */
    isDirty: boolean;
    /** Stack of previous views for back-navigation. */
    navigationHistory: WorkspaceView[];
    /** Data panel (left side). */
    dataPanelOpen: boolean;
    dataPanelTab: DataPanelTab;
    /** Pixels, default 280. */
    dataPanelWidth: number;
    /** Drawer overlay (right side). */
    activeDrawer: DrawerPanel | null;
    /** Pixels, default 360. */
    drawerWidth: number;
    /** Recent artifacts for the selector dropdown. */
    recentArtifacts: RecentArtifact[];
}
/** Returns default state: catalog view, data panel open, no drawer. */
export declare function initialUnifiedWorkspaceState(): UnifiedWorkspaceState;
/**
 * Navigates to a new view. Pushes the current view onto the history stack
 * (unless it's the same view). Resets dirty state and data panel tab.
 * Adds artifact views to recentArtifacts.
 */
export declare function navigateToView(state: UnifiedWorkspaceState, view: WorkspaceView): UnifiedWorkspaceState;
/**
 * Navigates back to the previous view. No-op if history is empty.
 * Resets dirty state.
 */
export declare function navigateBack(state: UnifiedWorkspaceState): UnifiedWorkspaceState;
/** Whether we can navigate back (history is non-empty). */
export declare function canNavigateBack(state: UnifiedWorkspaceState): boolean;
/** Marks the current view as dirty (unsaved changes) or clean. */
export declare function setWorkspaceViewDirty(state: UnifiedWorkspaceState, isDirty: boolean): UnifiedWorkspaceState;
/** Updates the active view's label (e.g., after user renames an artifact). */
export declare function renameWorkspaceView(state: UnifiedWorkspaceState, newLabel: string): UnifiedWorkspaceState;
/** Toggles dataPanelOpen. */
export declare function toggleWorkspaceDataPanel(state: UnifiedWorkspaceState): UnifiedWorkspaceState;
/** Switches the active sub-tab in the data panel. */
export declare function setWorkspaceDataPanelTab(state: UnifiedWorkspaceState, tab: DataPanelTab): UnifiedWorkspaceState;
/**
 * Returns which data panel tabs are available based on the active view.
 * The workspace data panel only shows data — filters and settings live
 * inside the authoring editors themselves.
 */
export declare function getAvailableDataPanelTabs(_state: UnifiedWorkspaceState): DataPanelTab[];
/** Sets data panel width, clamped between 200 and 480. */
export declare function setWorkspaceDataPanelWidth(state: UnifiedWorkspaceState, width: number): UnifiedWorkspaceState;
/** Opens drawer. If same drawer is already open, closes it (toggle). */
export declare function openWorkspaceDrawer(state: UnifiedWorkspaceState, panel: DrawerPanel): UnifiedWorkspaceState;
/** Closes drawer. */
export declare function closeWorkspaceDrawer(state: UnifiedWorkspaceState): UnifiedWorkspaceState;
/** Sets drawer width, clamped between 280 and 600. */
export declare function setWorkspaceDrawerWidth(state: UnifiedWorkspaceState, width: number): UnifiedWorkspaceState;
/**
 * Adds to front of recent artifacts, deduplicates by id, max 10.
 */
export declare function addWorkspaceRecentArtifact(state: UnifiedWorkspaceState, artifact: Omit<RecentArtifact, 'openedAt'>): UnifiedWorkspaceState;
/** Returns the current active view. */
export declare function getActiveWorkspaceView(state: UnifiedWorkspaceState): WorkspaceView;
/** Check if the active view is an authoring view (report/dashboard/explore). */
export declare function isAuthoringView(state: UnifiedWorkspaceState): boolean;
/** Whether the workspace data panel should be visible (hidden for authoring views). */
export declare function shouldShowDataPanel(state: UnifiedWorkspaceState): boolean;
/** Whether the workspace selector bar should be visible (hidden for authoring views). */
export declare function shouldShowSelectorBar(state: UnifiedWorkspaceState): boolean;
//# sourceMappingURL=unified-workspace-state.d.ts.map