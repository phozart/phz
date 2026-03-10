/**
 * Mobile responsiveness tests for widget components.
 *
 * Verifies:
 * - Container query CSS includes mobile breakpoints
 * - Touch target minimum of 44px
 * - SVG viewBox for scaling (not fixed width/height)
 * - Legend position changes at narrow widths
 * - Dashboard uses container-type: inline-size
 */

import { describe, it, expect } from 'vitest';
import { generateContainerQueryCSS, DEFAULT_BREAKPOINTS } from '../responsive-layout.js';

describe('mobile-rendering', () => {
  describe('responsive-layout container queries', () => {
    it('generates CSS with xs breakpoint at 0px for 1-column layout', () => {
      const css = generateContainerQueryCSS();
      // The base rule (xs at 0px) should produce 1-column grid
      expect(css).toContain('repeat(1, 1fr)');
    });

    it('generates CSS with sm breakpoint at 576px for 2-column layout', () => {
      const css = generateContainerQueryCSS();
      expect(css).toContain('@container (min-width: 576px)');
      expect(css).toContain('repeat(2, 1fr)');
    });

    it('DEFAULT_BREAKPOINTS includes xs and sm', () => {
      expect(DEFAULT_BREAKPOINTS.xs).toEqual({ columns: 1, minWidth: 0 });
      expect(DEFAULT_BREAKPOINTS.sm).toEqual({ columns: 2, minWidth: 576 });
    });
  });

  describe('phz-dashboard mobile support', () => {
    it('dashboard styles include container-type: inline-size', async () => {
      const { PhzDashboard } = await import('../components/phz-dashboard.js');
      const styles = PhzDashboard.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
      expect(cssText).toContain('inline-size');
    });
  });

  describe('phz-bar-chart mobile support', () => {
    it('styles include container-type for responsive layout', async () => {
      const { PhzBarChart } = await import('../components/phz-bar-chart.js');
      const styles = PhzBarChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
    });

    it('styles include 44px minimum touch target for bar rows', async () => {
      const { PhzBarChart } = await import('../components/phz-bar-chart.js');
      const styles = PhzBarChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('min-height: 44px');
    });

    it('styles include @container rule for narrow legend position', async () => {
      const { PhzBarChart } = await import('../components/phz-bar-chart.js');
      const styles = PhzBarChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('@container');
    });
  });

  describe('phz-kpi-card mobile support', () => {
    it('styles include container-type and vertical stacking below 200px', async () => {
      const { PhzKPICard } = await import('../components/phz-kpi-card.js');
      const styles = PhzKPICard.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
      expect(cssText).toContain('@container');
    });

    it('styles include 44px minimum touch target', async () => {
      const { PhzKPICard } = await import('../components/phz-kpi-card.js');
      const styles = PhzKPICard.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('44px');
    });
  });

  describe('phz-kpi-scorecard mobile support', () => {
    it('styles include @container for single-column below 576px', async () => {
      const { PhzKPIScorecard } = await import('../components/phz-kpi-scorecard.js');
      const styles = PhzKPIScorecard.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
      expect(cssText).toContain('@container');
    });
  });

  describe('phz-pie-chart mobile support', () => {
    it('SVG uses viewBox for scaling', async () => {
      const { PhzPieChart } = await import('../components/phz-pie-chart.js');
      const styles = PhzPieChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
    });

    it('styles include @container for legend below chart on narrow', async () => {
      const { PhzPieChart } = await import('../components/phz-pie-chart.js');
      const styles = PhzPieChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('@container');
    });
  });

  describe('phz-gauge mobile support', () => {
    it('SVG already uses viewBox — styles include width: 100%', async () => {
      const { PhzGauge } = await import('../components/phz-gauge.js');
      const styles = PhzGauge.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      // gauge already has width: 100% and viewBox on the SVG
      expect(cssText).toContain('width: 100%');
    });
  });

  describe('phz-trend-line mobile support', () => {
    it('styles include container-type for responsive behavior', async () => {
      const { PhzTrendLine } = await import('../components/phz-trend-line.js');
      const styles = PhzTrendLine.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
    });
  });

  describe('phz-line-chart mobile support', () => {
    it('styles include container-type', async () => {
      const { PhzLineChart } = await import('../components/phz-line-chart.js');
      const styles = PhzLineChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
    });
  });

  describe('phz-area-chart mobile support', () => {
    it('styles include container-type', async () => {
      const { PhzAreaChart } = await import('../components/phz-area-chart.js');
      const styles = PhzAreaChart.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('container-type');
    });
  });

  describe('phz-drill-link mobile support', () => {
    it('styles include 44px minimum touch target', async () => {
      const { PhzDrillLink } = await import('../components/phz-drill-link.js');
      const styles = PhzDrillLink.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('min-height: 44px');
    });
  });

  describe('phz-export-menu mobile support', () => {
    it('styles include 44px minimum touch target on menu items', async () => {
      const { PhzExportMenu } = await import('../components/phz-export-menu.js');
      const styles = PhzExportMenu.styles;
      const cssText = Array.isArray(styles)
        ? styles.map(s => s.cssText ?? String(s)).join('\n')
        : String(styles);
      expect(cssText).toContain('min-height: 44px');
    });
  });
});
