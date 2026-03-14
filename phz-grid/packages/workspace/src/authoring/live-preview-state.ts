/**
 * @phozart/workspace — Live Preview Toggle State Machine (UX-017)
 *
 * Headless state machine for the live preview mode in the authoring
 * environment. Pure functions, immutable state, no DOM dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviewBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type LivePreviewRole = 'admin' | 'author' | 'viewer';

export interface PreviewBreakpointConfig {
  name: PreviewBreakpoint;
  label: string;
  width: number;
}

export interface LivePreviewState {
  active: boolean;
  breakpoint: PreviewBreakpoint;
  role: LivePreviewRole;
  showAnnotations: boolean;
  showBreakpointLabel: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PREVIEW_BREAKPOINTS: readonly PreviewBreakpointConfig[] = [
  { name: 'desktop', label: 'Desktop', width: 1440 },
  { name: 'tablet', label: 'Tablet', width: 768 },
  { name: 'mobile', label: 'Mobile', width: 375 },
] as const;

/** Cycle order used by cycleBreakpoint. */
const CYCLE_ORDER: readonly PreviewBreakpoint[] = ['desktop', 'tablet', 'mobile'];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLivePreviewState(
  overrides?: Partial<LivePreviewState>,
): LivePreviewState {
  return {
    active: false,
    breakpoint: 'desktop',
    role: 'viewer',
    showAnnotations: false,
    showBreakpointLabel: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

/** Toggle preview on/off. Deactivating resets breakpoint to desktop. */
export function togglePreview(state: LivePreviewState): LivePreviewState {
  const active = !state.active;
  return {
    ...state,
    active,
    // Reset breakpoint when deactivating
    breakpoint: active ? state.breakpoint : 'desktop',
  };
}

/** Set breakpoint explicitly. No-op (returns same ref) when not active. */
export function setPreviewBreakpoint(
  state: LivePreviewState,
  breakpoint: PreviewBreakpoint,
): LivePreviewState {
  if (!state.active) return state;
  return { ...state, breakpoint };
}

/** Cycle through breakpoints: desktop -> tablet -> mobile -> desktop. No-op when not active. */
export function cycleBreakpoint(state: LivePreviewState): LivePreviewState {
  if (!state.active) return state;
  const idx = CYCLE_ORDER.indexOf(state.breakpoint);
  const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
  return { ...state, breakpoint: next };
}

/** Set the preview role. */
export function setLivePreviewRole(
  state: LivePreviewState,
  role: LivePreviewRole,
): LivePreviewState {
  return { ...state, role };
}

/** Toggle annotation overlay visibility. */
export function toggleAnnotations(state: LivePreviewState): LivePreviewState {
  return { ...state, showAnnotations: !state.showAnnotations };
}

/** Toggle breakpoint label visibility. */
export function toggleBreakpointLabel(state: LivePreviewState): LivePreviewState {
  return { ...state, showBreakpointLabel: !state.showBreakpointLabel };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Return the pixel width for the current breakpoint. */
export function getBreakpointWidth(state: LivePreviewState): number {
  return getBreakpointConfig(state.breakpoint).width;
}

/** Lookup a PreviewBreakpointConfig by name. */
export function getBreakpointConfig(breakpoint: PreviewBreakpoint): PreviewBreakpointConfig {
  const config = PREVIEW_BREAKPOINTS.find((b) => b.name === breakpoint);
  // Exhaustive — all three names are covered. Guard is for safety only.
  if (!config) {
    throw new Error(`Unknown breakpoint: ${breakpoint}`);
  }
  return config;
}
