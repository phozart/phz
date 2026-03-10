/**
 * @phozart/phz-workspace — Layout Container HTML Generation (K.3)
 *
 * Pure functions that generate accessible HTML from LayoutNode trees.
 * These produce HTML strings for SSR / headless usage. The Lit component
 * wrapper (if needed) consumes these generators.
 */
import type { LayoutNode, AutoGridLayout, TabsLayout, SectionsLayout, FreeformLayout } from '../schema/config-layers.js';
export declare function generateLayoutHTML(node: LayoutNode): string;
export declare function generateGridHTML(node: AutoGridLayout): string;
export declare function generateTabsHTML(node: TabsLayout): string;
export declare function generateSectionsHTML(node: SectionsLayout): string;
export declare function generateFreeformHTML(node: FreeformLayout): string;
//# sourceMappingURL=phz-layout-container.d.ts.map