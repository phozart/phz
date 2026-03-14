/**
 * @phozart/core — ViewsManager
 *
 * Manages saved views as named snapshots of grid state.
 * Peer to StateManager — NOT nested inside GridState.
 */

import type { SavedView, ViewsState, ViewsSummary, SaveViewOptions } from './types/views.js';
import type { SerializedGridState } from './types/state.js';
import type { GridPresentation } from './types/grid-presentation.js';

export class ViewsManager {
  private views: Map<string, SavedView>;
  private activeViewId: string | null = null;
  private defaultViewId: string | null = null;

  constructor(initialViews?: SavedView[]) {
    this.views = new Map();
    if (initialViews) {
      for (const view of initialViews) {
        this.views.set(view.id, view);
        if (view.isDefault) {
          this.defaultViewId = view.id;
        }
      }
    }
  }

  saveView(
    name: string,
    currentState: SerializedGridState,
    options?: SaveViewOptions,
  ): SavedView {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const view: SavedView = {
      id,
      name,
      state: currentState,
      ...(options?.presentation ? { presentation: options.presentation } : {}),
      isDefault: options?.makeDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    if (options?.makeDefault) {
      this.clearDefault();
      this.defaultViewId = id;
    }

    this.views.set(id, view);
    this.activeViewId = id;
    return view;
  }

  saveCurrentToView(viewId: string, currentState: SerializedGridState, options?: SaveViewOptions): SavedView {
    const existing = this.views.get(viewId);
    if (!existing) {
      throw new Error(`View "${viewId}" not found`);
    }

    const updated: SavedView = {
      ...existing,
      state: currentState,
      ...(options?.presentation ? { presentation: options.presentation } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.views.set(viewId, updated);
    return updated;
  }

  loadView(id: string): SavedView {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View "${id}" not found`);
    }
    this.activeViewId = id;
    return view;
  }

  deleteView(id: string): void {
    this.views.delete(id);
    if (this.activeViewId === id) {
      this.activeViewId = null;
    }
    if (this.defaultViewId === id) {
      this.defaultViewId = null;
    }
  }

  listViews(): ViewsSummary[] {
    return Array.from(this.views.values()).map(v => ({
      id: v.id,
      name: v.name,
      isDefault: v.id === this.defaultViewId,
      isActive: v.id === this.activeViewId,
      updatedAt: v.updatedAt,
    }));
  }

  getView(id: string): SavedView | undefined {
    return this.views.get(id);
  }

  renameView(id: string, name: string): void {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`View "${id}" not found`);
    }
    this.views.set(id, { ...view, name, updatedAt: new Date().toISOString() });
  }

  setDefaultView(id: string | null): void {
    this.clearDefault();
    this.defaultViewId = id;
    if (id) {
      const view = this.views.get(id);
      if (view) {
        this.views.set(id, { ...view, isDefault: true });
      }
    }
  }

  getActiveViewId(): string | null {
    return this.activeViewId;
  }

  isViewDirty(currentState: SerializedGridState, presentation?: GridPresentation): boolean {
    if (!this.activeViewId) return false;
    const view = this.views.get(this.activeViewId);
    if (!view) return false;
    if (JSON.stringify(currentState) !== JSON.stringify(view.state)) return true;
    if (presentation && view.presentation) {
      return JSON.stringify(presentation) !== JSON.stringify(view.presentation);
    }
    return false;
  }

  importViews(views: SavedView[]): void {
    for (const view of views) {
      this.views.set(view.id, view);
      if (view.isDefault) {
        this.defaultViewId = view.id;
      }
    }
  }

  exportViews(): SavedView[] {
    return Array.from(this.views.values());
  }

  private clearDefault(): void {
    if (this.defaultViewId) {
      const old = this.views.get(this.defaultViewId);
      if (old) {
        this.views.set(this.defaultViewId, { ...old, isDefault: false });
      }
    }
  }
}
