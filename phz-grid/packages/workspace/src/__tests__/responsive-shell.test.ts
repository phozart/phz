/**
 * S.2 — Responsive Viewport Breakpoints tests
 */

import { describe, it, expect } from 'vitest';

describe('Responsive Shell (S.2)', () => {
  describe('getViewportBreakpoint()', () => {
    it('returns "desktop" for widths > 1280', async () => {
      const { getViewportBreakpoint } = await import('../styles/responsive.js');
      expect(getViewportBreakpoint(1440)).toBe('desktop');
      expect(getViewportBreakpoint(1281)).toBe('desktop');
    });

    it('returns "laptop" for widths 1024-1280', async () => {
      const { getViewportBreakpoint } = await import('../styles/responsive.js');
      expect(getViewportBreakpoint(1280)).toBe('laptop');
      expect(getViewportBreakpoint(1024)).toBe('laptop');
    });

    it('returns "tablet" for widths 768-1023', async () => {
      const { getViewportBreakpoint } = await import('../styles/responsive.js');
      expect(getViewportBreakpoint(1023)).toBe('tablet');
      expect(getViewportBreakpoint(768)).toBe('tablet');
    });

    it('returns "mobile" for widths < 768', async () => {
      const { getViewportBreakpoint } = await import('../styles/responsive.js');
      expect(getViewportBreakpoint(767)).toBe('mobile');
      expect(getViewportBreakpoint(320)).toBe('mobile');
    });
  });

  describe('getBreakpointClasses()', () => {
    it('returns full layout classes for desktop', async () => {
      const { getBreakpointClasses } = await import('../styles/responsive.js');
      const classes = getBreakpointClasses('desktop');
      expect(classes.sidebar).toBe('sidebar--full');
      expect(classes.header).toBe('header--full');
      expect(classes.content).toBe('content--full');
      expect(classes.bottomBar).toBeUndefined();
    });

    it('returns icon-only sidebar for laptop', async () => {
      const { getBreakpointClasses } = await import('../styles/responsive.js');
      const classes = getBreakpointClasses('laptop');
      expect(classes.sidebar).toBe('sidebar--icon-only');
    });

    it('returns overlay sidebar for tablet', async () => {
      const { getBreakpointClasses } = await import('../styles/responsive.js');
      const classes = getBreakpointClasses('tablet');
      expect(classes.sidebar).toBe('sidebar--overlay');
      expect(classes.hamburger).toBe('hamburger--visible');
    });

    it('returns no sidebar and bottom bar for mobile', async () => {
      const { getBreakpointClasses } = await import('../styles/responsive.js');
      const classes = getBreakpointClasses('mobile');
      expect(classes.sidebar).toBe('sidebar--hidden');
      expect(classes.bottomBar).toBe('bottom-bar--visible');
      expect(classes.header).toBe('header--compact');
    });
  });

  describe('getBottomTabItems()', () => {
    it('returns all tabs for admin role', async () => {
      const { getBottomTabItems } = await import('../styles/responsive.js');
      const tabs = getBottomTabItems('admin');
      expect(tabs.length).toBeGreaterThanOrEqual(4);
      const ids = tabs.map(t => t.id);
      expect(ids).toContain('catalog');
      expect(ids).toContain('explore');
    });

    it('hides GOVERN tabs for author role', async () => {
      const { getBottomTabItems } = await import('../styles/responsive.js');
      const tabs = getBottomTabItems('author');
      const ids = tabs.map(t => t.id);
      expect(ids).not.toContain('govern');
    });

    it('returns minimal tabs for viewer role', async () => {
      const { getBottomTabItems } = await import('../styles/responsive.js');
      const tabs = getBottomTabItems('viewer');
      expect(tabs.length).toBeLessThanOrEqual(3);
    });

    it('each tab has id, label, and icon', async () => {
      const { getBottomTabItems } = await import('../styles/responsive.js');
      const tabs = getBottomTabItems('admin');
      for (const tab of tabs) {
        expect(tab.id).toBeTruthy();
        expect(tab.label).toBeTruthy();
        expect(tab.icon).toBeTruthy();
      }
    });
  });

  describe('BREAKPOINT_VALUES', () => {
    it('exports breakpoint thresholds', async () => {
      const { BREAKPOINT_VALUES } = await import('../styles/responsive.js');
      expect(BREAKPOINT_VALUES.mobile).toBe(768);
      expect(BREAKPOINT_VALUES.tablet).toBe(1024);
      expect(BREAKPOINT_VALUES.laptop).toBe(1280);
    });
  });
});
