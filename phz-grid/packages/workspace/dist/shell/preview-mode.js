/**
 * @phozart/workspace — Preview Mode State (L.11)
 *
 * Immutable state machine for viewport preview simulation.
 */
export const DEFAULT_VIEWPORT_PRESETS = [
    { name: 'desktop', width: 1280, label: 'Desktop' },
    { name: 'tablet', width: 768, label: 'Tablet' },
    { name: 'mobile', width: 375, label: 'Mobile' },
];
export function createPreviewState() {
    return { active: false, viewport: 'desktop' };
}
export function togglePreview(state) {
    return { ...state, active: !state.active };
}
export function setViewport(state, preset) {
    return { ...state, viewport: preset };
}
export function getViewportWidth(state, presets) {
    const found = presets.find(p => p.name === state.viewport);
    return found ? found.width : presets[0].width;
}
//# sourceMappingURL=preview-mode.js.map