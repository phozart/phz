'use client';
/**
 * @phozart/phz-react — PhzGrid React Component
 *
 * Wraps the <phz-grid> Web Component for React using @lit/react's
 * createComponent() for automatic property bridging. Event handlers
 * extract CustomEvent.detail for backward-compatible callback signatures.
 */
import React, { createElement, forwardRef, useCallback, useImperativeHandle, useRef, } from 'react';
import { createComponent } from '@lit/react';
import { PhzGrid as PhzGridElement } from '@phozart/phz-grid';
// ---------------------------------------------------------------------------
// @lit/react base component — auto-bridges Lit @property fields to React props
// and maps React event callbacks to DOM CustomEvents.
// ---------------------------------------------------------------------------
const PhzGridLit = createComponent({
    tagName: 'phz-grid',
    elementClass: PhzGridElement,
    react: React,
    events: {
        onGridReady: 'grid-ready',
        onStateChange: 'state-change',
        onCellClick: 'cell-click',
        onCellDoubleClick: 'cell-dblclick',
        onSelectionChange: 'selection-change',
        onSortChange: 'sort-change',
        onFilterChange: 'filter-change',
        onEditStart: 'edit-start',
        onEditCommit: 'edit-commit',
        onEditCancel: 'edit-cancel',
        onScroll: 'scroll',
        onRowAction: 'row-action',
        onDrillThrough: 'drill-through',
        onCopy: 'copy',
        onGenerateDashboard: 'generate-dashboard',
        onVirtualScroll: 'virtual-scroll',
        onRemoteDataLoad: 'remote-data-load',
        onRemoteDataError: 'remote-data-error',
        onAdminSettings: 'admin-settings',
        onBulkDelete: 'bulk-delete',
        onRowClick: 'row-click',
        onResize: 'resize',
    },
});
// ---------------------------------------------------------------------------
// Helper: wrap a detail-extracting callback for createComponent's CustomEvent
// ---------------------------------------------------------------------------
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
// ---------------------------------------------------------------------------
// PhzGrid — public React component with forwardRef for GridApi access
// ---------------------------------------------------------------------------
export const PhzGrid = forwardRef(function PhzGrid(props, ref) {
    const elementRef = useRef(null);
    const gridApiRef = useRef(null);
    // Expose GridApi via ref using the new getGridApi() public method
    useImperativeHandle(ref, () => {
        if (gridApiRef.current)
            return gridApiRef.current;
        const el = elementRef.current;
        if (el) {
            gridApiRef.current = el.getGridApi() ?? null;
        }
        return gridApiRef.current;
    });
    // grid-ready handler: capture GridApi and call user callback with detail
    const handleGridReady = useCallback((e) => {
        gridApiRef.current = e.detail.gridInstance;
        props.onGridReady?.(e.detail.gridInstance);
    }, [props.onGridReady]);
    // Map PhzGridProps to PhzGridLit element props
    // Most props map 1:1. The exceptions:
    //   height → gridHeight (with px conversion)
    //   width  → gridWidth  (with px conversion)
    //   className → class (handled by @lit/react automatically)
    //   Events → wrapped to extract .detail
    const elementProps = {
        ref: elementRef,
        className: props.className,
        style: props.style,
        // Core data
        data: props.data,
        columns: props.columns,
        // Display config — 1:1 property mappings
        theme: props.theme,
        locale: props.locale,
        responsive: props.responsive,
        virtualization: props.virtualization,
        selectionMode: props.selectionMode,
        editMode: props.editMode,
        loading: props.loading,
        density: props.density,
        gridTitle: props.gridTitle,
        gridSubtitle: props.gridSubtitle,
        scrollMode: props.scrollMode,
        pageSize: props.pageSize,
        pageSizeOptions: props.pageSizeOptions,
        showToolbar: props.showToolbar,
        showDensityToggle: props.showDensityToggle,
        showColumnEditor: props.showColumnEditor,
        showAdminSettings: props.showAdminSettings,
        showPagination: props.showPagination,
        paginationAlign: props.paginationAlign,
        showCheckboxes: props.showCheckboxes,
        showRowActions: props.showRowActions,
        showSelectionActions: props.showSelectionActions,
        showEditActions: props.showEditActions,
        showCopyActions: props.showCopyActions,
        rowBanding: props.rowBanding,
        statusColors: props.statusColors,
        barThresholds: props.barThresholds,
        dateFormats: props.dateFormats,
        numberFormats: props.numberFormats,
        columnStyles: props.columnStyles,
        gridLines: props.gridLines,
        gridLineColor: props.gridLineColor,
        gridLineWidth: props.gridLineWidth,
        bandingColor: props.bandingColor,
        hoverHighlight: props.hoverHighlight,
        cellTextOverflow: props.cellTextOverflow,
        compactNumbers: props.compactNumbers,
        autoSizeColumns: props.autoSizeColumns,
        aggregation: props.aggregation,
        aggregationFn: props.aggregationFn,
        aggregationPosition: props.aggregationPosition,
        groupBy: props.groupBy,
        groupByLevels: props.groupByLevels,
        groupTotals: props.groupTotals,
        groupTotalsFn: props.groupTotalsFn,
        conditionalFormattingRules: props.conditionalFormattingRules,
        columnGroups: props.columnGroups,
        userRole: props.userRole,
        copyHeaders: props.copyHeaders,
        copyFormatted: props.copyFormatted,
        loadingMode: props.loadingMode,
        virtualScrollThreshold: props.virtualScrollThreshold,
        fetchPageSize: props.fetchPageSize,
        prefetchPages: props.prefetchPages,
        showSearch: props.showSearch,
        showCsvExport: props.showCsvExport,
        showExcelExport: props.showExcelExport,
        showTitleBar: props.showTitleBar,
        titleIcon: props.titleIcon,
        titleBarBg: props.titleBarBg,
        titleBarText: props.titleBarText,
        headerBg: props.headerBg,
        headerText: props.headerText,
        bodyBg: props.bodyBg,
        bodyText: props.bodyText,
        footerBg: props.footerBg,
        footerText: props.footerText,
        headerWrapping: props.headerWrapping,
        containerShadow: props.containerShadow,
        containerRadius: props.containerRadius,
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        titleFontFamily: props.titleFontFamily,
        titleFontSize: props.titleFontSize,
        subtitleFontSize: props.subtitleFontSize,
        maxCopyRows: props.maxCopyRows,
        excludeFieldsFromCopy: props.excludeFieldsFromCopy,
        enableAnomalyDetection: props.enableAnomalyDetection,
        columnFormatting: props.columnFormatting,
        computedColumns: props.computedColumns,
        columnProfiles: props.columnProfiles,
        rowActions: props.rowActions,
        drillThroughConfig: props.drillThroughConfig,
        generateDashboardConfig: props.generateDashboardConfig,
        reportId: props.reportId,
        reportName: props.reportName,
        dataSet: props.dataSet,
        remoteDataSource: props.remoteDataSource,
        virtualRowHeight: props.virtualRowHeight,
        groupTotalsOverrides: props.groupTotalsOverrides,
        allowFiltering: props.allowFiltering,
        allowSorting: props.allowSorting,
        defaultSortField: props.defaultSortField,
        defaultSortDirection: props.defaultSortDirection,
        queryBackend: props.queryBackend,
        progressiveLoad: props.progressiveLoad,
        // Renamed props: height/width → gridHeight/gridWidth
        gridHeight: props.height != null
            ? (typeof props.height === 'number' ? `${props.height}px` : props.height)
            : undefined,
        gridWidth: props.width != null
            ? (typeof props.width === 'number' ? `${props.width}px` : props.width)
            : undefined,
        // Events — grid-ready has special handling for GridApi capture
        onGridReady: handleGridReady,
        // All other events: wrap to extract .detail for backward compat
        onStateChange: wrapDetail(props.onStateChange),
        onCellClick: wrapDetail(props.onCellClick),
        onCellDoubleClick: wrapDetail(props.onCellDoubleClick),
        onSelectionChange: wrapDetail(props.onSelectionChange),
        onSortChange: wrapDetail(props.onSortChange),
        onFilterChange: wrapDetail(props.onFilterChange),
        onEditStart: wrapDetail(props.onEditStart),
        onEditCommit: wrapDetail(props.onEditCommit),
        onEditCancel: wrapDetail(props.onEditCancel),
        onScroll: wrapDetail(props.onScroll),
        onRowAction: wrapDetail(props.onRowAction),
        onDrillThrough: wrapDetail(props.onDrillThrough),
        onCopy: wrapDetail(props.onCopy),
        onGenerateDashboard: wrapDetail(props.onGenerateDashboard),
        onVirtualScroll: wrapDetail(props.onVirtualScroll),
        onRemoteDataLoad: wrapDetail(props.onRemoteDataLoad),
        onRemoteDataError: wrapDetail(props.onRemoteDataError),
        onAdminSettings: wrapDetail(props.onAdminSettings),
    };
    // Remove undefined values so @lit/react doesn't set them as properties
    for (const key of Object.keys(elementProps)) {
        if (elementProps[key] === undefined) {
            delete elementProps[key];
        }
    }
    return createElement(PhzGridLit, elementProps, props.toolbar && createElement('div', { slot: 'toolbar' }, props.toolbar), props.header && createElement('div', { slot: 'header' }, props.header), props.footer && createElement('div', { slot: 'footer' }, props.footer), props.emptyState && createElement('div', { slot: 'empty-state' }, props.emptyState), props.loadingIndicator && createElement('div', { slot: 'loading' }, props.loadingIndicator), props.children);
});
//# sourceMappingURL=phz-grid.js.map