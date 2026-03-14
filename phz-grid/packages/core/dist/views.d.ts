/**
 * @phozart/core — ViewsManager
 *
 * Manages saved views as named snapshots of grid state.
 * Peer to StateManager — NOT nested inside GridState.
 */
import type { SavedView, ViewsSummary, SaveViewOptions } from './types/views.js';
import type { SerializedGridState } from './types/state.js';
import type { GridPresentation } from './types/grid-presentation.js';
export declare class ViewsManager {
    private views;
    private activeViewId;
    private defaultViewId;
    constructor(initialViews?: SavedView[]);
    saveView(name: string, currentState: SerializedGridState, options?: SaveViewOptions): SavedView;
    saveCurrentToView(viewId: string, currentState: SerializedGridState, options?: SaveViewOptions): SavedView;
    loadView(id: string): SavedView;
    deleteView(id: string): void;
    listViews(): ViewsSummary[];
    getView(id: string): SavedView | undefined;
    renameView(id: string, name: string): void;
    setDefaultView(id: string | null): void;
    getActiveViewId(): string | null;
    isViewDirty(currentState: SerializedGridState, presentation?: GridPresentation): boolean;
    importViews(views: SavedView[]): void;
    exportViews(): SavedView[];
    private clearDefault;
}
//# sourceMappingURL=views.d.ts.map