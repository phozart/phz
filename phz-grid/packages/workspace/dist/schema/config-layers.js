/**
 * @phozart/phz-workspace — Config Layer Separation Types
 *
 * DataDefinition = what data to show (fields, expressions, filters)
 * PresentationDefinition = how to show it (colors, formatting, layout)
 * LayoutIntent = where to place it (positioning, responsive behavior)
 */
export function flattenLayoutWidgets(node) {
    switch (node.kind) {
        case 'widget': return [node.widgetId];
        case 'tabs': return node.tabs.flatMap(t => t.children.flatMap(flattenLayoutWidgets));
        case 'sections': return node.sections.flatMap(s => s.children.flatMap(flattenLayoutWidgets));
        case 'auto-grid': return node.children.flatMap(flattenLayoutWidgets);
        case 'freeform': return node.children.map(c => c.widgetId);
    }
}
export function freeformToAutoGrid(freeform) {
    // Sort children by position (top-to-bottom, left-to-right)
    const sorted = [...freeform.children].sort((a, b) => a.row - b.row || a.col - b.col);
    return {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: sorted.map(c => ({
            kind: 'widget',
            widgetId: c.widgetId,
            weight: Math.max(1, Math.round(c.colSpan / (freeform.columns / 12))),
            minHeight: c.rowSpan * (freeform.cellSizePx + freeform.gapPx),
        })),
    };
}
export function convertLegacyLayout(placements) {
    const sorted = [...placements].sort((a, b) => a.row - b.row || a.col - b.col);
    return {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: sorted.map(p => ({
            kind: 'widget',
            widgetId: p.widgetId,
            weight: p.colSpan,
            minHeight: p.rowSpan * 100,
        })),
    };
}
//# sourceMappingURL=config-layers.js.map