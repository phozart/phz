/**
 * Tests for EditorShellConfig (B-2.02)
 */
import {
  createEditorShellConfig,
  validateEditorConfig,
} from '../editor-config.js';
import type { EditorShellConfig } from '../index.js';

describe('createEditorShellConfig', () => {
  it('creates config with all features enabled', () => {
    const config = createEditorShellConfig();
    expect(config.features.explorer).toBe(true);
    expect(config.features.sharing).toBe(true);
    expect(config.features.alerts).toBe(true);
    expect(config.features.measurePalette).toBe(true);
    expect(config.features.autoSave).toBe(true);
    expect(config.features.undoRedo).toBe(true);
    expect(config.features.createDashboard).toBe(true);
    expect(config.features.createReport).toBe(true);
  });

  it('has sensible defaults', () => {
    const config = createEditorShellConfig();
    expect(config.defaultScreen).toBe('catalog');
    expect(config.autoSaveDebounceMs).toBe(2000);
    expect(config.maxUndoDepth).toBe(50);
    expect(config.baseUrl).toBe('');
    expect(config.theme).toBe('auto');
    expect(config.locale).toBe('en');
  });

  it('merges feature overrides', () => {
    const config = createEditorShellConfig({
      features: { explorer: false, sharing: false } as any,
    });
    expect(config.features.explorer).toBe(false);
    expect(config.features.sharing).toBe(false);
    // Non-overridden features remain true
    expect(config.features.alerts).toBe(true);
    expect(config.features.measurePalette).toBe(true);
  });

  it('merges top-level overrides', () => {
    const config = createEditorShellConfig({
      defaultScreen: 'explorer',
      locale: 'de',
      autoSaveDebounceMs: 5000,
    });
    expect(config.defaultScreen).toBe('explorer');
    expect(config.locale).toBe('de');
    expect(config.autoSaveDebounceMs).toBe(5000);
  });
});

describe('validateEditorConfig', () => {
  it('returns valid for complete config', () => {
    const config = createEditorShellConfig({
      persistenceAdapter: {} as any,
      measureRegistryAdapter: {} as any,
    });
    const result = validateEditorConfig(config);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('warns about sharing without persistence adapter', () => {
    const config = createEditorShellConfig();
    const result = validateEditorConfig(config);
    expect(result.valid).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Sharing is enabled but no persistenceAdapter')]),
    );
  });

  it('warns about measure palette without registry adapter', () => {
    const config = createEditorShellConfig();
    const result = validateEditorConfig(config);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Measure palette is enabled but no measureRegistryAdapter')]),
    );
  });

  it('warns about alerts without persistence adapter', () => {
    const config = createEditorShellConfig();
    const result = validateEditorConfig(config);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Alerts are enabled but no persistenceAdapter')]),
    );
  });

  it('warns about low auto-save debounce', () => {
    const config = createEditorShellConfig({ autoSaveDebounceMs: 100 });
    const result = validateEditorConfig(config);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('autoSaveDebounceMs is below 500ms')]),
    );
  });

  it('no warnings when features are disabled without adapters', () => {
    const config = createEditorShellConfig({
      features: {
        sharing: false,
        alerts: false,
        measurePalette: false,
        explorer: true,
        autoSave: true,
        undoRedo: true,
        createDashboard: true,
        createReport: true,
      },
    });
    const result = validateEditorConfig(config);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
