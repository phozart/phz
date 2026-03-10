/**
 * Widget Picker Utils (L.5) — Tests
 */
import { describe, it, expect } from 'vitest';
import {
  filterManifestsByCapabilities,
  groupManifestsByCategory,
  searchManifests,
} from '../shell/widget-picker-utils.js';
import type { WidgetManifest } from '../types.js';
import type { ConsumerCapabilities } from '../client/workspace-client.js';

function makeManifest(overrides: Partial<WidgetManifest> & { type: string; category: string; name: string }): WidgetManifest {
  return {
    description: '',
    requiredFields: [],
    supportedAggregations: [],
    minSize: { cols: 1, rows: 1 },
    preferredSize: { cols: 2, rows: 2 },
    maxSize: { cols: 4, rows: 4 },
    supportedInteractions: [],
    variants: [],
    ...overrides,
  };
}

describe('Widget Picker Utils (L.5)', () => {
  const manifests: WidgetManifest[] = [
    makeManifest({ type: 'bar-chart', category: 'chart', name: 'Bar Chart', description: 'A bar chart widget' }),
    makeManifest({ type: 'line-chart', category: 'chart', name: 'Line Chart', description: 'A line chart widget' }),
    makeManifest({ type: 'kpi-card', category: 'kpi', name: 'KPI Card', description: 'Key performance indicator' }),
    makeManifest({ type: 'table', category: 'data', name: 'Data Table', description: 'Tabular data display' }),
  ];

  describe('filterManifestsByCapabilities', () => {
    it('returns all manifests when capabilities include all types', () => {
      const caps: ConsumerCapabilities = {
        widgetTypes: ['bar-chart', 'line-chart', 'kpi-card', 'table'],
        interactions: [],
        maxNestingDepth: 3,
        supportedLayoutTypes: [],
      };
      const result = filterManifestsByCapabilities(manifests, caps);
      expect(result).toHaveLength(4);
    });

    it('filters to only matching widget types', () => {
      const caps: ConsumerCapabilities = {
        widgetTypes: ['bar-chart', 'kpi-card'],
        interactions: [],
        maxNestingDepth: 3,
        supportedLayoutTypes: [],
      };
      const result = filterManifestsByCapabilities(manifests, caps);
      expect(result).toHaveLength(2);
      expect(result.map(m => m.type)).toEqual(['bar-chart', 'kpi-card']);
    });

    it('returns empty array when no types match', () => {
      const caps: ConsumerCapabilities = {
        widgetTypes: ['gauge'],
        interactions: [],
        maxNestingDepth: 3,
        supportedLayoutTypes: [],
      };
      const result = filterManifestsByCapabilities(manifests, caps);
      expect(result).toHaveLength(0);
    });

    it('returns all manifests when capabilities is undefined', () => {
      const result = filterManifestsByCapabilities(manifests, undefined);
      expect(result).toHaveLength(4);
    });
  });

  describe('groupManifestsByCategory', () => {
    it('groups manifests by category', () => {
      const grouped = groupManifestsByCategory(manifests);
      expect(grouped.get('chart')).toHaveLength(2);
      expect(grouped.get('kpi')).toHaveLength(1);
      expect(grouped.get('data')).toHaveLength(1);
    });

    it('returns empty map for empty input', () => {
      const grouped = groupManifestsByCategory([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('searchManifests', () => {
    it('finds manifests by name (case-insensitive)', () => {
      const result = searchManifests(manifests, 'bar');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('bar-chart');
    });

    it('finds manifests by description', () => {
      const result = searchManifests(manifests, 'performance');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('kpi-card');
    });

    it('returns all when query is empty', () => {
      const result = searchManifests(manifests, '');
      expect(result).toHaveLength(4);
    });

    it('returns empty when no match', () => {
      const result = searchManifests(manifests, 'zzzzz');
      expect(result).toHaveLength(0);
    });

    it('matches by widget type', () => {
      const result = searchManifests(manifests, 'table');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('table');
    });
  });
});
