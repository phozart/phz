/**
 * @phozart/phz-grid — <phz-chart-popover>
 *
 * Floating chart popover that displays bar/line visualizations of column data.
 * SVG-based, zero external dependencies. Opens via right-click "Visualize".
 */
import { LitElement, type TemplateResult, type PropertyValues } from 'lit';
export type ChartTypeOption = 'bar' | 'line';
export declare class PhzChartPopover extends LitElement {
    open: boolean;
    field: string;
    columnHeader: string;
    values: number[];
    labels: string[];
    private chartType;
    private posX;
    private posY;
    private cleanup;
    static styles: import("lit").CSSResult;
    updated(changed: PropertyValues): void;
    show(field: string, header: string, values: number[], labels?: string[]): void;
    hide(): void;
    private addListeners;
    private removeListeners;
    protected render(): TemplateResult;
    private renderBarChart;
    private renderLineChart;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-chart-popover': PhzChartPopover;
    }
}
//# sourceMappingURL=phz-chart-popover.d.ts.map