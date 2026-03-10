import { describe, it, expect } from 'vitest';
import {
  initialFreeformGridState,
  setGridColumns,
  setGridRows,
  setGridGap,
  setGridCellSize,
  toggleSnapToGrid,
  snapToGrid,
  snapPlacement,
  addFreeformWidget,
  removeFreeformWidget,
  moveFreeformWidget,
  selectFreeformWidget,
  deselectFreeformWidget,
  selectMultipleFreeformWidgets,
  toggleFreeformWidgetSelection,
  startFreeformDrag,
  updateFreeformDrag,
  commitFreeformDrag,
  cancelFreeformDrag,
  startResize,
  updateResize,
  commitResize,
  cancelResize,
  bringToFront,
  sendToBack,
  lockFreeformWidget,
  unlockFreeformWidget,
  alignFreeformWidgets,
  distributeFreeformWidgets,
  setFreeformZoom,
  findOpenPosition,
  autoExpandRows,
  detectCollisions,
  resolveCollisions,
  pixelToGrid,
  gridToPixel,
  toCSSGridStyle,
  toWidgetStyle,
} from '../authoring/freeform-grid-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialFreeformGridState', () => {
  it('creates state with default grid', () => {
    const state = initialFreeformGridState();
    expect(state.grid.columns).toBe(48);
    expect(state.grid.rows).toBe(36);
    expect(state.grid.gapPx).toBe(4);
    expect(state.grid.cellSizePx).toBe(20);
    expect(state.grid.snapToGrid).toBe(true);
    expect(state.widgets).toHaveLength(0);
    expect(state.selectedWidgetIds).toEqual([]);
    expect(state.zoom).toBe(1.0);
  });

  it('accepts overrides', () => {
    const state = initialFreeformGridState({ columns: 6, gapPx: 16 });
    expect(state.grid.columns).toBe(6);
    expect(state.grid.gapPx).toBe(16);
    expect(state.grid.rows).toBe(36); // default
  });
});

// ---------------------------------------------------------------------------
// Grid configuration
// ---------------------------------------------------------------------------

