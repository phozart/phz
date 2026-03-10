/**
 * Converts a ReportPresentation bundle into a partial set of PhzGridProps.
 * This is the bridge that lets admin settings flow back to the grid.
 *
 * Usage:
 *   <PhzGrid {...settingsToGridProps(settings)} data={data} columns={columns} />
 */
export function settingsToGridProps(settings) {
    if (!settings)
        return {};
    const result = {};
    const ts = settings.tableSettings;
    if (ts) {
        // Container
        if (ts.containerShadow != null)
            result.containerShadow = ts.containerShadow;
        if (ts.containerRadius != null)
            result.containerRadius = ts.containerRadius;
        // Title bar
        if (ts.showTitleBar != null)
            result.showTitleBar = ts.showTitleBar;
        if (ts.titleText != null)
            result.gridTitle = ts.titleText;
        if (ts.subtitleText != null)
            result.gridSubtitle = ts.subtitleText;
        if (ts.titleFontFamily != null)
            result.titleFontFamily = ts.titleFontFamily;
        if (ts.titleFontSize != null)
            result.titleFontSize = ts.titleFontSize;
        if (ts.subtitleFontSize != null)
            result.subtitleFontSize = ts.subtitleFontSize;
        if (ts.titleBarBg != null)
            result.titleBarBg = ts.titleBarBg;
        if (ts.titleBarText != null)
            result.titleBarText = ts.titleBarText;
        if (ts.titleIcon != null)
            result.titleIcon = ts.titleIcon;
        // Toolbar
        if (ts.showToolbar != null)
            result.showToolbar = ts.showToolbar;
        if (ts.showSearch != null)
            result.showSearch = ts.showSearch;
        if (ts.showDensityToggle != null)
            result.showDensityToggle = ts.showDensityToggle;
        if (ts.showColumnEditor != null)
            result.showColumnEditor = ts.showColumnEditor;
        if (ts.showCsvExport != null)
            result.showCsvExport = ts.showCsvExport;
        if (ts.showExcelExport != null)
            result.showExcelExport = ts.showExcelExport;
        // Grid options
        if (ts.density != null)
            result.density = ts.density;
        if (ts.loadingMode != null)
            result.loadingMode = ts.loadingMode;
        if (ts.pageSize != null)
            result.pageSize = ts.pageSize;
        if (ts.headerWrapping != null)
            result.headerWrapping = ts.headerWrapping;
        if (ts.columnGroups != null)
            result.columnGroups = ts.columnGroups;
        if (ts.autoSizeColumns != null)
            result.autoSizeColumns = ts.autoSizeColumns;
        if (ts.allowFiltering != null)
            result.allowFiltering = ts.allowFiltering;
        if (ts.allowSorting != null)
            result.allowSorting = ts.allowSorting;
        if (ts.defaultSortField != null)
            result.defaultSortField = ts.defaultSortField;
        if (ts.defaultSortDirection != null)
            result.defaultSortDirection = ts.defaultSortDirection;
        if (ts.rowBanding != null)
            result.rowBanding = ts.rowBanding;
        if (ts.showPagination != null)
            result.showPagination = ts.showPagination;
        if (ts.showCheckboxes != null)
            result.showCheckboxes = ts.showCheckboxes;
        if (ts.scrollMode != null)
            result.scrollMode = ts.scrollMode;
        if (ts.virtualScrollThreshold != null)
            result.virtualScrollThreshold = ts.virtualScrollThreshold;
        if (ts.fetchPageSize != null)
            result.fetchPageSize = ts.fetchPageSize;
        if (ts.prefetchPages != null)
            result.prefetchPages = ts.prefetchPages;
        if (ts.showRowActions != null)
            result.showRowActions = ts.showRowActions;
        if (ts.showSelectionActions != null)
            result.showSelectionActions = ts.showSelectionActions;
        if (ts.showEditActions != null)
            result.showEditActions = ts.showEditActions;
        if (ts.showCopyActions != null)
            result.showCopyActions = ts.showCopyActions;
        // Typography
        if (ts.fontFamily != null)
            result.fontFamily = ts.fontFamily;
        if (ts.fontSize != null)
            result.fontSize = ts.fontSize;
        // Grouping
        if (ts.groupByFields != null)
            result.groupBy = ts.groupByFields;
        if (ts.groupByLevels != null)
            result.groupByLevels = ts.groupByLevels;
        if (ts.groupTotals != null)
            result.groupTotals = ts.groupTotals;
        if (ts.groupTotalsFn != null)
            result.groupTotalsFn = ts.groupTotalsFn;
        if (ts.groupTotalsOverrides != null)
            result.groupTotalsOverrides = ts.groupTotalsOverrides;
        // Aggregation
        if (ts.showAggregation != null)
            result.aggregation = ts.showAggregation;
        if (ts.aggregationPosition != null)
            result.aggregationPosition = ts.aggregationPosition;
        if (ts.aggregationFn != null)
            result.aggregationFn = ts.aggregationFn;
        // Display
        if (ts.gridLines != null)
            result.gridLines = ts.gridLines;
        if (ts.gridLineColor != null)
            result.gridLineColor = ts.gridLineColor;
        if (ts.gridLineWidth != null)
            result.gridLineWidth = ts.gridLineWidth;
        if (ts.bandingColor != null)
            result.bandingColor = ts.bandingColor;
        if (ts.hoverHighlight != null)
            result.hoverHighlight = ts.hoverHighlight;
        if (ts.cellTextOverflow != null)
            result.cellTextOverflow = ts.cellTextOverflow;
        if (ts.compactNumbers != null)
            result.compactNumbers = ts.compactNumbers;
        // Section colors
        if (ts.headerBg != null)
            result.headerBg = ts.headerBg;
        if (ts.headerText != null)
            result.headerText = ts.headerText;
        if (ts.bodyBg != null)
            result.bodyBg = ts.bodyBg;
        if (ts.bodyText != null)
            result.bodyText = ts.bodyText;
        if (ts.footerBg != null)
            result.footerBg = ts.footerBg;
        if (ts.footerText != null)
            result.footerText = ts.footerText;
    }
    // Top-level presentation properties
    if (settings.columnFormatting)
        result.columnFormatting = settings.columnFormatting;
    if (settings.numberFormats)
        result.numberFormats = settings.numberFormats;
    if (settings.statusColors)
        result.statusColors = settings.statusColors;
    if (settings.barThresholds)
        result.barThresholds = settings.barThresholds;
    if (settings.dateFormats)
        result.dateFormats = settings.dateFormats;
    return result;
}
//# sourceMappingURL=settings-to-grid-props.js.map