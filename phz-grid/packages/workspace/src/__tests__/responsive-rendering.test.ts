import { describe, it, expect } from 'vitest';
import {
  generateResponsiveCSS,
  generatePrintCSS,
  computeContainerBreakpoints,
} from '../layout/layout-renderer.js';
import type { WidgetResponsiveBehavior } from '../types.js';
import type { AutoGridLayout } from '../schema/config-layers.js';

describe('Responsive Rendering (K.5)', () => {
  describe('generateResponsiveCSS', () => {
    it('generates @container queries from WidgetResponsiveBehavior', () => {
      const behavior: WidgetResponsiveBehavior = {
        compactBelow: 400,
        compactBehavior: {
          hideLegend: true,
          hideAxisLabels: true,
        },
      };
      const css = generateResponsiveCSS('w1', behavior);
      expect(css).toContain('@container');
      expect(css).toContain('400px');
    });

    it('handles minimalBelow breakpoint', () => {
      const behavior: WidgetResponsiveBehavior = {
        compactBelow: 400,
        compactBehavior: { hideLegend: true },
        minimalBelow: 200,
      };
      const css = generateResponsiveCSS('w1', behavior);
      expect(css).toContain('200px');
    });

    it('generates aspect ratio constraints', () => {
      const behavior: WidgetResponsiveBehavior = {
        compactBelow: 400,
        compactBehavior: {},
        minAspectRatio: 0.5,
        maxAspectRatio: 2.0,
      };
      const css = generateResponsiveCSS('w1', behavior);
      expect(css).toContain('aspect-ratio');
    });

    it('returns empty string when no behavior provided', () => {
      const css = generateResponsiveCSS('w1', undefined);
      expect(css).toBe('');
    });
  });

  describe('generatePrintCSS', () => {
    it('generates @media print styles', () => {
      const css = generatePrintCSS();
      expect(css).toContain('@media print');
    });

    it('hides interactive elements in print', () => {
      const css = generatePrintCSS();
      expect(css).toContain('display: none');
    });

    it('removes shadows and rounded corners for print', () => {
      const css = generatePrintCSS();
      expect(css).toContain('box-shadow: none');
    });
  });

  describe('computeContainerBreakpoints', () => {
    it('returns breakpoints from grid layout', () => {
      const layout: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 300,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
        ],
      };
      const breakpoints = computeContainerBreakpoints(layout);
      expect(breakpoints.compact).toBeGreaterThan(0);
      expect(breakpoints.mobile).toBeGreaterThan(0);
      expect(breakpoints.mobile).toBeLessThan(breakpoints.compact);
    });

    it('adjusts breakpoints based on minItemWidth', () => {
      const narrow: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 150,
        gap: 8,
        children: [{ kind: 'widget', widgetId: 'w1' }],
      };
      const wide: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 400,
        gap: 16,
        children: [{ kind: 'widget', widgetId: 'w1' }],
      };
      const narrowBp = computeContainerBreakpoints(narrow);
      const wideBp = computeContainerBreakpoints(wide);
      expect(wideBp.compact).toBeGreaterThan(narrowBp.compact);
    });
  });
});
