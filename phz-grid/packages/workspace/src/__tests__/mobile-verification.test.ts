/**
 * X.3 — Mobile Verification
 *
 * Exercises mobile interaction patterns from mobile-interactions.ts and
 * responsive viewport helpers from responsive.ts. Covers bottom sheet,
 * swipe detection, mobile dashboard layout, floating action bar,
 * tap-to-place, viewport breakpoints, breakpoint classes, and
 * role-specific bottom tab bars.
 */

import { describe, it, expect } from 'vitest';
import {
  createBottomSheetConfig,
  getBottomSheetClasses,
  detectSwipe,
  getMobileDashboardLayout,
  getFloatingActionBarClasses,
  getTapToPlaceConfig,
  type TouchPoint,
} from '../shell/mobile-interactions.js';
import {
  getViewportBreakpoint,
  getBreakpointClasses,
  getBottomTabItems,
  BREAKPOINT_VALUES,
  type ViewportBreakpoint,
} from '../styles/responsive.js';

// ========================================================================
// Bottom Sheet
// ========================================================================

describe('X.3 — Bottom sheet config', () => {
  it('creates default config with drag handle enabled', () => {
    const config = createBottomSheetConfig();
    expect(config.maxHeight).toBe('90vh');
    expect(config.dragHandle).toBe(true);
    expect(config.overscrollContain).toBe(true);
  });

  it('allows partial overrides', () => {
    const config = createBottomSheetConfig({ maxHeight: '50vh', dragHandle: false });
    expect(config.maxHeight).toBe('50vh');
    expect(config.dragHandle).toBe(false);
    expect(config.overscrollContain).toBe(true); // default preserved
  });
});

describe('X.3 — Bottom sheet classes', () => {
  it('open sheet has --open modifier and visible overlay', () => {
    const classes = getBottomSheetClasses(true);
    expect(classes.sheet).toContain('bottom-sheet--open');
    expect(classes.overlay).toContain('bottom-sheet-overlay--visible');
    expect(classes.handle).toBe('bottom-sheet-handle');
  });

  it('closed sheet has no --open modifier', () => {
    const classes = getBottomSheetClasses(false);
    expect(classes.sheet).toBe('bottom-sheet');
    expect(classes.sheet).not.toContain('--open');
    expect(classes.overlay).not.toContain('--visible');
  });
});

// ========================================================================
// Swipe Detection
// ========================================================================

describe('X.3 — Swipe detection', () => {
  const base: TouchPoint = { x: 200, y: 200, time: 0 };

  it('detects right swipe', () => {
    const end: TouchPoint = { x: 300, y: 200, time: 100 };
    expect(detectSwipe(base, end)).toBe('right');
  });

  it('detects left swipe', () => {
    const end: TouchPoint = { x: 100, y: 200, time: 100 };
    expect(detectSwipe(base, end)).toBe('left');
  });

  it('detects down swipe', () => {
    const end: TouchPoint = { x: 200, y: 300, time: 100 };
    expect(detectSwipe(base, end)).toBe('down');
  });

  it('detects up swipe', () => {
    const end: TouchPoint = { x: 200, y: 100, time: 100 };
    expect(detectSwipe(base, end)).toBe('up');
  });

  it('returns null for movements below min distance', () => {
    const end: TouchPoint = { x: 220, y: 210, time: 100 };
    expect(detectSwipe(base, end)).toBeNull();
  });

  it('respects custom min distance', () => {
    const end: TouchPoint = { x: 230, y: 200, time: 100 };
    // 30px movement — below default 50 but above custom 20
    expect(detectSwipe(base, end)).toBeNull();
    expect(detectSwipe(base, end, { minDistance: 20 })).toBe('right');
  });

  it('prefers horizontal when dx equals dy', () => {
    const end: TouchPoint = { x: 260, y: 260, time: 100 };
    const result = detectSwipe(base, end);
    // absDx === absDy → horizontal wins (>=)
    expect(result).toBe('right');
  });
});

// ========================================================================
// Mobile Dashboard Layout
// ========================================================================

describe('X.3 — Mobile dashboard layout', () => {
  it('returns single-column layout', () => {
    const layout = getMobileDashboardLayout();
    expect(layout.columns).toBe(1);
    expect(layout.singleColumn).toBe(true);
    expect(layout.filterCollapsed).toBe(true);
  });
});

// ========================================================================
// Floating Action Bar
// ========================================================================

describe('X.3 — Floating action bar', () => {
  it('visible when items are selected', () => {
    expect(getFloatingActionBarClasses(1)).toContain('fab--visible');
    expect(getFloatingActionBarClasses(5)).toContain('fab--visible');
  });

  it('hidden when nothing selected', () => {
    const cls = getFloatingActionBarClasses(0);
    expect(cls).toBe('fab');
    expect(cls).not.toContain('fab--visible');
  });
});

