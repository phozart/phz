/**
 * @phozart/phz-shared — Dashboard Bookmark Types
 *
 * Serializable bookmark types for persisting full dashboard interaction state.
 * All types are plain objects — no class instances, no functions, no Maps/Sets.
 */
// ========================================================================
// Utilities
// ========================================================================
let bookmarkCounter = 0;
/**
 * Generate a unique bookmark ID. Uses timestamp + counter for uniqueness.
 */
export function createBookmarkId() {
    bookmarkCounter++;
    return `bk_${Date.now()}_${bookmarkCounter}_${Math.random().toString(36).slice(2, 8)}`;
}
/**
 * Type guard: validates that an unknown value is a DashboardBookmark.
 */
export function isValidBookmark(value) {
    if (value === null || value === undefined || typeof value !== 'object') {
        return false;
    }
    const obj = value;
    return (typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.dashboardId === 'string' &&
        typeof obj.isDefault === 'boolean' &&
        typeof obj.createdAt === 'number' &&
        typeof obj.updatedAt === 'number' &&
        obj.state !== null &&
        typeof obj.state === 'object');
}
/**
 * Merge a partial overlay onto a base interaction state.
 * Overlay fields replace base fields entirely (no deep merge on Records).
 */
export function mergeInteractionState(base, overlay) {
    return { ...base, ...overlay };
}
//# sourceMappingURL=dashboard-bookmark.js.map