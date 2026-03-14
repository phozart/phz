/**
 * Monochrome SVG Icon System
 *
 * Extracted from @phozart/workspace styles.
 * All icons are 24x24 viewBox, 1.5px stroke, no fill (stroke-based).
 * Designed for the Console mode aesthetic: clean, geometric, warm.
 *
 * Usage:
 *   import { ICONS, icon } from '@phozart/shared/design-system';
 *   // As inline SVG string:
 *   element.innerHTML = icon('dashboard');
 *   // As raw path data:
 *   const path = ICONS.dashboard;
 *   // With custom size:
 *   element.innerHTML = icon('dashboard', 16);
 *   // With custom color:
 *   element.innerHTML = icon('dashboard', 24, '#3B82F6');
 */
// ========================================================================
// SVG Path Data — 24x24 viewBox, stroke-linecap="round" stroke-linejoin="round"
// ========================================================================
export const ICONS = {
    // -- Artifact Types -------------------------------------------------------
    /** Dashboard: 4-panel grid layout */
    dashboard: 'M3 3h8v10H3V3zm10 0h8v6h-8V3zM13 11h8v10h-8V11zM3 15h8v6H3v-6z',
    /** Report: document with lines */
    report: 'M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 0v5h5M8 10h8M8 14h8M8 18h5',
    /** Grid: table with rows and columns */
    grid: 'M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18M15 3v18',
    /** KPI: upward arrow in circle (performance indicator) */
    kpi: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 14V8m-3 3l3-3 3 3',
    /** Metric: sigma/summation symbol */
    metric: 'M6 4h12M6 4l6 8-6 8h12',
    /** Alert rule: bell with dot */
    alertRule: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0M20 4a2 2 0 1 1 0 .01',
    /** Filter preset: funnel with lines */
    filterPreset: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    /** Filter definition: funnel with gear */
    filterDefinition: 'M20 3H2l7 8.5V17l4 2v-7.5L20 3zM19 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 1.5v3m1.3-2.25l-2.6 1.5m0-1.5l2.6 1.5',
    /** Filter rule: funnel with checkmark */
    filterRule: 'M20 3H2l7 8.5V17l4 2v-7.5L20 3zM16 18l2 2 4-4',
    /** Subscription: envelope */
    subscription: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2l8 5 8-5',
    // -- Field Types ----------------------------------------------------------
    /** Text field: "Aa" text icon */
    fieldText: 'M4 18l4-12h2l4 12M5.5 14h7M16 6h2a2 2 0 0 1 0 4h-2v8m0-8h1.5a2.5 2.5 0 0 1 0 5H16',
    /** Number field: hash/pound */
    fieldNumber: 'M4 8h16M4 16h16M8 3v18M16 3v18',
    /** Date field: calendar */
    fieldDate: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01',
    /** Boolean field: toggle switch */
    fieldBoolean: 'M8 5h8a7 7 0 1 1 0 14H8A7 7 0 1 1 8 5zm8 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
    /** Enum field: list with bullets */
    fieldEnum: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    // -- Data Sources ---------------------------------------------------------
    /** Upload/file: document with up arrow */
    sourceUpload: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 12v6m0-6l-3 3m3-3l3 3M14 2v6h6',
    /** CSV: document with comma-separated lines */
    sourceCsv: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M8 13h2M11 13h2M14 13h2M8 17h2M11 17h2',
    /** Excel: spreadsheet grid */
    sourceExcel: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 6h18M4 14h18M10 4v16M16 4v16',
    /** Parquet: columnar blocks */
    sourceParquet: 'M4 4h4v16H4V4zm6 0h4v16h-4V4zm6 0h4v16h-4V4zM4 10h4M10 8h4M16 12h4M4 16h4M10 14h4M16 18h4',
    /** JSON: curly braces */
    sourceJson: 'M8 3c-2 0-3 1-3 3v4c0 1-1 2-2 2 1 0 2 1 2 2v4c0 2 1 3 3 3M16 3c2 0 3 1 3 3v4c0 1 1 2 2 2-1 0-2 1-2 2v4c0 2-1 3-3 3M10 12h.01M14 12h.01',
    /** Database: cylinder */
    sourceDatabase: 'M12 2C7.58 2 4 3.79 4 6v12c0 2.21 3.58 4 8 4s8-1.79 8-4V6c0-2.21-3.58-4-8-4zM4 6c0 2.21 3.58 4 8 4s8-1.79 8-4M4 12c0 2.21 3.58 4 8 4s8-1.79 8-4',
    /** API/globe: connected globe */
    sourceApi: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10M12 2a15 15 0 0 0-4 10 15 15 0 0 0 4 10',
    /** URL/link: chain link */
    sourceUrl: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    // -- Navigation / Shell ---------------------------------------------------
    /** Home */
    home: 'M3 12l2-2m0 0l7-7 7 7m-9-5v12a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V10m-9 9l9-9',
    /** Catalog: book/library */
    catalog: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z',
    /** Explore: compass */
    explore: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
    /** Settings/gear */
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    /** Filter/funnel */
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    /** Alert/bell */
    alert: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 0 1-3.46 0',
    /** Menu/hamburger */
    menu: 'M3 12h18M3 6h18M3 18h18',
    /** Sidebar collapse: left-pointing double chevron */
    sidebarCollapse: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
    /** Sidebar expand: right-pointing double chevron */
    sidebarExpand: 'M13 17l5-5-5-5M6 17l5-5-5-5',
    // -- Actions --------------------------------------------------------------
    /** Edit/pencil */
    edit: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
    /** Delete/trash */
    delete: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
    /** Duplicate/copy */
    duplicate: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2M4 16V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    /** Export/download */
    export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    /** Import/upload */
    import: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    /** Save/disk */
    save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
    /** Refresh/rotate */
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    /** Search/magnifier */
    search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35',
    /** Close/X */
    close: 'M18 6L6 18M6 6l12 12',
    /** Add/plus */
    add: 'M12 5v14M5 12h14',
    /** Add in circle */
    addCircle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v8M8 12h8',
    /** Remove/minus */
    remove: 'M5 12h14',
    /** Publish/send */
    publish: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    /** Share/people */
    share: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    // -- Navigation / Drill-through -------------------------------------------
    /** Drill-through: arrow entering box */
    drillThrough: 'M15 3h6v6M14 10l7-7M10 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6',
    /** Navigate/external link */
    navigate: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
    /** Back/arrow left */
    back: 'M19 12H5M12 19l-7-7 7-7',
    /** Chevron right */
    chevronRight: 'M9 18l6-6-6-6',
    /** Chevron down */
    chevronDown: 'M6 9l6 6 6-6',
    /** Chevron up */
    chevronUp: 'M18 15l-6-6-6 6',
    // -- Status ---------------------------------------------------------------
    /** Check/success */
    check: 'M20 6L9 17l-5-5',
    /** Warning/triangle */
    warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
    /** Info/circle-i */
    info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01',
    /** Error/circle-x */
    error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM15 9l-6 6M9 9l6 6',
    /** Lock/secure */
    lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
    /** Eye/visible */
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    /** Eye off/hidden */
    eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24',
    /** User/person */
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    // -- Misc -----------------------------------------------------------------
    /** Drag handle: 6 dots */
    dragHandle: 'M9 4h.01M9 9h.01M9 14h.01M9 19h.01M15 4h.01M15 9h.01M15 14h.01M15 19h.01',
    /** Sort ascending */
    sortAsc: 'M12 5v14M5 12l7 7 7-7',
    /** Sort descending */
    sortDesc: 'M12 19V5M19 12l-7-7-7 7',
    /** Expand/maximize */
    expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
    /** Collapse/minimize */
    collapse: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
    /** Pin */
    pin: 'M12 17v5M15 9.34V4H9v5.34M18 9.34a1.17 1.17 0 0 1-1 1.66H7a1.17 1.17 0 0 1-1-1.66L9 4h6l3 5.34z',
    /** Columns/layout */
    columns: 'M12 3v18M3 3h18v18H3V3z',
    /** Chart bar */
    chartBar: 'M18 20V10M12 20V4M6 20v-6',
    /** Trend line / sparkline */
    trendLine: 'M2 20l5-5 4 4 5-7 6-3',
    /** Clipboard/paste */
    clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
    /** Lineage/dependency graph: connected nodes */
    lineage: 'M4 6a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM4 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM8 6h4a2 2 0 0 1 2 2v2l2 2M8 18h4a2 2 0 0 0 2-2v-2l2-2',
};
// ========================================================================
// SVG Renderer
// ========================================================================
/**
 * Render an icon as an inline SVG string.
 *
 * @param name - Icon name from the ICONS registry
 * @param size - Width and height in pixels (default: 24)
 * @param color - Stroke color (default: 'currentColor' -- inherits from CSS)
 * @param strokeWidth - Stroke width (default: 1.5)
 * @returns SVG markup string, or empty string if icon not found
 */
