export class KeyboardNavigator {
    constructor(grid, columns, callbacks) {
        this.gridElement = null;
        this.focusedPosition = { rowIndex: 0, columnIndex: 0 };
        this.previousPosition = null;
        this.columnDefs = [];
        this.callbacks = {};
        this.pageJumpSize = 10;
        this.handleKeyDown = (event) => {
            const { key, ctrlKey, metaKey, shiftKey } = event;
            const mod = ctrlKey || metaKey;
            switch (key) {
                case 'ArrowUp':
                    event.preventDefault();
                    if (shiftKey) {
                        this.callbacks.onRangeExtend?.('up');
                    }
                    else {
                        this.moveFocus('up');
                    }
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    if (shiftKey) {
                        this.callbacks.onRangeExtend?.('down');
                    }
                    else {
                        this.moveFocus('down');
                    }
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    if (shiftKey) {
                        this.callbacks.onRangeExtend?.('left');
                    }
                    else {
                        this.moveFocus('left');
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    if (shiftKey) {
                        this.callbacks.onRangeExtend?.('right');
                    }
                    else {
                        this.moveFocus('right');
                    }
                    break;
                case 'Home':
                    event.preventDefault();
                    if (mod) {
                        this.moveFocusToFirstCell();
                    }
                    else {
                        this.focusedPosition = { ...this.focusedPosition, columnIndex: 0 };
                        this.applyFocus();
                    }
                    break;
                case 'End':
                    event.preventDefault();
                    if (mod) {
                        this.moveFocusToLastCell();
                    }
                    else {
                        const colCount = this.getColumnCount();
                        this.focusedPosition = { ...this.focusedPosition, columnIndex: colCount - 1 };
                        this.applyFocus();
                    }
                    break;
                case 'PageUp':
                    event.preventDefault();
                    this.moveFocusPage('up');
                    break;
                case 'PageDown':
                    event.preventDefault();
                    this.moveFocusPage('down');
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.activateCell();
                    break;
                case ' ':
                    if (!shiftKey) {
                        event.preventDefault();
                        this.toggleSelection();
                    }
                    break;
                case 'c':
                    if (mod) {
                        event.preventDefault();
                        this.callbacks.onCopy?.();
                    }
                    break;
                case 'a':
                    if (mod) {
                        event.preventDefault();
                        this.callbacks.onSelectAll?.();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.cancelCurrentEdit();
                    this.callbacks.onEscape?.();
                    break;
                case 'F2':
                    event.preventDefault();
                    this.enterEditMode();
                    break;
                case 'F10':
                    if (shiftKey) {
                        event.preventDefault();
                        this.openContextMenu();
                    }
                    break;
                case 'ContextMenu':
                    event.preventDefault();
                    this.openContextMenu();
                    break;
            }
        };
        this.grid = grid;
        if (columns)
            this.columnDefs = columns;
        if (callbacks)
            this.callbacks = callbacks;
    }
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }
    setColumns(columns) {
        this.columnDefs = columns;
    }
    setPageJumpSize(size) {
        this.pageJumpSize = size;
    }
    attach(element) {
        this.gridElement = element;
        element.addEventListener('keydown', this.handleKeyDown);
    }
    detach() {
        if (this.gridElement) {
            this.gridElement.removeEventListener('keydown', this.handleKeyDown);
        }
        this.gridElement = null;
    }
    moveFocus(direction) {
        const rowCount = this.getRowCount();
        const colCount = this.getColumnCount();
        let { rowIndex, columnIndex } = this.focusedPosition;
        switch (direction) {
            case 'up':
                rowIndex = Math.max(0, rowIndex - 1);
                break;
            case 'down':
                rowIndex = Math.min(rowCount - 1, rowIndex + 1);
                break;
            case 'left':
                columnIndex = Math.max(0, columnIndex - 1);
                break;
            case 'right':
                columnIndex = Math.min(colCount - 1, columnIndex + 1);
                break;
        }
        this.focusedPosition = { rowIndex, columnIndex };
        this.applyFocus();
    }
    moveFocusToFirstCell() {
        this.focusedPosition = { rowIndex: 0, columnIndex: 0 };
        this.applyFocus();
    }
    moveFocusToLastCell() {
        const rowCount = this.getRowCount();
        const colCount = this.getColumnCount();
        this.focusedPosition = { rowIndex: rowCount - 1, columnIndex: colCount - 1 };
        this.applyFocus();
    }
    getFocusedPosition() {
        return { ...this.focusedPosition };
    }
    setFocusedPosition(position) {
        this.focusedPosition = { ...position };
        this.applyFocus();
    }
    moveFocusPage(direction) {
        const pageSize = this.pageJumpSize;
        const rowCount = this.getRowCount();
        let { rowIndex } = this.focusedPosition;
        if (direction === 'up') {
            rowIndex = Math.max(0, rowIndex - pageSize);
        }
        else {
            rowIndex = Math.min(rowCount - 1, rowIndex + pageSize);
        }
        this.focusedPosition = { ...this.focusedPosition, rowIndex };
        this.applyFocus();
    }
    activateCell() {
        if (this.focusedPosition.rowIndex === -1) {
            // Header row — toggle sort
            const col = this.columnDefs[this.focusedPosition.columnIndex];
            if (col && col.sortable !== false) {
                const sortState = this.grid.getSortState();
                const current = sortState.columns.find(s => s.field === col.field);
                if (!current) {
                    this.grid.sort(col.field, 'asc');
                }
                else if (current.direction === 'asc') {
                    this.grid.sort(col.field, 'desc');
                }
                else {
                    this.grid.sort(col.field, null);
                }
            }
        }
        else {
            this.enterEditMode();
        }
    }
    toggleSelection() {
        const rows = this.getVisibleRows();
        const row = rows[this.focusedPosition.rowIndex];
        if (!row)
            return;
        const rowId = row.__id;
        const selection = this.grid.getSelection();
        if (selection.rows.includes(rowId)) {
            this.grid.deselect(rowId);
        }
        else {
            this.grid.selectRow(rowId);
        }
    }
    enterEditMode() {
        const col = this.columnDefs[this.focusedPosition.columnIndex];
        if (!col || col.editable === false)
            return;
        const rows = this.getVisibleRows();
        const row = rows[this.focusedPosition.rowIndex];
        if (!row)
            return;
        this.grid.startEdit({ rowId: row.__id, field: col.field });
    }
    cancelCurrentEdit() {
        const state = this.grid.getState();
        if (state.edit.status !== 'idle') {
            const activeCell = state.focus.activeCell;
            if (activeCell) {
                this.grid.cancelEdit(activeCell);
            }
        }
    }
    applyFocus() {
        if (!this.gridElement)
            return;
        // Reset previous cell's tabindex
        if (this.previousPosition) {
            const prevCell = this.gridElement.querySelector(`[data-row="${this.previousPosition.rowIndex}"][data-col="${this.previousPosition.columnIndex}"]`);
            if (prevCell) {
                prevCell.setAttribute('tabindex', '-1');
            }
        }
        const cell = this.gridElement.querySelector(`[data-row="${this.focusedPosition.rowIndex}"][data-col="${this.focusedPosition.columnIndex}"]`);
        if (cell) {
            cell.setAttribute('tabindex', '0');
            cell.focus();
            cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        this.previousPosition = { ...this.focusedPosition };
    }
    getVisibleRows() {
        return this.grid.getSortedRowModel().rows;
    }
    getRowCount() {
        return this.grid.getSortedRowModel().rowCount;
    }
    getColumnCount() {
        return this.columnDefs.length;
    }
    openContextMenu() {
        if (!this.gridElement)
            return;
        const cell = this.gridElement.querySelector(`[data-row="${this.focusedPosition.rowIndex}"][data-col="${this.focusedPosition.columnIndex}"]`);
        if (cell) {
            const rect = cell.getBoundingClientRect();
            cell.dispatchEvent(new MouseEvent('contextmenu', {
                bubbles: true,
                composed: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
            }));
        }
    }
}
//# sourceMappingURL=keyboard-navigator.js.map