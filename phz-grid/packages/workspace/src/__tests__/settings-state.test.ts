import { describe, it, expect } from 'vitest';
import {
  initialSettingsState,
  setTheme,
  updateBranding,
  updateDefaults,
  toggleFeatureFlag,
  setFeatureFlag,
  addFeatureFlag,
  removeFeatureFlag,
  isFeatureEnabled,
  getFlagsByCategory,
  getCategories,
  markSettingsSaved,
  resetToDefaults,
  validateSettings,
  BUILT_IN_FLAGS,
} from '../govern/settings-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialSettingsState', () => {
  it('creates state with defaults', () => {
    const state = initialSettingsState();
    expect(state.theme).toBe('auto');
    expect(state.branding.appName).toBe('PHZ Workspace');
    expect(state.defaults.density).toBe('comfortable');
    expect(state.featureFlags.length).toBe(BUILT_IN_FLAGS.length);
    expect(state.dirty).toBe(false);
  });

  it('accepts overrides', () => {
    const state = initialSettingsState({ theme: 'dark' });
    expect(state.theme).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

describe('theme', () => {
  it('sets theme', () => {
    let state = initialSettingsState();
    state = setTheme(state, 'dark');
    expect(state.theme).toBe('dark');
    expect(state.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

describe('branding', () => {
  it('updates branding', () => {
    let state = initialSettingsState();
    state = updateBranding(state, { appName: 'My App', primaryColor: '#ff0000' });
    expect(state.branding.appName).toBe('My App');
    expect(state.branding.primaryColor).toBe('#ff0000');
    expect(state.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

describe('defaults', () => {
  it('updates defaults', () => {
    let state = initialSettingsState();
    state = updateDefaults(state, { density: 'compact', pageSize: 100 });
    expect(state.defaults.density).toBe('compact');
    expect(state.defaults.pageSize).toBe(100);
    expect(state.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

describe('feature flags', () => {
  it('toggles a flag', () => {
    let state = initialSettingsState();
    const initialValue = isFeatureEnabled(state, 'ai-assist');
    state = toggleFeatureFlag(state, 'ai-assist');
    expect(isFeatureEnabled(state, 'ai-assist')).toBe(!initialValue);
  });

  it('sets a flag explicitly', () => {
    let state = initialSettingsState();
    state = setFeatureFlag(state, 'ai-assist', true);
    expect(isFeatureEnabled(state, 'ai-assist')).toBe(true);
  });

  it('adds a custom flag', () => {
    let state = initialSettingsState();
    state = addFeatureFlag(state, { id: 'custom', name: 'Custom', description: 'Test', enabled: true, category: 'test' });
    expect(state.featureFlags.length).toBe(BUILT_IN_FLAGS.length + 1);
  });

  it('does not add duplicate flag', () => {
    let state = initialSettingsState();
    state = addFeatureFlag(state, BUILT_IN_FLAGS[0]);
    expect(state.featureFlags.length).toBe(BUILT_IN_FLAGS.length);
  });

  it('removes a flag', () => {
    let state = initialSettingsState();
    state = addFeatureFlag(state, { id: 'custom', name: 'Custom', description: 'Test', enabled: true, category: 'test' });
    state = removeFeatureFlag(state, 'custom');
    expect(state.featureFlags.length).toBe(BUILT_IN_FLAGS.length);
  });

  it('getFlagsByCategory works', () => {
    const state = initialSettingsState();
    const exportFlags = getFlagsByCategory(state, 'export');
    expect(exportFlags.length).toBe(2);
  });

  it('getCategories returns sorted unique list', () => {
    const state = initialSettingsState();
    const categories = getCategories(state);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toEqual([...categories].sort());
  });

  it('isFeatureEnabled returns false for unknown flag', () => {
    const state = initialSettingsState();
    expect(isFeatureEnabled(state, 'nonexistent')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

describe('save', () => {
  it('marks settings saved', () => {
    let state = initialSettingsState();
    state = setTheme(state, 'dark');
    expect(state.dirty).toBe(true);
    state = markSettingsSaved(state);
    expect(state.dirty).toBe(false);
    expect(state.lastSavedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('resets to defaults', () => {
    let state = initialSettingsState();
    state = setTheme(state, 'dark');
    state = updateBranding(state, { appName: 'Changed' });
    state = updateDefaults(state, { density: 'compact' });
    state = resetToDefaults(state);
    expect(state.theme).toBe('auto');
    expect(state.branding.appName).toBe('PHZ Workspace');
    expect(state.defaults.density).toBe('comfortable');
    expect(state.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('passes with defaults', () => {
    const result = validateSettings(initialSettingsState());
    expect(result.valid).toBe(true);
  });

  it('fails with empty app name', () => {
    let state = initialSettingsState();
    state = updateBranding(state, { appName: '' });
    const result = validateSettings(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('App name is required');
  });

  it('fails with invalid color', () => {
    let state = initialSettingsState();
    state = updateBranding(state, { primaryColor: 'not-a-color' });
    const result = validateSettings(state);
    expect(result.valid).toBe(false);
  });

  it('fails with invalid page size', () => {
    let state = initialSettingsState();
    state = updateDefaults(state, { pageSize: 0 });
    const result = validateSettings(state);
    expect(result.valid).toBe(false);
  });
});
