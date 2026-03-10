/**
 * @phozart/phz-core — GridPresentation helpers (Item 6.5)
 *
 * Factory + merge utilities for GridPresentation.
 */

import type { GridPresentation } from './types/grid-presentation.js';

/**
 * Create a default GridPresentation with sensible values.
 */
export function createDefaultPresentation(): GridPresentation {
  return {
    density: 'comfortable',
    colorScheme: 'auto',
    gridLines: true,
    rowBanding: false,
    columnFormatting: {},
    tokens: {},
  };
}

/**
 * Deep-merge a base presentation with partial overrides.
 * Does not mutate either input.
 */
export function mergePresentation(
  base: GridPresentation,
  override: Partial<GridPresentation>,
): GridPresentation {
  return {
    ...base,
    ...override,
    columnFormatting: {
      ...base.columnFormatting,
      ...(override.columnFormatting ?? {}),
    },
    tokens: {
      ...base.tokens,
      ...(override.tokens ?? {}),
    },
  };
}
