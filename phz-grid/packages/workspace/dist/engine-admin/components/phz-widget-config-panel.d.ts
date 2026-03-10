/**
 * @phozart/phz-engine-admin — Widget Configuration Panel
 *
 * 3-tab panel: Data | Appearance | Behaviour
 * Per-widget-type controls for rich configuration.
 */
import { LitElement } from 'lit';
import type { EnhancedWidgetConfig } from '@phozart/phz-engine';
import type { KPIDefinition } from '@phozart/phz-engine';
import type { MetricDef } from '@phozart/phz-engine';
interface FieldInfo {
    name: string;
    type: string;
}
export declare class PhzWidgetConfigPanel extends LitElement {
    static styles: import("lit").CSSResult[];
    widgetConfig: EnhancedWidgetConfig;
    fields: FieldInfo[];
    kpis: KPIDefinition[];
    metrics: MetricDef[];
    layoutColumns: number;
    private activeTab;
    private emit;
    private updateData;
    private updateAppearance;
    private updateBehaviour;
    private get numericFields();
    private get stringFields();
    private renderDataTab;
    private renderBindingsForType;
    private renderChartBindings;
    private renderKpiBindings;
    private renderScorecardBindings;
    private renderStatusTableBindings;
    private renderDataTableBindings;
    private renderDrillLinkBindings;
    private renderFilterEditor;
    private renderSortLimit;
    private renderAppearanceTab;
    private renderChartAppearance;
    private renderKpiAppearance;
    private renderScorecardAppearance;
    private renderBottomNAppearance;
    private renderBehaviourTab;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-widget-config-panel': PhzWidgetConfigPanel;
    }
}
export {};
//# sourceMappingURL=phz-widget-config-panel.d.ts.map