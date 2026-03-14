/**
 * @phozart/workspace — Preview-as Utils (L.19)
 *
 * Immutable state for viewer context simulation ("preview as" role/user).
 */

import type { ViewerContext } from '../types.js';

export interface PreviewAsState {
  active: boolean;
  context: ViewerContext | undefined;
  recentContexts: ViewerContext[];
}

const MAX_RECENT = 5;

export function createPreviewAsState(): PreviewAsState {
  return { active: false, context: undefined, recentContexts: [] };
}

export function setPreviewContext(
  state: PreviewAsState,
  context: ViewerContext,
): PreviewAsState {
  // Remove duplicate (match by userId) and add to end
  const filtered = state.recentContexts.filter(
    c => c.userId !== context.userId,
  );
  const recents = [...filtered, context];
  // Keep only the last MAX_RECENT
  const trimmed = recents.length > MAX_RECENT
    ? recents.slice(recents.length - MAX_RECENT)
    : recents;

  return {
    active: true,
    context,
    recentContexts: trimmed,
  };
}

export function clearPreviewContext(state: PreviewAsState): PreviewAsState {
  return {
    ...state,
    active: false,
    context: undefined,
  };
}
