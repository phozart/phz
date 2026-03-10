/**
 * Tests for enhanced DashboardDataPipeline — migrateLegacyDataConfig,
 * multi-source isDashboardDataConfig, and DataSourceConfig types.
 *
 * These tests cover the Wave 2 enhancements to the existing pipeline types.
 */
import {
  migrateLegacyDataConfig,
  isDashboardDataConfig,
  isDetailSourceConfig,
} from '@phozart/phz-shared/coordination';
import type {
  DashboardDataConfig,
  DataSourceConfig,
  PreloadConfig,
  FullLoadConfig,
} from '@phozart/phz-shared/coordination';

// ========================================================================
// migrateLegacyDataConfig
// ========================================================================

describe('migrateLegacyDataConfig', () => {
  it('wraps legacy preload/fullLoad into a default source', () => {
    const legacy: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b', 'c'] } },
    };
    const migrated = migrateLegacyDataConfig(legacy);
    expect(migrated.sources).toHaveLength(1);
    expect(migrated.sources![0].sourceId).toBe('default');
    expect(migrated.sources![0].preload?.query.source).toBe('ds1');
    expect(migrated.sources![0].fullLoad?.query.fields).toEqual(['a', 'b', 'c']);
  });

  it('preserves legacy preload and fullLoad for backward compatibility', () => {
    const legacy: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['x'] } },
      fullLoad: { query: { source: 'ds1', fields: ['x', 'y'] } },
    };
    const migrated = migrateLegacyDataConfig(legacy);
    expect(migrated.preload).toEqual(legacy.preload);
    expect(migrated.fullLoad).toEqual(legacy.fullLoad);
  });

  it('returns config as-is when sources already exists', () => {
    const config: DashboardDataConfig = {
      sources: [
        { sourceId: 'src1', preload: { query: { source: 'ds1', fields: ['a'] } } },
      ],
    };
    const result = migrateLegacyDataConfig(config);
    expect(result).toBe(config); // same reference
  });

  it('returns config as-is when sources is non-empty (no double migration)', () => {
    const config: DashboardDataConfig = {
      sources: [
        { sourceId: 'src1' },
        { sourceId: 'src2' },
      ],
      preload: { query: { source: 'old', fields: [] } },
      fullLoad: { query: { source: 'old', fields: [] } },
    };
    const result = migrateLegacyDataConfig(config);
    expect(result).toBe(config);
    expect(result.sources).toHaveLength(2);
  });

  it('handles config with only preload (no fullLoad)', () => {
    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
    };
    const migrated = migrateLegacyDataConfig(config);
    expect(migrated.sources).toHaveLength(1);
    expect(migrated.sources![0].preload).toBeDefined();
    expect(migrated.sources![0].fullLoad).toBeUndefined();
  });

  it('handles config with only fullLoad (no preload)', () => {
    const config: DashboardDataConfig = {
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] } },
    };
    const migrated = migrateLegacyDataConfig(config);
    expect(migrated.sources).toHaveLength(1);
    expect(migrated.sources![0].preload).toBeUndefined();
    expect(migrated.sources![0].fullLoad).toBeDefined();
  });

  it('handles config with neither preload nor fullLoad', () => {
    const config: DashboardDataConfig = {};
    const migrated = migrateLegacyDataConfig(config);
    expect(migrated.sources).toEqual([]);
  });

  it('preserves detailSources', () => {
    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: [] } },
      fullLoad: { query: { source: 'ds1', fields: [] } },
      detailSources: [
        {
          id: 'd1',
          name: 'Detail',
          dataSourceId: 'ds1',
          filterMapping: [],
          baseQuery: { source: 'ds1', fields: [] },
          trigger: 'user-action',
        },
      ],
    };
    const migrated = migrateLegacyDataConfig(config);
    expect(migrated.detailSources).toHaveLength(1);
  });

  it('preserves transition setting', () => {
    const config: DashboardDataConfig = {
      preload: { query: { source: 'ds1', fields: [] } },
      fullLoad: { query: { source: 'ds1', fields: [] } },
      transition: 'fade',
    };
    const migrated = migrateLegacyDataConfig(config);
    expect(migrated.transition).toBe('fade');
  });

  it('handles empty sources array (triggers legacy migration)', () => {
    const config: DashboardDataConfig = {
      sources: [],
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a'] } },
    };
    const migrated = migrateLegacyDataConfig(config);
    // Empty sources array should trigger migration
    expect(migrated.sources).toHaveLength(1);
    expect(migrated.sources![0].sourceId).toBe('default');
  });
});

