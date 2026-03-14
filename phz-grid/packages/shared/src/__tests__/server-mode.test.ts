/**
 * Tests for server-mode configuration — ServerGridConfig management.
 *
 * Covers createDefaultServerGridConfig, isServerMode, and hasServerCapability.
 */
import {
  createDefaultServerGridConfig,
  isServerMode,
  hasServerCapability,
} from '@phozart/shared/coordination';
import type { ServerGridConfig } from '@phozart/shared/coordination';

// ========================================================================
// createDefaultServerGridConfig
// ========================================================================

describe('createDefaultServerGridConfig', () => {
  it('creates config with server mode disabled by default', () => {
    const config = createDefaultServerGridConfig();
    expect(config.enabled).toBe(false);
    expect(config.pageSize).toBe(50);
    expect(config.serverSort).toBe(false);
    expect(config.serverFilter).toBe(false);
    expect(config.serverGroupBy).toBe(false);
    expect(config.prefetchPages).toBe(1);
  });

  it('does not set totalRowCount by default', () => {
    const config = createDefaultServerGridConfig();
    expect(config.totalRowCount).toBeUndefined();
  });

  it('applies overrides', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      pageSize: 100,
      serverSort: true,
    });
    expect(config.enabled).toBe(true);
    expect(config.pageSize).toBe(100);
    expect(config.serverSort).toBe(true);
    // Non-overridden values remain default
    expect(config.serverFilter).toBe(false);
    expect(config.serverGroupBy).toBe(false);
  });

  it('overrides totalRowCount', () => {
    const config = createDefaultServerGridConfig({ totalRowCount: 10_000 });
    expect(config.totalRowCount).toBe(10_000);
  });

  it('overrides prefetchPages', () => {
    const config = createDefaultServerGridConfig({ prefetchPages: 3 });
    expect(config.prefetchPages).toBe(3);
  });

  it('enables all server capabilities at once', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverSort: true,
      serverFilter: true,
      serverGroupBy: true,
    });
    expect(config.serverSort).toBe(true);
    expect(config.serverFilter).toBe(true);
    expect(config.serverGroupBy).toBe(true);
  });

  it('works with no arguments', () => {
    const config = createDefaultServerGridConfig();
    expect(config).toBeDefined();
    expect(typeof config.enabled).toBe('boolean');
  });

  it('works with undefined overrides', () => {
    const config = createDefaultServerGridConfig(undefined);
    expect(config.enabled).toBe(false);
  });
});

// ========================================================================
// isServerMode
// ========================================================================

describe('isServerMode', () => {
  it('returns true when enabled is true', () => {
    const config = createDefaultServerGridConfig({ enabled: true });
    expect(isServerMode(config)).toBe(true);
  });

  it('returns false when enabled is false', () => {
    const config = createDefaultServerGridConfig({ enabled: false });
    expect(isServerMode(config)).toBe(false);
  });

  it('returns false for default config', () => {
    expect(isServerMode(createDefaultServerGridConfig())).toBe(false);
  });

  it('returns false for undefined config', () => {
    expect(isServerMode(undefined)).toBe(false);
  });

  it('returns false for null config', () => {
    expect(isServerMode(null)).toBe(false);
  });
});

// ========================================================================
// hasServerCapability
// ========================================================================

describe('hasServerCapability', () => {
  it('returns true for sort when serverSort is enabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverSort: true,
    });
    expect(hasServerCapability(config, 'sort')).toBe(true);
  });

  it('returns false for sort when serverSort is disabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverSort: false,
    });
    expect(hasServerCapability(config, 'sort')).toBe(false);
  });

  it('returns true for filter when serverFilter is enabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverFilter: true,
    });
    expect(hasServerCapability(config, 'filter')).toBe(true);
  });

  it('returns false for filter when serverFilter is disabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverFilter: false,
    });
    expect(hasServerCapability(config, 'filter')).toBe(false);
  });

  it('returns true for groupBy when serverGroupBy is enabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverGroupBy: true,
    });
    expect(hasServerCapability(config, 'groupBy')).toBe(true);
  });

  it('returns false for groupBy when serverGroupBy is disabled', () => {
    const config = createDefaultServerGridConfig({
      enabled: true,
      serverGroupBy: false,
    });
    expect(hasServerCapability(config, 'groupBy')).toBe(false);
  });

  it('returns false for all capabilities when enabled is false', () => {
    const config = createDefaultServerGridConfig({
      enabled: false,
      serverSort: true,
      serverFilter: true,
      serverGroupBy: true,
    });
    expect(hasServerCapability(config, 'sort')).toBe(false);
    expect(hasServerCapability(config, 'filter')).toBe(false);
    expect(hasServerCapability(config, 'groupBy')).toBe(false);
  });

  it('returns false for undefined config', () => {
    expect(hasServerCapability(undefined, 'sort')).toBe(false);
    expect(hasServerCapability(undefined, 'filter')).toBe(false);
    expect(hasServerCapability(undefined, 'groupBy')).toBe(false);
  });

  it('returns false for null config', () => {
    expect(hasServerCapability(null, 'sort')).toBe(false);
    expect(hasServerCapability(null, 'filter')).toBe(false);
    expect(hasServerCapability(null, 'groupBy')).toBe(false);
  });
});
