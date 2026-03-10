/**
 * W.6 — Data Source Panel Enhancement
 */

import { describe, it, expect } from 'vitest';

describe('Data Source Panel V2 (W.6)', () => {
  describe('SOURCE_TYPE_ICONS', () => {
    it('maps all source types to icons', async () => {
      const { SOURCE_TYPE_ICONS } = await import('../local/data-source-panel.js');
      expect(SOURCE_TYPE_ICONS.csv).toBeTruthy();
      expect(SOURCE_TYPE_ICONS.excel).toBeTruthy();
      expect(SOURCE_TYPE_ICONS.parquet).toBeTruthy();
      expect(SOURCE_TYPE_ICONS.json).toBeTruthy();
      expect(SOURCE_TYPE_ICONS.database).toBeTruthy();
      expect(SOURCE_TYPE_ICONS.api).toBeTruthy();
    });
  });

  describe('getRefreshBadge()', () => {
    it('returns fresh badge for recent data', async () => {
      const { getRefreshBadge } = await import('../local/data-source-panel.js');
      const badge = getRefreshBadge('fresh');
      expect(badge.label).toBe('Fresh');
      expect(badge.variant).toBe('fresh');
    });

    it('returns stale badge for old data', async () => {
      const { getRefreshBadge } = await import('../local/data-source-panel.js');
      const badge = getRefreshBadge('stale');
      expect(badge.label).toBe('Stale');
      expect(badge.variant).toBe('stale');
    });

    it('returns unknown badge for unknown status', async () => {
      const { getRefreshBadge } = await import('../local/data-source-panel.js');
      const badge = getRefreshBadge('unknown');
      expect(badge.label).toBe('Unknown');
    });
  });

  describe('DATA_SOURCE_PICKER_OPTIONS', () => {
    it('includes 3 options: upload, connect, sample', async () => {
      const { DATA_SOURCE_PICKER_OPTIONS } = await import('../local/data-source-panel.js');
      expect(DATA_SOURCE_PICKER_OPTIONS).toHaveLength(3);
      const ids = DATA_SOURCE_PICKER_OPTIONS.map(o => o.id);
      expect(ids).toContain('upload');
      expect(ids).toContain('connect');
      expect(ids).toContain('sample');
    });

    it('each option has id, label, description, and icon', async () => {
      const { DATA_SOURCE_PICKER_OPTIONS } = await import('../local/data-source-panel.js');
      for (const opt of DATA_SOURCE_PICKER_OPTIONS) {
        expect(opt.id).toBeTruthy();
        expect(opt.label).toBeTruthy();
        expect(opt.description).toBeTruthy();
        expect(opt.icon).toBeTruthy();
      }
    });
  });

  describe('getSourceDisplayProps()', () => {
    it('returns formatted display properties', async () => {
      const { getSourceDisplayProps } = await import('../local/data-source-panel.js');
      const props = getSourceDisplayProps({
        id: 'sales',
        name: 'Sales Data',
        sourceType: 'csv',
        rowCount: 1500,
        freshnessStatus: 'fresh',
      });
      expect(props.icon).toBeTruthy();
      expect(props.displayName).toBe('Sales Data');
      expect(props.formattedRowCount).toBe('1,500 rows');
    });
  });
});
