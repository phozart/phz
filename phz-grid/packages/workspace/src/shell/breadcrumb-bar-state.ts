/**
 * @phozart/phz-workspace — Breadcrumb Bar State
 *
 * Pure functions wrapping NavigationStack from shell-utils.ts.
 * Adds maxVisible truncation and collapsed breadcrumb computation.
 */

import {
  type BreadcrumbEntry,
  type NavigationStack,
  createNavigationStack,
  pushCrumb,
  popTo,
} from './shell-utils.js';

export interface BreadcrumbBarState {
  stack: NavigationStack;
  maxVisible: number;
}

export function initialBreadcrumbBarState(maxVisible = 5): BreadcrumbBarState {
  return {
    stack: createNavigationStack(),
    maxVisible,
  };
}

export function pushBreadcrumb(
  state: BreadcrumbBarState,
  entry: BreadcrumbEntry,
): BreadcrumbBarState {
  return { ...state, stack: pushCrumb(state.stack, entry) };
}

export function popToBreadcrumb(
  state: BreadcrumbBarState,
  index: number,
): BreadcrumbBarState {
  return { ...state, stack: popTo(state.stack, index) };
}

/**
 * Get the visible breadcrumbs up to currentIndex.
 */
export function getBreadcrumbs(state: BreadcrumbBarState): BreadcrumbEntry[] {
  if (state.stack.currentIndex < 0) return [];
  return state.stack.entries.slice(0, state.stack.currentIndex + 1);
}

/**
 * When there are more breadcrumbs than maxVisible, returns an object
 * with `collapsed` (hidden breadcrumbs) and `visible` (shown breadcrumbs).
 * The first and last breadcrumbs are always visible; middle items collapse.
 */
export function getCollapsedBreadcrumbs(state: BreadcrumbBarState): {
  collapsed: BreadcrumbEntry[];
  visible: BreadcrumbEntry[];
} {
  const all = getBreadcrumbs(state);
  if (all.length <= state.maxVisible) {
    return { collapsed: [], visible: all };
  }

  // Always show first + last (maxVisible - 2) items from the end
  const tailCount = state.maxVisible - 1;
  const first = all[0];
  const tail = all.slice(all.length - tailCount);
  const collapsed = all.slice(1, all.length - tailCount);

  return {
    collapsed,
    visible: [first, ...tail],
  };
}
