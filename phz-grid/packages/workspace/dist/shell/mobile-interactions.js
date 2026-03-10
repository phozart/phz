/**
 * S.8 — Mobile Interaction Patterns
 *
 * Pure functions for bottom sheet, swipe detection, tap-to-place,
 * mobile dashboard layout, and floating action bar.
 */
export function createBottomSheetConfig(overrides) {
    return {
        maxHeight: '90vh',
        dragHandle: true,
        overscrollContain: true,
        ...overrides,
    };
}
export function getBottomSheetClasses(open) {
    return {
        sheet: open ? 'bottom-sheet bottom-sheet--open' : 'bottom-sheet',
        overlay: open ? 'bottom-sheet-overlay bottom-sheet-overlay--visible' : 'bottom-sheet-overlay',
        handle: 'bottom-sheet-handle',
    };
}
const DEFAULT_MIN_DISTANCE = 50;
export function detectSwipe(start, end, options) {
    const minDistance = options?.minDistance ?? DEFAULT_MIN_DISTANCE;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < minDistance && absDy < minDistance) {
        return null;
    }
    if (absDx >= absDy) {
        return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
}
export function getMobileDashboardLayout() {
    return {
        columns: 1,
        filterCollapsed: true,
        singleColumn: true,
    };
}
// ========================================================================
// Floating Action Bar
// ========================================================================
export function getFloatingActionBarClasses(selectedCount) {
    return selectedCount > 0 ? 'fab fab--visible' : 'fab';
}
export function getTapToPlaceConfig() {
    return {
        mode: 'tap',
        insertPosition: 'end',
    };
}
//# sourceMappingURL=mobile-interactions.js.map