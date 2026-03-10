/**
 * @phozart/phz-widgets — Gauge / Speedometer
 *
 * SVG gauge widget for KPI display with color zones and animated needle.
 */
import { LitElement } from 'lit';
export interface GaugeThreshold {
    value: number;
    color: string;
    label: string;
}
export declare function valueToAngle(value: number, min: number, max: number, startAngle?: number, endAngle?: number): number;
export declare function detectThresholdZone(value: number, thresholds: GaugeThreshold[], min: number): {
    color: string;
    label: string;
};
export declare function describeArc(cx: number, cy: number, radius: number, startAngleDeg: number, endAngleDeg: number): string;
export declare function needleEndpoint(cx: number, cy: number, length: number, angleDeg: number): {
    x: number;
    y: number;
};
export declare class PhzGauge extends LitElement {
    static styles: import("lit").CSSResult[];
    value: number;
    min: number;
    max: number;
    thresholds: GaugeThreshold[];
    label: string;
    unit: string;
    showValue: boolean;
    startAngle: number;
    endAngle: number;
    loading: boolean;
    error: string | null;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-gauge': PhzGauge;
    }
}
//# sourceMappingURL=phz-gauge.d.ts.map