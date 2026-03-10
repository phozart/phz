/**
 * Capture a GridConfig as a GridDefinition.
 */
import type { GridConfig } from '@phozart/phz-core';
import type { GridDefinition } from '../types/grid-definition.js';
export interface FromGridConfigMeta {
    name: string;
    description?: string;
    createdBy?: string;
}
export declare function gridConfigToDefinition(config: GridConfig, meta: FromGridConfigMeta): GridDefinition;
//# sourceMappingURL=from-grid-config.d.ts.map