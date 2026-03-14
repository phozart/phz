/**
 * @phozart/engine-admin — Metric Builder
 *
 * Create/edit metric definitions: name, data product, formula, format.
 * Embeddable component.
 */
import { LitElement } from 'lit';
import type { BIEngine } from '@phozart/engine';
export declare class PhzMetricBuilder extends LitElement {
    static styles: import("lit").CSSResult[];
    engine?: BIEngine;
    metricId?: string;
    private name;
    private dataProductId;
    private formulaType;
    private field;
    private aggregation;
    private conditionField;
    private conditionOperator;
    private conditionValue;
    private expression;
    private handleSave;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-metric-builder': PhzMetricBuilder;
    }
}
//# sourceMappingURL=phz-metric-builder.d.ts.map