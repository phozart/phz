/**
 * @phozart/phz-workspace — Pivot Preview Controller (P.3)
 *
 * Headless controller for preview mode (table/chart/sql).
 * Also converts DropZoneState → ExploreQuery.
 */
import type { ExploreQuery } from '../explore-types.js';
import type { DataResult } from '../data-adapter.js';
import type { DropZoneState } from './phz-drop-zones.js';
export type PreviewMode = 'table' | 'chart' | 'sql';
export interface QueryOptions {
    limit?: number;
}
export declare function toExploreQuery(state: DropZoneState, options?: QueryOptions): ExploreQuery;
export interface PreviewController {
    getMode(): PreviewMode;
    setMode(mode: PreviewMode): void;
    isLoading(): boolean;
    setLoading(loading: boolean): void;
    getResult(): DataResult | null;
    setResult(result: DataResult): void;
    subscribe(listener: () => void): () => void;
}
export declare function createPreviewController(): PreviewController;
//# sourceMappingURL=phz-pivot-preview.d.ts.map