export function icon(name, size = 24, color = 'currentColor', strokeWidth = 1.5) {
    const path = ICONS[name];
    if (!path)
        return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${renderPaths(path)}</svg>`;
}
/**
 * Get just the SVG path element(s) for embedding in an existing `<svg>`.
 */
export function iconPath(name) {
    const path = ICONS[name];
    if (!path)
        return '';
    return renderPaths(path);
}
// ========================================================================
// Grouped Icon Sets — convenient for UI sections
// ========================================================================
/** Icons for artifact types in the catalog */
export const ARTIFACT_ICONS = {
    'dashboard': 'dashboard',
    'report': 'report',
    'grid-definition': 'grid',
    'kpi': 'kpi',
    'metric': 'metric',
    'filter-preset': 'filterPreset',
    'filter-definition': 'filterDefinition',
    'filter-rule': 'filterRule',
    'alert-rule': 'alertRule',
    'subscription': 'subscription',
};
/** Icons for data field types */
export const FIELD_TYPE_ICONS = {
    'string': 'fieldText',
    'text': 'fieldText',
    'number': 'fieldNumber',
    'integer': 'fieldNumber',
    'float': 'fieldNumber',
    'decimal': 'fieldNumber',
    'date': 'fieldDate',
    'datetime': 'fieldDate',
    'timestamp': 'fieldDate',
    'boolean': 'fieldBoolean',
    'bool': 'fieldBoolean',
    'enum': 'fieldEnum',
    'category': 'fieldEnum',
};
/** Icons for data source types */
export const SOURCE_ICONS = {
    'csv': 'sourceCsv',
    'excel': 'sourceExcel',
    'parquet': 'sourceParquet',
    'json': 'sourceJson',
    'jsonl': 'sourceJson',
    'database': 'sourceDatabase',
    'api': 'sourceApi',
    'url': 'sourceUrl',
    'upload': 'sourceUpload',
};
/** Icons for shell navigation sections */
export const NAV_ICONS = {
    'home': 'home',
    'catalog': 'catalog',
    'explore': 'explore',
    'settings': 'settings',
    'filter': 'filter',
    'alert': 'alert',
    'data': 'sourceDatabase',
    'users': 'share',
    'hierarchy': 'drillThrough',
    'lineage': 'lineage',
};
/** Icons for common actions */
export const ACTION_ICONS = {
    'edit': 'edit',
    'delete': 'delete',
    'duplicate': 'duplicate',
    'export': 'export',
    'import': 'import',
    'save': 'save',
    'refresh': 'refresh',
    'search': 'search',
    'close': 'close',
    'add': 'add',
    'remove': 'remove',
    'publish': 'publish',
    'share': 'share',
    'drill': 'drillThrough',
    'navigate': 'navigate',
    'back': 'back',
};
// ========================================================================
// Field Type Icon Helpers
// ========================================================================
/** @deprecated Use getFieldTypeIconSvg() for SVG icons */
const LEGACY_FIELD_TYPE_ICONS = {
    string: 'Aa',
    number: '#',
    date: '\u2630',
    boolean: '\u2713',
};
/** Get Unicode text icon for a field type (legacy). */
export function getFieldTypeIcon(dataType) {
    return LEGACY_FIELD_TYPE_ICONS[dataType] ?? '\u2022';
}
/**
 * Get SVG icon markup for a field data type.
 * Returns a complete inline `<svg>` element string.
 */
export function getFieldTypeIconSvg(dataType, size = 16, color = 'currentColor') {
    const iconName = FIELD_TYPE_ICONS[dataType];
    return iconName ? icon(iconName, size, color) : icon('fieldText', size, color);
}
// ========================================================================
// Explorer Visual Helpers
// ========================================================================
/**
 * Get a CSS class for a cardinality badge.
 */
export function getCardinalityBadgeClass(cardinality) {
    return `badge--cardinality-${cardinality}`;
}
/**
 * Get CSS class(es) for a drop zone element.
 *
 * @param zoneType - The zone type identifier (e.g., 'rows', 'columns', 'values')
 * @param dragOver - Whether a draggable is currently over this zone
 */
export function getDropZoneClass(zoneType, dragOver) {
    const base = `drop-zone drop-zone--${zoneType}`;
    return dragOver ? `${base} drop-zone--active` : base;
}
// ========================================================================
// Internal helpers
// ========================================================================
function renderPaths(pathData) {
    // Split on M to handle multi-path icons -- each subpath starting with M
    // is rendered as a separate <path> element for cleaner SVG
    const segments = pathData.split(/(?=M)/);
    if (segments.length <= 1) {
        return `<path d="${pathData}" />`;
    }
    return segments.map(s => `<path d="${s.trim()}" />`).join('');
}
//# sourceMappingURL=icons.js.map