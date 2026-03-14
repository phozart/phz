/**
 * @phozart/core — GridPresentation Types (Item 6.5)
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
/**
 * Configuration for drill-through navigation from a grid row click.
 * Describes which target report to open and how to pass filters.
 */
export interface DrillThroughConfig {
    targetReportId: string;
    trigger: 'click' | 'dblclick';
    openIn: 'panel' | 'modal' | 'page';
    mode: 'filtered' | 'full';
    fieldMappings?: Array<{
        sourceField: string;
        targetField: string;
    }>;
    filterFields?: string[];
}
/**
 * Drill source context originating from a grid row.
 * Captures the row data and clicked field for filter resolution.
 */
export interface GridRowDrillSource {
    type: 'grid-row';
    rowData: Record<string, unknown>;
    field?: string;
    value?: unknown;
    isSummaryRow?: boolean;
}
/**
 * Configuration for the "Generate Dashboard" action on a grid.
 */
export interface GenerateDashboardConfig {
    /** URL template with {reportId}, {dataMode} tokens. */
    href?: string;
    /** Custom menu label (default: "Dashboard from …"). */
    label?: string;
}
//# sourceMappingURL=grid-presentation.d.ts.map