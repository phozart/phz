/**
 * @phozart/core — Server-Side Operation Types
 *
 * Unified types for server-side data fetching, filtering, sorting,
 * grouping, export, mutations, and real-time updates.
 */
export function isServerFilterGroup(item) {
    return 'logic' in item && 'conditions' in item;
}
//# sourceMappingURL=server.js.map