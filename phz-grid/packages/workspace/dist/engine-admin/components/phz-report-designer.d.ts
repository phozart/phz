/**
 * @phozart/phz-engine-admin — Report Designer
 *
 * Stepped wizard: data product → columns → filters/sort → aggregation → drill-through → review.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { BIEngine } from '@phozart/phz-engine';
export declare class PhzReportDesigner extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    reportId?: string;
    private currentStep;
    private selectedDataProduct;
    private availableFields;
    private selectedFields;
    private reportName;
    private aggregateTable;
    private detailTable;
    private joinKey;
    private defaultSortField;
    private defaultSortDir;
    private preFilters;
    private drillTargetReport;
    private drillFilterMappings;
    private drillTrigger;
    private drillOpenIn;
    private drillMode;
    private goToStep;
    private nextStep;
    private prevStep;
    private selectDataProduct;
    private addField;
    private removeField;
    private addPreFilter;
    private removePreFilter;
    private updatePreFilter;
    private addDrillMapping;
    private removeDrillMapping;
    private updateDrillMapping;
    private handleSave;
    private renderStepContent;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-report-designer': PhzReportDesigner;
    }
}
//# sourceMappingURL=phz-report-designer.d.ts.map