/**
 * @phozart/phz-grid-admin — Grid Options Panel
 *
 * Display/Behavior/Features/Pagination grouped toggles.
 */
import { LitElement } from 'lit';
interface GridOptions {
    showToolbar: boolean;
    showPagination: boolean;
    showCheckboxes: boolean;
    rowBanding: boolean;
    autoSizeColumns: boolean;
    virtualization: boolean;
    scrollMode: string;
    virtualScrollThreshold: number;
    fetchPageSize: number;
    prefetchPages: number;
    editMode: string;
    selectionMode: string;
    pageSize: number;
    showRowActions: boolean;
    showSelectionActions: boolean;
    showEditActions: boolean;
    showCopyActions: boolean;
}
/**
 * @deprecated Use `<phz-admin-table-settings>` instead. This component will be removed in a future version.
 */
export declare class PhzAdminOptions extends LitElement {
    static styles: import("lit").CSSResult[];
    connectedCallback(): void;
    options: GridOptions;
    private emitChange;
    private renderToggle;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-options': PhzAdminOptions;
    }
}
export {};
//# sourceMappingURL=phz-admin-options.d.ts.map