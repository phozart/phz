/**
 * @phozart/definitions — <phz-definition-report>
 *
 * Form for editing report/definition identity (name, description).
 * Emits `report-meta-change` on any field change.
 *
 * Migrated from phz-grid-admin's phz-admin-report with new tag name.
 */
import { LitElement } from 'lit';
export declare class PhzDefinitionReport extends LitElement {
    static styles: import("lit").CSSResult[];
    reportName: string;
    reportDescription: string;
    reportId: string;
    createdBy: string;
    created: number;
    updatedAt: number;
    mode: 'create' | 'edit';
    private _emit;
    private _formatDate;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-definition-report': PhzDefinitionReport;
    }
}
//# sourceMappingURL=phz-definition-report.d.ts.map