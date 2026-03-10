/**
 * @phozart/phz-workspace — Responsive Fallback (Canvas Phase 4C)
 *
 * Converts freeform canvas positions to a single-column mobile stack
 * sorted by visual position (top→bottom, left→right).
 * Viewer shell applies this on narrow viewports.
 */
/**
 * Convert freeform widget placements to a mobile-friendly single-column layout.
 * Sorts widgets by their visual position (top→bottom, then left→right)
 * and assigns sequential order values.
 */
export function freeformToMobileLayout(widgets, gridConfig) {
    // Sort by row first, then by column for left-to-right ordering within same row
    const sorted = [...widgets].sort((a, b) => a.row - b.row || a.col - b.col);
    return sorted.map((w, index) => ({
        widgetId: w.id,
        order: index,
        minHeight: w.rowSpan * (gridConfig.cellSizePx + gridConfig.gapPx),
    }));
}
/**
 * Generate CSS for mobile single-column layout.
 * Returns CSS that stacks all widgets vertically with the computed order.
 */
export function generateMobileLayoutCSS(entries) {
    const rules = [
        '.phz-freeform-grid.phz-mobile-layout {',
        '  display: flex;',
        '  flex-direction: column;',
        '  gap: 12px;',
        '}',
    ];
    for (const entry of entries) {
        rules.push(`[data-widget-id="${entry.widgetId}"] {`);
        rules.push(`  order: ${entry.order};`);
        rules.push(`  min-height: ${entry.minHeight}px;`);
        rules.push(`  grid-column: unset;`);
        rules.push(`  grid-row: unset;`);
        rules.push('}');
    }
    return rules.join('\n');
}
/**
 * Determine if the current viewport should use mobile layout.
 */
export function shouldUseMobileLayout(viewportWidth, breakpoint = 768) {
    return viewportWidth < breakpoint;
}
//# sourceMappingURL=responsive-fallback.js.map