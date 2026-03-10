/**
 * @phozart/phz-grid-admin — Export Settings
 *
 * CSV + Excel export configuration.
 */
import { LitElement } from 'lit';
export declare class PhzAdminExport extends LitElement {
    static styles: import("lit").CSSResult[];
    format: 'csv' | 'excel';
    includeHeaders: boolean;
    includeFormatting: boolean;
    includeGroupHeaders: boolean;
    separator: string;
    availableColumns: string[];
    selectedColumns: string[];
    private emitChange;
    private _handleDownload;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-export': PhzAdminExport;
    }
}
//# sourceMappingURL=phz-admin-export.d.ts.map