import { describe, it, expect } from 'vitest';
import {
  renderLayoutToCSS,
  type LayoutRenderResult,
} from '../layout/layout-renderer.js';
import type {
  LayoutNode,
  AutoGridLayout,
  TabsLayout,
  SectionsLayout,
  WidgetSlot,
} from '../schema/config-layers.js';

describe('LayoutRenderer', () => {
  describe('renderLayoutToCSS', () => {
    it('renders a single WidgetSlot', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1' };
      const result = renderLayoutToCSS(node);
      expect(result.css).toContain('w1');
      expect(result.widgetIds).toEqual(['w1']);
    });

    it('renders AutoGridLayout with CSS Grid', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
        ],
      };
      const result = renderLayoutToCSS(node);
      expect(result.css).toContain('grid');
      expect(result.css).toContain('200px');
      expect(result.css).toContain('16px');
      expect(result.widgetIds).toEqual(['w1', 'w2']);
    });

    it('applies maxColumns constraint to AutoGridLayout', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        maxColumns: 3,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
        ],
      };
      const result = renderLayoutToCSS(node);
      expect(result.css).toContain('repeat');
    });

    it('maps WidgetSlot weight to grid-column span', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1', weight: 2 },
          { kind: 'widget', widgetId: 'w2', weight: 1 },
        ],
      };
      const result = renderLayoutToCSS(node);
      expect(result.css).toContain('span 2');
    });

    it('renders WidgetSlot minHeight', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1', minHeight: 300 };
      const result = renderLayoutToCSS(node);
      expect(result.css).toContain('300px');
    });

    it('renders TabsLayout with tab structure', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [
          { label: 'Sales', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { label: 'HR', children: [{ kind: 'widget', widgetId: 'w2' }] },
        ],
      };
      const result = renderLayoutToCSS(node);
      expect(result.html).toContain('Sales');
      expect(result.html).toContain('HR');
      expect(result.widgetIds).toEqual(['w1', 'w2']);
    });

    it('renders SectionsLayout with collapsible sections', () => {
      const node: SectionsLayout = {
        kind: 'sections',
        sections: [
          { title: 'Overview', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { title: 'Details', collapsed: true, children: [{ kind: 'widget', widgetId: 'w2' }] },
        ],
      };
      const result = renderLayoutToCSS(node);
      expect(result.html).toContain('Overview');
      expect(result.html).toContain('Details');
      expect(result.widgetIds).toEqual(['w1', 'w2']);
    });

    it('renders nested layout trees', () => {
      const node: LayoutNode = {
        kind: 'tabs',
        tabs: [{
          label: 'Main',
          children: [{
            kind: 'auto-grid',
            minItemWidth: 150,
            gap: 8,
            children: [
              { kind: 'widget', widgetId: 'w1' },
              { kind: 'widget', widgetId: 'w2' },
            ],
          }],
        }],
      };
      const result = renderLayoutToCSS(node);
      expect(result.widgetIds).toEqual(['w1', 'w2']);
      expect(result.css).toContain('grid');
    });

    it('returns empty widgetIds for empty layout', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [],
      };
      const result = renderLayoutToCSS(node);
      expect(result.widgetIds).toEqual([]);
    });

    it('result contains both css and html', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1' };
      const result = renderLayoutToCSS(node);
      expect(typeof result.css).toBe('string');
      expect(typeof result.html).toBe('string');
      expect(Array.isArray(result.widgetIds)).toBe(true);
    });
  });
});
