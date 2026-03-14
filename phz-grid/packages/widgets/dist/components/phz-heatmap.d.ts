/**
 * @phozart/widgets — Heatmap
 *
 * CSS-grid heatmap with color interpolation, tooltips, and SR accessibility.
 * Renders row/col labeled cells with value-proportional coloring.
 */
import { LitElement } from 'lit';
export interface HeatmapDatum {
    row: string;
    col: string;
    value: number;
}
export interface HeatmapCell {
    row: string;
    col: string;
    value: number;
    rowIndex: number;
    colIndex: number;
    color: string;
    normalizedValue: number;
}
export declare function hexToRGB(hex: string): {
    r: number;
    g: number;
    b: number;
};
export declare function interpolateColor(normalizedValue: number, colorScale?: [string, string]): string;
export declare function computeHeatmapCells(data: HeatmapDatum[], colorScale?: [string, string]): {
    cells: HeatmapCell[];
    rows: string[];
    cols: string[];
};
export declare function buildHeatmapAccessibleDescription(data: HeatmapDatum[], rows: string[], cols: string[]): string;
export declare class PhzHeatmap extends LitElement {
    static styles: import("lit").CSSResult[];
    data: HeatmapDatum[];
    colorScale: [string, string];
    showLabels: boolean;
    title: string;
    loading: boolean;
    error: string | null;
    private tooltipContent;
    private tooltipVisible;
    private tooltipStyle;
    private handleCellClick;
    private handleCellHover;
    private handleCellLeave;
    private handleRetry;
    private textColorForBackground;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-heatmap': PhzHeatmap;
    }
}
//# sourceMappingURL=phz-heatmap.d.ts.map