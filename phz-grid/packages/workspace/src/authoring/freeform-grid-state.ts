/**
 * @phozart/workspace — Freeform Grid Dashboard State (B-3.04)
 *
 * Pure functions for CSS Grid-based freeform layout in the dashboard editor.
 * Supports snap-to-grid positioning, widget resize handles, drag operations,
 * z-ordering, multi-select, alignment, distribution, zoom, collision resolution,
 * and grid gap / column count configuration.
 */

// ========================================================================
// Types
// ========================================================================

export interface FreeformGridConfig {
  columns: number;
  rows: number;
  gapPx: number;
  cellSizePx: number;
  snapToGrid: boolean;
}

export interface WidgetPlacement {
  id: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  zIndex?: number;
  locked?: boolean;
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeOperation {
  widgetId: string;
  handle: ResizeHandle;
  startPlacement: WidgetPlacement;
  currentPlacement: WidgetPlacement;
}

export interface DragOperation {
  widgetId: string;
  startPlacement: WidgetPlacement;
  currentPlacement: WidgetPlacement;
}

export interface FreeformGridState {
  grid: FreeformGridConfig;
  widgets: WidgetPlacement[];
  selectedWidgetIds: string[];
  resizing?: ResizeOperation;
  dragOperation?: DragOperation;
  zoom: number;
}

// ========================================================================
// Defaults
// ========================================================================

const DEFAULT_GRID: FreeformGridConfig = {
  columns: 48,
  rows: 36,
  gapPx: 4,
  cellSizePx: 20,
  snapToGrid: true,
};

// ========================================================================
// Factory
// ========================================================================

export function initialFreeformGridState(
  gridOverrides?: Partial<FreeformGridConfig>,
): FreeformGridState {
  return {
    grid: { ...DEFAULT_GRID, ...gridOverrides },
    widgets: [],
    selectedWidgetIds: [],
    zoom: 1.0,
  };
}

// ========================================================================
// Grid configuration
// ========================================================================

export function setGridColumns(
  state: FreeformGridState,
  columns: number,
): FreeformGridState {
  if (columns < 1 || columns > 96) return state;
  return { ...state, grid: { ...state.grid, columns } };
}

export function setGridRows(
  state: FreeformGridState,
  rows: number,
): FreeformGridState {
  if (rows < 1 || rows > 100) return state;
  return { ...state, grid: { ...state.grid, rows } };
}

export function setGridGap(
  state: FreeformGridState,
  gapPx: number,
): FreeformGridState {
  if (gapPx < 0 || gapPx > 64) return state;
  return { ...state, grid: { ...state.grid, gapPx } };
}

export function setGridCellSize(
  state: FreeformGridState,
  cellSizePx: number,
): FreeformGridState {
  if (cellSizePx < 4 || cellSizePx > 200) return state;
  return { ...state, grid: { ...state.grid, cellSizePx } };
}

export function toggleSnapToGrid(state: FreeformGridState): FreeformGridState {
  return { ...state, grid: { ...state.grid, snapToGrid: !state.grid.snapToGrid } };
}

// ========================================================================
// Snap-to-grid
// ========================================================================

export function snapToGrid(
  value: number,
  cellSize: number,
  gap: number,
): number {
  if (cellSize <= 0) return value;
  const step = cellSize + gap;
  return Math.round(value / step);
}

export function snapPlacement(
  placement: WidgetPlacement,
  grid: FreeformGridConfig,
): WidgetPlacement {
  if (!grid.snapToGrid) return placement;
  return {
    ...placement,
    col: Math.max(0, Math.min(placement.col, grid.columns - 1)),
    row: Math.max(0, placement.row),
    colSpan: Math.max(1, Math.min(placement.colSpan, grid.columns - placement.col)),
    rowSpan: Math.max(1, placement.rowSpan),
  };
}

// ========================================================================
// Widget placement
// ========================================================================

export function addFreeformWidget(
  state: FreeformGridState,
  id: string,
  placement?: Partial<WidgetPlacement>,
): FreeformGridState {
  if (state.widgets.some(w => w.id === id)) return state;

  const base: WidgetPlacement = {
    id,
    col: placement?.col ?? 0,
    row: placement?.row ?? 0,
    colSpan: placement?.colSpan ?? 2,
    rowSpan: placement?.rowSpan ?? 2,
  };
  if (placement?.zIndex !== undefined) {
    base.zIndex = placement.zIndex;
  }
  if (placement?.locked !== undefined) {
    base.locked = placement.locked;
  }

  const widget = snapPlacement(base, state.grid);

  return { ...state, widgets: [...state.widgets, widget] };
}

export function removeFreeformWidget(
  state: FreeformGridState,
  id: string,
): FreeformGridState {
  return {
    ...state,
    widgets: state.widgets.filter(w => w.id !== id),
    selectedWidgetIds: state.selectedWidgetIds.filter(sid => sid !== id),
  };
}

export function moveFreeformWidget(
  state: FreeformGridState,
  id: string,
  col: number,
  row: number,
): FreeformGridState {
  const widget = state.widgets.find(w => w.id === id);
  if (!widget) return state;
  if (widget.locked) return state;

  const snapped = snapPlacement(
    { ...widget, col, row },
    state.grid,
  );

  return {
    ...state,
    widgets: state.widgets.map(w => (w.id === id ? snapped : w)),
  };
}

// ========================================================================
// Selection
// ========================================================================

export function selectFreeformWidget(
  state: FreeformGridState,
  id: string,
): FreeformGridState {
  return { ...state, selectedWidgetIds: [id] };
}

export function deselectFreeformWidget(
  state: FreeformGridState,
): FreeformGridState {
  return { ...state, selectedWidgetIds: [] };
}

export function selectMultipleFreeformWidgets(
  state: FreeformGridState,
  widgetIds: string[],
): FreeformGridState {
  return { ...state, selectedWidgetIds: widgetIds };
}

export function toggleFreeformWidgetSelection(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  const idx = state.selectedWidgetIds.indexOf(widgetId);
  if (idx >= 0) {
    return {
      ...state,
      selectedWidgetIds: state.selectedWidgetIds.filter(id => id !== widgetId),
    };
  }
  return { ...state, selectedWidgetIds: [...state.selectedWidgetIds, widgetId] };
}

// ========================================================================
// Drag lifecycle
// ========================================================================

export function startFreeformDrag(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;
  if (widget.locked) return state;

  return {
    ...state,
    dragOperation: {
      widgetId,
      startPlacement: { ...widget },
      currentPlacement: { ...widget },
    },
  };
}

export function updateFreeformDrag(
  state: FreeformGridState,
  deltaCol: number,
  deltaRow: number,
): FreeformGridState {
  if (!state.dragOperation) return state;

  const { startPlacement } = state.dragOperation;
  const currentPlacement = snapPlacement(
    {
      ...startPlacement,
      col: startPlacement.col + deltaCol,
      row: startPlacement.row + deltaRow,
    },
    state.grid,
  );

  return {
    ...state,
    dragOperation: { ...state.dragOperation, currentPlacement },
  };
}

export function commitFreeformDrag(state: FreeformGridState): FreeformGridState {
  if (!state.dragOperation) return state;

  const { widgetId, currentPlacement } = state.dragOperation;

  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? currentPlacement : w,
    ),
    dragOperation: undefined,
  };
}

