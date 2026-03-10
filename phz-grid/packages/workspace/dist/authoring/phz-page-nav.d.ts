/**
 * <phz-page-nav> — Page navigation tab bar for multi-page dashboards.
 *
 * Renders a tab/pill bar or sidebar for switching between dashboard pages.
 * Adapts layout to PageNavConfig.position (top | left | bottom).
 *
 * Events:
 *   page-select   — { pageId: string }
 *   page-add      — { pageType: DashboardPageType }
 *   page-remove   — { pageId: string }
 *   page-reorder  — { fromIndex: number, toIndex: number }
 *   page-rename   — { pageId: string, label: string }
 *   page-duplicate — { pageId: string }
 */
import { LitElement } from 'lit';
import type { DashboardPage, PageNavConfig } from './dashboard-page-state.js';
export declare class PhzPageNav extends LitElement {
    static styles: import("lit").CSSResult;
    pages: DashboardPage[];
    activePageId: string;
    navConfig: PageNavConfig;
    private _showAddMenu;
    private _sidebarCollapsed;
    private _emit;
    private _onPageClick;
    private _onAddClick;
    private _onAddType;
    private _onKeyDown;
    private _toggleCollapse;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-page-nav': PhzPageNav;
    }
}
//# sourceMappingURL=phz-page-nav.d.ts.map