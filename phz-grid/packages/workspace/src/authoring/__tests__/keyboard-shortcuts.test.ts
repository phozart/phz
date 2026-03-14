import { describe, it, expect } from 'vitest';
import {
  matchShortcut,
  createShortcutHandler,
  formatShortcut,
  DEFAULT_AUTHORING_SHORTCUTS,
} from '../keyboard-shortcuts.js';
import type { ShortcutBinding, ShortcutMatchEvent } from '../keyboard-shortcuts.js';

/** Helper to build a minimal ShortcutMatchEvent. */
function ev(overrides: Partial<ShortcutMatchEvent>): ShortcutMatchEvent {
  return {
    key: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  };
}

describe('keyboard-shortcuts', () => {
  describe('matchShortcut', () => {
    it('matches Ctrl+Z to undo on other platform', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('undo');
    });

    it('matches Ctrl+Shift+Z to redo on other platform', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', ctrlKey: true, shiftKey: true }),
        'other',
      );
      expect(action).toBe('redo');
    });

    it('matches Ctrl+Y to redo on other platform', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'y', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('redo');
    });

    it('matches Ctrl+S to save', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 's', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('save');
    });

    it('returns null for unbound key', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'q', ctrlKey: true }),
        'other',
      );
      expect(action).toBeNull();
    });

    it('returns null for plain letter key with no modifier', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z' }),
        'other',
      );
      expect(action).toBeNull();
    });

    it('on mac platform uses metaKey instead of ctrlKey for Cmd+Z', () => {
      // metaKey (Cmd) should match
      const withMeta = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', metaKey: true }),
        'mac',
      );
      expect(withMeta).toBe('undo');

      // ctrlKey should NOT match on mac
      const withCtrl = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', ctrlKey: true }),
        'mac',
      );
      expect(withCtrl).toBeNull();
    });

    it('on mac platform Cmd+Shift+Z maps to redo', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', metaKey: true, shiftKey: true }),
        'mac',
      );
      expect(action).toBe('redo');
    });

    it('does not match when extra modifiers are pressed (Ctrl+Shift+S does not match Ctrl+S)', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 's', ctrlKey: true, shiftKey: true }),
        'other',
      );
      expect(action).toBeNull();
    });

    it('does not match when extra alt modifier is pressed', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'z', ctrlKey: true, altKey: true }),
        'other',
      );
      expect(action).toBeNull();
    });

    it('Delete maps to delete-widget', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'Delete' }),
        'other',
      );
      expect(action).toBe('delete-widget');
    });

    it('Backspace maps to delete-widget', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'Backspace' }),
        'other',
      );
      expect(action).toBe('delete-widget');
    });

    it('Escape maps to deselect', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'Escape' }),
        'other',
      );
      expect(action).toBe('deselect');
    });

    it('Ctrl+A maps to select-all-widgets', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'a', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('select-all-widgets');
    });

    it('Ctrl+D maps to duplicate-widget', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'd', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('duplicate-widget');
    });

    it('matches case-insensitively for single-character keys', () => {
      const action = matchShortcut(
        DEFAULT_AUTHORING_SHORTCUTS,
        ev({ key: 'Z', ctrlKey: true }),
        'other',
      );
      expect(action).toBe('undo');
    });

    it('works with custom bindings', () => {
      const custom: ShortcutBinding[] = [
        { key: 'p', ctrl: true, action: 'preview', label: 'Preview' },
      ];
      const action = matchShortcut(custom, ev({ key: 'p', ctrlKey: true }), 'other');
      expect(action).toBe('preview');
    });

    it('works with alt modifier in custom binding', () => {
      const custom: ShortcutBinding[] = [
        { key: 'n', alt: true, action: 'new-widget', label: 'New Widget' },
      ];
      const action = matchShortcut(custom, ev({ key: 'n', altKey: true }), 'other');
      expect(action).toBe('new-widget');
    });
  });

  describe('createShortcutHandler', () => {
    it('returns a reusable function', () => {
      const handler = createShortcutHandler();
      expect(typeof handler).toBe('function');
    });

    it('uses default bindings when none provided', () => {
      const handler = createShortcutHandler();
      expect(handler(ev({ key: 'z', ctrlKey: true }))).toBe('undo');
    });

    it('uses provided bindings', () => {
      const custom: ShortcutBinding[] = [
        { key: 'x', ctrl: true, action: 'cut', label: 'Cut' },
      ];
      const handler = createShortcutHandler(custom);
      expect(handler(ev({ key: 'x', ctrlKey: true }))).toBe('cut');
      expect(handler(ev({ key: 'z', ctrlKey: true }))).toBeNull();
    });

    it('uses provided platform', () => {
      const handler = createShortcutHandler(undefined, 'mac');
      // On mac, ctrlKey should not trigger undo
      expect(handler(ev({ key: 'z', ctrlKey: true }))).toBeNull();
      // On mac, metaKey should trigger undo
      expect(handler(ev({ key: 'z', metaKey: true }))).toBe('undo');
    });

    it('handler returns null for unbound events', () => {
      const handler = createShortcutHandler();
      expect(handler(ev({ key: 'q' }))).toBeNull();
    });
  });

  describe('formatShortcut', () => {
    it('formats Ctrl+Z on other platform', () => {
      const binding: ShortcutBinding = { key: 'z', ctrl: true, action: 'undo', label: 'Undo' };
      expect(formatShortcut(binding, 'other')).toBe('Ctrl+Z');
    });

    it('formats Ctrl+Shift+Z on other platform', () => {
      const binding: ShortcutBinding = { key: 'z', ctrl: true, shift: true, action: 'redo', label: 'Redo' };
      expect(formatShortcut(binding, 'other')).toBe('Ctrl+Shift+Z');
    });

    it('formats Cmd+Z on mac platform', () => {
      const binding: ShortcutBinding = { key: 'z', ctrl: true, action: 'undo', label: 'Undo' };
      expect(formatShortcut(binding, 'mac')).toBe('\u2318Z');
    });

    it('formats Cmd+Shift+Z on mac platform', () => {
      const binding: ShortcutBinding = { key: 'z', ctrl: true, shift: true, action: 'redo', label: 'Redo' };
      expect(formatShortcut(binding, 'mac')).toBe('\u2318\u21E7Z');
    });

    it('formats Alt modifier on other platform', () => {
      const binding: ShortcutBinding = { key: 'n', alt: true, action: 'new', label: 'New' };
      expect(formatShortcut(binding, 'other')).toBe('Alt+N');
    });

    it('formats Option modifier on mac platform', () => {
      const binding: ShortcutBinding = { key: 'n', alt: true, action: 'new', label: 'New' };
      expect(formatShortcut(binding, 'mac')).toBe('\u2325N');
    });

    it('formats multi-character key (Delete) without uppercasing', () => {
      const binding: ShortcutBinding = { key: 'Delete', action: 'delete-widget', label: 'Delete Widget' };
      expect(formatShortcut(binding, 'other')).toBe('Delete');
    });

    it('formats Escape key', () => {
      const binding: ShortcutBinding = { key: 'Escape', action: 'deselect', label: 'Deselect' };
      expect(formatShortcut(binding, 'other')).toBe('Escape');
    });

    it('formats all modifiers combined on other platform', () => {
      const binding: ShortcutBinding = { key: 'k', ctrl: true, shift: true, alt: true, action: 'special', label: 'Special' };
      expect(formatShortcut(binding, 'other')).toBe('Ctrl+Shift+Alt+K');
    });

    it('formats all modifiers combined on mac platform', () => {
      const binding: ShortcutBinding = { key: 'k', ctrl: true, shift: true, alt: true, action: 'special', label: 'Special' };
      expect(formatShortcut(binding, 'mac')).toBe('\u2318\u21E7\u2325K');
    });

    it('defaults to other platform when no platform specified', () => {
      const binding: ShortcutBinding = { key: 's', ctrl: true, action: 'save', label: 'Save' };
      expect(formatShortcut(binding)).toBe('Ctrl+S');
    });
  });

  describe('DEFAULT_AUTHORING_SHORTCUTS', () => {
    it('has 20 bindings', () => {
      expect(DEFAULT_AUTHORING_SHORTCUTS).toHaveLength(20);
    });

    it('every binding has required fields', () => {
      for (const binding of DEFAULT_AUTHORING_SHORTCUTS) {
        expect(binding.key).toBeTruthy();
        expect(binding.action).toBeTruthy();
        expect(binding.label).toBeTruthy();
      }
    });
  });
});
