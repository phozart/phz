/**
 * @phozart/phz-workspace — Keyboard Shortcuts State (B-3.12)
 *
 * Pure functions for an enhanced shortcut system with context-aware shortcuts,
 * customizable bindings, and help overlay support.
 * Builds on top of the existing keyboard-shortcuts.ts registry.
 */
import type { ShortcutEntry, KeyEvent } from './keyboard-shortcuts.js';
export type ShortcutContext = 'global' | 'catalog' | 'report-editor' | 'dashboard-editor' | 'settings' | 'command-palette';
export interface ContextualShortcut extends ShortcutEntry {
    context: ShortcutContext;
    group: string;
    customizable: boolean;
}
export interface ShortcutConflict {
    shortcutA: ContextualShortcut;
    shortcutB: ContextualShortcut;
}
export interface KeyboardShortcutsState {
    shortcuts: ContextualShortcut[];
    activeContext: ShortcutContext;
    helpOverlayOpen: boolean;
    customBindings: Map<string, {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
    }>;
    recordingShortcutId?: string;
}
export declare const DEFAULT_CONTEXTUAL_SHORTCUTS: ContextualShortcut[];
export declare function initialKeyboardShortcutsState(shortcuts?: ContextualShortcut[]): KeyboardShortcutsState;
export declare function setActiveContext(state: KeyboardShortcutsState, context: ShortcutContext): KeyboardShortcutsState;
export declare function getActiveShortcuts(state: KeyboardShortcutsState): ContextualShortcut[];
export declare function matchContextualShortcut(state: KeyboardShortcutsState, event: KeyEvent): ContextualShortcut | undefined;
export declare function openHelpOverlay(state: KeyboardShortcutsState): KeyboardShortcutsState;
export declare function closeHelpOverlay(state: KeyboardShortcutsState): KeyboardShortcutsState;
export declare function toggleHelpOverlay(state: KeyboardShortcutsState): KeyboardShortcutsState;
export declare function setCustomBinding(state: KeyboardShortcutsState, shortcutId: string, binding: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
}): KeyboardShortcutsState;
export declare function clearCustomBinding(state: KeyboardShortcutsState, shortcutId: string): KeyboardShortcutsState;
export declare function clearAllCustomBindings(state: KeyboardShortcutsState): KeyboardShortcutsState;
export declare function startRecording(state: KeyboardShortcutsState, shortcutId: string): KeyboardShortcutsState;
export declare function recordKeyCombination(state: KeyboardShortcutsState, event: KeyEvent): KeyboardShortcutsState;
export declare function cancelRecording(state: KeyboardShortcutsState): KeyboardShortcutsState;
export declare function detectConflicts(state: KeyboardShortcutsState): ShortcutConflict[];
export declare function getShortcutsByGroup(state: KeyboardShortcutsState): Map<string, ContextualShortcut[]>;
export declare function formatContextualShortcut(state: KeyboardShortcutsState, shortcutId: string): string;
//# sourceMappingURL=keyboard-shortcuts-state.d.ts.map