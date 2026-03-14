/**
 * @phozart/core — GridPresentation helpers (Item 6.5)
 *
 * Factory + merge utilities for GridPresentation.
 */
/**
 * Create a default GridPresentation with sensible values.
 */
export function createDefaultPresentation() {
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
export function mergePresentation(base, override) {
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
//# sourceMappingURL=grid-presentation.js.map