/**
 * DefinitionStore — sync and async interfaces for persisting GridDefinitions.
 */
import type { DefinitionId } from '../types/identity.js';
import type { GridDefinition, DefinitionMeta } from '../types/grid-definition.js';
export interface DefinitionStore {
    save(def: GridDefinition): GridDefinition;
    load(id: DefinitionId): GridDefinition | undefined;
    list(): DefinitionMeta[];
    delete(id: DefinitionId): boolean;
    duplicate(id: DefinitionId, options?: {
        name?: string;
    }): GridDefinition | undefined;
    clear(): void;
}
export interface AsyncDefinitionStore {
    save(def: GridDefinition): Promise<GridDefinition>;
    load(id: DefinitionId): Promise<GridDefinition | undefined>;
    list(): Promise<DefinitionMeta[]>;
    delete(id: DefinitionId): Promise<boolean>;
    duplicate(id: DefinitionId, options?: {
        name?: string;
    }): Promise<GridDefinition | undefined>;
    clear(): Promise<void>;
}
//# sourceMappingURL=definition-store.d.ts.map