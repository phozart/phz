/**
 * @phozart/workspace — Keyboard Shortcuts State (B-3.12)
 *
 * Pure functions for an enhanced shortcut system with context-aware shortcuts,
 * customizable bindings, and help overlay support.
 * Builds on top of the existing keyboard-shortcuts.ts registry.
 */
// ========================================================================
// Default contextual shortcuts
// ========================================================================
const noop = () => { };
export const DEFAULT_CONTEXTUAL_SHORTCUTS = [
    // Global
    { id: 'global-save', key: 's', ctrl: true, handler: noop, description: 'Save', context: 'global', group: 'General', customizable: true },
    { id: 'global-undo', key: 'z', ctrl: true, handler: noop, description: 'Undo', context: 'global', group: 'General', customizable: true },
    { id: 'global-redo', key: 'z', ctrl: true, shift: true, handler: noop, description: 'Redo', context: 'global', group: 'General', customizable: true },
    { id: 'global-search', key: 'k', ctrl: true, handler: noop, description: 'Open command palette', context: 'global', group: 'Navigation', customizable: false },
    { id: 'global-help', key: '?', shift: true, handler: noop, description: 'Show keyboard shortcuts', context: 'global', group: 'Help', customizable: false },
    { id: 'global-escape', key: 'Escape', handler: noop, description: 'Close overlay / Cancel', context: 'global', group: 'General', customizable: false },
    // Catalog
    { id: 'catalog-new', key: 'n', ctrl: true, handler: noop, description: 'New artifact', context: 'catalog', group: 'Actions', customizable: true },
    { id: 'catalog-delete', key: 'Delete', handler: noop, description: 'Delete selected', context: 'catalog', group: 'Actions', customizable: true },
    { id: 'catalog-select-all', key: 'a', ctrl: true, handler: noop, description: 'Select all', context: 'catalog', group: 'Selection', customizable: true },
    // Report editor
    { id: 'report-add-column', key: '+', ctrl: true, handler: noop, description: 'Add column', context: 'report-editor', group: 'Columns', customizable: true },
    { id: 'report-remove-column', key: '-', ctrl: true, handler: noop, description: 'Remove column', context: 'report-editor', group: 'Columns', customizable: true },
    { id: 'report-preview', key: 'p', ctrl: true, shift: true, handler: noop, description: 'Preview report', context: 'report-editor', group: 'Actions', customizable: true },
    // Dashboard editor
    { id: 'dashboard-add-widget', key: 'w', ctrl: true, handler: noop, description: 'Add widget', context: 'dashboard-editor', group: 'Widgets', customizable: true },
    { id: 'dashboard-grid-toggle', key: 'g', ctrl: true, handler: noop, description: 'Toggle grid', context: 'dashboard-editor', group: 'Layout', customizable: true },
    { id: 'dashboard-preview', key: 'p', ctrl: true, shift: true, handler: noop, description: 'Preview dashboard', context: 'dashboard-editor', group: 'Actions', customizable: true },
];
// ========================================================================
// Factory
// ========================================================================
export function initialKeyboardShortcutsState(shortcuts) {
    return {
        shortcuts: shortcuts ?? DEFAULT_CONTEXTUAL_SHORTCUTS.map(s => ({ ...s })),
        activeContext: 'global',
        helpOverlayOpen: false,
        customBindings: new Map(),
    };
}
// ========================================================================
// Context management
// ========================================================================
export function setActiveContext(state, context) {
    return { ...state, activeContext: context };
}
export function getActiveShortcuts(state) {
    return state.shortcuts.filter(s => s.context === state.activeContext || s.context === 'global');
}
// ========================================================================
// Shortcut matching (context-aware)
// ========================================================================
export function matchContextualShortcut(state, event) {
    const active = getActiveShortcuts(state);
    // Apply custom bindings
    return active.find(s => {
        const binding = state.customBindings.get(s.id);
        const key = binding?.key ?? s.key;
        const ctrl = binding?.ctrl ?? s.ctrl ?? false;
        const shift = binding?.shift ?? s.shift ?? false;
        const alt = binding?.alt ?? s.alt ?? false;
        if (key.toLowerCase() !== event.key.toLowerCase())
            return false;
        const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
        if (ctrl !== hasCtrlOrMeta)
            return false;
        if (shift !== event.shiftKey)
            return false;
        if (alt !== event.altKey)
            return false;
        return true;
    });
}
// ========================================================================
// Help overlay
// ========================================================================
export function openHelpOverlay(state) {
    return { ...state, helpOverlayOpen: true };
}
export function closeHelpOverlay(state) {
    return { ...state, helpOverlayOpen: false };
}
export function toggleHelpOverlay(state) {
    return { ...state, helpOverlayOpen: !state.helpOverlayOpen };
}
// ========================================================================
// Custom bindings
// ========================================================================
export function setCustomBinding(state, shortcutId, binding) {
    const shortcut = state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut || !shortcut.customizable)
        return state;
    const customBindings = new Map(state.customBindings);
    customBindings.set(shortcutId, binding);
    return { ...state, customBindings };
}
export function clearCustomBinding(state, shortcutId) {
    const customBindings = new Map(state.customBindings);
    customBindings.delete(shortcutId);
    return { ...state, customBindings };
}
export function clearAllCustomBindings(state) {
    return { ...state, customBindings: new Map() };
}
// ========================================================================
// Shortcut recording
// ========================================================================
export function startRecording(state, shortcutId) {
    const shortcut = state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut || !shortcut.customizable)
        return state;
    return { ...state, recordingShortcutId: shortcutId };
}
export function recordKeyCombination(state, event) {
    if (!state.recordingShortcutId)
        return state;
    // Ignore bare modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key))
        return state;
    const binding = {
        key: event.key,
        ctrl: event.ctrlKey || event.metaKey || undefined,
        shift: event.shiftKey || undefined,
        alt: event.altKey || undefined,
    };
    const customBindings = new Map(state.customBindings);
    customBindings.set(state.recordingShortcutId, binding);
    return { ...state, customBindings, recordingShortcutId: undefined };
}
export function cancelRecording(state) {
    return { ...state, recordingShortcutId: undefined };
}
// ========================================================================
// Conflict detection
// ========================================================================
export function detectConflicts(state) {
    const active = getActiveShortcuts(state);
    const conflicts = [];
    for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
            const a = active[i];
            const b = active[j];
            const bindA = state.customBindings.get(a.id);
            const bindB = state.customBindings.get(b.id);
            const keyA = (bindA?.key ?? a.key).toLowerCase();
            const keyB = (bindB?.key ?? b.key).toLowerCase();
            const ctrlA = bindA?.ctrl ?? a.ctrl ?? false;
            const ctrlB = bindB?.ctrl ?? b.ctrl ?? false;
            const shiftA = bindA?.shift ?? a.shift ?? false;
            const shiftB = bindB?.shift ?? b.shift ?? false;
            const altA = bindA?.alt ?? a.alt ?? false;
            const altB = bindB?.alt ?? b.alt ?? false;
            if (keyA === keyB && ctrlA === ctrlB && shiftA === shiftB && altA === altB) {
                conflicts.push({ shortcutA: a, shortcutB: b });
            }
        }
    }
    return conflicts;
}
// ========================================================================
// Grouping
// ========================================================================
export function getShortcutsByGroup(state) {
    const active = getActiveShortcuts(state);
    const groups = new Map();
    for (const s of active) {
        const group = groups.get(s.group) ?? [];
        group.push(s);
        groups.set(s.group, group);
    }
    return groups;
}
// ========================================================================
// Format shortcut for display
// ========================================================================
export function formatContextualShortcut(state, shortcutId) {
    const shortcut = state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut)
        return '';
    const binding = state.customBindings.get(shortcutId);
    const key = binding?.key ?? shortcut.key;
    const ctrl = binding?.ctrl ?? shortcut.ctrl ?? false;
    const shift = binding?.shift ?? shortcut.shift ?? false;
    const alt = binding?.alt ?? shortcut.alt ?? false;
    const parts = [];
    if (ctrl)
        parts.push('Ctrl');
    if (shift)
        parts.push('Shift');
    if (alt)
        parts.push('Alt');
    parts.push(key.length === 1 ? key.toUpperCase() : key);
    return parts.join('+');
}
//# sourceMappingURL=keyboard-shortcuts-state.js.map