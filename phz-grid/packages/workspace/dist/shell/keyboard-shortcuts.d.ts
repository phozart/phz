/**
 * @phozart/workspace — Keyboard Shortcuts (L.12)
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
export declare function createShortcutRegistry(initial?: ShortcutEntry[]): ShortcutRegistry;
export declare function registerShortcut(registry: ShortcutRegistry, entry: ShortcutEntry): ShortcutRegistry;
export declare function unregisterShortcut(registry: ShortcutRegistry, id: string): ShortcutRegistry;
export declare function matchShortcut(registry: ShortcutRegistry, event: KeyEvent): ShortcutEntry | undefined;
export declare const DEFAULT_SHORTCUTS: ShortcutEntry[];
export declare function formatShortcut(entry: ShortcutEntry): string;
//# sourceMappingURL=keyboard-shortcuts.d.ts.map