describe('grid configuration', () => {
  it('sets columns within bounds', () => {
    const state = setGridColumns(initialFreeformGridState(), 8);
    expect(state.grid.columns).toBe(8);
  });

  it('rejects invalid column count', () => {
    const base = initialFreeformGridState();
    expect(setGridColumns(base, 0).grid.columns).toBe(48);
    expect(setGridColumns(base, 97).grid.columns).toBe(48);
  });

  it('accepts column count up to 96', () => {
    const state = setGridColumns(initialFreeformGridState(), 96);
    expect(state.grid.columns).toBe(96);
  });

  it('sets rows', () => {
    const state = setGridRows(initialFreeformGridState(), 20);
    expect(state.grid.rows).toBe(20);
  });

  it('sets gap', () => {
    const state = setGridGap(initialFreeformGridState(), 16);
    expect(state.grid.gapPx).toBe(16);
  });

  it('rejects negative gap', () => {
    expect(setGridGap(initialFreeformGridState(), -1).grid.gapPx).toBe(4);
  });

  it('toggles snap-to-grid', () => {
    const state = toggleSnapToGrid(initialFreeformGridState());
    expect(state.grid.snapToGrid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setGridCellSize
// ---------------------------------------------------------------------------

describe('setGridCellSize', () => {
  it('sets cell size within bounds', () => {
    const state = setGridCellSize(initialFreeformGridState(), 40);
    expect(state.grid.cellSizePx).toBe(40);
  });

  it('accepts minimum cell size', () => {
    const state = setGridCellSize(initialFreeformGridState(), 4);
    expect(state.grid.cellSizePx).toBe(4);
  });

  it('accepts maximum cell size', () => {
    const state = setGridCellSize(initialFreeformGridState(), 200);
    expect(state.grid.cellSizePx).toBe(200);
  });

  it('rejects cell size below minimum', () => {
    const base = initialFreeformGridState();
    expect(setGridCellSize(base, 3).grid.cellSizePx).toBe(20);
  });

  it('rejects cell size above maximum', () => {
    const base = initialFreeformGridState();
    expect(setGridCellSize(base, 201).grid.cellSizePx).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Snap to grid
// ---------------------------------------------------------------------------

describe('snapToGrid', () => {
  it('snaps to nearest grid cell', () => {
    expect(snapToGrid(45, 80, 8)).toBe(1);
    expect(snapToGrid(200, 80, 8)).toBe(2);
  });

  it('handles zero cell size', () => {
    expect(snapToGrid(100, 0, 8)).toBe(100);
  });
});

describe('snapPlacement', () => {
  it('clamps placement within grid bounds', () => {
    const grid = { columns: 48, rows: 36, gapPx: 4, cellSizePx: 20, snapToGrid: true };
    const snapped = snapPlacement({ id: 'w1', col: 60, row: -1, colSpan: 0, rowSpan: 0 }, grid);
    expect(snapped.col).toBe(47);
    expect(snapped.row).toBe(0);
    expect(snapped.colSpan).toBe(1);
    expect(snapped.rowSpan).toBe(1);
  });

  it('does not modify when snapToGrid is false', () => {
    const grid = { columns: 48, rows: 36, gapPx: 4, cellSizePx: 20, snapToGrid: false };
    const placement = { id: 'w1', col: 60, row: -1, colSpan: 0, rowSpan: 0 };
    expect(snapPlacement(placement, grid)).toEqual(placement);
  });
});

// ---------------------------------------------------------------------------
// Widget placement
// ---------------------------------------------------------------------------

describe('widget placement', () => {
  it('adds a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 3, rowSpan: 2 });
    expect(state.widgets).toHaveLength(1);
    expect(state.widgets[0].id).toBe('w1');
  });

  it('does not add duplicate widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w1');
    expect(state.widgets).toHaveLength(1);
  });

  it('adds widget with zIndex', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, zIndex: 5 });
    expect(state.widgets[0].zIndex).toBe(5);
  });

  it('adds widget with locked flag', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, locked: true });
    expect(state.widgets[0].locked).toBe(true);
  });

  it('removes a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = removeFreeformWidget(state, 'w1');
    expect(state.widgets).toHaveLength(0);
  });

  it('clears selected when removing selected widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = selectFreeformWidget(state, 'w1');
    state = removeFreeformWidget(state, 'w1');
    expect(state.selectedWidgetIds).toEqual([]);
  });

  it('removes widget from multi-selection', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2']);
    state = removeFreeformWidget(state, 'w1');
    expect(state.selectedWidgetIds).toEqual(['w2']);
  });

  it('moves a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = moveFreeformWidget(state, 'w1', 3, 3);
    expect(state.widgets[0].col).toBe(3);
    expect(state.widgets[0].row).toBe(3);
  });

  it('move does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(moveFreeformWidget(state, 'unknown', 0, 0)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = selectFreeformWidget(state, 'w1');
    expect(state.selectedWidgetIds).toEqual(['w1']);
  });

  it('deselects widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = selectFreeformWidget(state, 'w1');
    state = deselectFreeformWidget(state);
    expect(state.selectedWidgetIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Multi-select
// ---------------------------------------------------------------------------

describe('multi-select', () => {
  it('selects multiple widgets', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = addFreeformWidget(state, 'w3');
    state = selectMultipleFreeformWidgets(state, ['w1', 'w3']);
    expect(state.selectedWidgetIds).toEqual(['w1', 'w3']);
  });

  it('replaces existing selection', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = selectFreeformWidget(state, 'w1');
    state = selectMultipleFreeformWidgets(state, ['w2']);
    expect(state.selectedWidgetIds).toEqual(['w2']);
  });

  it('toggles widget into selection', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = selectFreeformWidget(state, 'w1');
    state = toggleFreeformWidgetSelection(state, 'w2');
    expect(state.selectedWidgetIds).toEqual(['w1', 'w2']);
  });

  it('toggles widget out of selection', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2']);
    state = toggleFreeformWidgetSelection(state, 'w1');
    expect(state.selectedWidgetIds).toEqual(['w2']);
  });
});

