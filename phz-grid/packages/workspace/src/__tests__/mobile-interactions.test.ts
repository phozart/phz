/**
 * S.8 — Mobile Interaction Patterns tests
 */

import { describe, it, expect } from 'vitest';

describe('Mobile Interactions (S.8)', () => {
  describe('BottomSheetConfig', () => {
    it('returns default bottom sheet config', async () => {
      const { createBottomSheetConfig } = await import('../shell/mobile-interactions.js');
      const config = createBottomSheetConfig();
      expect(config.maxHeight).toBe('90vh');
      expect(config.dragHandle).toBe(true);
      expect(config.overscrollContain).toBe(true);
    });

    it('accepts custom overrides', async () => {
      const { createBottomSheetConfig } = await import('../shell/mobile-interactions.js');
      const config = createBottomSheetConfig({ maxHeight: '50vh', dragHandle: false });
      expect(config.maxHeight).toBe('50vh');
      expect(config.dragHandle).toBe(false);
    });
  });

  describe('getBottomSheetClasses()', () => {
    it('returns open classes when open', async () => {
      const { getBottomSheetClasses } = await import('../shell/mobile-interactions.js');
      const classes = getBottomSheetClasses(true);
      expect(classes.sheet).toContain('bottom-sheet--open');
      expect(classes.overlay).toContain('bottom-sheet-overlay--visible');
    });

    it('returns closed classes when closed', async () => {
      const { getBottomSheetClasses } = await import('../shell/mobile-interactions.js');
      const classes = getBottomSheetClasses(false);
      expect(classes.sheet).not.toContain('bottom-sheet--open');
    });
  });

  describe('detectSwipe()', () => {
    it('detects left swipe', async () => {
      const { detectSwipe } = await import('../shell/mobile-interactions.js');
      const result = detectSwipe(
        { x: 300, y: 200, time: 0 },
        { x: 100, y: 200, time: 100 },
      );
      expect(result).toBe('left');
    });

    it('detects right swipe', async () => {
      const { detectSwipe } = await import('../shell/mobile-interactions.js');
      const result = detectSwipe(
        { x: 100, y: 200, time: 0 },
        { x: 300, y: 200, time: 100 },
      );
      expect(result).toBe('right');
    });

    it('detects down swipe', async () => {
      const { detectSwipe } = await import('../shell/mobile-interactions.js');
      const result = detectSwipe(
        { x: 200, y: 100, time: 0 },
        { x: 200, y: 300, time: 100 },
      );
      expect(result).toBe('down');
    });

    it('returns null for insufficient distance', async () => {
      const { detectSwipe } = await import('../shell/mobile-interactions.js');
      const result = detectSwipe(
        { x: 200, y: 200, time: 0 },
        { x: 210, y: 200, time: 100 },
      );
      expect(result).toBeNull();
    });

    it('respects custom threshold', async () => {
      const { detectSwipe } = await import('../shell/mobile-interactions.js');
      const result = detectSwipe(
        { x: 200, y: 200, time: 0 },
        { x: 250, y: 200, time: 100 },
        { minDistance: 100 },
      );
      expect(result).toBeNull();
    });
  });

  describe('getMobileDashboardLayout()', () => {
    it('returns single column for mobile', async () => {
      const { getMobileDashboardLayout } = await import('../shell/mobile-interactions.js');
      const layout = getMobileDashboardLayout();
      expect(layout.columns).toBe(1);
      expect(layout.filterCollapsed).toBe(true);
    });
  });

  describe('getFloatingActionBarClasses()', () => {
    it('returns visible class when items selected', async () => {
      const { getFloatingActionBarClasses } = await import('../shell/mobile-interactions.js');
      const classes = getFloatingActionBarClasses(3);
      expect(classes).toContain('fab--visible');
    });

    it('returns hidden class when no items selected', async () => {
      const { getFloatingActionBarClasses } = await import('../shell/mobile-interactions.js');
      const classes = getFloatingActionBarClasses(0);
      expect(classes).not.toContain('fab--visible');
    });
  });

  describe('getTapToPlaceConfig()', () => {
    it('returns tap-to-place config for mobile dashboard', async () => {
      const { getTapToPlaceConfig } = await import('../shell/mobile-interactions.js');
      const config = getTapToPlaceConfig();
      expect(config.mode).toBe('tap');
      expect(config.insertPosition).toBe('end');
    });
  });
});
