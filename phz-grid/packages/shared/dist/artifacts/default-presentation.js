/**
 * @phozart/phz-shared — DefaultPresentation (A-1.04)
 *
 * Admin-defined presentation defaults for artifacts (density, theme,
 * column order, frozen columns, etc.). Users can create personal views
 * that override specific presentation settings.
 *
 * Extracted from workspace/navigation/default-presentation.ts.
 */
export function createDefaultPresentation(overrides) {
    return {
        density: overrides.density ?? 'comfortable',
        theme: overrides.theme ?? 'light',
        columnOrder: overrides.columnOrder ? [...overrides.columnOrder] : [],
        columnWidths: overrides.columnWidths ? { ...overrides.columnWidths } : {},
        hiddenColumns: overrides.hiddenColumns ? [...overrides.hiddenColumns] : [],
        frozenColumns: overrides.frozenColumns,
        sortState: overrides.sortState ? [...overrides.sortState] : undefined,
    };
}
// ========================================================================
// Merge: admin defaults + user overrides
// ========================================================================
export function mergePresentation(admin, user) {
    return {
        density: user.density ?? admin.density,
        theme: user.theme ?? admin.theme,
        columnOrder: user.columnOrder ?? admin.columnOrder,
        columnWidths: user.columnWidths
            ? { ...admin.columnWidths, ...user.columnWidths }
            : admin.columnWidths,
        hiddenColumns: user.hiddenColumns ?? admin.hiddenColumns,
        frozenColumns: user.frozenColumns ?? admin.frozenColumns,
        sortState: user.sortState ?? admin.sortState,
    };
}
//# sourceMappingURL=default-presentation.js.map