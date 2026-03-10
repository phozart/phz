/**
 * @phozart/phz-shared — Server-Side Grid Mode (A-2.07)
 *
 * Configuration for server-side data operations (sort, filter, group, page).
 * When enabled, the grid delegates these operations to the DataAdapter
 * instead of performing them in-browser.
 *
 * Pure types and functions only — no side effects.
 */
/**
 * Configuration for server-side grid mode. When `enabled` is true, the grid
 * delegates sorting, filtering, grouping, and pagination to the server via
 * the DataAdapter rather than processing data client-side.
 */
export interface ServerGridConfig {
    /** Whether server-side mode is active. */
    enabled: boolean;
    /** Number of rows per page in server-side pagination. */
    pageSize: number;
    /** Delegate sorting to the server. */
    serverSort: boolean;
    /** Delegate filtering to the server. */
    serverFilter: boolean;
    /** Delegate group-by aggregation to the server. */
    serverGroupBy: boolean;
    /** Total row count as reported by the server (for virtual scroll calculations). */
    totalRowCount?: number;
    /**
     * Number of pages to prefetch ahead of the current viewport.
     * Defaults to 1 for a single prefetch page.
     */
    prefetchPages?: number;
}
/**
 * Creates a default server grid configuration with server-side operations
 * disabled. Consumers opt in by setting `enabled: true` and toggling
 * individual server-side capabilities.
 */
export declare function createDefaultServerGridConfig(overrides?: Partial<ServerGridConfig>): ServerGridConfig;
/**
 * Returns `true` when the given config enables server-side grid mode.
 * Returns `false` for `undefined` or `null` configs.
 */
export declare function isServerMode(config: ServerGridConfig | undefined | null): boolean;
/**
 * Checks whether a specific server-side capability is enabled.
 */
export declare function hasServerCapability(config: ServerGridConfig | undefined | null, capability: 'sort' | 'filter' | 'groupBy'): boolean;
//# sourceMappingURL=server-mode.d.ts.map