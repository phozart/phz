/**
 * S.5 — Explorer + Dashboard Builder Visual Styling tests
 */

import { describe, it, expect } from 'vitest';

describe('Explorer Visual (S.5)', () => {
  describe('EXPLORER_LAYOUT', () => {
    it('exports field palette width', async () => {
      const { EXPLORER_LAYOUT } = await import('../styles/explorer-visual.js');
      expect(EXPLORER_LAYOUT.fieldPaletteWidth).toBe(260);
    });

    it('exports config panel width', async () => {
      const { EXPLORER_LAYOUT } = await import('../styles/explorer-visual.js');
      expect(EXPLORER_LAYOUT.configPanelWidth).toBe(360);
    });

    it('exports widget palette width', async () => {
      const { EXPLORER_LAYOUT } = await import('../styles/explorer-visual.js');
      expect(EXPLORER_LAYOUT.widgetPaletteWidth).toBe(260);
    });
  });

  describe('getFieldTypeIcon()', () => {
    it('returns correct icon for string type', async () => {
      const { getFieldTypeIcon } = await import('../styles/explorer-visual.js');
      expect(getFieldTypeIcon('string')).toBeTruthy();
    });

    it('returns correct icon for number type', async () => {
      const { getFieldTypeIcon } = await import('../styles/explorer-visual.js');
      expect(getFieldTypeIcon('number')).toBeTruthy();
    });

    it('returns correct icon for date type', async () => {
      const { getFieldTypeIcon } = await import('../styles/explorer-visual.js');
      expect(getFieldTypeIcon('date')).toBeTruthy();
    });

    it('returns correct icon for boolean type', async () => {
      const { getFieldTypeIcon } = await import('../styles/explorer-visual.js');
      expect(getFieldTypeIcon('boolean')).toBeTruthy();
    });

    it('returns fallback for unknown type', async () => {
      const { getFieldTypeIcon } = await import('../styles/explorer-visual.js');
      expect(getFieldTypeIcon('unknown')).toBeTruthy();
    });
  });

  describe('getCardinalityBadgeClass()', () => {
    it('returns correct class for low cardinality', async () => {
      const { getCardinalityBadgeClass } = await import('../styles/explorer-visual.js');
      expect(getCardinalityBadgeClass('low')).toBe('badge--cardinality-low');
    });

    it('returns correct class for medium cardinality', async () => {
      const { getCardinalityBadgeClass } = await import('../styles/explorer-visual.js');
      expect(getCardinalityBadgeClass('medium')).toBe('badge--cardinality-medium');
    });

    it('returns correct class for high cardinality', async () => {
      const { getCardinalityBadgeClass } = await import('../styles/explorer-visual.js');
      expect(getCardinalityBadgeClass('high')).toBe('badge--cardinality-high');
    });
  });

  describe('getDropZoneClass()', () => {
    it('returns active class when dragOver is true', async () => {
      const { getDropZoneClass } = await import('../styles/explorer-visual.js');
      const cls = getDropZoneClass('values', true);
      expect(cls).toContain('drop-zone--active');
    });

    it('returns base class when dragOver is false', async () => {
      const { getDropZoneClass } = await import('../styles/explorer-visual.js');
      const cls = getDropZoneClass('values', false);
      expect(cls).not.toContain('drop-zone--active');
      expect(cls).toContain('drop-zone');
    });

    it('includes zone type in class', async () => {
      const { getDropZoneClass } = await import('../styles/explorer-visual.js');
      const cls = getDropZoneClass('rows', false);
      expect(cls).toContain('drop-zone--rows');
    });
  });

  describe('SQL_PREVIEW_THEME', () => {
    it('exports dark background color', async () => {
      const { SQL_PREVIEW_THEME } = await import('../styles/explorer-visual.js');
      expect(SQL_PREVIEW_THEME.background).toBeDefined();
      expect(SQL_PREVIEW_THEME.textColor).toBeDefined();
    });
  });
});
