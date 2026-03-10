import { describe, it, expect } from 'vitest';
import {
  generateLayoutHTML,
  generateTabsHTML,
  generateSectionsHTML,
  generateGridHTML,
} from '../layout/phz-layout-container.js';
import type {
  LayoutNode,
  TabsLayout,
  SectionsLayout,
  AutoGridLayout,
  WidgetSlot,
} from '../schema/config-layers.js';

describe('PhzLayoutContainer', () => {
  describe('generateLayoutHTML', () => {
    it('generates widget slot HTML', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1' };
      const html = generateLayoutHTML(node);
      expect(html).toContain('data-widget-id="w1"');
      expect(html).toContain('phz-widget-slot');
    });

    it('generates nested structure from tree', () => {
      const node: LayoutNode = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
        ],
      };
      const html = generateLayoutHTML(node);
      expect(html).toContain('data-widget-id="w1"');
      expect(html).toContain('data-widget-id="w2"');
    });
  });

  describe('generateTabsHTML', () => {
    it('generates tab-panel structure with aria attributes', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [
          { label: 'Tab 1', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { label: 'Tab 2', children: [{ kind: 'widget', widgetId: 'w2' }] },
        ],
      };
      const html = generateTabsHTML(node);
      expect(html).toContain('role="tablist"');
      expect(html).toContain('role="tab"');
      expect(html).toContain('role="tabpanel"');
      expect(html).toContain('Tab 1');
      expect(html).toContain('Tab 2');
    });

    it('supports tab icons', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [
          { label: 'Sales', icon: 'chart-bar', children: [] },
        ],
      };
      const html = generateTabsHTML(node);
      expect(html).toContain('chart-bar');
    });

    it('marks first tab as selected', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [
          { label: 'A', children: [] },
          { label: 'B', children: [] },
        ],
      };
      const html = generateTabsHTML(node);
      expect(html).toContain('aria-selected="true"');
    });
  });

  describe('generateSectionsHTML', () => {
    it('generates collapsible section structure', () => {
      const node: SectionsLayout = {
        kind: 'sections',
        sections: [
          { title: 'Section 1', children: [{ kind: 'widget', widgetId: 'w1' }] },
        ],
      };
      const html = generateSectionsHTML(node);
      expect(html).toContain('Section 1');
      expect(html).toContain('phz-layout-section');
    });

    it('respects collapsed state', () => {
      const node: SectionsLayout = {
        kind: 'sections',
        sections: [
          { title: 'Hidden', collapsed: true, children: [{ kind: 'widget', widgetId: 'w1' }] },
        ],
      };
      const html = generateSectionsHTML(node);
      expect(html).toContain('collapsed');
    });
  });

  describe('generateGridHTML', () => {
    it('generates CSS Grid container', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
        ],
      };
      const html = generateGridHTML(node);
      expect(html).toContain('phz-auto-grid');
      expect(html).toContain('display: grid');
    });

    it('includes gap and minItemWidth in style', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 250,
        gap: 24,
        children: [],
      };
      const html = generateGridHTML(node);
      expect(html).toContain('250px');
      expect(html).toContain('24px');
    });
  });
});
