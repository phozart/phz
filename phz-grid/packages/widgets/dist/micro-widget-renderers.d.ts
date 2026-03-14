/**
 * @phozart/widgets — Micro-Widget Cell Renderers (7A-B)
 *
 * Pure functions that produce SVG/HTML strings for rendering micro-widgets
 * inside grid table cells. No DOM APIs, no Lit, no side effects.
 *
 * Each renderer must complete in under 2ms per call.
 */
import type { MicroWidgetRenderer, CellRendererRegistry } from '@phozart/shared/types';
/**
 * Formatted number + colored status dot.
 * Uses alert tokens from the design system for dot color.
 */
export declare function createValueOnlyRenderer(): MicroWidgetRenderer;
/**
 * SVG polyline from array data. No axes, no labels. Just the line.
 */
export declare function createSparklineRenderer(): MicroWidgetRenderer;
/**
 * Value + arrow (up/down) + percentage, colored by positive/negative.
 */
export declare function createDeltaRenderer(): MicroWidgetRenderer;
/**
 * SVG semi-circle arc with fill percentage.
 */
export declare function createGaugeArcRenderer(): MicroWidgetRenderer;
/**
 * Register all four micro-widget renderers with the given registry.
 * This is the standard way shells populate the registry at mount time.
 */
export declare function registerAllMicroWidgetRenderers(registry: CellRendererRegistry): void;
//# sourceMappingURL=micro-widget-renderers.d.ts.map