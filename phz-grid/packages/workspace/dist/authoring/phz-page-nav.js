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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { safeCustomElement } from '../safe-custom-element.js';
const PAGE_TYPE_LABELS = {
    canvas: 'Canvas',
    query: 'Query Builder',
    sql: 'SQL Editor',
    report: 'Report',
};
let PhzPageNav = class PhzPageNav extends LitElement {
    constructor() {
        super(...arguments);
        this.pages = [];
        this.activePageId = '';
        this.navConfig = {
            position: 'top', style: 'tabs', showLabels: true, collapsible: false,
        };
        this._showAddMenu = false;
        this._sidebarCollapsed = false;
    }
    static { this.styles = css `
    :host {
      display: block;
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }

    /* ── Horizontal (top / bottom) ── */
    .nav--horizontal {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 0 8px;
      border-bottom: 1px solid var(--phz-border, #d1d5db);
      background: var(--phz-bg-surface, #fff);
      overflow-x: auto;
      scrollbar-width: thin;
    }

    :host([position="bottom"]) .nav--horizontal {
      border-bottom: none;
      border-top: 1px solid var(--phz-border, #d1d5db);
    }

    /* ── Vertical (left sidebar) ── */
    .nav--vertical {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 4px;
      border-right: 1px solid var(--phz-border, #d1d5db);
      background: var(--phz-bg-surface, #fff);
      overflow-y: auto;
      min-width: 120px;
    }

    .nav--vertical.collapsed { min-width: 40px; }

    /* ── Tab items ── */
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--phz-text-secondary, #6b7280);
      white-space: nowrap;
      border-radius: 0;
      position: relative;
      flex-shrink: 0;
    }

    .tab:hover {
      color: var(--phz-text-primary, #111827);
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .tab:focus-visible {
      outline: 2px solid var(--phz-primary, #2563eb);
      outline-offset: -2px;
    }

    .tab.active {
      color: var(--phz-primary, #2563eb);
    }

    /* Tabs style active indicator */
    .nav--horizontal .tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 2px;
      background: var(--phz-primary, #2563eb);
    }

    .nav--vertical .tab.active::before {
      content: '';
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 0;
      width: 2px;
      background: var(--phz-primary, #2563eb);
    }

    /* Pills style */
    :host([nav-style="pills"]) .tab {
      border-radius: 6px;
    }

    :host([nav-style="pills"]) .tab.active {
      background: var(--phz-primary, #2563eb);
      color: #fff;
    }

    :host([nav-style="pills"]) .tab.active::after,
    :host([nav-style="pills"]) .tab.active::before {
      display: none;
    }

    .tab-icon { font-size: 14px; }

    .tab-type {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--phz-bg-canvas, #f3f4f6);
      color: var(--phz-text-tertiary, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .tab.active .tab-type {
      background: rgba(37, 99, 235, 0.1);
      color: var(--phz-primary, #2563eb);
    }

    /* ── Add button ── */
    .add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px dashed var(--phz-border, #d1d5db);
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      color: var(--phz-text-secondary, #6b7280);
      flex-shrink: 0;
      margin-left: 4px;
    }

    .add-btn:hover {
      border-color: var(--phz-primary, #2563eb);
      color: var(--phz-primary, #2563eb);
      background: var(--phz-bg-hover, #f0f7ff);
    }

    /* ── Add menu (type picker) ── */
    .add-menu {
      position: absolute;
      z-index: 10;
      background: var(--phz-bg-surface, #fff);
      border: 1px solid var(--phz-border, #d1d5db);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 4px 0;
      min-width: 160px;
    }

    .add-menu-item {
      display: block;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      color: var(--phz-text-primary, #111827);
    }

    .add-menu-item:hover {
      background: var(--phz-bg-hover, #f3f4f6);
    }

    .add-menu-item-desc {
      font-size: 11px;
      color: var(--phz-text-tertiary, #9ca3af);
    }

    /* ── Collapse toggle ── */
    .collapse-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 4px;
      font-size: 12px;
      color: var(--phz-text-secondary, #6b7280);
    }

    .collapse-btn:hover { color: var(--phz-text-primary, #111827); }
  `; }
    _emit(name, detail) {
        this.dispatchEvent(new CustomEvent(name, {
            bubbles: true, composed: true, detail,
        }));
    }
    _onPageClick(pageId) {
        this._emit('page-select', { pageId });
    }
    _onAddClick() {
        this._showAddMenu = !this._showAddMenu;
    }
    _onAddType(pageType) {
        this._showAddMenu = false;
        this._emit('page-add', { pageType });
    }
    _onKeyDown(e) {
        const tabs = this.pages;
        const currentIndex = tabs.findIndex(p => p.id === this.activePageId);
        if (currentIndex === -1)
            return;
        const isHorizontal = this.navConfig.position !== 'left';
        const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
        const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        if (e.key === nextKey) {
            e.preventDefault();
            const next = (currentIndex + 1) % tabs.length;
            this._emit('page-select', { pageId: tabs[next].id });
        }
        else if (e.key === prevKey) {
            e.preventDefault();
            const prev = (currentIndex - 1 + tabs.length) % tabs.length;
            this._emit('page-select', { pageId: tabs[prev].id });
        }
    }
    _toggleCollapse() {
        this._sidebarCollapsed = !this._sidebarCollapsed;
    }
    render() {
        const { position, style: navStyle, showLabels, collapsible } = this.navConfig;
        const isVertical = position === 'left';
        // Reflect attributes for CSS
        this.setAttribute('position', position);
        this.setAttribute('nav-style', navStyle);
        const navClasses = {
            'nav--horizontal': !isVertical,
            'nav--vertical': isVertical,
            collapsed: isVertical && this._sidebarCollapsed,
        };
        return html `
      <div class=${classMap(navClasses)}
           role="tablist"
           aria-label="Dashboard pages"
           aria-orientation="${isVertical ? 'vertical' : 'horizontal'}"
           @keydown=${this._onKeyDown}>

        ${isVertical && collapsible ? html `
          <button class="collapse-btn"
                  @click=${this._toggleCollapse}
                  aria-label="${this._sidebarCollapsed ? 'Expand page list' : 'Collapse page list'}">
            ${this._sidebarCollapsed ? '>' : '<'}
          </button>
        ` : nothing}

        ${this.pages.map(page => {
            const isActive = page.id === this.activePageId;
            return html `
            <button class="tab ${isActive ? 'active' : ''}"
                    role="tab"
                    id="page-tab-${page.id}"
                    aria-selected="${isActive}"
                    aria-controls="page-content-${page.id}"
                    tabindex="${isActive ? 0 : -1}"
                    @click=${() => this._onPageClick(page.id)}>
              ${page.icon ? html `<span class="tab-icon">${page.icon}</span>` : nothing}
              ${showLabels && !(isVertical && this._sidebarCollapsed)
                ? html `<span>${page.label}</span>`
                : nothing}
              ${page.pageType !== 'canvas' ? html `
                <span class="tab-type">${page.pageType}</span>
              ` : nothing}
            </button>
          `;
        })}

        <div style="position: relative; display: inline-flex;">
          <button class="add-btn"
                  @click=${this._onAddClick}
                  aria-label="Add page"
                  aria-haspopup="true"
                  aria-expanded="${this._showAddMenu}">+</button>

          ${this._showAddMenu ? html `
            <div class="add-menu" role="menu">
              ${['canvas', 'query', 'sql', 'report'].map(pt => html `
                <button class="add-menu-item" role="menuitem"
                  @click=${() => this._onAddType(pt)}>
                  ${PAGE_TYPE_LABELS[pt]}
                  <div class="add-menu-item-desc">
                    ${pt === 'canvas' ? 'Widget grid layout' :
            pt === 'query' ? 'Visual query builder' :
                pt === 'sql' ? 'Write SQL directly' :
                    'Embedded report grid'}
                  </div>
                </button>
              `)}
            </div>
          ` : nothing}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzPageNav.prototype, "pages", void 0);
__decorate([
    property({ type: String })
], PhzPageNav.prototype, "activePageId", void 0);
__decorate([
    property({ attribute: false })
], PhzPageNav.prototype, "navConfig", void 0);
__decorate([
    state()
], PhzPageNav.prototype, "_showAddMenu", void 0);
__decorate([
    state()
], PhzPageNav.prototype, "_sidebarCollapsed", void 0);
PhzPageNav = __decorate([
    safeCustomElement('phz-page-nav')
], PhzPageNav);
export { PhzPageNav };
//# sourceMappingURL=phz-page-nav.js.map