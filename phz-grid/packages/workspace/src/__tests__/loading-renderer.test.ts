import { describe, it, expect } from 'vitest';
import {
  generateSkeletonHTML,
  generateLoadingHTML,
  generateStaleIndicatorHTML,
  type LoadingState,
} from '../layout/loading-renderer.js';
import type { LayoutNode, AutoGridLayout } from '../schema/config-layers.js';

describe('LoadingRenderer', () => {
  describe('generateSkeletonHTML', () => {
    it('generates skeleton for a single widget slot', () => {
      const node: LayoutNode = { kind: 'widget', widgetId: 'w1', minHeight: 200 };
      const html = generateSkeletonHTML(node);
      expect(html).toContain('phz-skeleton');
      expect(html).toContain('200px');
    });

    it('generates skeleton for auto-grid with multiple widgets', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
          { kind: 'widget', widgetId: 'w3' },
        ],
      };
      const html = generateSkeletonHTML(node);
      const matches = html.match(/phz-skeleton/g);
      expect(matches?.length).toBeGreaterThanOrEqual(3);
    });

    it('uses default height when minHeight not set', () => {
      const node: LayoutNode = { kind: 'widget', widgetId: 'w1' };
      const html = generateSkeletonHTML(node);
      expect(html).toContain('phz-skeleton');
      // Default height should be applied
      expect(html).toContain('px');
    });
  });

  describe('generateLoadingHTML', () => {
    it('generates spinner for spinner loading behavior', () => {
      const state: LoadingState = { behavior: 'spinner', widgetId: 'w1' };
      const html = generateLoadingHTML(state);
      expect(html).toContain('phz-loading-spinner');
    });

    it('generates skeleton for skeleton loading behavior', () => {
      const state: LoadingState = { behavior: 'skeleton', widgetId: 'w1' };
      const html = generateLoadingHTML(state);
      expect(html).toContain('phz-skeleton');
    });

    it('returns empty for previous loading behavior', () => {
      const state: LoadingState = { behavior: 'previous', widgetId: 'w1' };
      const html = generateLoadingHTML(state);
      // 'previous' means show last data, no loading indicator
      expect(html).toBe('');
    });
  });

  describe('generateStaleIndicatorHTML', () => {
    it('generates stale indicator with warning', () => {
      const html = generateStaleIndicatorHTML('w1', 'stale');
      expect(html).toContain('phz-stale-indicator');
      expect(html).toContain('stale');
    });

    it('returns empty string for fresh data', () => {
      const html = generateStaleIndicatorHTML('w1', 'fresh');
      expect(html).toBe('');
    });

    it('returns empty string for unknown status', () => {
      const html = generateStaleIndicatorHTML('w1', 'unknown');
      expect(html).toBe('');
    });
  });
});
