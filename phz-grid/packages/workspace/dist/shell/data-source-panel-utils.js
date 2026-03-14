/**
 * @phozart/workspace — Data Source Panel Utils (L.16)
 *
 * Types and utility functions for the data source panel UI.
 */
export function groupDataSourcesByType(entries) {
    const grouped = new Map();
    for (const entry of entries) {
        let list = grouped.get(entry.type);
        if (!list) {
            list = [];
            grouped.set(entry.type, list);
        }
        list.push(entry);
    }
    return grouped;
}
const STATUS_ICONS = {
    connected: 'check-circle',
    error: 'alert-circle',
    refreshing: 'refresh',
};
export function getStatusIcon(status) {
    return STATUS_ICONS[status];
}
const TYPE_ICONS = {
    file: 'file',
    url: 'link',
    api: 'code',
    server: 'database',
};
export function getTypeIcon(type) {
    return TYPE_ICONS[type];
}
//# sourceMappingURL=data-source-panel-utils.js.map