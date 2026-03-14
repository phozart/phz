/**
 * @phozart/workspace — Report Context Menu
 *
 * Pure functions that generate context menu items for report editing.
 */
function sep() {
    return { id: `sep-${Date.now()}-${Math.random()}`, label: '', separator: true };
}
export function getColumnHeaderMenu(state, field) {
    const col = state.columns.find(c => c.field === field);
    const isPinned = col?.pinned;
    const isGrouped = state.grouping.includes(field);
    const sortEntry = state.sorting.find(s => s.field === field);
    return [
        { id: 'sort-asc', label: 'Sort Ascending', icon: 'sort-asc', disabled: sortEntry?.direction === 'asc' },
        { id: 'sort-desc', label: 'Sort Descending', icon: 'sort-desc', disabled: sortEntry?.direction === 'desc' },
        sep(),
        { id: isGrouped ? 'ungroup' : 'group', label: isGrouped ? 'Ungroup' : `Group by ${field}`, icon: 'group' },
        sep(),
        { id: 'pin-left', label: 'Pin Left', icon: 'pin-left', disabled: isPinned === 'left' },
        { id: 'pin-right', label: 'Pin Right', icon: 'pin-right', disabled: isPinned === 'right' },
        ...(isPinned ? [{ id: 'unpin', label: 'Unpin', icon: 'unpin' }] : []),
        sep(),
        { id: 'hide-column', label: 'Hide Column', icon: 'eye-off' },
        { id: 'add-filter', label: `Add Filter on ${field}`, icon: 'filter' },
        { id: 'conditional-format', label: 'Conditional Formatting...', icon: 'paint' },
        { id: 'column-settings', label: 'Column Settings...', icon: 'settings' },
    ];
}
export function getCellMenu(_state, target) {
    const displayValue = target.value != null ? String(target.value) : 'null';
    return [
        { id: 'copy-value', label: 'Copy Value', icon: 'copy', shortcut: 'Ctrl+C' },
        sep(),
        { id: 'filter-by-value', label: `Filter by "${displayValue}"`, icon: 'filter' },
        { id: 'exclude-value', label: `Exclude "${displayValue}"`, icon: 'filter-off' },
        sep(),
        { id: 'view-data', label: 'View Data', icon: 'table' },
    ];
}
export function getSelectionMenu(_state, _target) {
    return [
        { id: 'copy-selected', label: 'Copy Selected', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'export-selection', label: 'Export Selection as CSV', icon: 'download' },
    ];
}
// Centralized menu dispatcher
export function getContextMenu(state, target) {
    switch (target.type) {
        case 'column-header': return getColumnHeaderMenu(state, target.field);
        case 'cell': return getCellMenu(state, target);
        case 'selection': return getSelectionMenu(state, target);
        case 'row': return [
            { id: 'copy-row', label: 'Copy Row', icon: 'copy' },
            { id: 'view-row', label: 'View Row Details', icon: 'eye' },
        ];
    }
}
//# sourceMappingURL=report-context-menu.js.map