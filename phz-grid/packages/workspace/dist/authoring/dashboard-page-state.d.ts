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
export declare const DEFAULT_PAGE_NAV_CONFIG: PageNavConfig;
export declare function createPage(label: string, pageType?: DashboardPageType, icon?: string): DashboardPage;
export declare function addPage(state: DashboardEditorState, page: DashboardPage): DashboardEditorState;
export declare function removePage(state: DashboardEditorState, pageId: string): DashboardEditorState;
export declare function reorderPages(state: DashboardEditorState, fromIndex: number, toIndex: number): DashboardEditorState;
export declare function setActivePage(state: DashboardEditorState, pageId: string): DashboardEditorState;
export declare function updatePageLabel(state: DashboardEditorState, pageId: string, label: string): DashboardEditorState;
export declare function setPageNavConfig(state: DashboardEditorState, config: Partial<PageNavConfig>): DashboardEditorState;
export declare function duplicatePage(state: DashboardEditorState, pageId: string): DashboardEditorState;
/**
 * Migrate a single-page dashboard to the multi-page format.
 * Existing widgets and layout become page[0].
 */
export declare function migrateSinglePageDashboard(state: DashboardEditorState): DashboardEditorState;
/**
 * Get the currently active page, or undefined if no pages exist.
 */
export declare function getActivePage(state: DashboardEditorState): DashboardPage | undefined;
/**
 * Reset the page counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetPageCounter(): void;
//# sourceMappingURL=dashboard-page-state.d.ts.map