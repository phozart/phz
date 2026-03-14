/**
 * @phozart/engine-admin — KPI Designer
 *
 * 6-step wizard: 3-column layout (step nav | content | live preview).
 * Embeddable component — drop into any admin page.
 */
import { LitElement } from 'lit';
import type { BIEngine } from '@phozart/engine';
export declare class PhzKPIDesigner extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    kpiIdProp?: string;
    private currentStep;
    private draft;
    private completedSteps;
    private goToStep;
    private nextStep;
    private prevStep;
    private handleSave;
    private updateDraft;
    private renderStepNav;
    private renderStep1;
    private renderStep2;
    private renderStep3;
    private renderStep4;
    private renderStep5;
    private renderStep6;
    private renderPreview;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-kpi-designer': PhzKPIDesigner;
    }
}
//# sourceMappingURL=phz-kpi-designer.d.ts.map