// ========================================================================
// Tap-to-Place
// ========================================================================

describe('X.3 — Tap-to-place config', () => {
  it('defaults to tap mode with end insertion', () => {
    const config = getTapToPlaceConfig();
    expect(config.mode).toBe('tap');
    expect(config.insertPosition).toBe('end');
  });
});

// ========================================================================
// Viewport Breakpoints
// ========================================================================

describe('X.3 — Viewport breakpoint detection', () => {
  it('classifies mobile below 768px', () => {
    expect(getViewportBreakpoint(320)).toBe('mobile');
    expect(getViewportBreakpoint(767)).toBe('mobile');
  });

  it('classifies tablet at 768-1023px', () => {
    expect(getViewportBreakpoint(768)).toBe('tablet');
    expect(getViewportBreakpoint(1023)).toBe('tablet');
  });

  it('classifies laptop at 1024-1280px', () => {
    expect(getViewportBreakpoint(1024)).toBe('laptop');
    expect(getViewportBreakpoint(1280)).toBe('laptop');
  });

  it('classifies desktop above 1280px', () => {
    expect(getViewportBreakpoint(1281)).toBe('desktop');
    expect(getViewportBreakpoint(1920)).toBe('desktop');
  });

  it('breakpoint values match the classification boundaries', () => {
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.mobile - 1)).toBe('mobile');
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.mobile)).toBe('tablet');
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.tablet - 1)).toBe('tablet');
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.tablet)).toBe('laptop');
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.laptop)).toBe('laptop');
    expect(getViewportBreakpoint(BREAKPOINT_VALUES.laptop + 1)).toBe('desktop');
  });
});

// ========================================================================
// Breakpoint Classes
// ========================================================================

describe('X.3 — Breakpoint-driven layout classes', () => {
  const breakpoints: ViewportBreakpoint[] = ['mobile', 'tablet', 'laptop', 'desktop'];

  it('every breakpoint returns non-empty sidebar and content classes', () => {
    for (const bp of breakpoints) {
      const classes = getBreakpointClasses(bp);
      expect(classes.sidebar).toBeTruthy();
      expect(classes.content).toBe('content--full');
    }
  });

  it('mobile has hidden sidebar, compact header, bottom bar', () => {
    const classes = getBreakpointClasses('mobile');
    expect(classes.sidebar).toBe('sidebar--hidden');
    expect(classes.header).toBe('header--compact');
    expect(classes.bottomBar).toBe('bottom-bar--visible');
  });

  it('tablet has overlay sidebar and hamburger', () => {
    const classes = getBreakpointClasses('tablet');
    expect(classes.sidebar).toBe('sidebar--overlay');
    expect(classes.hamburger).toBe('hamburger--visible');
  });

  it('laptop has icon-only sidebar', () => {
    const classes = getBreakpointClasses('laptop');
    expect(classes.sidebar).toBe('sidebar--icon-only');
  });

  it('desktop has full sidebar', () => {
    const classes = getBreakpointClasses('desktop');
    expect(classes.sidebar).toBe('sidebar--full');
    expect(classes.header).toBe('header--full');
  });
});

// ========================================================================
// Role-Specific Bottom Tab Bar
// ========================================================================

describe('X.3 — Role-specific bottom tabs', () => {
  it('admin sees all 5 tabs', () => {
    const tabs = getBottomTabItems('admin');
    expect(tabs).toHaveLength(5);
    const ids = tabs.map(t => t.id);
    expect(ids).toContain('catalog');
    expect(ids).toContain('explore');
    expect(ids).toContain('dashboards');
    expect(ids).toContain('data');
    expect(ids).toContain('govern');
  });

  it('author sees 4 tabs (no govern)', () => {
    const tabs = getBottomTabItems('author');
    expect(tabs).toHaveLength(4);
    const ids = tabs.map(t => t.id);
    expect(ids).not.toContain('govern');
    expect(ids).toContain('catalog');
    expect(ids).toContain('data');
  });

  it('viewer sees only catalog and dashboards', () => {
    const tabs = getBottomTabItems('viewer');
    expect(tabs).toHaveLength(2);
    const ids = tabs.map(t => t.id);
    expect(ids).toEqual(['catalog', 'dashboards']);
  });

  it('all tabs have icon and label', () => {
    for (const role of ['admin', 'author', 'viewer'] as const) {
      const tabs = getBottomTabItems(role);
      for (const tab of tabs) {
        expect(tab.id).toBeTruthy();
        expect(tab.label).toBeTruthy();
        expect(tab.icon).toBeTruthy();
      }
    }
  });
});
