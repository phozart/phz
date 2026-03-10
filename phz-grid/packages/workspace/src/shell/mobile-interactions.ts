/**
 * S.8 — Mobile Interaction Patterns
 *
 * Pure functions for bottom sheet, swipe detection, tap-to-place,
 * mobile dashboard layout, and floating action bar.
 */

// ========================================================================
// Bottom Sheet
// ========================================================================

export interface BottomSheetConfig {
  maxHeight: string;
  dragHandle: boolean;
  overscrollContain: boolean;
}

export function createBottomSheetConfig(overrides?: Partial<BottomSheetConfig>): BottomSheetConfig {
  return {
    maxHeight: '90vh',
    dragHandle: true,
    overscrollContain: true,
    ...overrides,
  };
}

export interface BottomSheetClasses {
  sheet: string;
  overlay: string;
  handle: string;
}

export function getBottomSheetClasses(open: boolean): BottomSheetClasses {
  return {
    sheet: open ? 'bottom-sheet bottom-sheet--open' : 'bottom-sheet',
    overlay: open ? 'bottom-sheet-overlay bottom-sheet-overlay--visible' : 'bottom-sheet-overlay',
    handle: 'bottom-sheet-handle',
  };
}

// ========================================================================
// Swipe Detection
// ========================================================================

export interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export interface SwipeOptions {
  minDistance?: number;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const DEFAULT_MIN_DISTANCE = 50;

export function detectSwipe(
  start: TouchPoint,
  end: TouchPoint,
  options?: SwipeOptions,
): SwipeDirection | null {
  const minDistance = options?.minDistance ?? DEFAULT_MIN_DISTANCE;
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < minDistance && absDy < minDistance) {
    return null;
  }

  if (absDx >= absDy) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

// ========================================================================
// Mobile Dashboard Layout
// ========================================================================

export interface MobileDashboardLayout {
  columns: number;
  filterCollapsed: boolean;
  singleColumn: boolean;
}

export function getMobileDashboardLayout(): MobileDashboardLayout {
  return {
    columns: 1,
    filterCollapsed: true,
    singleColumn: true,
  };
}

// ========================================================================
// Floating Action Bar
// ========================================================================

export function getFloatingActionBarClasses(selectedCount: number): string {
  return selectedCount > 0 ? 'fab fab--visible' : 'fab';
}

// ========================================================================
// Tap-to-Place (Mobile Dashboard Builder)
// ========================================================================

export interface TapToPlaceConfig {
  mode: 'tap' | 'drag';
  insertPosition: 'end' | 'after-selected';
}

export function getTapToPlaceConfig(): TapToPlaceConfig {
  return {
    mode: 'tap',
    insertPosition: 'end',
  };
}
