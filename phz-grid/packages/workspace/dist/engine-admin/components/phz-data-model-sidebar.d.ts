/**
 * @phozart/phz-engine-admin — Data Model Sidebar
 *
 * 5-section collapsible sidebar for the computation DAG layers:
 * Fields (gray) → Parameters (purple) → Calculated Fields (amber) → Metrics (blue) → KPIs (green)
 */
import { LitElement } from 'lit';
import type { DataModelField, ParameterDef, CalculatedFieldDef } from '@phozart/phz-engine';
import type { MetricDef, KPIDefinition } from '@phozart/phz-engine';
export declare class PhzDataModelSidebar extends LitElement {
    static styles: import("lit").CSSResult;
    fields: DataModelField[];
    parameters: ParameterDef[];
    calculatedFields: CalculatedFieldDef[];
    metrics: MetricDef[];
    kpis: KPIDefinition[];
    private _expanded;
    private _toggle;
    private _emptyText;
    private _emit;
    private _handleContextMenu;
    private _getItems;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-model-sidebar': PhzDataModelSidebar;
    }
}
//# sourceMappingURL=phz-data-model-sidebar.d.ts.map