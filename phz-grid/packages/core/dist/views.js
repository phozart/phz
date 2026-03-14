/**
 * @phozart/core — ViewsManager
 *
 * Manages saved views as named snapshots of grid state.
 * Peer to StateManager — NOT nested inside GridState.
 */
export class ViewsManager {
    views;
    activeViewId = null;
    defaultViewId = null;
    constructor(initialViews) {
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
    saveView(name, currentState, options) {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const view = {
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
    saveCurrentToView(viewId, currentState, options) {
        const existing = this.views.get(viewId);
        if (!existing) {
            throw new Error(`View "${viewId}" not found`);
        }
        const updated = {
            ...existing,
            state: currentState,
            ...(options?.presentation ? { presentation: options.presentation } : {}),
            updatedAt: new Date().toISOString(),
        };
        this.views.set(viewId, updated);
        return updated;
    }
    loadView(id) {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View "${id}" not found`);
        }
        this.activeViewId = id;
        return view;
    }
    deleteView(id) {
        this.views.delete(id);
        if (this.activeViewId === id) {
            this.activeViewId = null;
        }
        if (this.defaultViewId === id) {
            this.defaultViewId = null;
        }
    }
    listViews() {
        return Array.from(this.views.values()).map(v => ({
            id: v.id,
            name: v.name,
            isDefault: v.id === this.defaultViewId,
            isActive: v.id === this.activeViewId,
            updatedAt: v.updatedAt,
        }));
    }
    getView(id) {
        return this.views.get(id);
    }
    renameView(id, name) {
        const view = this.views.get(id);
        if (!view) {
            throw new Error(`View "${id}" not found`);
        }
        this.views.set(id, { ...view, name, updatedAt: new Date().toISOString() });
    }
    setDefaultView(id) {
        this.clearDefault();
        this.defaultViewId = id;
        if (id) {
            const view = this.views.get(id);
            if (view) {
                this.views.set(id, { ...view, isDefault: true });
            }
        }
    }
    getActiveViewId() {
        return this.activeViewId;
    }
    isViewDirty(currentState, presentation) {
        if (!this.activeViewId)
            return false;
        const view = this.views.get(this.activeViewId);
        if (!view)
            return false;
        if (JSON.stringify(currentState) !== JSON.stringify(view.state))
            return true;
        if (presentation && view.presentation) {
            return JSON.stringify(presentation) !== JSON.stringify(view.presentation);
        }
        return false;
    }
    importViews(views) {
        for (const view of views) {
            this.views.set(view.id, view);
            if (view.isDefault) {
                this.defaultViewId = view.id;
            }
        }
    }
    exportViews() {
        return Array.from(this.views.values());
    }
    clearDefault() {
        if (this.defaultViewId) {
            const old = this.views.get(this.defaultViewId);
            if (old) {
                this.views.set(this.defaultViewId, { ...old, isDefault: false });
            }
        }
    }
}
//# sourceMappingURL=views.js.map