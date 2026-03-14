/**
 * @phozart/core — Server Capabilities
 *
 * Resolves and queries server capabilities for feature toggling.
 */

import type { ServerCapabilities } from './types/server.js';

export const DEFAULT_SERVER_CAPABILITIES: ServerCapabilities = {
  sort: false,
  filter: false,
  grouping: false,
  pivot: false,
  fullTextSearch: false,
  cursorPagination: false,
  exactTotalCount: false,
  realTimeUpdates: false,
};

export function resolveCapabilities(
  caps: ServerCapabilities | undefined,
): ServerCapabilities {
  if (!caps) return { ...DEFAULT_SERVER_CAPABILITIES };
  return { ...DEFAULT_SERVER_CAPABILITIES, ...caps };
}

export type FeatureKey =
  | 'sort'
  | 'filter'
  | 'grouping'
  | 'pivot'
  | 'fullTextSearch'
  | 'cursorPagination'
  | 'exactTotalCount'
  | 'realTimeUpdates'
  | 'export';

export function isFeatureEnabled(
  caps: ServerCapabilities,
  feature: FeatureKey,
  format?: string,
): boolean {
  if (feature === 'export') {
    if (!caps.exportFormats || caps.exportFormats.length === 0) return false;
    if (format) return caps.exportFormats.includes(format as any);
    return true;
  }
  return caps[feature] === true;
}
