/**
 * @phozart/workspace — Filter Preset Manager (O.4)
 *
 * Save/load/share named filter presets. Headless logic —
 * Lit components can be layered on top.
 */
import type { FilterValue } from '../types.js';
export interface FilterPreset {
    id: string;
    name: string;
    filters: FilterValue[];
    createdAt: number;
    updatedAt: number;
}
export interface FilterPresetManager {
    list(): FilterPreset[];
    load(id: string): FilterPreset | undefined;
    save(name: string, filters: FilterValue[]): FilterPreset;
    update(id: string, changes: {
        name?: string;
        filters?: FilterValue[];
    }): void;
    delete(id: string): void;
    subscribe(listener: () => void): () => void;
}
export declare function createFilterPresetManager(): FilterPresetManager;
//# sourceMappingURL=filter-preset-manager.d.ts.map