/**
 * Responsive Breakpoints — TDD RED phase
 *
 * Tests pure layout computation functions: breakpoint resolution,
 * column clamping, and grid style generation.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BREAKPOINTS,
  resolveBreakpoint,
  computeResponsiveColumns,
  clampColSpan,
  computeResponsiveLayout,
  generateContainerQueryCSS,
} from '../responsive-layout.js';
import type { BreakpointConfig, ResponsiveLayoutInput } from '../responsive-layout.js';

// --- DEFAULT_BREAKPOINTS ---

describe('DEFAULT_BREAKPOINTS', () => {
  it('defines xs, sm, md, lg, xl breakpoints', () => {
    expect(DEFAULT_BREAKPOINTS).toHaveProperty('xs');
    expect(DEFAULT_BREAKPOINTS).toHaveProperty('sm');
    expect(DEFAULT_BREAKPOINTS).toHaveProperty('md');
    expect(DEFAULT_BREAKPOINTS).toHaveProperty('lg');
    expect(DEFAULT_BREAKPOINTS).toHaveProperty('xl');
  });

  it('xs has 1 column and minWidth 0', () => {
    expect(DEFAULT_BREAKPOINTS.xs).toEqual({ columns: 1, minWidth: 0 });
  });

  it('sm has 2 columns and minWidth 576', () => {
    expect(DEFAULT_BREAKPOINTS.sm).toEqual({ columns: 2, minWidth: 576 });
  });

  it('md has 6 columns and minWidth 768', () => {
    expect(DEFAULT_BREAKPOINTS.md).toEqual({ columns: 6, minWidth: 768 });
  });

  it('lg has 12 columns and minWidth 992', () => {
    expect(DEFAULT_BREAKPOINTS.lg).toEqual({ columns: 12, minWidth: 992 });
  });

  it('xl has 12 columns and minWidth 1200', () => {
    expect(DEFAULT_BREAKPOINTS.xl).toEqual({ columns: 12, minWidth: 1200 });
  });
});

// --- resolveBreakpoint ---

describe('resolveBreakpoint', () => {
  it('returns xs for width < 576', () => {
    expect(resolveBreakpoint(400)).toBe('xs');
    expect(resolveBreakpoint(0)).toBe('xs');
    expect(resolveBreakpoint(575)).toBe('xs');
  });

  it('returns sm for width 576-767', () => {
    expect(resolveBreakpoint(576)).toBe('sm');
    expect(resolveBreakpoint(700)).toBe('sm');
    expect(resolveBreakpoint(767)).toBe('sm');
  });

  it('returns md for width 768-991', () => {
    expect(resolveBreakpoint(768)).toBe('md');
    expect(resolveBreakpoint(900)).toBe('md');
    expect(resolveBreakpoint(991)).toBe('md');
  });

  it('returns lg for width 992-1199', () => {
    expect(resolveBreakpoint(992)).toBe('lg');
    expect(resolveBreakpoint(1100)).toBe('lg');
    expect(resolveBreakpoint(1199)).toBe('lg');
  });

  it('returns xl for width >= 1200', () => {
    expect(resolveBreakpoint(1200)).toBe('xl');
    expect(resolveBreakpoint(2000)).toBe('xl');
  });

  it('accepts custom breakpoints', () => {
    const custom: Record<string, BreakpointConfig> = {
      small: { columns: 1, minWidth: 0 },
      large: { columns: 4, minWidth: 800 },
    };
    expect(resolveBreakpoint(500, custom)).toBe('small');
    expect(resolveBreakpoint(800, custom)).toBe('large');
    expect(resolveBreakpoint(1200, custom)).toBe('large');
  });
});

// --- computeResponsiveColumns ---

describe('computeResponsiveColumns', () => {
  it('returns 1 column for xs', () => {
    expect(computeResponsiveColumns(400)).toBe(1);
  });

  it('returns 2 columns for sm', () => {
    expect(computeResponsiveColumns(600)).toBe(2);
  });

  it('returns 6 columns for md', () => {
    expect(computeResponsiveColumns(800)).toBe(6);
  });

  it('returns 12 columns for lg', () => {
    expect(computeResponsiveColumns(1000)).toBe(12);
  });

  it('returns 12 columns for xl', () => {
    expect(computeResponsiveColumns(1400)).toBe(12);
  });

  it('accepts custom breakpoints', () => {
    const custom: Record<string, BreakpointConfig> = {
      tiny: { columns: 1, minWidth: 0 },
      wide: { columns: 8, minWidth: 600 },
    };
    expect(computeResponsiveColumns(300, custom)).toBe(1);
    expect(computeResponsiveColumns(700, custom)).toBe(8);
  });
});

// --- clampColSpan ---

describe('clampColSpan', () => {
  it('returns colSpan when within available columns', () => {
    expect(clampColSpan(4, 12)).toBe(4);
    expect(clampColSpan(6, 12)).toBe(6);
  });

  it('clamps colSpan to availableColumns', () => {
    expect(clampColSpan(6, 2)).toBe(2);
    expect(clampColSpan(12, 1)).toBe(1);
    expect(clampColSpan(4, 3)).toBe(3);
  });

  it('returns 1 as minimum', () => {
    expect(clampColSpan(0, 12)).toBe(1);
    expect(clampColSpan(-1, 12)).toBe(1);
  });
});

// --- computeResponsiveLayout ---

describe('computeResponsiveLayout', () => {
  it('computes layout at lg breakpoint (12 columns) with no clamping', () => {
    const input: ResponsiveLayoutInput = {
      widgets: [
        { id: 'w-1', colSpan: 4 },
        { id: 'w-2', colSpan: 6 },
        { id: 'w-3', colSpan: 4 },
      ],
      containerWidth: 1000,
    };
    const result = computeResponsiveLayout(input);
    expect(result.columns).toBe(12);
    expect(result.breakpoint).toBe('lg');
    expect(result.widgets[0].colSpan).toBe(4);
    expect(result.widgets[1].colSpan).toBe(6);
    expect(result.widgets[2].colSpan).toBe(4);
  });

  it('clamps widget colSpan at xs breakpoint (1 column)', () => {
    const input: ResponsiveLayoutInput = {
      widgets: [
        { id: 'w-1', colSpan: 6 },
        { id: 'w-2', colSpan: 4 },
      ],
      containerWidth: 400,
    };
    const result = computeResponsiveLayout(input);
    expect(result.columns).toBe(1);
    expect(result.breakpoint).toBe('xs');
    expect(result.widgets[0].colSpan).toBe(1);
    expect(result.widgets[1].colSpan).toBe(1);
  });

  it('clamps widget colSpan at sm breakpoint (2 columns)', () => {
    const input: ResponsiveLayoutInput = {
      widgets: [
        { id: 'w-1', colSpan: 6 },
        { id: 'w-2', colSpan: 2 },
      ],
      containerWidth: 600,
    };
    const result = computeResponsiveLayout(input);
    expect(result.columns).toBe(2);
    expect(result.breakpoint).toBe('sm');
    expect(result.widgets[0].colSpan).toBe(2);
    expect(result.widgets[1].colSpan).toBe(2);
  });

  it('clamps widget colSpan at md breakpoint (6 columns)', () => {
    const input: ResponsiveLayoutInput = {
      widgets: [
        { id: 'w-1', colSpan: 12 },
        { id: 'w-2', colSpan: 4 },
      ],
      containerWidth: 800,
    };
    const result = computeResponsiveLayout(input);
    expect(result.columns).toBe(6);
    expect(result.breakpoint).toBe('md');
    expect(result.widgets[0].colSpan).toBe(6);
    expect(result.widgets[1].colSpan).toBe(4);
  });

  it('uses custom breakpoints when provided', () => {
    const custom: Record<string, BreakpointConfig> = {
      small: { columns: 2, minWidth: 0 },
      large: { columns: 8, minWidth: 500 },
    };
    const input: ResponsiveLayoutInput = {
      widgets: [{ id: 'w-1', colSpan: 6 }],
      containerWidth: 300,
      breakpoints: custom,
    };
    const result = computeResponsiveLayout(input);
    expect(result.columns).toBe(2);
    expect(result.breakpoint).toBe('small');
    expect(result.widgets[0].colSpan).toBe(2);
  });

  it('handles empty widget list', () => {
    const result = computeResponsiveLayout({ widgets: [], containerWidth: 1000 });
    expect(result.widgets).toEqual([]);
    expect(result.columns).toBe(12);
  });
});

// --- generateContainerQueryCSS ---

describe('generateContainerQueryCSS', () => {
  it('generates CSS container query rules for default breakpoints', () => {
    const css = generateContainerQueryCSS();
    // Should contain @container queries for each breakpoint (except xs which is the base)
    expect(css).toContain('@container');
    expect(css).toContain('576px');
    expect(css).toContain('768px');
    expect(css).toContain('992px');
    expect(css).toContain('1200px');
    expect(css).toContain('grid-template-columns');
  });

  it('generates CSS for custom breakpoints', () => {
    const custom: Record<string, BreakpointConfig> = {
      small: { columns: 1, minWidth: 0 },
      medium: { columns: 4, minWidth: 600 },
      large: { columns: 8, minWidth: 1000 },
    };
    const css = generateContainerQueryCSS(custom);
    expect(css).toContain('600px');
    expect(css).toContain('1000px');
    expect(css).toContain('repeat(4, 1fr)');
    expect(css).toContain('repeat(8, 1fr)');
  });

  it('base rule uses xs columns (no container query)', () => {
    const css = generateContainerQueryCSS();
    // The base (xs) rule should set 1-column grid without a container query
    expect(css).toContain('repeat(1, 1fr)');
  });
});