// ---------------------------------------------------------------------------
// Drag lifecycle
// ---------------------------------------------------------------------------

describe('drag lifecycle', () => {
  it('starts a drag operation', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 2, row: 3, colSpan: 4, rowSpan: 2 });
    state = startFreeformDrag(state, 'w1');
    expect(state.dragOperation).toBeDefined();
    expect(state.dragOperation!.widgetId).toBe('w1');
    expect(state.dragOperation!.startPlacement.col).toBe(2);
    expect(state.dragOperation!.startPlacement.row).toBe(3);
  });

  it('does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(startFreeformDrag(state, 'unknown')).toBe(state);
  });

  it('does not start drag on locked widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, locked: true });
    const result = startFreeformDrag(state, 'w1');
    expect(result).toBe(state);
    expect(result.dragOperation).toBeUndefined();
  });

  it('updates drag with deltas', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 2, row: 3, colSpan: 4, rowSpan: 2 });
    state = startFreeformDrag(state, 'w1');
    state = updateFreeformDrag(state, 5, 2);
    expect(state.dragOperation!.currentPlacement.col).toBe(7);
    expect(state.dragOperation!.currentPlacement.row).toBe(5);
    // startPlacement unchanged
    expect(state.dragOperation!.startPlacement.col).toBe(2);
    expect(state.dragOperation!.startPlacement.row).toBe(3);
  });

  it('update does nothing without active drag', () => {
    const state = initialFreeformGridState();
    expect(updateFreeformDrag(state, 1, 1)).toBe(state);
  });

  it('commits drag to widget position', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = startFreeformDrag(state, 'w1');
    state = updateFreeformDrag(state, 5, 3);
    state = commitFreeformDrag(state);
    expect(state.dragOperation).toBeUndefined();
    expect(state.widgets[0].col).toBe(5);
    expect(state.widgets[0].row).toBe(3);
  });

  it('commit does nothing without active drag', () => {
    const state = initialFreeformGridState();
    expect(commitFreeformDrag(state)).toBe(state);
  });

  it('cancels drag without applying', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 2, row: 3, colSpan: 2, rowSpan: 2 });
    state = startFreeformDrag(state, 'w1');
    state = updateFreeformDrag(state, 10, 10);
    state = cancelFreeformDrag(state);
    expect(state.dragOperation).toBeUndefined();
    // Widget position unchanged
    expect(state.widgets[0].col).toBe(2);
    expect(state.widgets[0].row).toBe(3);
  });

  it('cancel does nothing without active drag', () => {
    const state = initialFreeformGridState();
    expect(cancelFreeformDrag(state)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

describe('resize', () => {
  it('starts and commits resize', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = startResize(state, 'w1', 'se');
    expect(state.resizing).toBeDefined();
    state = updateResize(state, 2, 1);
    state = commitResize(state);
    expect(state.resizing).toBeUndefined();
    expect(state.widgets[0].colSpan).toBe(4);
    expect(state.widgets[0].rowSpan).toBe(3);
  });

  it('cancels resize', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = startResize(state, 'w1', 'e');
    state = updateResize(state, 5, 0);
    state = cancelResize(state);
    expect(state.resizing).toBeUndefined();
    expect(state.widgets[0].colSpan).toBe(2); // unchanged
  });

  it('does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(startResize(state, 'unknown', 'e').resizing).toBeUndefined();
  });

  it('enforces minimum span of 1', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = startResize(state, 'w1', 'w');
    state = updateResize(state, 10, 0); // try to shrink past 1
    state = commitResize(state);
    expect(state.widgets[0].colSpan).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Z-ordering
// ---------------------------------------------------------------------------

describe('z-ordering', () => {
  it('bringToFront sets zIndex above all others', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, zIndex: 1 });
    state = addFreeformWidget(state, 'w2', { col: 4, row: 0, colSpan: 2, rowSpan: 2, zIndex: 5 });
    state = addFreeformWidget(state, 'w3', { col: 8, row: 0, colSpan: 2, rowSpan: 2, zIndex: 3 });
    state = bringToFront(state, 'w1');
    const w1 = state.widgets.find(w => w.id === 'w1')!;
    expect(w1.zIndex).toBe(6); // max(1,5,3) + 1
  });

  it('bringToFront does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(bringToFront(state, 'unknown')).toBe(state);
  });

  it('bringToFront works when no zIndex set', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 4, row: 0, colSpan: 2, rowSpan: 2 });
    state = bringToFront(state, 'w1');
    const w1 = state.widgets.find(w => w.id === 'w1')!;
    expect(w1.zIndex).toBe(1); // max(0,0) + 1
  });

  it('sendToBack sets zIndex to 0 when all are 0', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 4, row: 0, colSpan: 2, rowSpan: 2 });
    state = sendToBack(state, 'w1');
    const w1 = state.widgets.find(w => w.id === 'w1')!;
    expect(w1.zIndex).toBe(0); // max(0, 0 - 1) = 0
  });

  it('sendToBack does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(sendToBack(state, 'unknown')).toBe(state);
  });

  it('sendToBack floors at 0', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, zIndex: 2 });
    state = addFreeformWidget(state, 'w2', { col: 4, row: 0, colSpan: 2, rowSpan: 2, zIndex: 0 });
    state = sendToBack(state, 'w1');
    const w1 = state.widgets.find(w => w.id === 'w1')!;
    expect(w1.zIndex).toBe(0); // max(0, min(0,2) - 1) = max(0, -1) = 0
  });
});

