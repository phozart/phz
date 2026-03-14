/**
 * @phozart/shared — DataAdapter SPI & Related Types
 *
 * Core contract for data sources. Consumer applications implement DataAdapter
 * to provide query execution, schema introspection, and field-level metadata.
 *
 * v15 additions: optional async query methods for long-running reports.
 */
// ========================================================================
// Type guard
// ========================================================================
/**
 * Returns true when the given result contains a non-empty Arrow IPC buffer.
 */
export function hasArrowBuffer(result) {
    if (result == null || typeof result !== 'object')
        return false;
    return (result.arrowBuffer instanceof ArrayBuffer &&
        result.arrowBuffer.byteLength > 0);
}
//# sourceMappingURL=data-adapter.js.map