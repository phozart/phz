import { describe, it, expect } from 'vitest';
import type { WidgetPlacement } from '../authoring/freeform-grid-state.js';
import {
  initialCanvasInteractionState,
  enterCanvasDragMode,
  enterCanvasResizeMode,
  enterCanvasSelectMode,
  enterCanvasPanMode,
  exitCanvasInteraction,
  updateCanvasGhost,
  computeCanvasSnapGuides,
  setCanvasSnapGuides,
  updateCanvasSelectionRect,
  getWidgetsInCanvasSelectionRect,
  toggleCanvasGridDots,
  setCanvasGridDots,
} from '../authoring/canvas-interaction-state.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWidget(overrides: Partial<WidgetPlacement> & { id: string }): WidgetPlacement {
  return {
    col: 0,
    row: 0,
    colSpan: 2,
    rowSpan: 2,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialCanvasInteractionState', () => {
  it('creates idle state with grid dots visible', () => {
    const s = initialCanvasInteractionState();
    expect(s.mode).toBe('idle');
    expect(s.showGridDots).toBe(true);
  });

  it('has no snap guides, selection rect, or ghost', () => {
    const s = initialCanvasInteractionState();
    expect(s.snapGuides).toEqual([]);
    expect(s.selectionRect).toBeUndefined();
    expect(s.ghostPlacement).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Mode transitions
// ---------------------------------------------------------------------------

describe('mode transitions', () => {
  const ghost = makeWidget({ id: 'g1', col: 5, row: 5 });

  it('enterCanvasDragMode sets mode and ghost', () => {
    const s = enterCanvasDragMode(initialCanvasInteractionState(), ghost);
    expect(s.mode).toBe('dragging');
    expect(s.ghostPlacement).toEqual(ghost);
  });

  it('enterCanvasResizeMode sets mode and ghost', () => {
    const s = enterCanvasResizeMode(initialCanvasInteractionState(), ghost);
    expect(s.mode).toBe('resizing');
    expect(s.ghostPlacement).toEqual(ghost);
  });

  it('enterCanvasSelectMode sets mode and selection rect', () => {
    const s = enterCanvasSelectMode(initialCanvasInteractionState(), 3, 7);
    expect(s.mode).toBe('selecting-area');
    expect(s.selectionRect).toEqual({ startCol: 3, startRow: 7, endCol: 3, endRow: 7 });
  });

  it('enterCanvasPanMode sets mode', () => {
    const s = enterCanvasPanMode(initialCanvasInteractionState());
    expect(s.mode).toBe('panning');
  });

  it('exitCanvasInteraction resets everything to idle', () => {
    let s = enterCanvasDragMode(initialCanvasInteractionState(), ghost);
    s = exitCanvasInteraction(s);
    expect(s.mode).toBe('idle');
    expect(s.ghostPlacement).toBeUndefined();
    expect(s.selectionRect).toBeUndefined();
  });

  it('exitCanvasInteraction clears snap guides', () => {
    let s = initialCanvasInteractionState();
    s = setCanvasSnapGuides(s, [{ axis: 'vertical', position: 10 }]);
    expect(s.snapGuides).toHaveLength(1);
    s = exitCanvasInteraction(s);
    expect(s.snapGuides).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Ghost placement
// ---------------------------------------------------------------------------

describe('updateCanvasGhost', () => {
  const ghost1 = makeWidget({ id: 'g1', col: 1, row: 1 });
  const ghost2 = makeWidget({ id: 'g1', col: 5, row: 5 });

  it('updates ghost during drag', () => {
    let s = enterCanvasDragMode(initialCanvasInteractionState(), ghost1);
    s = updateCanvasGhost(s, ghost2);
    expect(s.ghostPlacement).toEqual(ghost2);
  });

  it('updates ghost during resize', () => {
    let s = enterCanvasResizeMode(initialCanvasInteractionState(), ghost1);
    s = updateCanvasGhost(s, ghost2);
    expect(s.ghostPlacement).toEqual(ghost2);
  });

  it('is no-op in idle mode', () => {
    const s = initialCanvasInteractionState();
    const result = updateCanvasGhost(s, ghost2);
    expect(result).toBe(s); // same reference — no change
  });
});

// ---------------------------------------------------------------------------
// Snap guides
// ---------------------------------------------------------------------------

describe('computeCanvasSnapGuides', () => {
  it('finds left-edge alignment', () => {
    const widgets = [makeWidget({ id: 'a', col: 5, row: 0 })];
    const moving = makeWidget({ id: 'b', col: 5, row: 4 });
    const guides = computeCanvasSnapGuides(widgets, moving);
    expect(guides).toContainEqual({ axis: 'vertical', position: 5 });
  });

  it('finds right-edge alignment', () => {
    const widgets = [makeWidget({ id: 'a', col: 3, row: 0, colSpan: 4 })];
    const moving = makeWidget({ id: 'b', col: 5, row: 4, colSpan: 2 });
    // a right = 7, b right = 7
    const guides = computeCanvasSnapGuides(widgets, moving);
    expect(guides).toContainEqual({ axis: 'vertical', position: 7 });
  });

  it('finds top alignment', () => {
    const widgets = [makeWidget({ id: 'a', col: 0, row: 3 })];
    const moving = makeWidget({ id: 'b', col: 8, row: 3 });
    const guides = computeCanvasSnapGuides(widgets, moving);
    expect(guides).toContainEqual({ axis: 'horizontal', position: 3 });
  });

  it('finds center alignment', () => {
    // Widget a: col=4, colSpan=4 → center=6
    // Widget b: col=5, colSpan=2 → center=6
    const widgets = [makeWidget({ id: 'a', col: 4, row: 0, colSpan: 4 })];
    const moving = makeWidget({ id: 'b', col: 5, row: 4, colSpan: 2 });
    const guides = computeCanvasSnapGuides(widgets, moving);
    expect(guides).toContainEqual({ axis: 'vertical', position: 6 });
  });

  it('deduplicates guides', () => {
    // Two widgets at same col=5 — should produce single vertical guide at 5
    const widgets = [
      makeWidget({ id: 'a', col: 5, row: 0 }),
      makeWidget({ id: 'c', col: 5, row: 6 }),
    ];
    const moving = makeWidget({ id: 'b', col: 5, row: 3 });
    const guides = computeCanvasSnapGuides(widgets, moving);
    const verticalAt5 = guides.filter(g => g.axis === 'vertical' && g.position === 5);
    expect(verticalAt5).toHaveLength(1);
  });

  it('excludes self from guide computation', () => {
    const widgets = [makeWidget({ id: 'a', col: 5, row: 0 })];
    const moving = makeWidget({ id: 'a', col: 5, row: 0 });
    const guides = computeCanvasSnapGuides(widgets, moving);
    expect(guides).toHaveLength(0);
  });

  it('setCanvasSnapGuides updates state', () => {
    const s = initialCanvasInteractionState();
    const guides = [
      { axis: 'vertical' as const, position: 10 },
      { axis: 'horizontal' as const, position: 20 },
    ];
    const result = setCanvasSnapGuides(s, guides);
    expect(result.snapGuides).toEqual(guides);
  });
});

// ---------------------------------------------------------------------------
// Selection rectangle
// ---------------------------------------------------------------------------

describe('selection rectangle', () => {
  it('updateCanvasSelectionRect updates end coordinates', () => {
    let s = enterCanvasSelectMode(initialCanvasInteractionState(), 2, 3);
    s = updateCanvasSelectionRect(s, 8, 10);
    expect(s.selectionRect).toEqual({ startCol: 2, startRow: 3, endCol: 8, endRow: 10 });
  });

  it('updateCanvasSelectionRect is no-op in idle', () => {
    const s = initialCanvasInteractionState();
    const result = updateCanvasSelectionRect(s, 5, 5);
    expect(result).toBe(s);
  });

  it('getWidgetsInCanvasSelectionRect finds overlapping widgets', () => {
    const widgets = [
      makeWidget({ id: 'a', col: 1, row: 1, colSpan: 2, rowSpan: 2 }),
      makeWidget({ id: 'b', col: 5, row: 5, colSpan: 2, rowSpan: 2 }),
      makeWidget({ id: 'c', col: 10, row: 10, colSpan: 2, rowSpan: 2 }),
    ];
    const rect = { startCol: 0, startRow: 0, endCol: 6, endRow: 6 };
    const ids = getWidgetsInCanvasSelectionRect(widgets, rect);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).not.toContain('c');
  });

  it('getWidgetsInCanvasSelectionRect handles negative-direction selection', () => {
    const widgets = [
      makeWidget({ id: 'a', col: 2, row: 2, colSpan: 2, rowSpan: 2 }),
    ];
    // endCol < startCol, endRow < startRow
    const rect = { startCol: 6, startRow: 6, endCol: 1, endRow: 1 };
    const ids = getWidgetsInCanvasSelectionRect(widgets, rect);
    expect(ids).toContain('a');
  });
});

// ---------------------------------------------------------------------------
// Grid dots
// ---------------------------------------------------------------------------

describe('grid dots', () => {
  it('initial state has grid dots on', () => {
    expect(initialCanvasInteractionState().showGridDots).toBe(true);
  });

  it('toggleCanvasGridDots toggles value', () => {
    let s = initialCanvasInteractionState();
    s = toggleCanvasGridDots(s);
    expect(s.showGridDots).toBe(false);
    s = toggleCanvasGridDots(s);
    expect(s.showGridDots).toBe(true);
  });

  it('setCanvasGridDots sets explicit value', () => {
    const s = initialCanvasInteractionState();
    expect(setCanvasGridDots(s, false).showGridDots).toBe(false);
    expect(setCanvasGridDots(s, true).showGridDots).toBe(true);
  });
});
