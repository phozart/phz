/**
 * @phozart/phz-engine/explorer — Data Explorer Orchestrator
 *
 * Main headless controller combining field palette, drop zones,
 * preview, chart suggest, and undo/redo.
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
import type { FieldMetadata } from '@phozart/phz-shared/adapters';
import type { ExploreQuery } from './explore-types.js';
import type { DropZoneState, ZoneName } from './phz-drop-zones.js';
export interface DataExplorerState {
    dataSourceId?: string;
    fields: FieldMetadata[];
    dropZones: DropZoneState;
}
export interface DataExplorer {
    getState(): DataExplorerState;
    setDataSource(id: string, fields: FieldMetadata[]): void;
    autoPlaceField(field: FieldMetadata): void;
    addToZone(zone: ZoneName, field: FieldMetadata): void;
    removeFromZone(zone: ZoneName, fieldName: string): void;
    toQuery(): ExploreQuery;
    suggestChart(): string;
    subscribe(listener: () => void): () => void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
}
export declare function createDataExplorer(): DataExplorer;
//# sourceMappingURL=phz-data-explorer.d.ts.map