export function cancelFreeformDrag(state: FreeformGridState): FreeformGridState {
  if (!state.dragOperation) return state;
  return { ...state, dragOperation: undefined };
}

// ========================================================================
// Resize
// ========================================================================

export function startResize(
  state: FreeformGridState,
  widgetId: string,
  handle: ResizeHandle,
): FreeformGridState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;

  return {
    ...state,
    resizing: {
      widgetId,
      handle,
      startPlacement: { ...widget },
      currentPlacement: { ...widget },
    },
  };
}

export function updateResize(
  state: FreeformGridState,
  deltaCol: number,
  deltaRow: number,
): FreeformGridState {
  if (!state.resizing) return state;

  const { handle, startPlacement } = state.resizing;
  let { col, row, colSpan, rowSpan } = startPlacement;

  // Apply deltas based on handle direction
  if (handle.includes('e')) {
    colSpan = Math.max(1, colSpan + deltaCol);
  }
  if (handle.includes('w')) {
    const newCol = col + deltaCol;
    const newSpan = colSpan - deltaCol;
    if (newSpan >= 1 && newCol >= 0) {
      col = newCol;
      colSpan = newSpan;
    }
  }
  if (handle.includes('s')) {
    rowSpan = Math.max(1, rowSpan + deltaRow);
  }
  if (handle.includes('n')) {
    const newRow = row + deltaRow;
    const newSpan = rowSpan - deltaRow;
    if (newSpan >= 1 && newRow >= 0) {
      row = newRow;
      rowSpan = newSpan;
    }
  }

  const currentPlacement = snapPlacement(
    { id: state.resizing.widgetId, col, row, colSpan, rowSpan },
    state.grid,
  );

  return {
    ...state,
    resizing: { ...state.resizing, currentPlacement },
  };
}

export function commitResize(state: FreeformGridState): FreeformGridState {
  if (!state.resizing) return state;

  const { widgetId, currentPlacement } = state.resizing;

  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? currentPlacement : w,
    ),
    resizing: undefined,
  };
}

export function cancelResize(state: FreeformGridState): FreeformGridState {
  return { ...state, resizing: undefined };
}

// ========================================================================
// Z-ordering
// ========================================================================

