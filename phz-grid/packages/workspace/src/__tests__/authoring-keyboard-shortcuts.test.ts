/**
 * Authoring Keyboard Shortcuts — Canvas Shortcuts Tests (Phase 4B)
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AUTHORING_SHORTCUTS,
  matchShortcut,
  type ShortcutMatchEvent,
} from '../authoring/keyboard-shortcuts.js';

function makeEvent(overrides: Partial<ShortcutMatchEvent> = {}): ShortcutMatchEvent {
  return {
    key: '',
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...overrides,
  };
}

describe('Authoring Keyboard Shortcuts — Canvas', () => {
  it('DEFAULT_AUTHORING_SHORTCUTS includes canvas nudge shortcuts', () => {
    const actions = DEFAULT_AUTHORING_SHORTCUTS.map(s => s.action);
    expect(actions).toContain('nudge-up');
    expect(actions).toContain('nudge-down');
    expect(actions).toContain('nudge-left');
    expect(actions).toContain('nudge-right');
    expect(actions).toContain('nudge-up-4');
    expect(actions).toContain('nudge-down-4');
    expect(actions).toContain('nudge-left-4');
    expect(actions).toContain('nudge-right-4');
  });

  it('DEFAULT_AUTHORING_SHORTCUTS includes zoom shortcuts', () => {
    const actions = DEFAULT_AUTHORING_SHORTCUTS.map(s => s.action);
    expect(actions).toContain('zoom-in');
    expect(actions).toContain('zoom-out');
    expect(actions).toContain('zoom-reset');
  });

  it('matchShortcut matches ArrowUp to nudge-up', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'ArrowUp' }),
    );
    expect(result).toBe('nudge-up');
  });

  it('matchShortcut matches Shift+ArrowUp to nudge-up-4', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'ArrowUp', shiftKey: true }),
    );
    expect(result).toBe('nudge-up-4');
  });

  it('matchShortcut matches ArrowDown to nudge-down', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'ArrowDown' }),
    );
    expect(result).toBe('nudge-down');
  });

  it('matchShortcut matches Shift+ArrowLeft to nudge-left-4', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'ArrowLeft', shiftKey: true }),
    );
    expect(result).toBe('nudge-left-4');
  });

  it('matchShortcut matches = to zoom-in', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: '=' }),
    );
    expect(result).toBe('zoom-in');
  });

  it('matchShortcut matches - to zoom-out', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: '-' }),
    );
    expect(result).toBe('zoom-out');
  });

  it('matchShortcut matches Ctrl+0 to zoom-reset', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: '0', ctrlKey: true }),
    );
    expect(result).toBe('zoom-reset');
  });

  it('existing shortcuts still work (Ctrl+Z for undo)', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'z', ctrlKey: true }),
    );
    expect(result).toBe('undo');
  });

  it('existing shortcuts still work (Escape for deselect)', () => {
    const result = matchShortcut(
      DEFAULT_AUTHORING_SHORTCUTS,
      makeEvent({ key: 'Escape' }),
    );
    expect(result).toBe('deselect');
  });
});
