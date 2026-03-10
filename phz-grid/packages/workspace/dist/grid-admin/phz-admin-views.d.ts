/**
 * @phozart/phz-grid-admin — <phz-admin-views>
 *
 * Full CRUD management tab for saved views within the grid admin panel.
 * Lists views, allows rename, delete, set default.
 */
import { LitElement } from 'lit';
import type { ViewsSummary } from '@phozart/phz-core';
export declare class PhzAdminViews extends LitElement {
    static styles: import("lit").CSSResult[];
    views: ViewsSummary[];
    private _renamingId;
    private _renameValue;
    render(): import("lit-html").TemplateResult<1>;
    private _renderViewRow;
    private _startRename;
    private _confirmRename;
    private _setDefault;
    private _deleteView;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-views': PhzAdminViews;
    }
}
//# sourceMappingURL=phz-admin-views.d.ts.map