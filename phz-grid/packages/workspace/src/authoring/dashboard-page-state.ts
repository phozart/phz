/**
 * @phozart/workspace — Dashboard Multi-Page State
 *
 * Pure functions for managing multi-page dashboards. Each dashboard contains
 * one or more pages, each with its own layout, widgets, and optional filters.
 *
 * Page types:
 *  - 'canvas'  — standard widget grid (default)
 *  - 'query'   — visual query builder (existing data workbench)
 *  - 'sql'     — raw SQL editor with result table
 *  - 'report'  — embedded report grid
 */

import type { LayoutNode } from '../schema/config-layers.js';
import type { FilterBinding } from '../filters/filter-definition.js';
import type { DashboardWidgetState, DashboardEditorState } from './dashboard-editor-state.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardPageType = 'canvas' | 'query' | 'sql' | 'report';

export interface DashboardPage {
  id: string;
  label: string;
  icon?: string;
  pageType: DashboardPageType;
  layout: LayoutNode;
  widgets: DashboardWidgetState[];
  pageFilters?: FilterBinding[];
}

export interface PageNavConfig {
  position: 'top' | 'left' | 'bottom';
  style: 'tabs' | 'pills' | 'sidebar';
  showLabels: boolean;
  collapsible: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_NAV_CONFIG: PageNavConfig = {
  position: 'top',
  style: 'tabs',
  showLabels: true,
  collapsible: false,
};

let pageCounter = 0;

export function createPage(
  label: string,
  pageType: DashboardPageType = 'canvas',
  icon?: string,
): DashboardPage {
  pageCounter++;
  return {
    id: `page_${Date.now()}_${pageCounter}`,
    label,
    icon,
    pageType,
    layout: { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [] },
    widgets: [],
  };
}

// ---------------------------------------------------------------------------
// Pure State Transitions
// ---------------------------------------------------------------------------

export function addPage(
  state: DashboardEditorState,
  page: DashboardPage,
): DashboardEditorState {
  return {
    ...state,
    pages: [...state.pages, page],
    activePageId: page.id,
  };
}

export function removePage(
  state: DashboardEditorState,
  pageId: string,
): DashboardEditorState {
  if (state.pages.length <= 1) return state; // never remove last page

  const pages = state.pages.filter(p => p.id !== pageId);
  let activePageId = state.activePageId;

  if (activePageId === pageId) {
    // Fall back to the page before the removed one, or the first page
    const removedIndex = state.pages.findIndex(p => p.id === pageId);
    const fallbackIndex = Math.min(removedIndex, pages.length - 1);
    activePageId = pages[fallbackIndex].id;
  }

  return { ...state, pages, activePageId };
}

export function reorderPages(
  state: DashboardEditorState,
  fromIndex: number,
  toIndex: number,
): DashboardEditorState {
  if (fromIndex === toIndex) return state;
  if (fromIndex < 0 || fromIndex >= state.pages.length) return state;
  if (toIndex < 0 || toIndex >= state.pages.length) return state;

  const pages = [...state.pages];
  const [moved] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, moved);
  return { ...state, pages };
}

export function setActivePage(
  state: DashboardEditorState,
  pageId: string,
): DashboardEditorState {
  if (!state.pages.some(p => p.id === pageId)) return state;
  if (state.activePageId === pageId) return state;
  return { ...state, activePageId: pageId };
}

export function updatePageLabel(
  state: DashboardEditorState,
  pageId: string,
  label: string,
): DashboardEditorState {
  return {
    ...state,
    pages: state.pages.map(p =>
      p.id === pageId ? { ...p, label } : p,
    ),
  };
}

export function setPageNavConfig(
  state: DashboardEditorState,
  config: Partial<PageNavConfig>,
): DashboardEditorState {
  return {
    ...state,
    pageNavConfig: { ...state.pageNavConfig, ...config },
  };
}

export function duplicatePage(
  state: DashboardEditorState,
  pageId: string,
): DashboardEditorState {
  const source = state.pages.find(p => p.id === pageId);
  if (!source) return state;

  pageCounter++;
  const newId = `page_${Date.now()}_${pageCounter}`;

  const clonedWidgets = source.widgets.map(w => ({
    ...w,
    id: `${w.id}_dup_${pageCounter}`,
    config: { ...w.config },
    dataConfig: {
      dimensions: [...w.dataConfig.dimensions],
      measures: [...w.dataConfig.measures],
      filters: [...w.dataConfig.filters],
    },
    position: { ...w.position },
  }));

  const clone: DashboardPage = {
    ...source,
    id: newId,
    label: `${source.label} (copy)`,
    widgets: clonedWidgets,
    pageFilters: source.pageFilters ? [...source.pageFilters] : undefined,
  };

  const sourceIndex = state.pages.findIndex(p => p.id === pageId);
  const pages = [...state.pages];
  pages.splice(sourceIndex + 1, 0, clone);

  return { ...state, pages, activePageId: newId };
}

/**
 * Migrate a single-page dashboard to the multi-page format.
 * Existing widgets and layout become page[0].
 */
export function migrateSinglePageDashboard(
  state: DashboardEditorState,
): DashboardEditorState {
  if (state.pages.length > 0) return state; // already migrated

  const page: DashboardPage = {
    id: 'page_initial',
    label: 'Page 1',
    pageType: 'canvas',
    layout: state.layout,
    widgets: state.widgets,
  };

  return {
    ...state,
    pages: [page],
    activePageId: page.id,
  };
}

/**
 * Get the currently active page, or undefined if no pages exist.
 */
export function getActivePage(state: DashboardEditorState): DashboardPage | undefined {
  return state.pages.find(p => p.id === state.activePageId);
}

/**
 * Reset the page counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetPageCounter(): void {
  pageCounter = 0;
}
