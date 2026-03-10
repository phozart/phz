/**
 * @phozart/phz-workspace — Preview Mode State (L.11)
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

export const DEFAULT_VIEWPORT_PRESETS: ViewportPreset[] = [
  { name: 'desktop', width: 1280, label: 'Desktop' },
  { name: 'tablet', width: 768, label: 'Tablet' },
  { name: 'mobile', width: 375, label: 'Mobile' },
];

export function createPreviewState(): PreviewState {
  return { active: false, viewport: 'desktop' };
}

export function togglePreview(state: PreviewState): PreviewState {
  return { ...state, active: !state.active };
}

export function setViewport(state: PreviewState, preset: string): PreviewState {
  return { ...state, viewport: preset };
}

export function getViewportWidth(state: PreviewState, presets: ViewportPreset[]): number {
  const found = presets.find(p => p.name === state.viewport);
  return found ? found.width : presets[0].width;
}
