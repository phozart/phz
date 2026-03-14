/**
 * @phozart/grid — KeyboardNavigator
 *
 * Handles keyboard navigation within the grid using a roving tabindex
 * pattern (WCAG 2.1.1 compliant). Arrow keys navigate cells, Tab exits
 * the grid — avoiding the keyboard trap that affects competitors.
 */
import type { GridApi, ColumnDefinition } from '@phozart/core';
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
export declare class KeyboardNavigator {
    private grid;
    private gridElement;
    private focusedPosition;
    private previousPosition;
    private columnDefs;
    private callbacks;
    private pageJumpSize;
    constructor(grid: GridApi, columns?: ColumnDefinition[], callbacks?: KeyboardNavigatorCallbacks);
    setCallbacks(callbacks: KeyboardNavigatorCallbacks): void;
    setColumns(columns: ColumnDefinition[]): void;
    setPageJumpSize(size: number): void;
    attach(element: HTMLElement): void;
    detach(): void;
    handleKeyDown: (event: KeyboardEvent) => void;
    moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void;
    moveFocusToFirstCell(): void;
    moveFocusToLastCell(): void;
    getFocusedPosition(): GridCellPosition;
    setFocusedPosition(position: GridCellPosition): void;
    private moveFocusPage;
    private activateCell;
    private toggleSelection;
    private enterEditMode;
    private cancelCurrentEdit;
    private applyFocus;
    private getVisibleRows;
    private getRowCount;
    private getColumnCount;
    private openContextMenu;
}
//# sourceMappingURL=keyboard-navigator.d.ts.map