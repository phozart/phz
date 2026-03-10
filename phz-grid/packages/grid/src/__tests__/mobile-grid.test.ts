/**
 * Mobile responsiveness tests for grid package.
 *
 * Verifies:
 * - Density auto-compact logic in VirtualScrollController
 * - Grid styles include horizontal scroll and touch scrolling
 * - Sticky first column at narrow widths
 */

import { describe, it, expect } from 'vitest';
import { VirtualScrollController } from '../controllers/virtual-scroll.controller.js';

describe('mobile-grid', () => {
  describe('VirtualScrollController density row heights', () => {
    it('returns 42px for compact density', () => {
      const host = createMockHost('compact');
      const ctrl = new VirtualScrollController(host);
      expect(ctrl.getDensityRowHeight()).toBe(42);
    });

    it('returns 34px for dense density', () => {
      const host = createMockHost('dense');
      const ctrl = new VirtualScrollController(host);
      expect(ctrl.getDensityRowHeight()).toBe(34);
    });

    it('returns 52px for comfortable density', () => {
      const host = createMockHost('comfortable');
      const ctrl = new VirtualScrollController(host);
      expect(ctrl.getDensityRowHeight()).toBe(52);
    });

    it('prefers explicit virtualRowHeight over density-based', () => {
      const host = createMockHost('comfortable');
      host.virtualRowHeight = 36;
      const ctrl = new VirtualScrollController(host);
      expect(ctrl.getDensityRowHeight()).toBe(36);
    });
  });

  describe('grid styles include mobile responsive CSS', () => {
    it('phzGridStyles includes touch scrolling rules', async () => {
      const { phzGridStyles } = await import('../components/phz-grid.styles.js');
      const cssText = phzGridStyles.cssText ?? String(phzGridStyles);
      expect(cssText).toContain('-webkit-overflow-scrolling');
      expect(cssText).toContain('touch');
    });

    it('phzGridStyles includes sticky first column support', async () => {
      const { phzGridStyles } = await import('../components/phz-grid.styles.js');
      const cssText = phzGridStyles.cssText ?? String(phzGridStyles);
      expect(cssText).toContain('sticky');
    });
  });
});

function createMockHost(density: 'compact' | 'dense' | 'comfortable') {
  const controllers: any[] = [];
  return {
    scrollMode: 'paginate' as const,
    virtualScrollThreshold: 0,
    remoteDataSource: undefined,
    fetchPageSize: 50,
    prefetchPages: 1,
    virtualRowHeight: undefined as number | undefined,
    density,
    isConnected: true,
    renderRoot: { querySelector: () => null } as any,
    totalRowCount: 0,
    addController(ctrl: any) { controllers.push(ctrl); },
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
  };
}
