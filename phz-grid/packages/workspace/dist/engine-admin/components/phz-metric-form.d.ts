/**
 * @phozart/engine-admin — Metric Form
 *
 * Slide-over form for creating/editing metrics.
 * Two tabs: Simple (field + aggregation) and Composite (expression builder).
 */
import { LitElement } from 'lit';
import type { DataModelField, ParameterDef, CalculatedFieldDef } from '@phozart/engine';
import type { MetricDef } from '@phozart/engine';
import './phz-expression-builder.js';
export declare class PhzMetricForm extends LitElement {
    static styles: import("lit").CSSResult[];
    metric?: MetricDef;
    isEdit: boolean;
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    metrics: MetricDef[];
    private _name;
    private _mode;
    private _field;
    private _aggregation;
    private _expression?;
    private _format;
    willUpdate(changed: Map<string, unknown>): void;
    private _handleExpressionChange;
    private _handleSave;
    private _handleCancel;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-metric-form': PhzMetricForm;
    }
}
//# sourceMappingURL=phz-metric-form.d.ts.map