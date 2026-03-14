/**
 * @phozart/workspace — Preview Mode State (L.11)
 *
 * Immutable state machine for viewport preview simulation.
 */
export interface ViewportPreset {
    name: string;
    width: number;
    label: string;
}
export interface PreviewState {
    active: boolean;
    viewport: string;
}
export declare const DEFAULT_VIEWPORT_PRESETS: ViewportPreset[];
export declare function createPreviewState(): PreviewState;
export declare function togglePreview(state: PreviewState): PreviewState;
export declare function setViewport(state: PreviewState, preset: string): PreviewState;
export declare function getViewportWidth(state: PreviewState, presets: ViewportPreset[]): number;
//# sourceMappingURL=preview-mode.d.ts.map