export function bringToFront(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;

  const maxZ = Math.max(0, ...state.widgets.map(w => w.zIndex ?? 0));
  const newZ = maxZ + 1;

  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, zIndex: newZ } : w,
    ),
  };
}

export function sendToBack(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  const widget = state.widgets.find(w => w.id === widgetId);
  if (!widget) return state;

  const minZ = Math.min(0, ...state.widgets.map(w => w.zIndex ?? 0));
  const newZ = Math.max(0, minZ - 1);

  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, zIndex: newZ } : w,
    ),
  };
}

// ========================================================================
// Lock / unlock
// ========================================================================

export function lockFreeformWidget(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, locked: true } : w,
    ),
  };
}

export function unlockFreeformWidget(
  state: FreeformGridState,
  widgetId: string,
): FreeformGridState {
  return {
    ...state,
    widgets: state.widgets.map(w =>
      w.id === widgetId ? { ...w, locked: false } : w,
    ),
  };
}

// ========================================================================
// Alignment (operates on selectedWidgetIds)
// ========================================================================

export function alignFreeformWidgets(
  state: FreeformGridState,
  alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v',
): FreeformGridState {
  if (state.selectedWidgetIds.length < 2) return state;

  const selected = state.widgets.filter(w => state.selectedWidgetIds.includes(w.id));
  if (selected.length < 2) return state;

  let updater: (w: WidgetPlacement) => WidgetPlacement;

  switch (alignment) {
    case 'left': {
      const minCol = Math.min(...selected.map(w => w.col));
      updater = w => ({ ...w, col: minCol });
      break;
    }
    case 'right': {
      const maxRight = Math.max(...selected.map(w => w.col + w.colSpan));
      updater = w => ({ ...w, col: maxRight - w.colSpan });
      break;
    }
    case 'top': {
      const minRow = Math.min(...selected.map(w => w.row));
      updater = w => ({ ...w, row: minRow });
      break;
    }
    case 'bottom': {
      const maxBottom = Math.max(...selected.map(w => w.row + w.rowSpan));
      updater = w => ({ ...w, row: maxBottom - w.rowSpan });
      break;
    }
    case 'center-h': {
      const avgCenter = selected.reduce((sum, w) => sum + w.col + w.colSpan / 2, 0) / selected.length;
      updater = w => ({ ...w, col: Math.round(avgCenter - w.colSpan / 2) });
      break;
    }
    case 'center-v': {
      const avgCenter = selected.reduce((sum, w) => sum + w.row + w.rowSpan / 2, 0) / selected.length;
      updater = w => ({ ...w, row: Math.round(avgCenter - w.rowSpan / 2) });
      break;
    }
  }

  const selectedIds = new Set(state.selectedWidgetIds);
  return {
    ...state,
    widgets: state.widgets.map(w =>
      selectedIds.has(w.id) ? updater(w) : w,
    ),
  };
}

// ========================================================================
// Distribution
// ========================================================================

export function distributeFreeformWidgets(
  state: FreeformGridState,
  direction: 'horizontal' | 'vertical',
): FreeformGridState {
  if (state.selectedWidgetIds.length < 3) return state;

  const selected = state.widgets.filter(w => state.selectedWidgetIds.includes(w.id));
  if (selected.length < 3) return state;

  const selectedIds = new Set(state.selectedWidgetIds);

  if (direction === 'horizontal') {
    const sorted = [...selected].sort((a, b) => a.col - b.col);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.col + last.colSpan) - first.col;
    const widgetSpan = sorted.reduce((sum, w) => sum + w.colSpan, 0);
    const gapTotal = totalSpan - widgetSpan;
    const gapEach = gapTotal / (sorted.length - 1);

    let currentCol = first.col;
    const updates = new Map<string, number>();
    for (const w of sorted) {
      updates.set(w.id, Math.round(currentCol));
      currentCol += w.colSpan + gapEach;
    }

    return {
      ...state,
      widgets: state.widgets.map(w =>
        selectedIds.has(w.id) && updates.has(w.id)
          ? { ...w, col: updates.get(w.id)! }
          : w,
      ),
    };
  } else {
    const sorted = [...selected].sort((a, b) => a.row - b.row);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.row + last.rowSpan) - first.row;
    const widgetSpan = sorted.reduce((sum, w) => sum + w.rowSpan, 0);
    const gapTotal = totalSpan - widgetSpan;
    const gapEach = gapTotal / (sorted.length - 1);

    let currentRow = first.row;
    const updates = new Map<string, number>();
    for (const w of sorted) {
      updates.set(w.id, Math.round(currentRow));
      currentRow += w.rowSpan + gapEach;
    }

    return {
      ...state,
      widgets: state.widgets.map(w =>
        selectedIds.has(w.id) && updates.has(w.id)
          ? { ...w, row: updates.get(w.id)! }
          : w,
      ),
    };
  }
}