// ---------------------------------------------------------------------------
// Lock / unlock
// ---------------------------------------------------------------------------

describe('lock/unlock', () => {
  it('locks a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = lockFreeformWidget(state, 'w1');
    expect(state.widgets[0].locked).toBe(true);
  });

  it('unlocks a widget', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2, locked: true });
    state = unlockFreeformWidget(state, 'w1');
    expect(state.widgets[0].locked).toBe(false);
  });

  it('locked widget prevents move', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 2, row: 3, colSpan: 2, rowSpan: 2 });
    state = lockFreeformWidget(state, 'w1');
    const moved = moveFreeformWidget(state, 'w1', 10, 10);
    expect(moved).toBe(state);
    expect(moved.widgets[0].col).toBe(2);
    expect(moved.widgets[0].row).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

describe('alignment', () => {
  function threeWidgetState() {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 2, row: 1, colSpan: 4, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 10, row: 5, colSpan: 6, rowSpan: 3 });
    state = addFreeformWidget(state, 'w3', { col: 6, row: 3, colSpan: 3, rowSpan: 4 });
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2', 'w3']);
    return state;
  }

  it('returns state unchanged if fewer than 2 widgets selected', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = selectFreeformWidget(state, 'w1');
    expect(alignFreeformWidgets(state, 'left')).toBe(state);
  });

  it('returns state unchanged if no widgets selected', () => {
    const state = initialFreeformGridState();
    expect(alignFreeformWidgets(state, 'left')).toBe(state);
  });

  it('aligns left', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'left');
    const cols = state.widgets.map(w => w.col);
    // min col is 2 (from w1), all should be 2
    expect(cols).toEqual([2, 2, 2]);
  });

  it('aligns right', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'right');
    // max right edge: w2 at col=10, span=6 -> right=16
    // w1: col = 16 - 4 = 12; w2: col = 16 - 6 = 10; w3: col = 16 - 3 = 13
    expect(state.widgets.find(w => w.id === 'w1')!.col).toBe(12);
    expect(state.widgets.find(w => w.id === 'w2')!.col).toBe(10);
    expect(state.widgets.find(w => w.id === 'w3')!.col).toBe(13);
  });

  it('aligns top', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'top');
    const rows = state.widgets.map(w => w.row);
    // min row is 1 (from w1)
    expect(rows).toEqual([1, 1, 1]);
  });

  it('aligns bottom', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'bottom');
    // max bottom edge: w2 at row=5, span=3 -> bottom=8
    // w1: row = 8 - 2 = 6; w2: row = 8 - 3 = 5; w3: row = 8 - 4 = 4
    expect(state.widgets.find(w => w.id === 'w1')!.row).toBe(6);
    expect(state.widgets.find(w => w.id === 'w2')!.row).toBe(5);
    expect(state.widgets.find(w => w.id === 'w3')!.row).toBe(4);
  });

  it('aligns center-h', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'center-h');
    // centers: w1=2+2=4, w2=10+3=13, w3=6+1.5=7.5 -> avg = (4+13+7.5)/3 = 8.1667
    // w1: col = round(8.1667 - 2) = round(6.1667) = 6
    // w2: col = round(8.1667 - 3) = round(5.1667) = 5
    // w3: col = round(8.1667 - 1.5) = round(6.6667) = 7
    expect(state.widgets.find(w => w.id === 'w1')!.col).toBe(6);
    expect(state.widgets.find(w => w.id === 'w2')!.col).toBe(5);
    expect(state.widgets.find(w => w.id === 'w3')!.col).toBe(7);
  });

  it('aligns center-v', () => {
    const state = alignFreeformWidgets(threeWidgetState(), 'center-v');
    // centers: w1=1+1=2, w2=5+1.5=6.5, w3=3+2=5 -> avg = (2+6.5+5)/3 = 4.5
    // w1: row = round(4.5 - 1) = round(3.5) = 4
    // w2: row = round(4.5 - 1.5) = round(3.0) = 3
    // w3: row = round(4.5 - 2) = round(2.5) = 3 (round-half-to-even may give 2, but Math.round(2.5) = 3 in JS)
    expect(state.widgets.find(w => w.id === 'w1')!.row).toBe(4);
    expect(state.widgets.find(w => w.id === 'w2')!.row).toBe(3);
    expect(state.widgets.find(w => w.id === 'w3')!.row).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

describe('distribution', () => {
  it('returns state unchanged if fewer than 3 widgets selected', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = addFreeformWidget(state, 'w2');
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2']);
    expect(distributeFreeformWidgets(state, 'horizontal')).toBe(state);
  });

  it('distributes horizontally', () => {
    let state = initialFreeformGridState();
    // Three widgets with colSpan=2 each, placed at cols 0, 4, 20
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 20, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w3', { col: 4, row: 0, colSpan: 2, rowSpan: 2 });
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2', 'w3']);
    state = distributeFreeformWidgets(state, 'horizontal');
    // sorted by col: w1(0), w3(4), w2(20)
    // totalSpan = (20+2)-0 = 22
    // widgetSpan = 2+2+2 = 6
    // gapTotal = 22-6 = 16
    // gapEach = 16/2 = 8
    // w1: col=0, w3: col=0+2+8=10, w2: col=10+2+8=20
    expect(state.widgets.find(w => w.id === 'w1')!.col).toBe(0);
    expect(state.widgets.find(w => w.id === 'w3')!.col).toBe(10);
    expect(state.widgets.find(w => w.id === 'w2')!.col).toBe(20);
  });

  it('distributes vertically', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 0, row: 18, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w3', { col: 0, row: 3, colSpan: 2, rowSpan: 2 });
    state = selectMultipleFreeformWidgets(state, ['w1', 'w2', 'w3']);
    state = distributeFreeformWidgets(state, 'vertical');
    // sorted by row: w1(0), w3(3), w2(18)
    // totalSpan = (18+2)-0 = 20
    // widgetSpan = 2+2+2 = 6
    // gapTotal = 20-6 = 14
    // gapEach = 14/2 = 7
    // w1: row=0, w3: row=0+2+7=9, w2: row=9+2+7=18
    expect(state.widgets.find(w => w.id === 'w1')!.row).toBe(0);
    expect(state.widgets.find(w => w.id === 'w3')!.row).toBe(9);
    expect(state.widgets.find(w => w.id === 'w2')!.row).toBe(18);
  });

  it('no-op with fewer than 3 selected', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1');
    state = selectFreeformWidget(state, 'w1');
    const result = distributeFreeformWidgets(state, 'horizontal');
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Zoom
// ---------------------------------------------------------------------------

describe('zoom', () => {
  it('sets zoom level', () => {
    const state = setFreeformZoom(initialFreeformGridState(), 1.5);
    expect(state.zoom).toBe(1.5);
  });

  it('clamps zoom to minimum 0.25', () => {
    const state = setFreeformZoom(initialFreeformGridState(), 0.1);
    expect(state.zoom).toBe(0.25);
  });

  it('clamps zoom to maximum 3.0', () => {
    const state = setFreeformZoom(initialFreeformGridState(), 5.0);
    expect(state.zoom).toBe(3.0);
  });

  it('accepts boundary values', () => {
    expect(setFreeformZoom(initialFreeformGridState(), 0.25).zoom).toBe(0.25);
    expect(setFreeformZoom(initialFreeformGridState(), 3.0).zoom).toBe(3.0);
  });
});

// ---------------------------------------------------------------------------
// findOpenPosition
// ---------------------------------------------------------------------------

describe('findOpenPosition', () => {
  it('returns (0,0) for empty grid', () => {
    const state = initialFreeformGridState();
    expect(findOpenPosition(state, 4, 2)).toEqual({ col: 0, row: 0 });
  });

  it('finds first gap in partially filled grid', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 4, rowSpan: 2 });
    const pos = findOpenPosition(state, 4, 2);
    // Should find position right after w1 (col 4, row 0)
    expect(pos.col).toBe(4);
    expect(pos.row).toBe(0);
  });

  it('wraps to next row when row is full', () => {
    let state = initialFreeformGridState({ columns: 8 });
    // Fill entire first row
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 4, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 4, row: 0, colSpan: 4, rowSpan: 2 });
    const pos = findOpenPosition(state, 4, 2);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// autoExpandRows
// ---------------------------------------------------------------------------

describe('autoExpandRows', () => {
  it('expands rows when widget exceeds grid', () => {
    let state = initialFreeformGridState({ rows: 10 });
    state = addFreeformWidget(state, 'w1', { col: 0, row: 9, colSpan: 2, rowSpan: 4 });
    state = autoExpandRows(state);
    // Widget extends to row 13 (9+4), so need 13+2=15 rows
    expect(state.grid.rows).toBe(15);
  });

  it('no-op when widgets fit within grid', () => {
    let state = initialFreeformGridState({ rows: 36 });
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    const result = autoExpandRows(state);
    expect(result).toBe(state);
  });

  it('no-op for empty grid', () => {
    const state = initialFreeformGridState();
    expect(autoExpandRows(state)).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// Collision detection & resolution
// ---------------------------------------------------------------------------

describe('detectCollisions', () => {
  it('detects overlapping widgets', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 3, rowSpan: 3 });
    state = addFreeformWidget(state, 'w2', { col: 2, row: 2, colSpan: 3, rowSpan: 3 });
    const collisions = detectCollisions(state, state.widgets[1]);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].id).toBe('w1');
  });

  it('no collisions when widgets are separate', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    state = addFreeformWidget(state, 'w2', { col: 5, row: 5, colSpan: 2, rowSpan: 2 });
    const collisions = detectCollisions(state, state.widgets[1]);
    expect(collisions).toHaveLength(0);
  });
});

