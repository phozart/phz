/**
 * @phozart/phz-workspace — Keyboard Shortcuts (L.12)
 *
 * Pure registry for workspace-level keyboard shortcuts.
 * Ctrl and Meta (Cmd on macOS) are treated equivalently.
 */

export interface ShortcutEntry {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export interface ShortcutRegistry {
  shortcuts: ShortcutEntry[];
}

export interface KeyEvent {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export function createShortcutRegistry(initial?: ShortcutEntry[]): ShortcutRegistry {
  return { shortcuts: initial ? [...initial] : [] };
}

export function registerShortcut(registry: ShortcutRegistry, entry: ShortcutEntry): ShortcutRegistry {
  const filtered = registry.shortcuts.filter(s => s.id !== entry.id);
  return { shortcuts: [...filtered, entry] };
}

export function unregisterShortcut(registry: ShortcutRegistry, id: string): ShortcutRegistry {
  return { shortcuts: registry.shortcuts.filter(s => s.id !== id) };
}

export function matchShortcut(registry: ShortcutRegistry, event: KeyEvent): ShortcutEntry | undefined {
  return registry.shortcuts.find(s => {
    if (s.key.toLowerCase() !== event.key.toLowerCase()) return false;

    const wantCtrl = s.ctrl ?? false;
    const wantShift = s.shift ?? false;
    const wantAlt = s.alt ?? false;

    const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (wantCtrl !== hasCtrlOrMeta) return false;
    if (wantShift !== event.shiftKey) return false;
    if (wantAlt !== event.altKey) return false;

    return true;
  });
}

const noop = () => {};

export const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
  { id: 'save', key: 's', ctrl: true, handler: noop, description: 'Save' },
  { id: 'undo', key: 'z', ctrl: true, handler: noop, description: 'Undo' },
  { id: 'redo', key: 'z', ctrl: true, shift: true, handler: noop, description: 'Redo' },
  { id: 'search', key: 'k', ctrl: true, handler: noop, description: 'Focus search' },
  { id: 'escape', key: 'Escape', handler: noop, description: 'Close / Cancel' },
  { id: 'print', key: 'p', ctrl: true, handler: noop, description: 'Print' },
  { id: 'help', key: '/', ctrl: true, handler: noop, description: 'Show shortcuts' },
];

export function formatShortcut(entry: ShortcutEntry): string {
  const parts: string[] = [];
  if (entry.ctrl) parts.push('Ctrl');
  if (entry.shift) parts.push('Shift');
  if (entry.alt) parts.push('Alt');
  parts.push(entry.key.length === 1 ? entry.key.toUpperCase() : entry.key);
  return parts.join('+');
}
