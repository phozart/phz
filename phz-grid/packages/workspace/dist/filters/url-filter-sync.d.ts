/**
 * @phozart/workspace — URL Filter Sync (O.3)
 *
 * Serializes/deserializes FilterContextState to URL query parameters.
 * Format: f.{field}={operator}:{value}
 *
 * Array values use comma separation: f.region=in:US,EU,APAC
 * Null-check operators omit value: f.email=isNull
 */
import type { FilterContextState } from '../types.js';
export declare function serializeFilterState(state: FilterContextState): string;
export declare function deserializeFilterState(queryString: string): FilterContextState;
//# sourceMappingURL=url-filter-sync.d.ts.map