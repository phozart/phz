import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, RowData, RowId, ColumnDefinition } from '@phozart/phz-core';
import { dispatchGridEvent } from '../events.js';

export interface SelectionHost extends ReactiveControllerHost, EventTarget {
  gridApi: GridApi | null;
  selectionMode: 'none' | 'single' | 'multi' | 'range';
  visibleRows: RowData[];
  columnDefs: ColumnDefinition[];
}

export class SelectionController implements ReactiveController {
  private host: SelectionHost;

  selectedRowIds: Set<RowId> = new Set();
  lastClickedRowId: RowId | null = null;

  // Cell range state
  cellRangeAnchor: { rowIndex: number; colIndex: number } | null = null;
  cellRangeEnd: { rowIndex: number; colIndex: number } | null = null;
  isDraggingRange: boolean = false;

  constructor(host: SelectionHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  toggleRowSelection(row: RowData): void {
    if (!this.host.gridApi) return;
    if (this.selectedRowIds.has(row.__id)) {
      this.host.gridApi.deselect(row.__id);
    } else {
      this.host.gridApi.selectRow(row.__id);
    }
  }

  handleRowClick(e: MouseEvent, row: RowData): void {
    if (!this.host.gridApi) return;

    // Clear any active cell range when switching to row selection
    this.clearCellRange();

    if (this.host.selectionMode === 'single') {
      const sel = this.host.gridApi.getSelection();
      if (sel.rows.includes(row.__id)) {
        this.host.gridApi.deselect(row.__id);
      } else {
        this.host.gridApi.deselectAll();
        this.host.gridApi.selectRow(row.__id);
      }
    } else if (this.host.selectionMode === 'multi') {
      if (e.shiftKey && this.lastClickedRowId != null) {
        const rows = this.host.visibleRows;
        const anchorIdx = rows.findIndex(r => r.__id === this.lastClickedRowId);
        const targetIdx = rows.findIndex(r => r.__id === row.__id);
        if (anchorIdx >= 0 && targetIdx >= 0) {
          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          if (!e.ctrlKey && !e.metaKey) this.host.gridApi.deselectAll();
          for (let i = start; i <= end; i++) {
            this.host.gridApi.selectRow(rows[i].__id);
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        const sel = this.host.gridApi.getSelection();
        if (sel.rows.includes(row.__id)) {
          this.host.gridApi.deselect(row.__id);
        } else {
          this.host.gridApi.selectRow(row.__id);
        }
      } else {
        this.host.gridApi.deselectAll();
        this.host.gridApi.selectRow(row.__id);
      }
    }
    this.lastClickedRowId = row.__id;

    dispatchGridEvent(this.host as unknown as HTMLElement, 'row-click', {
      rowId: row.__id,
      rowIndex: this.host.visibleRows.indexOf(row),
      data: { ...row },
      originalEvent: e,
    });
  }

  // --- Cell range ---

  handleCellMouseDown(e: MouseEvent, rowIdx: number, colIdx: number): void {
    if (e.button !== 0) return;
    e.preventDefault();

    if (e.shiftKey && this.cellRangeAnchor) {
      this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
    } else {
      this.cellRangeAnchor = { rowIndex: rowIdx, colIndex: colIdx };
      this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
      this.isDraggingRange = true;
    }
    this.host.requestUpdate();
  }

  handleCellMouseMove(_e: MouseEvent, rowIdx: number, colIdx: number): void {
    if (!this.isDraggingRange) return;
    this.cellRangeEnd = { rowIndex: rowIdx, colIndex: colIdx };
    this.host.requestUpdate();
  }

  handleCellMouseUp(): void {
    this.isDraggingRange = false;
  }

  isCellInRange(rowIdx: number, colIdx: number): boolean {
    if (!this.cellRangeAnchor || !this.cellRangeEnd) return false;
    const minRow = Math.min(this.cellRangeAnchor.rowIndex, this.cellRangeEnd.rowIndex);
    const maxRow = Math.max(this.cellRangeAnchor.rowIndex, this.cellRangeEnd.rowIndex);
    const minCol = Math.min(this.cellRangeAnchor.colIndex, this.cellRangeEnd.colIndex);
    const maxCol = Math.max(this.cellRangeAnchor.colIndex, this.cellRangeEnd.colIndex);
    return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
  }

  getCellRangeCount(): number {
    if (!this.cellRangeAnchor || !this.cellRangeEnd) return 0;
    const rows = Math.abs(this.cellRangeEnd.rowIndex - this.cellRangeAnchor.rowIndex) + 1;
    const cols = Math.abs(this.cellRangeEnd.colIndex - this.cellRangeAnchor.colIndex) + 1;
    return rows * cols;
  }

  clearCellRange(): void {
    this.cellRangeAnchor = null;
    this.cellRangeEnd = null;
    this.isDraggingRange = false;
    this.host.requestUpdate();
  }

  extendCellRange(
    direction: 'up' | 'down' | 'left' | 'right',
    rowCount: number,
    colCount: number,
    focusedPosition?: { rowIndex: number; columnIndex: number },
  ): void {
    if (!this.cellRangeAnchor) {
      if (!focusedPosition) return;
      this.cellRangeAnchor = { rowIndex: focusedPosition.rowIndex, colIndex: focusedPosition.columnIndex };
      this.cellRangeEnd = { ...this.cellRangeAnchor };
    }

    const end = this.cellRangeEnd ?? { ...this.cellRangeAnchor };
    let { rowIndex, colIndex } = end;

    switch (direction) {
      case 'up': rowIndex = Math.max(0, rowIndex - 1); break;
      case 'down': rowIndex = Math.min(rowCount - 1, rowIndex + 1); break;
      case 'left': colIndex = Math.max(0, colIndex - 1); break;
      case 'right': colIndex = Math.min(colCount - 1, colIndex + 1); break;
    }

    this.cellRangeEnd = { rowIndex, colIndex };
    this.host.requestUpdate();
  }

  syncFromGridState(selectedRows: RowId[]): void {
    this.selectedRowIds = new Set(selectedRows);
  }
}
