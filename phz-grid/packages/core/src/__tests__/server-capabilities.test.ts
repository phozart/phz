import { describe, it, expect } from 'vitest';
import {
  resolveCapabilities,
  DEFAULT_SERVER_CAPABILITIES,
  isFeatureEnabled,
} from '../server-capabilities.js';
import type { ServerCapabilities } from '../types/server.js';

describe('WI 18: resolveCapabilities — default capabilities', () => {
  it('returns all-false defaults when no capabilities provided', () => {
    const caps = resolveCapabilities(undefined);
    expect(caps.sort).toBe(false);
    expect(caps.filter).toBe(false);
    expect(caps.grouping).toBe(false);
    expect(caps.pivot).toBe(false);
    expect(caps.fullTextSearch).toBe(false);
    expect(caps.cursorPagination).toBe(false);
    expect(caps.exactTotalCount).toBe(false);
    expect(caps.realTimeUpdates).toBe(false);
    expect(caps.exportFormats).toBeUndefined();
  });

  it('DEFAULT_SERVER_CAPABILITIES is all-false', () => {
    expect(DEFAULT_SERVER_CAPABILITIES.sort).toBe(false);
    expect(DEFAULT_SERVER_CAPABILITIES.filter).toBe(false);
    expect(DEFAULT_SERVER_CAPABILITIES.realTimeUpdates).toBe(false);
  });
});

describe('WI 18: resolveCapabilities — merging', () => {
  it('merges partial capabilities with defaults', () => {
    const caps = resolveCapabilities({ sort: true, filter: true } as Partial<ServerCapabilities> as ServerCapabilities);
    expect(caps.sort).toBe(true);
    expect(caps.filter).toBe(true);
    expect(caps.grouping).toBe(false);
  });

  it('preserves all provided capabilities', () => {
    const input: ServerCapabilities = {
      sort: true,
      filter: true,
      grouping: true,
      pivot: true,
      fullTextSearch: true,
      cursorPagination: true,
      exactTotalCount: true,
      realTimeUpdates: true,
      exportFormats: ['csv', 'xlsx'],
      filterOperators: { string: ['equals', 'contains'] },
    };
    const caps = resolveCapabilities(input);
    expect(caps).toEqual(input);
  });
});

describe('WI 18: isFeatureEnabled — feature toggling', () => {
  const fullCaps: ServerCapabilities = {
    sort: true,
    filter: true,
    grouping: true,
    pivot: true,
    fullTextSearch: true,
    cursorPagination: true,
    exactTotalCount: true,
    realTimeUpdates: true,
    exportFormats: ['csv', 'xlsx', 'pdf'],
  };

  const minimalCaps: ServerCapabilities = {
    sort: true,
    filter: false,
    grouping: false,
    pivot: false,
    fullTextSearch: false,
    cursorPagination: false,
    exactTotalCount: true,
    realTimeUpdates: false,
  };

  it('returns true for enabled features', () => {
    expect(isFeatureEnabled(fullCaps, 'sort')).toBe(true);
    expect(isFeatureEnabled(fullCaps, 'filter')).toBe(true);
    expect(isFeatureEnabled(fullCaps, 'grouping')).toBe(true);
  });

  it('returns false for disabled features', () => {
    expect(isFeatureEnabled(minimalCaps, 'filter')).toBe(false);
    expect(isFeatureEnabled(minimalCaps, 'grouping')).toBe(false);
    expect(isFeatureEnabled(minimalCaps, 'pivot')).toBe(false);
  });

  it('checks export format availability', () => {
    expect(isFeatureEnabled(fullCaps, 'export', 'csv')).toBe(true);
    expect(isFeatureEnabled(fullCaps, 'export', 'parquet')).toBe(false);
    expect(isFeatureEnabled(minimalCaps, 'export')).toBe(false);
  });

  it('returns false for export when no formats provided', () => {
    expect(isFeatureEnabled(minimalCaps, 'export', 'csv')).toBe(false);
  });
});
