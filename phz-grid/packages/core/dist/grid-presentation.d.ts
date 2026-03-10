/**
 * @phozart/phz-core — GridPresentation helpers (Item 6.5)
 *
 * Factory + merge utilities for GridPresentation.
 */
import type { GridPresentation } from './types/grid-presentation.js';
/**
 * Create a default GridPresentation with sensible values.
 */
export declare function createDefaultPresentation(): GridPresentation;
/**
 * Deep-merge a base presentation with partial overrides.
 * Does not mutate either input.
 */
export declare function mergePresentation(base: GridPresentation, override: Partial<GridPresentation>): GridPresentation;
//# sourceMappingURL=grid-presentation.d.ts.map