describe('resolveCollisions', () => {
  it('pushes colliding widget down', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 4, rowSpan: 3 });
    state = addFreeformWidget(state, 'w2', { col: 2, row: 1, colSpan: 4, rowSpan: 3 });
    state = resolveCollisions(state, 'w1');
    const w2 = state.widgets.find(w => w.id === 'w2')!;
    // w2 should be pushed below w1 (row 0 + span 3 = row 3)
    expect(w2.row).toBe(3);
  });

  it('cascading collision resolution', () => {
    let state = initialFreeformGridState();
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 4, rowSpan: 3 });
    state = addFreeformWidget(state, 'w2', { col: 0, row: 1, colSpan: 4, rowSpan: 3 });
    state = addFreeformWidget(state, 'w3', { col: 0, row: 2, colSpan: 4, rowSpan: 3 });
    state = resolveCollisions(state, 'w1');
    const w2 = state.widgets.find(w => w.id === 'w2')!;
    const w3 = state.widgets.find(w => w.id === 'w3')!;
    // w2 pushed below w1 (row 3), w3 pushed below w2 (row 6)
    expect(w2.row).toBe(3);
    expect(w3.row).toBe(6);
  });

  it('does nothing for unknown widget', () => {
    const state = initialFreeformGridState();
    expect(resolveCollisions(state, 'unknown')).toBe(state);
  });

  it('auto-expands rows after resolving', () => {
    let state = initialFreeformGridState({ rows: 6 });
    state = addFreeformWidget(state, 'w1', { col: 0, row: 0, colSpan: 4, rowSpan: 3 });
    state = addFreeformWidget(state, 'w2', { col: 0, row: 1, colSpan: 4, rowSpan: 3 });
    state = resolveCollisions(state, 'w1');
    // w2 pushed to row 3, extends to row 6, so need 6+2=8 rows
    expect(state.grid.rows).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Coordinate converters
// ---------------------------------------------------------------------------

describe('coordinate converters', () => {
  it('pixelToGrid converts pixel to grid cell', () => {
    expect(pixelToGrid(0, 20, 4)).toBe(0);
    expect(pixelToGrid(24, 20, 4)).toBe(1); // 24 / 24 = 1
    expect(pixelToGrid(48, 20, 4)).toBe(2); // 48 / 24 = 2
    expect(pixelToGrid(36, 20, 4)).toBe(2); // 36 / 24 = 1.5 -> round = 2
  });

  it('gridToPixel converts grid cell to pixel', () => {
    expect(gridToPixel(0, 20, 4)).toBe(0);
    expect(gridToPixel(1, 20, 4)).toBe(24); // 1 * (20+4) = 24
    expect(gridToPixel(3, 20, 4)).toBe(72); // 3 * 24 = 72
  });

  it('roundtrip pixel -> grid -> pixel is close', () => {
    const cellSize = 20;
    const gap = 4;
    const px = 48;
    const cell = pixelToGrid(px, cellSize, gap);
    const back = gridToPixel(cell, cellSize, gap);
    expect(back).toBe(px);
  });
});

// ---------------------------------------------------------------------------
// CSS style generation
// ---------------------------------------------------------------------------

describe('CSS generation', () => {
  it('toCSSGridStyle generates correct styles', () => {
    const style = toCSSGridStyle({ columns: 48, rows: 36, gapPx: 4, cellSizePx: 20, snapToGrid: true });
    expect(style.display).toBe('grid');
    expect(style.gridTemplateColumns).toBe('repeat(48, 20px)');
    expect(style.gap).toBe('4px');
  });

  it('toWidgetStyle generates correct grid placement', () => {
    const style = toWidgetStyle({ id: 'w1', col: 2, row: 3, colSpan: 4, rowSpan: 2 });
    expect(style.gridColumn).toBe('3 / span 4');
    expect(style.gridRow).toBe('4 / span 2');
  });

  it('toWidgetStyle includes zIndex when present', () => {
    const style = toWidgetStyle({ id: 'w1', col: 0, row: 0, colSpan: 2, rowSpan: 2, zIndex: 5 });
    expect(style.zIndex).toBe('5');
  });

  it('toWidgetStyle omits zIndex when absent', () => {
    const style = toWidgetStyle({ id: 'w1', col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    expect(style.zIndex).toBeUndefined();
  });
});
