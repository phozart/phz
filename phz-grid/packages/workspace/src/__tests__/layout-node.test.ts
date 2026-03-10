import { describe, it, expect } from 'vitest';
import {
  flattenLayoutWidgets,
  convertLegacyLayout,
  type LayoutNode,
  type TabsLayout,
  type SectionsLayout,
  type AutoGridLayout,
  type WidgetSlot,
} from '../schema/config-layers.js';

describe('LayoutNode', () => {
  describe('type guards via kind discriminant', () => {
    it('WidgetSlot has kind "widget"', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1' };
      expect(node.kind).toBe('widget');
    });

    it('TabsLayout has kind "tabs"', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [{ label: 'Tab 1', children: [] }],
      };
      expect(node.kind).toBe('tabs');
    });

    it('SectionsLayout has kind "sections"', () => {
      const node: SectionsLayout = {
        kind: 'sections',
        sections: [{ title: 'Section 1', children: [] }],
      };
      expect(node.kind).toBe('sections');
    });

    it('AutoGridLayout has kind "auto-grid"', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [],
      };
      expect(node.kind).toBe('auto-grid');
    });
  });

  describe('flattenLayoutWidgets', () => {
    it('returns widgetId from a single WidgetSlot', () => {
      const node: LayoutNode = { kind: 'widget', widgetId: 'w1' };
      expect(flattenLayoutWidgets(node)).toEqual(['w1']);
    });

    it('flattens widgets from TabsLayout', () => {
      const node: LayoutNode = {
        kind: 'tabs',
        tabs: [
          { label: 'Tab A', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { label: 'Tab B', children: [{ kind: 'widget', widgetId: 'w2' }, { kind: 'widget', widgetId: 'w3' }] },
        ],
      };
      expect(flattenLayoutWidgets(node)).toEqual(['w1', 'w2', 'w3']);
    });

    it('flattens widgets from SectionsLayout', () => {
      const node: LayoutNode = {
        kind: 'sections',
        sections: [
          { title: 'Metrics', children: [{ kind: 'widget', widgetId: 'w1' }] },
          { title: 'Charts', collapsed: true, children: [{ kind: 'widget', widgetId: 'w2' }] },
        ],
      };
      expect(flattenLayoutWidgets(node)).toEqual(['w1', 'w2']);
    });

    it('flattens widgets from AutoGridLayout', () => {
      const node: LayoutNode = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        children: [
          { kind: 'widget', widgetId: 'w1' },
          { kind: 'widget', widgetId: 'w2' },
        ],
      };
      expect(flattenLayoutWidgets(node)).toEqual(['w1', 'w2']);
    });

    it('flattens deeply nested layouts', () => {
      const node: LayoutNode = {
        kind: 'tabs',
        tabs: [{
          label: 'Main',
          children: [{
            kind: 'sections',
            sections: [{
              title: 'Inner',
              children: [{
                kind: 'auto-grid',
                minItemWidth: 100,
                gap: 8,
                children: [
                  { kind: 'widget', widgetId: 'deep-w1' },
                  { kind: 'widget', widgetId: 'deep-w2' },
                ],
              }],
            }],
          }],
        }],
      };
      expect(flattenLayoutWidgets(node)).toEqual(['deep-w1', 'deep-w2']);
    });

    it('returns empty array for empty containers', () => {
      const node: LayoutNode = { kind: 'tabs', tabs: [] };
      expect(flattenLayoutWidgets(node)).toEqual([]);
    });
  });

  describe('convertLegacyLayout', () => {
    it('converts placement array to AutoGridLayout', () => {
      const placements = [
        { row: 0, col: 0, colSpan: 2, rowSpan: 1, widgetId: 'w1' },
        { row: 0, col: 2, colSpan: 1, rowSpan: 1, widgetId: 'w2' },
      ];
      const result = convertLegacyLayout(placements);
      expect(result.kind).toBe('auto-grid');
      expect(result.minItemWidth).toBe(200);
      expect(result.gap).toBe(16);
      expect(result.children).toHaveLength(2);
      expect(result.children[0]).toEqual({
        kind: 'widget',
        widgetId: 'w1',
        weight: 2,
        minHeight: 100,
      });
    });

    it('sorts placements by row then col', () => {
      const placements = [
        { row: 1, col: 0, colSpan: 1, rowSpan: 1, widgetId: 'w2' },
        { row: 0, col: 1, colSpan: 1, rowSpan: 1, widgetId: 'w1b' },
        { row: 0, col: 0, colSpan: 1, rowSpan: 1, widgetId: 'w1a' },
      ];
      const result = convertLegacyLayout(placements);
      expect(result.children.map(c => c.widgetId)).toEqual(['w1a', 'w1b', 'w2']);
    });

    it('handles empty placement array', () => {
      const result = convertLegacyLayout([]);
      expect(result.kind).toBe('auto-grid');
      expect(result.children).toHaveLength(0);
    });

    it('maps rowSpan to minHeight', () => {
      const placements = [
        { row: 0, col: 0, colSpan: 1, rowSpan: 3, widgetId: 'tall' },
      ];
      const result = convertLegacyLayout(placements);
      expect(result.children[0].minHeight).toBe(300);
    });

    it('does not mutate original array', () => {
      const placements = [
        { row: 1, col: 0, colSpan: 1, rowSpan: 1, widgetId: 'w2' },
        { row: 0, col: 0, colSpan: 1, rowSpan: 1, widgetId: 'w1' },
      ];
      const original = [...placements];
      convertLegacyLayout(placements);
      expect(placements).toEqual(original);
    });
  });

  describe('optional properties', () => {
    it('WidgetSlot supports weight and minHeight', () => {
      const node: WidgetSlot = { kind: 'widget', widgetId: 'w1', weight: 2, minHeight: 200 };
      expect(node.weight).toBe(2);
      expect(node.minHeight).toBe(200);
    });

    it('TabsLayout tabs support icon', () => {
      const node: TabsLayout = {
        kind: 'tabs',
        tabs: [{ label: 'Sales', icon: 'chart-bar', children: [] }],
      };
      expect(node.tabs[0].icon).toBe('chart-bar');
    });

    it('SectionsLayout sections support collapsed', () => {
      const node: SectionsLayout = {
        kind: 'sections',
        sections: [{ title: 'Hidden', collapsed: true, children: [] }],
      };
      expect(node.sections[0].collapsed).toBe(true);
    });

    it('AutoGridLayout supports maxColumns', () => {
      const node: AutoGridLayout = {
        kind: 'auto-grid',
        minItemWidth: 200,
        gap: 16,
        maxColumns: 4,
        children: [],
      };
      expect(node.maxColumns).toBe(4);
    });
  });
});
