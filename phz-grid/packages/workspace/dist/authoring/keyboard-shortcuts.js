/**
 * @phozart/phz-workspace — Keyboard Shortcuts
 *
 * Pure shortcut matching for the authoring environment.
 * Platform-aware: maps Cmd on macOS, Ctrl elsewhere.
 */
export const DEFAULT_AUTHORING_SHORTCUTS = [
    { key: 'z', ctrl: true, action: 'undo', label: 'Undo' },
    { key: 'z', ctrl: true, shift: true, action: 'redo', label: 'Redo' },
    { key: 'y', ctrl: true, action: 'redo', label: 'Redo' },
    { key: 's', ctrl: true, action: 'save', label: 'Save' },
    { key: 'd', ctrl: true, action: 'duplicate-widget', label: 'Duplicate Widget' },
    { key: 'Delete', action: 'delete-widget', label: 'Delete Widget' },
    { key: 'Backspace', action: 'delete-widget', label: 'Delete Widget' },
    { key: 'Escape', action: 'deselect', label: 'Deselect / Close Panel' },
    { key: 'a', ctrl: true, action: 'select-all-widgets', label: 'Select All Widgets' },
    // Canvas shortcuts
    { key: 'ArrowUp', action: 'nudge-up', label: 'Nudge Up 1 Cell' },
    { key: 'ArrowDown', action: 'nudge-down', label: 'Nudge Down 1 Cell' },
    { key: 'ArrowLeft', action: 'nudge-left', label: 'Nudge Left 1 Cell' },
    { key: 'ArrowRight', action: 'nudge-right', label: 'Nudge Right 1 Cell' },
    { key: 'ArrowUp', shift: true, action: 'nudge-up-4', label: 'Nudge Up 4 Cells' },
    { key: 'ArrowDown', shift: true, action: 'nudge-down-4', label: 'Nudge Down 4 Cells' },
    { key: 'ArrowLeft', shift: true, action: 'nudge-left-4', label: 'Nudge Left 4 Cells' },
    { key: 'ArrowRight', shift: true, action: 'nudge-right-4', label: 'Nudge Right 4 Cells' },
    { key: '=', action: 'zoom-in', label: 'Zoom In' },
    { key: '-', action: 'zoom-out', label: 'Zoom Out' },
    { key: '0', ctrl: true, action: 'zoom-reset', label: 'Reset Zoom' },
];
export function matchShortcut(bindings, event, platform = 'other') {
    const ctrlOrMeta = platform === 'mac' ? event.metaKey : event.ctrlKey;
    for (const binding of bindings) {
        const keyMatch = event.key.toLowerCase() === binding.key.toLowerCase() ||
            event.key === binding.key; // for Delete, Escape etc.
        if (!keyMatch)
            continue;
        const ctrlMatch = binding.ctrl ? ctrlOrMeta : !ctrlOrMeta;
        const shiftMatch = binding.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = binding.alt ? event.altKey : !event.altKey;
        if (ctrlMatch && shiftMatch && altMatch) {
            return binding.action;
        }
    }
    return null;
}
export function createShortcutHandler(bindings, platform) {
    const b = bindings ?? DEFAULT_AUTHORING_SHORTCUTS;
    const p = platform ?? 'other';
    return (event) => matchShortcut(b, event, p);
}
export function formatShortcut(binding, platform = 'other') {
    const parts = [];
    if (binding.ctrl)
        parts.push(platform === 'mac' ? '\u2318' : 'Ctrl');
    if (binding.shift)
        parts.push(platform === 'mac' ? '\u21E7' : 'Shift');
    if (binding.alt)
        parts.push(platform === 'mac' ? '\u2325' : 'Alt');
    // Capitalize key display
    const keyDisplay = binding.key.length === 1 ? binding.key.toUpperCase() : binding.key;
    parts.push(keyDisplay);
    return parts.join(platform === 'mac' ? '' : '+');
}
//# sourceMappingURL=keyboard-shortcuts.js.map