/**
 * @phozart/core — Server Capabilities
 *
 * Resolves and queries server capabilities for feature toggling.
 */
import type { ServerCapabilities } from './types/server.js';
export declare const DEFAULT_SERVER_CAPABILITIES: ServerCapabilities;
export declare function resolveCapabilities(caps: ServerCapabilities | undefined): ServerCapabilities;
export type FeatureKey = 'sort' | 'filter' | 'grouping' | 'pivot' | 'fullTextSearch' | 'cursorPagination' | 'exactTotalCount' | 'realTimeUpdates' | 'export';
export declare function isFeatureEnabled(caps: ServerCapabilities, feature: FeatureKey, format?: string): boolean;
//# sourceMappingURL=server-capabilities.d.ts.map