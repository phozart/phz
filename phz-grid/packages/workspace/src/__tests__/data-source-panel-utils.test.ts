/**
 * Data Source Panel Utils (L.16) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  groupDataSourcesByType,
  getStatusIcon,
  getTypeIcon,
  type DataSourceEntry,
} from '../shell/data-source-panel-utils.js';

function makeEntry(overrides: Partial<DataSourceEntry> & { id: string }): DataSourceEntry {
  return {
    name: overrides.id,
    type: 'file',
    status: 'connected',
    ...overrides,
  };
}

describe('Data Source Panel Utils (L.16)', () => {
  describe('groupDataSourcesByType', () => {
    it('returns empty map for empty input', () => {
      const grouped = groupDataSourcesByType([]);
      expect(grouped.size).toBe(0);
    });

    it('groups entries by type', () => {
      const entries = [
        makeEntry({ id: 'f1', type: 'file' }),
        makeEntry({ id: 'f2', type: 'file' }),
        makeEntry({ id: 'u1', type: 'url' }),
        makeEntry({ id: 'a1', type: 'api' }),
        makeEntry({ id: 's1', type: 'server' }),
      ];
      const grouped = groupDataSourcesByType(entries);
      expect(grouped.get('file')).toHaveLength(2);
      expect(grouped.get('url')).toHaveLength(1);
      expect(grouped.get('api')).toHaveLength(1);
      expect(grouped.get('server')).toHaveLength(1);
    });
  });

  describe('getStatusIcon', () => {
    it('returns icon names for each status', () => {
      expect(typeof getStatusIcon('connected')).toBe('string');
      expect(typeof getStatusIcon('error')).toBe('string');
      expect(typeof getStatusIcon('refreshing')).toBe('string');
    });

    it('returns distinct icons for different statuses', () => {
      const icons = new Set([
        getStatusIcon('connected'),
        getStatusIcon('error'),
        getStatusIcon('refreshing'),
      ]);
      expect(icons.size).toBe(3);
    });
  });

  describe('getTypeIcon', () => {
    it('returns icon names for each source type', () => {
      expect(typeof getTypeIcon('file')).toBe('string');
      expect(typeof getTypeIcon('url')).toBe('string');
      expect(typeof getTypeIcon('api')).toBe('string');
      expect(typeof getTypeIcon('server')).toBe('string');
    });

    it('returns distinct icons for different types', () => {
      const icons = new Set([
        getTypeIcon('file'),
        getTypeIcon('url'),
        getTypeIcon('api'),
        getTypeIcon('server'),
      ]);
      expect(icons.size).toBe(4);
    });
  });
});
