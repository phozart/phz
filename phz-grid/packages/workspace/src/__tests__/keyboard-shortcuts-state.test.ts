import { describe, it, expect } from 'vitest';
import {
  initialKeyboardShortcutsState,
  setActiveContext,
  getActiveShortcuts,
  matchContextualShortcut,
  openHelpOverlay,
  closeHelpOverlay,
  toggleHelpOverlay,
  setCustomBinding,
  clearCustomBinding,
  clearAllCustomBindings,
  startRecording,
  recordKeyCombination,
  cancelRecording,
  detectConflicts,
  getShortcutsByGroup,
  formatContextualShortcut,
  DEFAULT_CONTEXTUAL_SHORTCUTS,
} from '../shell/keyboard-shortcuts-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialKeyboardShortcutsState', () => {
  it('creates state with default shortcuts', () => {
    const state = initialKeyboardShortcutsState();
    expect(state.shortcuts.length).toBe(DEFAULT_CONTEXTUAL_SHORTCUTS.length);
    expect(state.activeContext).toBe('global');
    expect(state.helpOverlayOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Context management
// ---------------------------------------------------------------------------

describe('context management', () => {
  it('sets active context', () => {
    let state = initialKeyboardShortcutsState();
    state = setActiveContext(state, 'report-editor');
    expect(state.activeContext).toBe('report-editor');
  });

  it('getActiveShortcuts includes global and context-specific', () => {
    let state = initialKeyboardShortcutsState();
    state = setActiveContext(state, 'catalog');
    const active = getActiveShortcuts(state);
    const hasGlobal = active.some(s => s.context === 'global');
    const hasCatalog = active.some(s => s.context === 'catalog');
    expect(hasGlobal).toBe(true);
    expect(hasCatalog).toBe(true);
    expect(active.every(s => s.context === 'global' || s.context === 'catalog')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

describe('matchContextualShortcut', () => {
  it('matches Ctrl+S', () => {
    const state = initialKeyboardShortcutsState();
    const match = matchContextualShortcut(state, { key: 's', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(match).toBeDefined();
    expect(match!.id).toBe('global-save');
  });

  it('matches Cmd+S (metaKey)', () => {
    const state = initialKeyboardShortcutsState();
    const match = matchContextualShortcut(state, { key: 's', ctrlKey: false, shiftKey: false, altKey: false, metaKey: true });
    expect(match).toBeDefined();
    expect(match!.id).toBe('global-save');
  });

  it('matches Ctrl+Shift+Z for redo', () => {
    const state = initialKeyboardShortcutsState();
    const match = matchContextualShortcut(state, { key: 'z', ctrlKey: true, shiftKey: true, altKey: false, metaKey: false });
    expect(match).toBeDefined();
    expect(match!.id).toBe('global-redo');
  });

  it('returns undefined for unmatched', () => {
    const state = initialKeyboardShortcutsState();
    const match = matchContextualShortcut(state, { key: 'x', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false });
    expect(match).toBeUndefined();
  });

  it('respects active context', () => {
    let state = initialKeyboardShortcutsState();
    state = setActiveContext(state, 'catalog');
    const match = matchContextualShortcut(state, { key: 'n', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(match).toBeDefined();
    expect(match!.id).toBe('catalog-new');
  });

  it('context shortcuts not available outside context', () => {
    let state = initialKeyboardShortcutsState();
    state = setActiveContext(state, 'settings');
    const match = matchContextualShortcut(state, { key: 'n', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(match).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Help overlay
// ---------------------------------------------------------------------------

describe('help overlay', () => {
  it('opens and closes', () => {
    let state = initialKeyboardShortcutsState();
    state = openHelpOverlay(state);
    expect(state.helpOverlayOpen).toBe(true);
    state = closeHelpOverlay(state);
    expect(state.helpOverlayOpen).toBe(false);
  });

  it('toggles', () => {
    let state = initialKeyboardShortcutsState();
    state = toggleHelpOverlay(state);
    expect(state.helpOverlayOpen).toBe(true);
    state = toggleHelpOverlay(state);
    expect(state.helpOverlayOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Custom bindings
// ---------------------------------------------------------------------------

describe('custom bindings', () => {
  it('sets custom binding', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-save', { key: 'd', ctrl: true });
    expect(state.customBindings.get('global-save')).toEqual({ key: 'd', ctrl: true });
  });

  it('does not set binding for non-customizable shortcut', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-escape', { key: 'x' });
    expect(state.customBindings.has('global-escape')).toBe(false);
  });

  it('clears custom binding', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-save', { key: 'd', ctrl: true });
    state = clearCustomBinding(state, 'global-save');
    expect(state.customBindings.has('global-save')).toBe(false);
  });

  it('clears all custom bindings', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-save', { key: 'd', ctrl: true });
    state = setCustomBinding(state, 'global-undo', { key: 'u', ctrl: true });
    state = clearAllCustomBindings(state);
    expect(state.customBindings.size).toBe(0);
  });

  it('custom binding affects matching', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-save', { key: 'd', ctrl: true });
    const matchOld = matchContextualShortcut(state, { key: 's', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(matchOld?.id).not.toBe('global-save');
    const matchNew = matchContextualShortcut(state, { key: 'd', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(matchNew?.id).toBe('global-save');
  });
});

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

describe('recording', () => {
  it('starts and records key combination', () => {
    let state = initialKeyboardShortcutsState();
    state = startRecording(state, 'global-save');
    expect(state.recordingShortcutId).toBe('global-save');
    state = recordKeyCombination(state, { key: 'b', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(state.recordingShortcutId).toBeUndefined();
    expect(state.customBindings.get('global-save')).toBeDefined();
  });

  it('ignores modifier-only keys', () => {
    let state = initialKeyboardShortcutsState();
    state = startRecording(state, 'global-save');
    state = recordKeyCombination(state, { key: 'Control', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
    expect(state.recordingShortcutId).toBe('global-save');
  });

  it('does not start for non-customizable', () => {
    let state = initialKeyboardShortcutsState();
    state = startRecording(state, 'global-search');
    expect(state.recordingShortcutId).toBeUndefined();
  });

  it('cancels recording', () => {
    let state = initialKeyboardShortcutsState();
    state = startRecording(state, 'global-save');
    state = cancelRecording(state);
    expect(state.recordingShortcutId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

describe('conflict detection', () => {
  it('detects no conflicts with defaults', () => {
    const state = initialKeyboardShortcutsState();
    expect(detectConflicts(state)).toHaveLength(0);
  });

  it('detects conflict when custom binding overlaps', () => {
    let state = initialKeyboardShortcutsState();
    // Set save to same combo as undo (Ctrl+Z)
    state = setCustomBinding(state, 'global-save', { key: 'z', ctrl: true });
    const conflicts = detectConflicts(state);
    expect(conflicts.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Grouping and formatting
// ---------------------------------------------------------------------------

describe('grouping', () => {
  it('groups shortcuts', () => {
    const state = initialKeyboardShortcutsState();
    const groups = getShortcutsByGroup(state);
    expect(groups.size).toBeGreaterThan(0);
    expect(groups.has('General')).toBe(true);
  });
});

describe('formatting', () => {
  it('formats default shortcut', () => {
    const state = initialKeyboardShortcutsState();
    expect(formatContextualShortcut(state, 'global-save')).toBe('Ctrl+S');
  });

  it('formats custom binding', () => {
    let state = initialKeyboardShortcutsState();
    state = setCustomBinding(state, 'global-save', { key: 'd', ctrl: true, shift: true });
    expect(formatContextualShortcut(state, 'global-save')).toBe('Ctrl+Shift+D');
  });

  it('returns empty for unknown', () => {
    const state = initialKeyboardShortcutsState();
    expect(formatContextualShortcut(state, 'nonexistent')).toBe('');
  });
});
