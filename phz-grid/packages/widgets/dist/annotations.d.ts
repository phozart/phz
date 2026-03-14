/**
 * @phozart/widgets -- Data Point Annotations
 *
 * Annotation manager and SVG marker rendering for chart data points.
 */
import { LitElement } from 'lit';
export type MarkerStyle = 'pin' | 'flag' | 'circle' | 'highlight';
export interface Annotation {
    id: string;
    chartId: string;
    dataPoint: {
        x: number;
        y: number;
    } | {
        label: string;
    };
    text: string;
    author?: string;
    timestamp?: Date;
    style?: MarkerStyle;
}
export interface AnnotationManager {
    add(annotation: Annotation): void;
    remove(id: string): void;
    update(id: string, changes: Partial<Annotation>): void;
    getForChart(chartId: string): Annotation[];
    serialize(): string;
    deserialize(data: string): void;
}
export declare function createAnnotationManager(): AnnotationManager;
export declare function renderAnnotationMarker(annotation: Annotation, position: {
    x: number;
    y: number;
}): string;
export declare class PhzAnnotationLayer extends LitElement {
    static styles: import("lit").CSSResult[];
    chartId: string;
    annotations: Annotation[];
    positionMap: Map<string, {
        x: number;
        y: number;
    }>;
    private _formOpen;
    private _formPos;
    private _formText;
    private _formStyle;
    private _onChartClick;
    private _onSave;
    private _onCancel;
    private _onAnnotationClick;
    private _onAnnotationRemove;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-annotation-layer': PhzAnnotationLayer;
    }
}
//# sourceMappingURL=annotations.d.ts.map