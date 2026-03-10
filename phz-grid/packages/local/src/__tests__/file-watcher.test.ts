import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deriveTableName, isImportable, createFileWatcher } from '../watchers/file-watcher.js';
import type { FileWatcher } from '../watchers/file-watcher.js';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('File Watcher Utilities', () => {
  describe('deriveTableName', () => {
    it('strips extension and lowercases', () => {
      expect(deriveTableName('Sales-Data.csv')).toBe('sales_data');
    });

    it('replaces non-alphanumeric chars with underscores', () => {
      expect(deriveTableName('Q1 2026 Report.parquet')).toBe('q1_2026_report');
    });

    it('collapses consecutive underscores', () => {
      expect(deriveTableName('data--v2..final.json')).toBe('data_v2_final');
    });

    it('handles simple filename', () => {
      expect(deriveTableName('users.csv')).toBe('users');
    });
  });

  describe('isImportable', () => {
    it('accepts .csv files', () => {
      expect(isImportable('data.csv')).toBe(true);
    });

    it('accepts .json files', () => {
      expect(isImportable('config.json')).toBe(true);
    });

    it('accepts .parquet files', () => {
      expect(isImportable('events.parquet')).toBe(true);
    });

    it('rejects dot files', () => {
      expect(isImportable('.hidden.csv')).toBe(false);
    });

    it('rejects unsupported extensions', () => {
      expect(isImportable('data.xlsx')).toBe(false);
      expect(isImportable('readme.md')).toBe(false);
      expect(isImportable('image.png')).toBe(false);
    });

    it('is case-insensitive for extensions', () => {
      expect(isImportable('data.CSV')).toBe(true);
      expect(isImportable('data.JSON')).toBe(true);
      expect(isImportable('data.Parquet')).toBe(true);
    });
  });
});

describe('FileWatcher lifecycle', () => {
  let testDir: string;
  let watcher: FileWatcher | null = null;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'phz-watch-'));
  });

  afterEach(async () => {
    if (watcher) {
      watcher.stop();
      watcher = null;
    }
    await rm(testDir, { recursive: true, force: true });
  });

  it('creates a file watcher with correct watch dir', () => {
    const importFn = vi.fn().mockResolvedValue(undefined);
    watcher = createFileWatcher({ watchDir: testDir, importFn });
    expect(watcher.getWatchDir()).toBe(testDir);
  });

  it('imports existing files on start', async () => {
    // Create a test file before starting the watcher
    await writeFile(join(testDir, 'existing.csv'), 'a,b\n1,2');

    const importFn = vi.fn().mockResolvedValue(undefined);
    watcher = createFileWatcher({ watchDir: testDir, importFn, debounceMs: 50 });
    await watcher.start();

    // Wait for debounce
    await new Promise(r => setTimeout(r, 100));

    expect(importFn).toHaveBeenCalledWith(
      join(testDir, 'existing.csv'),
      'existing',
    );
  });

  it('ignores dot files on start', async () => {
    await writeFile(join(testDir, '.hidden.csv'), 'a,b\n1,2');

    const importFn = vi.fn().mockResolvedValue(undefined);
    watcher = createFileWatcher({ watchDir: testDir, importFn, debounceMs: 50 });
    await watcher.start();

    await new Promise(r => setTimeout(r, 100));
    expect(importFn).not.toHaveBeenCalled();
  });

  it('stop clears all timers', async () => {
    const importFn = vi.fn().mockResolvedValue(undefined);
    watcher = createFileWatcher({ watchDir: testDir, importFn, debounceMs: 5000 });
    await watcher.start();

    // Create a file — it will queue a debounced import
    await writeFile(join(testDir, 'test.csv'), 'a,b\n1,2');
    await new Promise(r => setTimeout(r, 50));

    // Stop before debounce fires
    watcher.stop();
    watcher = null;

    // Wait past the debounce
    await new Promise(r => setTimeout(r, 100));

    // Import should NOT have been called since we stopped before debounce
    expect(importFn).not.toHaveBeenCalledWith(
      join(testDir, 'test.csv'),
      'test',
    );
  });

  it('stop is safe to call multiple times', () => {
    const importFn = vi.fn().mockResolvedValue(undefined);
    watcher = createFileWatcher({ watchDir: testDir, importFn });
    watcher.stop();
    watcher.stop(); // should not throw
    watcher = null;
  });
});
