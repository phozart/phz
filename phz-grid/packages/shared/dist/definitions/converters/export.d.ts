/**
 * Export/Import definitions as JSON with envelope and validation.
 */
import type { GridDefinition } from '../types/grid-definition.js';
export interface DefinitionEnvelope {
    format: 'phz-grid-definition';
    version: string;
    exportedAt: string;
    definition: GridDefinition;
}
export declare function exportDefinition(def: GridDefinition): string;
export interface ImportOptions {
    skipValidation?: boolean;
    skipMigration?: boolean;
}
export declare function importDefinition(json: string, options?: ImportOptions): GridDefinition;
//# sourceMappingURL=export.d.ts.map