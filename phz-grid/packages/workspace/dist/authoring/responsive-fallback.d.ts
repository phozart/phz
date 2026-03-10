/**
 * @phozart/phz-workspace — Responsive Fallback (Canvas Phase 4C)
 *
 * Converts freeform canvas positions to a single-column mobile stack
 * sorted by visual position (top→bottom, left→right).
 * Viewer shell applies this on narrow viewports.
 */
import type { FreeformGridConfig, WidgetPlacement } from './freeform-grid-state.js';
export interface MobileLayoutEntry {
    widgetId: string;
    order: number;
    minHeight: number;
}
/**
 * Convert freeform widget placements to a mobile-friendly single-column layout.
 * Sorts widgets by their visual position (top→bottom, then left→right)
 * and assigns sequential order values.
 */
export declare function freeformToMobileLayout(widgets: WidgetPlacement[], gridConfig: FreeformGridConfig): MobileLayoutEntry[];
/**
 * Generate CSS for mobile single-column layout.
 * Returns CSS that stacks all widgets vertically with the computed order.
 */
export declare function generateMobileLayoutCSS(entries: MobileLayoutEntry[]): string;
/**
 * Determine if the current viewport should use mobile layout.
 */
export declare function shouldUseMobileLayout(viewportWidth: number, breakpoint?: number): boolean;
//# sourceMappingURL=responsive-fallback.d.ts.map