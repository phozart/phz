/**
 * Tests for GridExportConfig — export configuration, async threshold, and format checks.
 *
 * Covers createDefaultExportConfig, shouldUseAsyncExport, and isFormatEnabled.
 */
import {
  createDefaultExportConfig,
  shouldUseAsyncExport,
  isFormatEnabled,
} from '@phozart/phz-shared/coordination';
import type { GridExportConfig, ExportFormat } from '@phozart/phz-shared/coordination';

// ========================================================================
// createDefaultExportConfig
// ========================================================================

describe('createDefaultExportConfig', () => {
  it('creates config with default values', () => {
    const config = createDefaultExportConfig();
    expect(config.enabledFormats).toEqual(['csv', 'xlsx']);
    expect(config.includeHeaders).toBe(true);
    expect(config.includeGroupSummary).toBe(true);
    expect(config.asyncThreshold).toBe(10_000);
  });

  it('does not set maxRows by default', () => {
    const config = createDefaultExportConfig();
    expect(config.maxRows).toBeUndefined();
  });

  it('does not set fileName by default', () => {
    const config = createDefaultExportConfig();
    expect(config.fileName).toBeUndefined();
  });

  it('applies overrides', () => {
    const config = createDefaultExportConfig({
      enabledFormats: ['csv', 'json'],
      maxRows: 50_000,
      includeHeaders: false,
      fileName: 'export-data',
    });
    expect(config.enabledFormats).toEqual(['csv', 'json']);
    expect(config.maxRows).toBe(50_000);
    expect(config.includeHeaders).toBe(false);
    expect(config.fileName).toBe('export-data');
    // Non-overridden values remain default
    expect(config.includeGroupSummary).toBe(true);
    expect(config.asyncThreshold).toBe(10_000);
  });

  it('overrides asyncThreshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 50_000 });
    expect(config.asyncThreshold).toBe(50_000);
  });

  it('sets asyncThreshold to undefined to disable async', () => {
    const config = createDefaultExportConfig({ asyncThreshold: undefined });
    expect(config.asyncThreshold).toBeUndefined();
  });

  it('works with no arguments', () => {
    const config = createDefaultExportConfig();
    expect(config).toBeDefined();
  });

  it('works with undefined argument', () => {
    const config = createDefaultExportConfig(undefined);
    expect(config.enabledFormats).toEqual(['csv', 'xlsx']);
  });

  it('overrides all formats', () => {
    const config = createDefaultExportConfig({
      enabledFormats: ['csv', 'xlsx', 'json', 'parquet', 'pdf'],
    });
    expect(config.enabledFormats).toHaveLength(5);
  });

  it('allows empty formats array', () => {
    const config = createDefaultExportConfig({ enabledFormats: [] });
    expect(config.enabledFormats).toEqual([]);
  });
});

// ========================================================================
// shouldUseAsyncExport
// ========================================================================

describe('shouldUseAsyncExport', () => {
  it('returns true when rowCount exceeds asyncThreshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 10_000 });
    expect(shouldUseAsyncExport(config, 10_001)).toBe(true);
  });

  it('returns false when rowCount is at asyncThreshold (boundary)', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 10_000 });
    expect(shouldUseAsyncExport(config, 10_000)).toBe(false);
  });

  it('returns false when rowCount is below asyncThreshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 10_000 });
    expect(shouldUseAsyncExport(config, 5_000)).toBe(false);
  });

  it('returns false when asyncThreshold is undefined', () => {
    const config = createDefaultExportConfig({ asyncThreshold: undefined });
    expect(shouldUseAsyncExport(config, 1_000_000)).toBe(false);
  });

  it('returns false when rowCount is 0', () => {
    const config = createDefaultExportConfig();
    expect(shouldUseAsyncExport(config, 0)).toBe(false);
  });

  it('handles very large row counts', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 100 });
    expect(shouldUseAsyncExport(config, 10_000_000)).toBe(true);
  });

  it('handles asyncThreshold of 0', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 0 });
    expect(shouldUseAsyncExport(config, 1)).toBe(true);
    expect(shouldUseAsyncExport(config, 0)).toBe(false);
  });

  it('returns true for 1 row above threshold', () => {
    const config = createDefaultExportConfig({ asyncThreshold: 500 });
    expect(shouldUseAsyncExport(config, 501)).toBe(true);
    expect(shouldUseAsyncExport(config, 500)).toBe(false);
  });
});

// ========================================================================
// isFormatEnabled
// ========================================================================

describe('isFormatEnabled', () => {
  it('returns true for csv (default enabled)', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'csv')).toBe(true);
  });

  it('returns true for xlsx (default enabled)', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'xlsx')).toBe(true);
  });

  it('returns false for json (not default enabled)', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'json')).toBe(false);
  });

  it('returns false for parquet (not default enabled)', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'parquet')).toBe(false);
  });

  it('returns false for pdf (not default enabled)', () => {
    const config = createDefaultExportConfig();
    expect(isFormatEnabled(config, 'pdf')).toBe(false);
  });

  it('returns true for custom enabled formats', () => {
    const config = createDefaultExportConfig({ enabledFormats: ['json', 'pdf'] });
    expect(isFormatEnabled(config, 'json')).toBe(true);
    expect(isFormatEnabled(config, 'pdf')).toBe(true);
    expect(isFormatEnabled(config, 'csv')).toBe(false);
  });

  it('returns false for all formats when enabledFormats is empty', () => {
    const config = createDefaultExportConfig({ enabledFormats: [] });
    const formats: ExportFormat[] = ['csv', 'xlsx', 'json', 'parquet', 'pdf'];
    for (const fmt of formats) {
      expect(isFormatEnabled(config, fmt)).toBe(false);
    }
  });

  it('returns true for all formats when all are enabled', () => {
    const config = createDefaultExportConfig({
      enabledFormats: ['csv', 'xlsx', 'json', 'parquet', 'pdf'],
    });
    const formats: ExportFormat[] = ['csv', 'xlsx', 'json', 'parquet', 'pdf'];
    for (const fmt of formats) {
      expect(isFormatEnabled(config, fmt)).toBe(true);
    }
  });
});
