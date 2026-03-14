/**
 * @phozart/grid — Sparkline Cell Renderer
 *
 * SVG-based sparkline/mini-chart renderer for inline data visualization.
 * Supports line, bar, and area types. Zero external dependencies.
 */
import { type TemplateResult } from 'lit';
export type SparklineType = 'line' | 'bar' | 'area';
export interface SparklineOptions {
    type?: SparklineType;
    width?: number;
    height?: number;
    color?: string;
    fillColor?: string;
    strokeWidth?: number;
    showDots?: boolean;
    showMinMax?: boolean;
}
export declare function renderSparkline(data: unknown, options?: SparklineOptions): TemplateResult;
//# sourceMappingURL=sparkline-renderer.d.ts.map