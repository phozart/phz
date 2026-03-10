/**
 * @phozart/phz-engine/explorer — Pivot Preview Controller
 *
 * Headless controller for preview mode (table/chart/sql).
 * Also converts DropZoneState -> ExploreQuery.
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
import type { ExploreQuery } from './explore-types.js';
import type { DataResult } from '@phozart/phz-shared/adapters';
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