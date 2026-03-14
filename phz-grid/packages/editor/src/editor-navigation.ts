/**
 * @phozart/editor — Editor Navigation (B-2.02)
 *
 * Route/screen management utilities for the editor shell.
 * Maps URL-like paths to EditorScreen values, builds navigation
 * breadcrumbs, and manages deep linking.
 */

import type { EditorScreen, NavigationEntry } from './editor-state.js';

// ========================================================================
// Route mapping
// ========================================================================

export interface EditorRoute {
  screen: EditorScreen;
  artifactId?: string;
  artifactType?: string;
  params?: Record<string, string>;
}

/** Route path patterns for each screen. */
const ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  screen: EditorScreen;
  artifactIdGroup?: number;
  artifactTypeGroup?: number;
}> = [
  { pattern: /^\/editor\/?$/, screen: 'catalog' },
  { pattern: /^\/editor\/catalog\/?$/, screen: 'catalog' },
  { pattern: /^\/editor\/dashboard\/([^/]+)\/edit\/?$/, screen: 'dashboard-edit', artifactIdGroup: 1 },
  { pattern: /^\/editor\/dashboard\/([^/]+)\/?$/, screen: 'dashboard-view', artifactIdGroup: 1 },
  { pattern: /^\/editor\/report\/([^/]+)\/?$/, screen: 'report', artifactIdGroup: 1 },
  { pattern: /^\/editor\/explorer\/?$/, screen: 'explorer' },
  { pattern: /^\/editor\/explorer\/([^/]+)\/?$/, screen: 'explorer', artifactIdGroup: 1 },
  { pattern: /^\/editor\/sharing\/([^/]+)\/?$/, screen: 'sharing', artifactIdGroup: 1 },
  { pattern: /^\/editor\/alerts\/?$/, screen: 'alerts' },
];

/**
 * Parse a URL path into an EditorRoute.
 * Returns null if the path does not match any known editor route.
 */
export function parseRoute(path: string): EditorRoute | null {
  const cleanPath = path.split('?')[0].split('#')[0];

  for (const { pattern, screen, artifactIdGroup } of ROUTE_PATTERNS) {
    const match = cleanPath.match(pattern);
    if (match) {
      const route: EditorRoute = { screen };
      if (artifactIdGroup !== undefined && match[artifactIdGroup]) {
        route.artifactId = match[artifactIdGroup];
      }
      return route;
    }
  }

  return null;
}

/**
 * Build a URL path for a given route.
 */
export function buildRoutePath(route: EditorRoute): string {
  switch (route.screen) {
    case 'catalog':
      return '/editor/catalog';
    case 'dashboard-view':
      return route.artifactId ? `/editor/dashboard/${route.artifactId}` : '/editor/catalog';
    case 'dashboard-edit':
      return route.artifactId ? `/editor/dashboard/${route.artifactId}/edit` : '/editor/catalog';
    case 'report':
      return route.artifactId ? `/editor/report/${route.artifactId}` : '/editor/catalog';
    case 'explorer':
      return route.artifactId ? `/editor/explorer/${route.artifactId}` : '/editor/explorer';
    case 'sharing':
      return route.artifactId ? `/editor/sharing/${route.artifactId}` : '/editor/catalog';
    case 'alerts':
      return '/editor/alerts';
    default:
      return '/editor/catalog';
  }
}

// ========================================================================
// Breadcrumbs
// ========================================================================

export interface Breadcrumb {
  label: string;
  screen: EditorScreen;
  artifactId?: string;
  active: boolean;
}

/** Screen display labels for breadcrumbs. */
const SCREEN_LABELS: Record<EditorScreen, string> = {
  'catalog': 'Catalog',
  'dashboard-view': 'Dashboard',
  'dashboard-edit': 'Edit Dashboard',
  'report': 'Report',
  'explorer': 'Explorer',
  'sharing': 'Sharing',
  'alerts': 'Alerts & Subscriptions',
};

/**
 * Build breadcrumb trail from navigation history up to the current index.
 * The last breadcrumb is marked as active.
 */
export function buildBreadcrumbs(
  history: NavigationEntry[],
  historyIndex: number,
  artifactNames?: Map<string, string>,
): Breadcrumb[] {
  // Always show catalog as the root
  const crumbs: Breadcrumb[] = [];

  // Deduplicate consecutive screens in the history up to the current index
  const entries = history.slice(0, historyIndex + 1);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const label = entry.artifactId && artifactNames?.has(entry.artifactId)
      ? artifactNames.get(entry.artifactId)!
      : SCREEN_LABELS[entry.screen] ?? entry.screen;

    crumbs.push({
      label,
      screen: entry.screen,
      artifactId: entry.artifactId ?? undefined,
      active: i === entries.length - 1,
    });
  }

  return crumbs;
}

/**
 * Get the display label for an EditorScreen.
 */
export function getScreenLabel(screen: EditorScreen): string {
  return SCREEN_LABELS[screen] ?? screen;
}

// ========================================================================
// Deep link helpers
// ========================================================================

/**
 * Build a deep link URL for the editor.
 *
 * @param baseUrl - Application base URL (no trailing slash).
 * @param screen - The target editor screen.
 * @param artifactId - Optional artifact ID.
 * @param params - Optional query parameters.
 */
export function buildEditorDeepLink(
  baseUrl: string,
  screen: EditorScreen,
  artifactId?: string,
  params?: Record<string, string>,
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const route = buildRoutePath({ screen, artifactId });
  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return `${cleanBase}${route}${queryString}`;
}
