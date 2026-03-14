/**
 * @phozart/workspace — Keyboard Shortcuts
 *
 * Pure shortcut matching for the authoring environment.
 * Platform-aware: maps Cmd on macOS, Ctrl elsewhere.
 */
export interface ShortcutBinding {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: string;
    label: string;
}
export declare const DEFAULT_AUTHORING_SHORTCUTS: ShortcutBinding[];
export interface ShortcutMatchEvent {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}
export declare function matchShortcut(bindings: ShortcutBinding[], event: ShortcutMatchEvent, platform?: 'mac' | 'other'): string | null;
export declare function createShortcutHandler(bindings?: ShortcutBinding[], platform?: 'mac' | 'other'): (event: ShortcutMatchEvent) => string | null;
export declare function formatShortcut(binding: ShortcutBinding, platform?: 'mac' | 'other'): string;
//# sourceMappingURL=keyboard-shortcuts.d.ts.map