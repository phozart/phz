/**
 * @phozart/workspace — Navigation Controller (L.3)
 *
 * Pure functions for workspace navigation state management.
 * Coordinates panel navigation with breadcrumb history.
 */

import {
  createNavigationStack,
  pushCrumb,
  popTo,
  type BreadcrumbEntry,
  type NavigationStack,
  type NavItem,
} from './shell-utils.js';

export interface NavigationTarget {
  panelId: string;
  artifactId?: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface NavigationState {
  activePanel: string;
  breadcrumbs: NavigationStack;
  navItems: NavItem[];
}

export function createNavigationState(
  navItems: NavItem[],
  initialPanel?: string,
): NavigationState {
  const panelId = initialPanel ?? navItems[0]?.id ?? '';
  const item = navItems.find(n => n.id === panelId);
  const label = item?.label ?? panelId;

  return {
    activePanel: panelId,
    breadcrumbs: createNavigationStack([{ id: panelId, label, panelId }]),
    navItems,
  };
}

export function canNavigateTo(state: NavigationState, target: NavigationTarget): boolean {
  return state.navItems.some(n => n.id === target.panelId);
}

export function navigateTo(state: NavigationState, target: NavigationTarget): NavigationState {
  const navItem = state.navItems.find(n => n.id === target.panelId);
  const label = target.label ?? navItem?.label ?? target.panelId;

  const crumb: BreadcrumbEntry = {
    id: target.artifactId ?? target.panelId,
    label,
    panelId: target.panelId,
    metadata: target.metadata,
  };

  return {
    ...state,
    activePanel: target.panelId,
    breadcrumbs: pushCrumb(state.breadcrumbs, crumb),
  };
}

export function goBack(state: NavigationState): NavigationState {
  const { breadcrumbs } = state;
  if (breadcrumbs.currentIndex <= 0) return state;

  const newBreadcrumbs = popTo(breadcrumbs, breadcrumbs.currentIndex - 1);
  const entry = newBreadcrumbs.entries[newBreadcrumbs.currentIndex];

  return {
    ...state,
    activePanel: entry.panelId,
    breadcrumbs: newBreadcrumbs,
  };
}

export function goForward(state: NavigationState): NavigationState {
  const { breadcrumbs } = state;
  if (breadcrumbs.currentIndex >= breadcrumbs.entries.length - 1) return state;

  const newBreadcrumbs = popTo(breadcrumbs, breadcrumbs.currentIndex + 1);
  const entry = newBreadcrumbs.entries[newBreadcrumbs.currentIndex];

  return {
    ...state,
    activePanel: entry.panelId,
    breadcrumbs: newBreadcrumbs,
  };
}
