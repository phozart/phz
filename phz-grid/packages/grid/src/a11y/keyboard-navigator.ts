/**
 * @phozart/phz-grid — KeyboardNavigator
 *
 * Handles keyboard navigation within the grid using a roving tabindex
 * pattern (WCAG 2.1.1 compliant). Arrow keys navigate cells, Tab exits
 * the grid — avoiding the keyboard trap that affects competitors.
 */
import type { GridApi, ColumnDefinition, RowData } from '@phozart/phz-core';

export interface GridCellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface KeyboardNavigatorCallbacks {
  onCopy?: () => void;
  onSelectAll?: () => void;
  onRangeExtend?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onEscape?: () => void;
}

export class KeyboardNavigator {
  private grid: GridApi;
  private gridElement: HTMLElement | null = null;
  private focusedPosition: GridCellPosition = { rowIndex: 0, columnIndex: 0 };
  private previousPosition: GridCellPosition | null = null;
  private columnDefs: ColumnDefinition[] = [];
  private callbacks: KeyboardNavigatorCallbacks = {};
  private pageJumpSize: number = 10;

  constructor(grid: GridApi, columns?: ColumnDefinition[], callbacks?: KeyboardNavigatorCallbacks) {
    this.grid = grid;
    if (columns) this.columnDefs = columns;
    if (callbacks) this.callbacks = callbacks;
  }

  setCallbacks(callbacks: KeyboardNavigatorCallbacks): void {
    this.callbacks = callbacks;
  }

  setColumns(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
  }

  setPageJumpSize(size: number): void {
    this.pageJumpSize = size;
  }

  attach(element: HTMLElement): void {
    this.gridElement = element;
    element.addEventListener('keydown', this.handleKeyDown);
  }

  detach(): void {
    if (this.gridElement) {
      this.gridElement.removeEventListener('keydown', this.handleKeyDown);
    }
    this.gridElement = null;
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const mod = ctrlKey || metaKey;

    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        if (shiftKey) {
          this.callbacks.onRangeExtend?.('up');
        } else {
          this.moveFocus('up');
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (shiftKey) {
          this.callbacks.onRangeExtend?.('down');
        } else {
          this.moveFocus('down');
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (shiftKey) {
          this.callbacks.onRangeExtend?.('left');
        } else {
          this.moveFocus('left');
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (shiftKey) {
          this.callbacks.onRangeExtend?.('right');
        } else {
          this.moveFocus('right');
        }
        break;
      case 'Home':
        event.preventDefault();
        if (mod) {
          this.moveFocusToFirstCell();
        } else {
          this.focusedPosition = { ...this.focusedPosition, columnIndex: 0 };
          this.applyFocus();
        }
        break;
      case 'End':
        event.preventDefault();
        if (mod) {
          this.moveFocusToLastCell();
        } else {
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

  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
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

  moveFocusToFirstCell(): void {
    this.focusedPosition = { rowIndex: 0, columnIndex: 0 };
    this.applyFocus();
  }

  moveFocusToLastCell(): void {
    const rowCount = this.getRowCount();
    const colCount = this.getColumnCount();
    this.focusedPosition = { rowIndex: rowCount - 1, columnIndex: colCount - 1 };
    this.applyFocus();
  }

  getFocusedPosition(): GridCellPosition {
    return { ...this.focusedPosition };
  }

  setFocusedPosition(position: GridCellPosition): void {
    this.focusedPosition = { ...position };
    this.applyFocus();
  }

  private moveFocusPage(direction: 'up' | 'down'): void {
    const pageSize = this.pageJumpSize;
    const rowCount = this.getRowCount();
    let { rowIndex } = this.focusedPosition;

    if (direction === 'up') {
      rowIndex = Math.max(0, rowIndex - pageSize);
    } else {
      rowIndex = Math.min(rowCount - 1, rowIndex + pageSize);
    }

    this.focusedPosition = { ...this.focusedPosition, rowIndex };
    this.applyFocus();
  }

  private activateCell(): void {
    if (this.focusedPosition.rowIndex === -1) {
      // Header row — toggle sort
      const col = this.columnDefs[this.focusedPosition.columnIndex];
      if (col && col.sortable !== false) {
        const sortState = this.grid.getSortState();
        const current = sortState.columns.find(s => s.field === col.field);
        if (!current) {
          this.grid.sort(col.field, 'asc');
        } else if (current.direction === 'asc') {
          this.grid.sort(col.field, 'desc');
        } else {
          this.grid.sort(col.field, null);
        }
      }
    } else {
      this.enterEditMode();
    }
  }

  private toggleSelection(): void {
    const rows = this.getVisibleRows();
    const row = rows[this.focusedPosition.rowIndex];
    if (!row) return;

    const rowId = row.__id;
    const selection = this.grid.getSelection();
    if (selection.rows.includes(rowId)) {
      this.grid.deselect(rowId);
    } else {
      this.grid.selectRow(rowId);
    }
  }

  private enterEditMode(): void {
    const col = this.columnDefs[this.focusedPosition.columnIndex];
    if (!col || col.editable === false) return;

    const rows = this.getVisibleRows();
    const row = rows[this.focusedPosition.rowIndex];
    if (!row) return;

    this.grid.startEdit({ rowId: row.__id, field: col.field });
  }

  private cancelCurrentEdit(): void {
    const state = this.grid.getState();
    if (state.edit.status !== 'idle') {
      const activeCell = state.focus.activeCell;
      if (activeCell) {
        this.grid.cancelEdit(activeCell);
      }
    }
  }

  private applyFocus(): void {
    if (!this.gridElement) return;

    // Reset previous cell's tabindex
    if (this.previousPosition) {
      const prevCell = this.gridElement.querySelector(
        `[data-row="${this.previousPosition.rowIndex}"][data-col="${this.previousPosition.columnIndex}"]`
      ) as HTMLElement | null;
      if (prevCell) {
        prevCell.setAttribute('tabindex', '-1');
      }
    }

    const cell = this.gridElement.querySelector(
      `[data-row="${this.focusedPosition.rowIndex}"][data-col="${this.focusedPosition.columnIndex}"]`
    ) as HTMLElement | null;
    if (cell) {
      cell.setAttribute('tabindex', '0');
      cell.focus();
      cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    this.previousPosition = { ...this.focusedPosition };
  }

  private getVisibleRows(): RowData[] {
    return this.grid.getSortedRowModel().rows;
  }

  private getRowCount(): number {
    return this.grid.getSortedRowModel().rowCount;
  }

  private getColumnCount(): number {
    return this.columnDefs.length;
  }

  private openContextMenu(): void {
    if (!this.gridElement) return;
    const cell = this.gridElement.querySelector(
      `[data-row="${this.focusedPosition.rowIndex}"][data-col="${this.focusedPosition.columnIndex}"]`
    ) as HTMLElement | null;
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
