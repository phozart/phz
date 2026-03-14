/**
 * @phozart/engine-admin — KPI Form
 *
 * Slide-over form for creating/editing KPIs.
 * Supports simple thresholds and custom threshold bands with dynamic sources.
 */
import { LitElement } from 'lit';
import type { ParameterDef } from '@phozart/engine';
import type { KPIDefinition, MetricDef } from '@phozart/engine';
export declare class PhzKpiForm extends LitElement {
    static styles: import("lit").CSSResult[];
    kpi?: KPIDefinition;
    isEdit: boolean;
    metrics: MetricDef[];
    parameters: ParameterDef[];
    private _name;
    private _metricId;
    private _direction;
    private _target;
    private _thresholdMode;
    private _okThreshold;
    private _warnThreshold;
    private _bands;
    willUpdate(changed: Map<string, unknown>): void;
    private _addBand;
    private _removeBand;
    private _updateBand;
    private _updateBandSource;
    private _handleSave;
    private _handleCancel;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-kpi-form': PhzKpiForm;
    }
}
//# sourceMappingURL=phz-kpi-form.d.ts.map