/**
 * @phozart/workspace — Layout Migration (K.2)
 *
 * Migrates legacy absolute-position grid layouts to the
 * composable LayoutNode tree format (AutoGridLayout).
 */
export function migrateAbsoluteToAutoGrid(widgets) {
    const sorted = [...widgets].sort((a, b) => a.row - b.row || a.col - b.col);
    const children = sorted.map(w => ({
        kind: 'widget',
        widgetId: w.widgetId,
        weight: w.colSpan,
        minHeight: w.rowSpan * 100,
    }));
    return {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children,
    };
}
//# sourceMappingURL=layout-migration.js.map