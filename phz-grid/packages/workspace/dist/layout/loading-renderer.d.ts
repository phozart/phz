/**
 * @phozart/phz-workspace — Loading & Quality Renderer (K.4 + K.7)
 *
 * Generates loading skeletons from LayoutNode structure,
 * freshness badges, quality warnings, and stale dimming CSS.
 */
import type { LayoutNode } from '../schema/config-layers.js';
import type { DataQualityInfo } from '../data-adapter.js';
export interface LoadingState {
    behavior: 'skeleton' | 'spinner' | 'previous';
    widgetId: string;
}
export declare function generateSkeletonHTML(node: LayoutNode): string;
export declare function generateLoadingHTML(state: LoadingState): string;
export declare function generateStaleIndicatorHTML(widgetId: string, freshnessStatus: 'fresh' | 'stale' | 'unknown'): string;
export declare function generateFreshnessBadgeHTML(widgetId: string, quality: DataQualityInfo | undefined): string;
export declare function generateQualityWarningHTML(widgetId: string, quality: DataQualityInfo | undefined): string;
export declare function generateStaleDimmingCSS(widgetId: string): string;
//# sourceMappingURL=loading-renderer.d.ts.map