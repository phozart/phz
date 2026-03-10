export class ContextMenuController {
    constructor(host) {
        this.ctxMenuOpen = false;
        this.ctxMenuX = 0;
        this.ctxMenuY = 0;
        this.ctxMenuItems = [];
        this.ctxMenuSource = 'body';
        this.ctxMenuField = '';
        this.ctxMenuRowId = null;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    handleHeaderContextMenu(e, col) {
        e.preventDefault();
        this.showHeaderContextMenu(e.clientX, e.clientY, col);
    }
    showHeaderContextMenu(x, y, col) {
        const sortInfo = this.host.sortColumns.find(s => s.field === col.field);
        const isFiltered = this.host.activeFilters.has(col.field);
        this.ctxMenuItems = [
            { id: 'sort-asc', label: 'Sort Ascending', icon: '\u2191', checked: sortInfo?.direction === 'asc' },
            { id: 'sort-desc', label: 'Sort Descending', icon: '\u2193', checked: sortInfo?.direction === 'desc' },
            { id: 'sort-clear', label: 'Clear Sort', disabled: !sortInfo, icon: '\u2715' },
            { id: 'sep1', label: '', separator: true },
            { id: 'filter', label: 'Filter...', icon: '\u25BD' },
            { id: 'filter-clear', label: 'Clear Filter', disabled: !isFiltered, icon: '\u2715' },
            { id: 'sep2', label: '', separator: true },
            { id: 'hide-col', label: 'Hide Column', icon: '\u2298' },
            { id: 'resize-fit', label: 'Resize to Fit', icon: '\u2194' },
            { id: 'sep3', label: '', separator: true },
            { id: 'group-by', label: 'Group by This Column', icon: '\u2261' },
            { id: 'ungroup', label: 'Remove Grouping', icon: '\u2715', disabled: !this.host.isGrouped },
            { id: 'sep4', label: '', separator: true },
            { id: 'visualize', label: 'Visualize Column', icon: '\u2587' },
            { id: 'detect-anomalies', label: 'Detect Anomalies', icon: '\u26A0' },
            { id: 'sep5', label: '', separator: true },
            { id: 'column-chooser', label: 'Column Chooser...', icon: '\u2699' },
            { id: 'export-csv', label: 'Export to CSV', icon: '\u21E9' },
            { id: 'export-excel', label: 'Export to Excel', icon: '\u21E9' },
        ];
        this.ctxMenuSource = 'header';
        this.ctxMenuField = col.field;
        this.ctxMenuX = x;
        this.ctxMenuY = y;
        this.ctxMenuOpen = true;
        this.host.requestUpdate();
    }
    handleBodyContextMenu(e, row) {
        e.preventDefault();
        const path = e.composedPath();
        const td = path.find(el => el instanceof HTMLElement && el.tagName === 'TD' && el.hasAttribute('data-col'));
        if (td) {
            const colIdx = Number(td.getAttribute('data-col'));
            const col = this.host.columnDefs[colIdx];
            if (col)
                this.ctxMenuField = col.field;
        }
        const items = [
            { id: 'copy-cell', label: 'Copy Cell Value', icon: '\u2398', shortcut: 'Ctrl+C' },
            { id: 'copy-row', label: 'Copy Row', icon: '\u2398' },
        ];
        if (this.host.cellRangeAnchor && this.host.cellRangeEnd) {
            const count = this.getCellRangeCount();
            items.push({ id: 'copy-range', label: `Copy Selection (${count} cells)`, icon: '\u2398' });
            items.push({ id: 'copy-range-headers', label: 'Copy Selection with Headers', icon: '\u2398' });
        }
        if (this.host.selectedRowIds.size > 0) {
            items.push({ id: 'copy-selected-rows', label: `Copy Selected Rows (${this.host.selectedRowIds.size})`, icon: '\u2398' });
            items.push({ id: 'copy-selected-rows-headers', label: 'Copy Selected with Headers', icon: '\u2398' });
        }
        items.push({ id: 'sep1', label: '', separator: true }, { id: 'select-row', label: 'Select Row', icon: '\u2713' }, { id: 'select-all', label: 'Select All Rows', shortcut: 'Ctrl+A' }, { id: 'sep2', label: '', separator: true }, { id: 'export-csv', label: 'Export to CSV', icon: '\u21E9' }, { id: 'export-excel', label: 'Export to Excel', icon: '\u21E9' });
        const actions = this.host.effectiveRowActions;
        if (actions.length > 0) {
            items.push({ id: 'sep-actions', label: '', separator: true });
            for (const action of actions) {
                items.push({
                    id: `row-action:${action.id}`,
                    label: action.label,
                    icon: action.icon,
                    variant: action.variant,
                });
            }
        }
        this.ctxMenuItems = items;
        this.ctxMenuSource = 'body';
        this.ctxMenuRowId = row.__id;
        this.ctxMenuX = e.clientX;
        this.ctxMenuY = e.clientY;
        this.ctxMenuOpen = true;
        this.host.requestUpdate();
    }
    handleContextMenuSelect(id) {
        const cmds = this.host.commands;
        if (!this.host.gridApi)
            return;
        switch (id) {
            case 'sort-asc':
                cmds.sort(this.ctxMenuField, 'asc');
                break;
            case 'sort-desc':
                cmds.sort(this.ctxMenuField, 'desc');
                break;
            case 'sort-clear':
                cmds.sort(this.ctxMenuField, null);
                break;
            case 'filter':
                cmds.openFilter(this.ctxMenuField);
                break;
            case 'filter-clear':
                cmds.removeFilter(this.ctxMenuField);
                break;
            case 'hide-col':
                cmds.hideColumn(this.ctxMenuField);
                break;
            case 'resize-fit':
                cmds.autoFitColumn(this.ctxMenuField);
                break;
            case 'copy-cell':
                cmds.copyCell(this.ctxMenuRowId, this.ctxMenuField);
                break;
            case 'copy-row':
                cmds.copyRow(this.ctxMenuRowId);
                break;
            case 'copy-range':
                cmds.copyCellRange(false);
                break;
            case 'copy-range-headers':
                cmds.copyCellRange(true);
                break;
            case 'copy-selected-rows':
                cmds.copySelectedRows(false);
                break;
            case 'copy-selected-rows-headers':
                cmds.copySelectedRows(true);
                break;
            case 'select-row':
                if (this.ctxMenuRowId != null)
                    cmds.selectRow(this.ctxMenuRowId);
                break;
            case 'select-all':
                cmds.selectAll();
                break;
            case 'group-by':
                cmds.groupBy(this.ctxMenuField);
                break;
            case 'ungroup':
                cmds.ungroupBy();
                break;
            case 'visualize':
                cmds.openChart(this.ctxMenuField);
                break;
            case 'detect-anomalies':
                cmds.detectAnomalies(this.ctxMenuField);
                break;
            case 'column-chooser':
                cmds.openColumnChooser();
                break;
            case 'export-csv':
                cmds.exportCSV();
                break;
            case 'export-excel':
                cmds.exportExcel();
                break;
            default:
                if (id.startsWith('row-action:')) {
                    const actionId = id.slice('row-action:'.length);
                    const row = this.host.visibleRows.find(r => r.__id === this.ctxMenuRowId);
                    if (row)
                        cmds.handleRowAction(actionId, row);
                }
                break;
        }
    }
    close() {
        this.ctxMenuOpen = false;
        this.host.requestUpdate();
    }
    getCellRangeCount() {
        if (!this.host.cellRangeAnchor || !this.host.cellRangeEnd)
            return 0;
        const rows = Math.abs(this.host.cellRangeEnd.rowIndex - this.host.cellRangeAnchor.rowIndex) + 1;
        const cols = Math.abs(this.host.cellRangeEnd.colIndex - this.host.cellRangeAnchor.colIndex) + 1;
        return rows * cols;
    }
}
//# sourceMappingURL=context-menu.controller.js.map