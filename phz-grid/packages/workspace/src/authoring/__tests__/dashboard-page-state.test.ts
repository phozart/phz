/**
 * Dashboard Multi-Page State — Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  type DashboardPage,
  type PageNavConfig,
  createPage,
  addPage,
  removePage,
  reorderPages,
  setActivePage,
  updatePageLabel,
  setPageNavConfig,
  duplicatePage,
  migrateSinglePageDashboard,
  getActivePage,
  _resetPageCounter,
  DEFAULT_PAGE_NAV_CONFIG,
} from '../dashboard-page-state.js';
import {
  type DashboardEditorState,
  initialDashboardEditorState,
  _resetWidgetCounter,
  addWidget,
} from '../dashboard-editor-state.js';

describe('dashboard-page-state', () => {
  let state: DashboardEditorState;

  beforeEach(() => {
    _resetPageCounter();
    _resetWidgetCounter();
    state = initialDashboardEditorState('Test Dashboard', 'ds-1');
  });

  // ── createPage ──

  it('creates a canvas page by default', () => {
    const page = createPage('My Page');
    expect(page.label).toBe('My Page');
    expect(page.pageType).toBe('canvas');
    expect(page.widgets).toEqual([]);
    expect(page.layout.kind).toBe('auto-grid');
    expect(page.id).toMatch(/^page_/);
  });

  it('creates a page with specified type and icon', () => {
    const page = createPage('SQL Sheet', 'sql', 'code');
    expect(page.pageType).toBe('sql');
    expect(page.icon).toBe('code');
  });

  // ── addPage ──

  it('adds a page and sets it as active', () => {
    const page = createPage('Page 2', 'query');
    const next = addPage(state, page);
    expect(next.pages).toHaveLength(2);
    expect(next.activePageId).toBe(page.id);
  });

  // ── removePage ──

  it('removes a page and falls back to previous', () => {
    const page2 = createPage('Page 2');
    state = addPage(state, page2);
    const page3 = createPage('Page 3');
    state = addPage(state, page3);

    // Remove active page (page3) → falls back
    const next = removePage(state, page3.id);
    expect(next.pages).toHaveLength(2);
    expect(next.activePageId).toBe(page2.id);
  });

  it('does not remove the last page', () => {
    const next = removePage(state, state.pages[0].id);
    expect(next.pages).toHaveLength(1);
    expect(next).toBe(state); // identity: no change
  });

  it('keeps active page when removing a different page', () => {
    const page2 = createPage('Page 2');
    state = addPage(state, page2);
    // active is page2, remove page1
    const page1Id = state.pages[0].id;
    const next = removePage(state, page1Id);
    expect(next.pages).toHaveLength(1);
    expect(next.activePageId).toBe(page2.id);
  });

  // ── reorderPages ──

  it('reorders pages by index', () => {
    const page2 = createPage('Page 2');
    const page3 = createPage('Page 3');
    state = addPage(state, page2);
    state = addPage(state, page3);

    const next = reorderPages(state, 0, 2);
    expect(next.pages[0].id).toBe(page2.id);
    expect(next.pages[2].label).toBe('Page 1'); // moved from index 0
  });

  it('returns same state for no-op reorder', () => {
    expect(reorderPages(state, 0, 0)).toBe(state);
  });

  it('returns same state for out-of-bounds reorder', () => {
    expect(reorderPages(state, -1, 0)).toBe(state);
    expect(reorderPages(state, 0, 5)).toBe(state);
  });

  // ── setActivePage ──

  it('switches the active page', () => {
    const page2 = createPage('Page 2');
    state = addPage(state, page2);
    const page1Id = state.pages[0].id;
    const next = setActivePage(state, page1Id);
    expect(next.activePageId).toBe(page1Id);
  });

  it('returns same state for unknown page id', () => {
    expect(setActivePage(state, 'nonexistent')).toBe(state);
  });

  it('returns same state if already active', () => {
    expect(setActivePage(state, state.activePageId)).toBe(state);
  });

  // ── updatePageLabel ──

  it('updates the label of a page', () => {
    const pageId = state.pages[0].id;
    const next = updatePageLabel(state, pageId, 'Renamed');
    expect(next.pages[0].label).toBe('Renamed');
  });

  // ── setPageNavConfig ──

  it('updates page nav config partially', () => {
    const next = setPageNavConfig(state, { position: 'left', collapsible: true });
    expect(next.pageNavConfig.position).toBe('left');
    expect(next.pageNavConfig.collapsible).toBe(true);
    expect(next.pageNavConfig.style).toBe('tabs'); // unchanged
  });

  // ── duplicatePage ──

  it('duplicates a page with new IDs', () => {
    // Add a widget to the first page so we can verify deep clone
    state = addWidget(state, 'bar-chart');
    // Put the widget on page 0
    const page0 = state.pages[0];
    const updatedPage0 = { ...page0, widgets: [...state.widgets] };
    state = { ...state, pages: [updatedPage0, ...state.pages.slice(1)] };

    const next = duplicatePage(state, updatedPage0.id);
    expect(next.pages).toHaveLength(2);
    const clone = next.pages[1];
    expect(clone.label).toBe('Page 1 (copy)');
    expect(clone.id).not.toBe(updatedPage0.id);
    expect(clone.widgets).toHaveLength(updatedPage0.widgets.length);
    // Widget IDs should differ
    if (clone.widgets.length > 0) {
      expect(clone.widgets[0].id).not.toBe(updatedPage0.widgets[0].id);
    }
    expect(next.activePageId).toBe(clone.id);
  });

  it('returns same state for unknown page id in duplicate', () => {
    expect(duplicatePage(state, 'nonexistent')).toBe(state);
  });

  // ── migrateSinglePageDashboard ──

  it('migrates a legacy single-page state to multi-page', () => {
    // Simulate a legacy state with no pages
    const legacy = { ...state, pages: [] as DashboardPage[], activePageId: '' };
    const migrated = migrateSinglePageDashboard(legacy);
    expect(migrated.pages).toHaveLength(1);
    expect(migrated.pages[0].label).toBe('Page 1');
    expect(migrated.pages[0].pageType).toBe('canvas');
    expect(migrated.pages[0].widgets).toBe(legacy.widgets);
    expect(migrated.pages[0].layout).toBe(legacy.layout);
    expect(migrated.activePageId).toBe('page_initial');
  });

  it('does not re-migrate if pages already exist', () => {
    const result = migrateSinglePageDashboard(state);
    expect(result).toBe(state);
  });

  // ── getActivePage ──

  it('returns the active page', () => {
    const page = getActivePage(state);
    expect(page).toBeDefined();
    expect(page!.id).toBe(state.activePageId);
  });

  // ── DEFAULT_PAGE_NAV_CONFIG ──

  it('provides sensible defaults', () => {
    expect(DEFAULT_PAGE_NAV_CONFIG.position).toBe('top');
    expect(DEFAULT_PAGE_NAV_CONFIG.style).toBe('tabs');
    expect(DEFAULT_PAGE_NAV_CONFIG.showLabels).toBe(true);
    expect(DEFAULT_PAGE_NAV_CONFIG.collapsible).toBe(false);
  });

  // ── initialDashboardEditorState includes pages ──

  it('initial state includes one default page', () => {
    expect(state.pages).toHaveLength(1);
    expect(state.pages[0].pageType).toBe('canvas');
    expect(state.activePageId).toBe(state.pages[0].id);
    expect(state.pageNavConfig).toEqual(DEFAULT_PAGE_NAV_CONFIG);
  });
});
