/**
 * W.6 — Data Source Panel Enhancement
 *
 * Source type icons, refresh status badges, three-option data source picker,
 * and display property formatting.
 */
// ========================================================================
// Source Type Icons
// ========================================================================
import { SOURCE_ICONS, icon } from '../styles/icons.js';
/** @deprecated Use getSourceTypeIconSvg() for SVG icons */
export const SOURCE_TYPE_ICONS = {
    csv: '\u2630',
    excel: '\u2637',
    parquet: '\u25A6',
    json: '\u007B\u007D',
    database: '\u2699',
    api: '\u2194',
};
/**
 * Get SVG icon markup for a data source type.
 * Returns a complete inline <svg> element string.
 */
export function getSourceTypeIconSvg(sourceType, size = 20, color = 'currentColor') {
    const iconName = SOURCE_ICONS[sourceType];
    return iconName ? icon(iconName, size, color) : icon('sourceDatabase', size, color);
}
const REFRESH_BADGES = {
    fresh: { label: 'Fresh', variant: 'fresh', bgColor: '#D1FAE5', textColor: '#065F46' },
    stale: { label: 'Stale', variant: 'stale', bgColor: '#FEF3C7', textColor: '#92400E' },
    unknown: { label: 'Unknown', variant: 'unknown', bgColor: '#F5F5F4', textColor: '#57534E' },
};
export function getRefreshBadge(status) {
    return REFRESH_BADGES[status];
}
export const DATA_SOURCE_PICKER_OPTIONS = [
    {
        id: 'upload',
        label: 'Upload File',
        description: 'Import CSV, Excel, Parquet, or JSON files',
        icon: '\u21E7',
    },
    {
        id: 'connect',
        label: 'Connect to Data',
        description: 'Connect to a database or API endpoint',
        icon: '\u2194',
    },
    {
        id: 'sample',
        label: 'Sample Data',
        description: 'Start with a built-in sample dataset',
        icon: '\u2605',
    },
];
export function getSourceDisplayProps(source) {
    const icon = SOURCE_TYPE_ICONS[source.sourceType] ?? '\u25A0';
    const formattedRowCount = source.rowCount !== undefined
        ? `${source.rowCount.toLocaleString()} rows`
        : 'Unknown rows';
    const badge = source.freshnessStatus
        ? getRefreshBadge(source.freshnessStatus)
        : undefined;
    return {
        icon,
        displayName: source.name,
        formattedRowCount,
        badge,
    };
}
//# sourceMappingURL=data-source-panel.js.map