/**
 * @phozart/workspace — Layout Migration (K.2)
 *
 * Migrates legacy absolute-position grid layouts to the
 * composable LayoutNode tree format (AutoGridLayout).
 */
import type { AutoGridLayout } from '../schema/config-layers.js';
export interface AbsoluteWidget {
    widgetId: string;
    row: number;
    col: number;
    colSpan: number;
    rowSpan: number;
}
export declare function migrateAbsoluteToAutoGrid(widgets: AbsoluteWidget[]): AutoGridLayout;
//# sourceMappingURL=layout-migration.d.ts.map