// ========================================================================
// Zoom
// ========================================================================

export function setFreeformZoom(
  state: FreeformGridState,
  zoom: number,
): FreeformGridState {
  const clamped = Math.max(0.25, Math.min(3.0, zoom));
  return { ...state, zoom: clamped };
}

// ========================================================================
// Smart placement
// ========================================================================

export function findOpenPosition(
  state: FreeformGridState,
  colSpan: number,
  rowSpan: number,
): { col: number; row: number } {
  if (state.widgets.length === 0) {
    return { col: 0, row: 0 };
  }

  // Determine scan bounds: we need to scan beyond existing rows
  const maxRow = Math.max(
    state.grid.rows,
    ...state.widgets.map(w => w.row + w.rowSpan),
  ) + rowSpan;

  for (let row = 0; row < maxRow; row++) {
    for (let col = 0; col <= state.grid.columns - colSpan; col++) {
      const candidate: WidgetPlacement = { id: '__probe__', col, row, colSpan, rowSpan };
      const collisions = state.widgets.filter(w => {
        const noOverlap =
          w.col >= candidate.col + candidate.colSpan ||
          w.col + w.colSpan <= candidate.col ||
          w.row >= candidate.row + candidate.rowSpan ||
          w.row + w.rowSpan <= candidate.row;
        return !noOverlap;
      });
      if (collisions.length === 0) {
        return { col, row };
      }
    }
  }

  // Fallback: place below everything
  const belowAll = Math.max(0, ...state.widgets.map(w => w.row + w.rowSpan));
  return { col: 0, row: belowAll };
}

// ========================================================================
// Auto-expand rows
// ========================================================================

export function autoExpandRows(state: FreeformGridState): FreeformGridState {
  if (state.widgets.length === 0) return state;

  const maxBottom = Math.max(...state.widgets.map(w => w.row + w.rowSpan));
  const needed = maxBottom + 2;

  if (needed <= state.grid.rows) return state;

  return { ...state, grid: { ...state.grid, rows: needed } };
}

// ========================================================================
// Collision resolution
// ========================================================================

export function detectCollisions(
  state: FreeformGridState,
  target: WidgetPlacement,
): WidgetPlacement[] {
  return state.widgets.filter(w => {
    if (w.id === target.id) return false;

    const noOverlap =
      w.col >= target.col + target.colSpan ||
      w.col + w.colSpan <= target.col ||
      w.row >= target.row + target.rowSpan ||
      w.row + w.rowSpan <= target.row;

    return !noOverlap;
  });
}

export function resolveCollisions(
  state: FreeformGridState,
  movedWidgetId: string,
): FreeformGridState {
  const moved = state.widgets.find(w => w.id === movedWidgetId);
  if (!moved) return state;

  let widgets = [...state.widgets];
  const processed = new Set<string>();
  const queue = [movedWidgetId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (processed.has(currentId)) continue;
    processed.add(currentId);

    const current = widgets.find(w => w.id === currentId)!;
    if (!current) continue;

    for (let i = 0; i < widgets.length; i++) {
      const other = widgets[i];
      if (other.id === currentId) continue;
      if (processed.has(other.id)) continue;

      const noOverlap =
        other.col >= current.col + current.colSpan ||
        other.col + other.colSpan <= current.col ||
        other.row >= current.row + current.rowSpan ||
        other.row + other.rowSpan <= current.row;

      if (!noOverlap) {
        // Push down
        const newRow = current.row + current.rowSpan;
        widgets = widgets.map(w =>
          w.id === other.id ? { ...w, row: newRow } : w,
        );
        queue.push(other.id);
      }
    }
  }

  let result: FreeformGridState = { ...state, widgets };
  result = autoExpandRows(result);
  return result;
}

// ========================================================================
// Coordinate converters
// ========================================================================

export function pixelToGrid(px: number, cellSize: number, gap: number): number {
  return Math.round(px / (cellSize + gap));
}

export function gridToPixel(cell: number, cellSize: number, gap: number): number {
  return cell * (cellSize + gap);
}

// ========================================================================
// CSS Grid style generation
// ========================================================================

export function toCSSGridStyle(grid: FreeformGridConfig): Record<string, string> {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${grid.columns}, ${grid.cellSizePx}px)`,
    gridAutoRows: `${grid.cellSizePx}px`,
    gap: `${grid.gapPx}px`,
  };
}

export function toWidgetStyle(widget: WidgetPlacement): Record<string, string> {
  const style: Record<string, string> = {
    gridColumn: `${widget.col + 1} / span ${widget.colSpan}`,
    gridRow: `${widget.row + 1} / span ${widget.rowSpan}`,
  };
  if (widget.zIndex !== undefined) {
    style.zIndex = String(widget.zIndex);
  }
  return style;
}
