/**
 * @phozart/phz-core — GridPresentation Types (Item 6.5)
 *
 * Unified visual/behavioral configuration for the grid.
 * Lives in core so all packages can reference it without depending on engine.
 */
export type GridDensity = 'compact' | 'comfortable' | 'spacious';
export type GridColorScheme = 'light' | 'dark' | 'auto';
export interface ColumnFormatting {
    align?: 'left' | 'center' | 'right';
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    numberFormat?: string;
    dateFormat?: string;
}
/**
 * Unified grid presentation configuration.
 * Captures all visual + behavioral settings that SavedView should preserve.
 */
export interface GridPresentation {
    density: GridDensity;
    colorScheme: GridColorScheme;
    gridLines: boolean;
    rowBanding: boolean;
    columnFormatting: Record<string, ColumnFormatting>;
    tokens: Record<string, string>;
    headerHeight?: number;
    rowHeight?: number;
    fontSize?: number;
    fontFamily?: string;
}
//# sourceMappingURL=grid-presentation.d.ts.map