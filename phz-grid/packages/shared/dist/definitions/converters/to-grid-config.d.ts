/**
 * Convert a GridDefinition to a GridConfig for createGrid().
 */
import type { GridConfig } from '@phozart/phz-core';
import type { GridDefinition } from '../types/grid-definition.js';
export interface ToGridConfigOptions {
    userRole?: string;
}
export declare function definitionToGridConfig(def: GridDefinition, options?: ToGridConfigOptions): GridConfig;
//# sourceMappingURL=to-grid-config.d.ts.map