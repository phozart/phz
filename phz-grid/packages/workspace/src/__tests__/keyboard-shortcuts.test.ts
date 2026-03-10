/**
 * Keyboard Shortcuts (L.12 cont.) — Tests
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createShortcutRegistry,
  registerShortcut,
  unregisterShortcut,
  matchShortcut,
  DEFAULT_SHORTCUTS,
  formatShortcut,
  type ShortcutEntry,
  type ShortcutRegistry,
} from '../shell/keyboard-shortcuts.js';

describe('Keyboard Shortcuts', () => {
  describe('createShortcutRegistry', () => {
    it('starts empty', () => {
      const reg = createShortcutRegistry();
      expect(reg.shortcuts).toEqual([]);
    });

    it('can be initialized with defaults', () => {
      const reg = createShortcutRegistry(DEFAULT_SHORTCUTS);
      expect(reg.shortcuts.length).toBeGreaterThan(0);
    });
  });

  describe('registerShortcut', () => {
    it('adds a shortcut', () => {
      const reg = createShortcutRegistry();
      const handler = vi.fn();
      const next = registerShortcut(reg, {
        id: 'save',
        key: 's',
        ctrl: true,
        handler,
        description: 'Save',
      });
      expect(next.shortcuts).toHaveLength(1);
      expect(next.shortcuts[0].id).toBe('save');
    });

    it('replaces shortcut with same id', () => {
      let reg = createShortcutRegistry();
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler: vi.fn(), description: 'Save' });
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler: vi.fn(), description: 'Save v2' });
      expect(reg.shortcuts).toHaveLength(1);
      expect(reg.shortcuts[0].description).toBe('Save v2');
    });

    it('is immutable', () => {
      const reg = createShortcutRegistry();
      const next = registerShortcut(reg, { id: 'x', key: 'x', handler: vi.fn(), description: 'X' });
      expect(reg.shortcuts).toHaveLength(0);
      expect(next.shortcuts).toHaveLength(1);
    });
  });

  describe('unregisterShortcut', () => {
    it('removes by id', () => {
      let reg = createShortcutRegistry();
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler: vi.fn(), description: 'Save' });
      const next = unregisterShortcut(reg, 'save');
      expect(next.shortcuts).toHaveLength(0);
    });

    it('no-op for unknown id', () => {
      const reg = createShortcutRegistry();
      const next = unregisterShortcut(reg, 'unknown');
      expect(next.shortcuts).toHaveLength(0);
    });
  });

  describe('matchShortcut', () => {
    it('matches ctrl+s', () => {
      let reg = createShortcutRegistry();
      const handler = vi.fn();
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler, description: 'Save' });

      const match = matchShortcut(reg, { key: 's', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false });
      expect(match).toBeDefined();
      expect(match!.id).toBe('save');
    });

    it('matches meta+s (macOS Cmd)', () => {
      let reg = createShortcutRegistry();
      const handler = vi.fn();
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler, description: 'Save' });

      const match = matchShortcut(reg, { key: 's', ctrlKey: false, shiftKey: false, altKey: false, metaKey: true });
      expect(match).toBeDefined();
    });

    it('matches ctrl+shift+z', () => {
      let reg = createShortcutRegistry();
      const handler = vi.fn();
      reg = registerShortcut(reg, { id: 'redo', key: 'z', ctrl: true, shift: true, handler, description: 'Redo' });

      const match = matchShortcut(reg, { key: 'z', ctrlKey: true, shiftKey: true, altKey: false, metaKey: false });
      expect(match).toBeDefined();
      expect(match!.id).toBe('redo');
    });

    it('returns undefined for no match', () => {
      const reg = createShortcutRegistry();
      const match = matchShortcut(reg, { key: 'x', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false });
      expect(match).toBeUndefined();
    });

    it('does not match when extra modifiers present', () => {
      let reg = createShortcutRegistry();
      reg = registerShortcut(reg, { id: 'save', key: 's', ctrl: true, handler: vi.fn(), description: 'Save' });

      const match = matchShortcut(reg, { key: 's', ctrlKey: true, shiftKey: true, altKey: false, metaKey: false });
      expect(match).toBeUndefined();
    });
  });

  describe('DEFAULT_SHORTCUTS', () => {
    it('includes standard shortcuts', () => {
      const ids = DEFAULT_SHORTCUTS.map(s => s.id);
      expect(ids).toContain('save');
      expect(ids).toContain('undo');
      expect(ids).toContain('redo');
      expect(ids).toContain('search');
      expect(ids).toContain('escape');
    });

    it('all have descriptions', () => {
      for (const s of DEFAULT_SHORTCUTS) {
        expect(s.description).toBeTruthy();
      }
    });
  });

  describe('formatShortcut', () => {
    it('formats ctrl+s', () => {
      const formatted = formatShortcut({ id: 'save', key: 'S', ctrl: true, handler: vi.fn(), description: 'Save' });
      expect(formatted).toMatch(/Ctrl|Cmd/);
      expect(formatted).toContain('S');
    });

    it('formats ctrl+shift+z', () => {
      const formatted = formatShortcut({ id: 'redo', key: 'Z', ctrl: true, shift: true, handler: vi.fn(), description: 'Redo' });
      expect(formatted).toContain('Shift');
      expect(formatted).toContain('Z');
    });

    it('formats standalone escape', () => {
      const formatted = formatShortcut({ id: 'esc', key: 'Escape', handler: vi.fn(), description: 'Close' });
      expect(formatted).toBe('Escape');
    });
  });
});