// ========================================================================
// isDashboardDataConfig — multi-source format
// ========================================================================

describe('isDashboardDataConfig — multi-source format', () => {
  it('returns true for valid multi-source config', () => {
    const config = {
      sources: [
        { sourceId: 'src1', preload: { query: { source: 'ds1', fields: ['a'] } } },
      ],
    };
    expect(isDashboardDataConfig(config)).toBe(true);
  });

  it('returns true for multi-source with multiple entries', () => {
    const config = {
      sources: [
        { sourceId: 'src1' },
        { sourceId: 'src2' },
      ],
    };
    expect(isDashboardDataConfig(config)).toBe(true);
  });

  it('returns false for sources with missing sourceId', () => {
    const config = {
      sources: [{ preload: { query: {} } }],
    };
    expect(isDashboardDataConfig(config)).toBe(false);
  });

  it('returns false for sources with null entry', () => {
    const config = {
      sources: [null],
    };
    expect(isDashboardDataConfig(config)).toBe(false);
  });

  it('returns false for empty sources array (falls to legacy check)', () => {
    expect(isDashboardDataConfig({ sources: [] })).toBe(false);
  });

  it('returns true for legacy format with preload and fullLoad', () => {
    const config = {
      preload: { query: { source: 'ds1', fields: ['a'] } },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] } },
    };
    expect(isDashboardDataConfig(config)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDashboardDataConfig(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDashboardDataConfig(undefined)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isDashboardDataConfig('hello')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isDashboardDataConfig(42)).toBe(false);
  });
});

// ========================================================================
// isDetailSourceConfig — edge cases
// ========================================================================

describe('isDetailSourceConfig — additional edge cases', () => {
  it('returns true for valid config', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 'Detail',
        dataSourceId: 'ds1',
        filterMapping: [],
        baseQuery: { source: 'ds1', fields: [] },
        trigger: 'user-action',
      }),
    ).toBe(true);
  });

  it('returns true for complex trigger', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 'Detail',
        dataSourceId: 'ds1',
        filterMapping: [],
        baseQuery: { source: 'ds1', fields: [] },
        trigger: { type: 'drill-through', fromWidgetTypes: ['bar'] },
      }),
    ).toBe(true);
  });

  it('returns true for breach trigger', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 'Detail',
        dataSourceId: 'ds1',
        filterMapping: [],
        baseQuery: { source: 'ds1', fields: [] },
        trigger: { type: 'breach' },
      }),
    ).toBe(true);
  });

  it('returns false when filterMapping is not an array', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 'Detail',
        dataSourceId: 'ds1',
        filterMapping: 'not-array',
        baseQuery: {},
        trigger: 'user-action',
      }),
    ).toBe(false);
  });

  it('returns false when name is not a string', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 123,
        dataSourceId: 'ds1',
        filterMapping: [],
        baseQuery: {},
        trigger: 'user-action',
      }),
    ).toBe(false);
  });

  it('returns false when dataSourceId is not a string', () => {
    expect(
      isDetailSourceConfig({
        id: 'd1',
        name: 'Detail',
        dataSourceId: 42,
        filterMapping: [],
        baseQuery: {},
        trigger: 'user-action',
      }),
    ).toBe(false);
  });
});

// ========================================================================
// DataSourceConfig shape validation
// ========================================================================

describe('DataSourceConfig shape', () => {
  it('supports all optional fields', () => {
    const source: DataSourceConfig = {
      sourceId: 'src1',
      alias: 'Primary Source',
      preload: { query: { source: 'ds1', fields: ['a'] }, usePersonalView: true },
      fullLoad: { query: { source: 'ds1', fields: ['a', 'b'] }, applyCurrentFilters: true, maxRows: 50000 },
      refreshIntervalMs: 30_000,
    };
    expect(source.sourceId).toBe('src1');
    expect(source.alias).toBe('Primary Source');
    expect(source.refreshIntervalMs).toBe(30_000);
  });

  it('requires only sourceId', () => {
    const source: DataSourceConfig = { sourceId: 'minimal' };
    expect(source.sourceId).toBe('minimal');
    expect(source.alias).toBeUndefined();
    expect(source.preload).toBeUndefined();
    expect(source.fullLoad).toBeUndefined();
    expect(source.refreshIntervalMs).toBeUndefined();
  });
});
