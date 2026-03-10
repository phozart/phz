/**
 * Tests for viewer-config.ts — ViewerShellConfig
 */
import { describe, it, expect } from 'vitest';
import {
  createViewerShellConfig,
  createDefaultFeatureFlags,
} from '../viewer-config.js';

// Minimal mock adapters
const mockDataAdapter = {
  execute: async () => ({ columns: [], rows: [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 0 } }),
  getSchema: async () => ({ id: 'test', name: 'test', fields: [] }),
  listDataSources: async () => [],
  getDistinctValues: async () => ({ values: [], totalCount: 0, truncated: false }),
  getFieldStats: async () => ({ distinctCount: 0, nullCount: 0, totalCount: 0 }),
};

const mockPersistenceAdapter = {
  save: async () => ({ id: '1', version: 1, savedAt: Date.now(), success: true }),
  load: async () => null,
  delete: async () => ({ success: true }),
  list: async () => ({ items: [], totalCount: 0, hasMore: false }),
  saveFilterPreset: async () => ({ id: '1', version: 1, savedAt: Date.now(), success: true }),
  listFilterPresets: async () => [],
  deleteFilterPreset: async () => ({ success: true }),
  savePersonalView: async () => ({ id: '1', version: 1, savedAt: Date.now(), success: true }),
  loadPersonalView: async () => null,
  deletePersonalView: async () => ({ success: true }),
  saveFieldEnrichments: async () => ({ id: '1', version: 1, savedAt: Date.now(), success: true }),
  loadFieldEnrichments: async () => [],
};

describe('viewer-config', () => {
  describe('createViewerShellConfig', () => {
    it('creates config with sensible defaults', () => {
      const config = createViewerShellConfig({
        dataAdapter: mockDataAdapter,
        persistenceAdapter: mockPersistenceAdapter,
      });

      expect(config.dataAdapter).toBe(mockDataAdapter);
      expect(config.persistenceAdapter).toBe(mockPersistenceAdapter);
      expect(config.features.explorer).toBe(true);
      expect(config.features.attentionItems).toBe(true);
      expect(config.features.filterBar).toBe(true);
      expect(config.features.keyboardShortcuts).toBe(true);
      expect(config.features.mobileResponsive).toBe(true);
      expect(config.features.urlRouting).toBe(false);
      expect(config.branding.title).toBe('phz-grid Viewer');
      expect(config.branding.theme).toBe('auto');
      expect(config.branding.locale).toBe('en-US');
      expect(config.initialScreen).toBe('catalog');
    });

    it('accepts feature flag overrides', () => {
      const config = createViewerShellConfig({
        dataAdapter: mockDataAdapter,
        persistenceAdapter: mockPersistenceAdapter,
        features: { explorer: false, urlRouting: true } as any,
      });

      expect(config.features.explorer).toBe(false);
      expect(config.features.urlRouting).toBe(true);
      expect(config.features.filterBar).toBe(true);
    });

    it('accepts branding overrides', () => {
      const config = createViewerShellConfig({
        dataAdapter: mockDataAdapter,
        persistenceAdapter: mockPersistenceAdapter,
        branding: { title: 'My App', theme: 'dark' },
      });

      expect(config.branding.title).toBe('My App');
      expect(config.branding.theme).toBe('dark');
      expect(config.branding.locale).toBe('en-US');
    });

    it('accepts initial screen and artifact', () => {
      const config = createViewerShellConfig({
        dataAdapter: mockDataAdapter,
        persistenceAdapter: mockPersistenceAdapter,
        initialScreen: 'dashboard',
        initialArtifactId: 'dash-1',
        initialArtifactType: 'dashboard',
      });

      expect(config.initialScreen).toBe('dashboard');
      expect(config.initialArtifactId).toBe('dash-1');
      expect(config.initialArtifactType).toBe('dashboard');
    });
  });

  describe('createDefaultFeatureFlags', () => {
    it('creates all-enabled defaults', () => {
      const flags = createDefaultFeatureFlags();
      expect(flags.explorer).toBe(true);
      expect(flags.attentionItems).toBe(true);
      expect(flags.filterBar).toBe(true);
      expect(flags.keyboardShortcuts).toBe(true);
      expect(flags.mobileResponsive).toBe(true);
      expect(flags.urlRouting).toBe(false);
    });

    it('accepts partial overrides', () => {
      const flags = createDefaultFeatureFlags({ explorer: false });
      expect(flags.explorer).toBe(false);
      expect(flags.attentionItems).toBe(true);
    });
  });
});
