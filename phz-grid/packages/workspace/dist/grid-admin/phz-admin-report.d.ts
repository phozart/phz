/**
 * @phozart/phz-grid-admin — Report Identity Tab
 *
 * Form for editing report name, description, and metadata.
 * Emits `report-meta-change` on any field change.
 */
import { LitElement } from 'lit';
export declare class PhzAdminReport extends LitElement {
    static styles: import("lit").CSSResult[];
    reportName: string;
    reportDescription: string;
    reportId: string;
    createdBy: string;
    created: number;
    updatedAt: number;
    permissions: string[];
    mode: 'create' | 'edit';
    private _emit;
    private _handleNameInput;
    private _handleDescriptionInput;
    private _formatDate;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-report': PhzAdminReport;
    }
}
//# sourceMappingURL=phz-admin-report.d.ts.map