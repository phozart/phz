/**
 * @phozart/phz-widgets — View Manager
 *
 * User saved view CRUD: save, load, rename, delete, set as default.
 */
import { LitElement } from 'lit';
import type { UserViewConfig } from '@phozart/phz-engine';
export declare class PhzViewManager extends LitElement {
    static styles: import("lit").CSSResult[];
    views: UserViewConfig[];
    activeViewId?: string;
    sourceType: string;
    sourceId: string;
    private isRenaming;
    private renameValue;
    private handleViewChange;
    private handleSave;
    private handleDelete;
    private handleSetDefault;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-view-manager': PhzViewManager;
    }
}
//# sourceMappingURL=phz-view-manager.d.ts.map