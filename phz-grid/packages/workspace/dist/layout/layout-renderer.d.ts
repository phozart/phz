/**
 * @phozart/workspace — Layout Renderer (K.1 + K.5)
 *
 * Transforms a declarative LayoutNode tree into CSS and HTML strings.
 * Pure functions -- no DOM dependency, safe for workers/SSR.
 */
import type { LayoutNode, AutoGridLayout } from '../schema/config-layers.js';
import type { WidgetResponsiveBehavior } from '../types.js';
export interface LayoutRenderResult {
    css: string;
    html: string;
    widgetIds: string[];
}
export declare function renderLayoutToCSS(node: LayoutNode): LayoutRenderResult;
export declare function generateResponsiveCSS(widgetId: string, behavior: WidgetResponsiveBehavior | undefined): string;
export declare function generatePrintCSS(): string;
export declare function computeContainerBreakpoints(layout: AutoGridLayout): {
    compact: number;
    mobile: number;
};
//# sourceMappingURL=layout-renderer.d.ts.map