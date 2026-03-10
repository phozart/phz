/**
 * Canvas Toolbar State (Phase 4A) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  initialCanvasToolbarState,
  setCanvasToolbarZoom,
  setCanvasToolbarZoomPreset,
  toggleCanvasToolbarGridSnap,
  toggleCanvasToolbarGridDots,
  setCanvasToolbarMode,
  updateCanvasToolbarSelection,
  showCanvasAlignmentButtons,
  showCanvasDistributionButtons,
  canvasToolbarZoomIn,
  canvasToolbarZoomOut,
  canvasToolbarZoomReset,
  ZOOM_PRESETS,
} from '../authoring/canvas-toolbar-state.js';

describe('Canvas Toolbar State', () => {
  describe('initialCanvasToolbarState', () => {
    it('returns default state with zoom 1, gridSnap true, showGridDots true, freeform mode', () => {
      const state = initialCanvasToolbarState();
      expect(state.zoom).toBe(1);
      expect(state.gridSnap).toBe(true);
      expect(state.showGridDots).toBe(true);
      expect(state.canvasMode).toBe('freeform');
      expect(state.selectedCount).toBe(0);
    });
  });

  describe('setCanvasToolbarZoom', () => {
    it('sets zoom to given value', () => {
      const state = initialCanvasToolbarState();
      const next = setCanvasToolbarZoom(state, 1.5);
      expect(next.zoom).toBe(1.5);
    });

    it('clamps zoom above 3 to 3', () => {
      const state = initialCanvasToolbarState();
      const next = setCanvasToolbarZoom(state, 5);
      expect(next.zoom).toBe(3);
    });

    it('clamps zoom below 0.25 to 0.25', () => {
      const state = initialCanvasToolbarState();
      const next = setCanvasToolbarZoom(state, 0.1);
      expect(next.zoom).toBe(0.25);
    });
  });

  describe('setCanvasToolbarZoomPreset', () => {
    it('sets exact preset value', () => {
      const state = initialCanvasToolbarState();
      const next = setCanvasToolbarZoomPreset(state, 0.75);
      expect(next.zoom).toBe(0.75);
    });

    it('ZOOM_PRESETS contains expected values', () => {
      expect(ZOOM_PRESETS).toEqual([0.5, 0.75, 1, 1.5, 2]);
    });
  });

  describe('toggleCanvasToolbarGridSnap', () => {
    it('toggles gridSnap from true to false', () => {
      const state = initialCanvasToolbarState();
      const next = toggleCanvasToolbarGridSnap(state);
      expect(next.gridSnap).toBe(false);
    });

    it('toggles gridSnap from false to true', () => {
      const state = initialCanvasToolbarState();
      const toggled = toggleCanvasToolbarGridSnap(state);
      const next = toggleCanvasToolbarGridSnap(toggled);
      expect(next.gridSnap).toBe(true);
    });
  });

  describe('toggleCanvasToolbarGridDots', () => {
    it('toggles showGridDots from true to false', () => {
      const state = initialCanvasToolbarState();
      const next = toggleCanvasToolbarGridDots(state);
      expect(next.showGridDots).toBe(false);
    });

    it('toggles showGridDots from false to true', () => {
      const state = initialCanvasToolbarState();
      const toggled = toggleCanvasToolbarGridDots(state);
      const next = toggleCanvasToolbarGridDots(toggled);
      expect(next.showGridDots).toBe(true);
    });
  });

  describe('setCanvasToolbarMode', () => {
    it('switches to auto-grid', () => {
      const state = initialCanvasToolbarState();
      const next = setCanvasToolbarMode(state, 'auto-grid');
      expect(next.canvasMode).toBe('auto-grid');
    });

    it('switches to freeform', () => {
      const state = setCanvasToolbarMode(initialCanvasToolbarState(), 'auto-grid');
      const next = setCanvasToolbarMode(state, 'freeform');
      expect(next.canvasMode).toBe('freeform');
    });
  });

  describe('updateCanvasToolbarSelection', () => {
    it('updates selectedCount', () => {
      const state = initialCanvasToolbarState();
      const next = updateCanvasToolbarSelection(state, 5);
      expect(next.selectedCount).toBe(5);
    });
  });

  describe('showCanvasAlignmentButtons', () => {
    it('returns true when 2 or more widgets selected', () => {
      const state = updateCanvasToolbarSelection(initialCanvasToolbarState(), 2);
      expect(showCanvasAlignmentButtons(state)).toBe(true);
    });

    it('returns false when fewer than 2 widgets selected', () => {
      const state = updateCanvasToolbarSelection(initialCanvasToolbarState(), 1);
      expect(showCanvasAlignmentButtons(state)).toBe(false);
    });
  });

  describe('showCanvasDistributionButtons', () => {
    it('returns true when 3 or more widgets selected', () => {
      const state = updateCanvasToolbarSelection(initialCanvasToolbarState(), 3);
      expect(showCanvasDistributionButtons(state)).toBe(true);
    });

    it('returns false when fewer than 3 widgets selected', () => {
      const state = updateCanvasToolbarSelection(initialCanvasToolbarState(), 2);
      expect(showCanvasDistributionButtons(state)).toBe(false);
    });
  });

  describe('canvasToolbarZoomIn', () => {
    it('increases zoom by 0.25', () => {
      const state = initialCanvasToolbarState();
      const next = canvasToolbarZoomIn(state);
      expect(next.zoom).toBe(1.25);
    });

    it('caps at 3.0', () => {
      const state = setCanvasToolbarZoom(initialCanvasToolbarState(), 2.9);
      const next = canvasToolbarZoomIn(state);
      expect(next.zoom).toBe(3);
    });
  });

  describe('canvasToolbarZoomOut', () => {
    it('decreases zoom by 0.25', () => {
      const state = initialCanvasToolbarState();
      const next = canvasToolbarZoomOut(state);
      expect(next.zoom).toBe(0.75);
    });

    it('floors at 0.25', () => {
      const state = setCanvasToolbarZoom(initialCanvasToolbarState(), 0.3);
      const next = canvasToolbarZoomOut(state);
      expect(next.zoom).toBe(0.25);
    });
  });

  describe('canvasToolbarZoomReset', () => {
    it('resets zoom to 1', () => {
      const state = setCanvasToolbarZoom(initialCanvasToolbarState(), 2.5);
      const next = canvasToolbarZoomReset(state);
      expect(next.zoom).toBe(1);
    });
  });
});
