import { dispatchGridEvent } from '../events.js';
export class SelectionController {
    constructor(host) {
        this.selectedRowIds = new Set();
        this.lastClickedRowId = null;
        // Cell range state
        this.cellRangeAnchor = null;
        this.cellRangeEnd = null;
        this.isDraggingRange = false;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    toggleRowSelection(row) {
        if (!this.host.gridApi)
            return;
        if (this.selectedRowIds.has(row.__id)) {
            this.host.gridApi.deselect(row.__id);
        }
        else {
            this.host.gridApi.selectRow(row.__id);
        }
    }
    handleRowClick(e, row) {
        if (!this.host.gridApi)
            return;
        // Clear any active cell range when switching to row selection
        this.clearCellRange();
        if (this.host.selectionMode === 'single') {
            const sel = this.host.gridApi.getSelection();
            if (sel.rows.includes(row.__id)) {
                this.host.gridApi.deselect(row.__id);
            }
            else {
                this.host.gridApi.deselectAll();
                this.host.gridApi.selectRow(row.__id);
            }
        }
        else if (this.host.selectionMode === 'multi') {
            if (e.shiftKey && this.lastClickedRowId != null) {
                const rows = this.host.visibleRows;
                const anchorIdx = rows.findIndex(r => r.__id === this.lastClickedRowId);
                const targetIdx = rows.findIndex(r => r.__id === row.__id);
                if (anchorIdx >= 0 && targetIdx >= 0) {
                    const start = Math.min(anchorIdx, targetIdx);
                    const end = Math.max(anchorIdx, targetIdx);
                    if (!e.ctrlKey && !e.metaKey)
                        this.host.gridApi.deselectAll();
                    for (let i = start; i <= end; i++) {
                        this.host.gridApi.selectRow(rows[i].__id);
                    }
                }
            }
            else if (e.ctrlKey || e.metaKey) {
                const sel = this.host.gridApi.getSelection();
                if (sel.rows.includes(row.__id)) {
                    this.host.gridApi.deselect(row.__id);
                }
                else {
                    this.host.gridApi.selectRow(row.__id);
                }
            }
            else {
                this.host.gridApi.deselectAll();
                this.host.gridApi.selectRow(row.__id);
            }
        }
        this.lastClickedRowId = row.__id;
        dispatchGridEvent(this.host, 'row-click', {
            rowId: row.__id,
            rowIndex: this.host.visibleRows.indexOf(row),
            data: { ...row },
            originalEvent: e,
        });
    }
    // --- Cell range ---
    handleCellMouseDown(e, rowIdx, colIdx) {
        if (e.button !== 0)
            return;
        e.preventDefault();
        if (e.shiftKey && this.cellRangeAnchor) {
            this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
        }
        else {
            this.cellRangeAnchor = { rowIndex: rowIdx, colIndex: colIdx };
            this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
            this.isDraggingRange = true;
        }
        this.host.requestUpdate();
    }
    handleCellMouseMove(_e, rowIdx, colIdx) {
        if (!this.isDraggingRange)
            return;
        this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
        this.host.requestUpdate();
    }
    handleCellMouseUp() {
        this.isDraggingRange = false;
    }
    isCellInRange(rowIdx, colIdx) {
        if (!this.cellRangeAnchor || !this.cellRangeEnd)
            return false;
        const minRow = Math.min(this.cellRangeAnchor.rowIndex, this.cellRangeEnd.rowIndex);
        const maxRow = Math.max(this.cellRangeAnchor.rowIndex, this.cellRangeEnd.rowIndex);
        const minCol = Math.min(this.cellRangeAnchor.colIndex, this.cellRangeEnd.colIndex);
        const maxCol = Math.max(this.cellRangeAnchor.colIndex, this.cellRangeEnd.colIndex);
        return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
    }
    getCellRangeCount() {
        if (!this.cellRangeAnchor || !this.cellRangeEnd)
            return 0;
        const rows = Math.abs(this.cellRangeEnd.rowIndex - this.cellRangeAnchor.rowIndex) + 1;
        const cols = Math.abs(this.cellRangeEnd.colIndex - this.cellRangeAnchor.colIndex) + 1;
        return rows * cols;
    }
    clearCellRange() {
        this.cellRangeAnchor = null;
        this.cellRangeEnd = null;
        this.isDraggingRange = false;
        this.host.requestUpdate();
    }
    extendCellRange(direction, rowCount, colCount, focusedPosition) {
        if (!this.cellRangeAnchor) {
            if (!focusedPosition)
                return;
            this.cellRangeAnchor = { rowIndex: focusedPosition.rowIndex, colIndex: focusedPosition.columnIndex };
            this.cellRangeEnd = { ...this.cellRangeAnchor };
        }
        const end = this.cellRangeEnd ?? { ...this.cellRangeAnchor };
        let { rowIndex, colIndex } = end;
        switch (direction) {
            case 'up':
                rowIndex = Math.max(0, rowIndex - 1);
                break;
            case 'down':
                rowIndex = Math.min(rowCount - 1, rowIndex + 1);
                break;
            case 'left':
                colIndex = Math.max(0, colIndex - 1);
                break;
            case 'right':
                colIndex = Math.min(colCount - 1, colIndex + 1);
                break;
        }
        this.cellRangeEnd = { rowIndex, colIndex };
        this.host.requestUpdate();
    }
    syncFromGridState(selectedRows) {
        this.selectedRowIds = new Set(selectedRows);
    }
}
//# sourceMappingURL=selection.controller.js.map