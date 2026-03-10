/**
 * @phozart/phz-workspace — WorkspaceShell
 *
 * Root shell component: dark header bar, sidebar with SVG icons and section headers,
 * content area with slot-based panel routing. Role-aware navigation.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { initialBreadcrumbBarState, pushBreadcrumb, popToBreadcrumb, getBreadcrumbs, getCollapsedBreadcrumbs, } from './breadcrumb-bar-state.js';
import { icon, NAV_ICONS } from '../styles/icons.js';
import { getNavItemsForRole, getShellConfig, } from './shell-roles.js';
/** Section header display labels */
const SECTION_LABELS = {
    CONTENT: 'Content',
    DATA: 'Data',
    GOVERN: 'Govern',
};
let PhzWorkspaceShell = class PhzWorkspaceShell extends LitElement {
    constructor() {
        super(...arguments);
        this.role = 'admin';
        this.title = 'Workspace';
        /** Save status indicator: idle, dirty, saving, saved, error. */
        this.saveStatus = 'idle';
        /** Whether undo action is available. */
        this.canUndo = false;
        /** Whether redo action is available. */
        this.canRedo = false;
        this.activePanel = '';
        this._mobileNavOpen = false;
        this._breadcrumbState = initialBreadcrumbBarState();
    }
    static { this.TAG = 'phz-workspace-shell'; }
    static { this.styles = css `
    :host {
      display: flex;
      height: 100%;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-primary, #1C1917);
    }

    /* ── Header (56px dark frame, sticky) ── */
    .shell-header {
      position: sticky;
      top: 0;
      z-index: 50;
      height: 56px;
      background: var(--header-bg, #1C1917);
      color: var(--header-text, #FFFFFF);
      display: none; /* shown on mobile */
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--header-border, #292524);
      gap: 12px;
    }

    .shell-header__title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.04em;
      flex: 1;
    }

    /* ── Save Indicator ── */
    .shell-save-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--header-text-muted, #A8A29E);
      padding: 4px 8px;
      border-radius: 4px;
    }

    .shell-save-indicator--saved { color: #4ade80; }
    .shell-save-indicator--saving { color: #facc15; }
    .shell-save-indicator--dirty { color: #fb923c; }
    .shell-save-indicator--error { color: #f87171; }

    .shell-save-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    /* ── Undo/Redo Buttons ── */
    .shell-toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--header-text-muted, #A8A29E);
      cursor: pointer;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .shell-toolbar-btn:hover:not(:disabled) {
      background: #292524;
      color: #FFFFFF;
    }

    .shell-toolbar-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }

    .shell-toolbar-group {
      display: flex;
      gap: 2px;
      align-items: center;
    }

    /* ── Sidebar (240px, warm subtle bg) ── */
    .shell-sidebar {
      width: 240px;
      background: var(--header-bg, #1C1917);
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-right: 1px solid var(--header-border, #292524);
      overflow-y: auto;
    }

    .shell-sidebar__logo {
      height: 56px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--header-border, #292524);
      gap: 10px;
      flex-shrink: 0;
    }

    .shell-sidebar__logo-icon {
      display: flex;
      align-items: center;
    }

    /* ── Section Headers ── */
    .shell-section-header {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--header-text-muted, #78716C);
      padding: 20px 20px 6px;
      margin: 0;
    }

    .shell-section-header:first-of-type {
      padding-top: 12px;
    }

    /* ── Nav Items ── */
    .shell-nav {
      list-style: none;
      padding: 0 8px;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .shell-nav__item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--header-text-muted, #A8A29E);
      width: 100%;
      text-align: left;
      transition: background 0.15s ease, color 0.15s ease;
      min-height: 40px;
      position: relative;
    }

    .shell-nav__item:hover {
      background: #292524;
      color: #FFFFFF;
    }

    .shell-nav__item--active {
      background: var(--primary-500, #3B82F6);
      color: #FFFFFF;
    }

    .shell-nav__item--active::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 4px;
      bottom: 4px;
      width: 3px;
      background: var(--header-accent, #3B82F6);
      border-radius: 0 2px 2px 0;
    }

    .shell-nav__item:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .shell-nav__icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .shell-nav__icon svg {
      display: block;
    }

    /* ── Content Area ── */
    .shell-content {
      flex: 1;
      overflow: auto;
      background: var(--bg-base, #FEFDFB);
      min-width: 0;
    }

    .shell-content__inner {
      max-width: 1440px;
      padding: 24px;
    }

    /* ── Hamburger (hidden on desktop) ── */
    .shell-hamburger {
      display: none;
      width: 44px;
      height: 44px;
      border: none;
      background: none;
      color: #FFFFFF;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .shell-hamburger:hover { background: #292524; }

    /* ── Laptop (1024-1280): sidebar icon-only ── */
    @media (max-width: 1280px) and (min-width: 769px) {
      .shell-sidebar { width: 56px; }
      .shell-sidebar__logo span { display: none; }
      .shell-sidebar__logo { justify-content: center; padding: 0; }
      .shell-section-header { display: none; }
      .shell-nav { padding: 4px; }
      .shell-nav__item { justify-content: center; padding: 8px; }
      .shell-nav__label { display: none; }
      .shell-nav__item--active::before { display: none; }
    }

    /* ── Tablet & Mobile (<769px) ── */
    @media (max-width: 768px) {
      :host { flex-direction: column; }

      .shell-header { display: flex; }
      .shell-sidebar { display: none; }
      .shell-sidebar--mobile-open {
        display: flex;
        position: fixed;
        z-index: 100;
        top: 56px;
        left: 0;
        bottom: 0;
        width: 280px;
        box-shadow: 4px 0 16px rgba(0,0,0,0.3);
      }

      .shell-hamburger { display: flex; }

      .shell-content__inner { padding: 16px; }
    }

    /* ── Small Mobile (<576px) ── */
    @media (max-width: 576px) {
      .shell-header { height: 48px; }
      .shell-content__inner { padding: 12px 8px; }
    }

    /* ── Overlay backdrop for mobile sidebar ── */
    .shell-overlay {
      display: none;
      position: fixed;
      z-index: 99;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
    }

    .shell-overlay--visible { display: block; }
  `; }
    getResolvedNavItems() {
        if (this.navItems) {
            return this.navItems.map(n => ({ ...n, section: 'CONTENT' }));
        }
        return getNavItemsForRole(this.role);
    }
    _emitUndo() {
        this.dispatchEvent(new CustomEvent('undo-action', { bubbles: true, composed: true }));
    }
    _emitRedo() {
        this.dispatchEvent(new CustomEvent('redo-action', { bubbles: true, composed: true }));
    }
    _getSaveLabel() {
        switch (this.saveStatus) {
            case 'saved': return 'Saved';
            case 'saving': return 'Saving...';
            case 'dirty': return 'Unsaved changes';
            case 'error': return 'Save error';
            default: return '';
        }
    }
    handleNavClick(id) {
        this.activePanel = id;
        this._mobileNavOpen = false;
        const items = this.getResolvedNavItems();
        const item = items.find(i => i.id === id);
        this._breadcrumbState = pushBreadcrumb(this._breadcrumbState, {
            id,
            label: item?.label ?? id,
            panelId: id,
        });
        this.dispatchEvent(new CustomEvent('panel-change', {
            bubbles: true,
            composed: true,
            detail: { panelId: id },
        }));
    }
    _handleBreadcrumbClick(index) {
        this._breadcrumbState = popToBreadcrumb(this._breadcrumbState, index);
        const crumbs = getBreadcrumbs(this._breadcrumbState);
        const last = crumbs[crumbs.length - 1];
        if (last) {
            this.activePanel = last.panelId;
            this.dispatchEvent(new CustomEvent('panel-change', {
                bubbles: true,
                composed: true,
                detail: { panelId: last.panelId },
            }));
        }
    }
    renderNavIcon(iconKey) {
        const iconName = (NAV_ICONS[iconKey] ?? iconKey);
        const svg = icon(iconName, 18, 'currentColor');
        return svg ? unsafeHTML(svg) : nothing;
    }
    renderSidebar() {
        const items = this.getResolvedNavItems();
        const config = getShellConfig(this.role);
        const active = this.activePanel || items[0]?.id || '';
        // Group items by section
        const sections = config.sidebarSections;
        const grouped = new Map();
        for (const section of sections) {
            grouped.set(section, items.filter(i => i.section === section));
        }
        return html `
      <div class="shell-sidebar__logo">
        <span class="shell-sidebar__logo-icon">${unsafeHTML(icon('grid', 20, '#3B82F6'))}</span>
        <span>${this.title}</span>
      </div>
      ${sections.map(section => {
            const sectionItems = grouped.get(section) ?? [];
            if (sectionItems.length === 0)
                return nothing;
            return html `
          <p class="shell-section-header">${SECTION_LABELS[section]}</p>
          <ul class="shell-nav" role="list">
            ${sectionItems.map(item => html `
              <li>
                <button class="shell-nav__item ${active === item.id ? 'shell-nav__item--active' : ''}"
                        role="listitem"
                        aria-current="${active === item.id ? 'page' : 'false'}"
                        @click=${() => this.handleNavClick(item.id)}>
                  <span class="shell-nav__icon">${this.renderNavIcon(item.icon)}</span>
                  <span class="shell-nav__label">${item.label}</span>
                </button>
              </li>
            `)}
          </ul>
        `;
        })}
    `;
    }
    render() {
        const items = this.getResolvedNavItems();
        const active = this.activePanel || items[0]?.id || '';
        return html `
      <!-- Mobile header -->
      <header class="shell-header">
        <button class="shell-hamburger"
                @click=${() => { this._mobileNavOpen = !this._mobileNavOpen; }}
                aria-label="Toggle navigation">
          ${unsafeHTML(icon(this._mobileNavOpen ? 'close' : 'menu', 22, 'currentColor'))}
        </button>
        <span class="shell-header__title">${this.title}</span>
        ${this.saveStatus !== 'idle' ? html `
          <span class="shell-save-indicator shell-save-indicator--${this.saveStatus}">
            <span class="shell-save-dot"></span>
            ${this._getSaveLabel()}
          </span>
        ` : nothing}
        <div class="shell-toolbar-group">
          <button class="shell-toolbar-btn"
                  ?disabled=${!this.canUndo}
                  @click=${this._emitUndo}
                  aria-label="Undo"
                  title="Undo (Ctrl+Z)">
            ${unsafeHTML(icon('back', 16, 'currentColor'))}
          </button>
          <button class="shell-toolbar-btn"
                  ?disabled=${!this.canRedo}
                  @click=${this._emitRedo}
                  aria-label="Redo"
                  title="Redo (Ctrl+Shift+Z)">
            ${unsafeHTML(icon('forward', 16, 'currentColor'))}
          </button>
        </div>
      </header>

      <!-- Mobile overlay -->
      <div class="shell-overlay ${this._mobileNavOpen ? 'shell-overlay--visible' : ''}"
           @click=${() => { this._mobileNavOpen = false; }}></div>

      <!-- Sidebar -->
      <aside class="shell-sidebar ${this._mobileNavOpen ? 'shell-sidebar--mobile-open' : ''}"
             role="navigation"
             aria-label="Workspace navigation">
        ${this.renderSidebar()}
      </aside>

      <!-- Content -->
      <main class="shell-content">
        ${getBreadcrumbs(this._breadcrumbState).length > 0 ? html `
          <nav class="shell-breadcrumbs" aria-label="Breadcrumb" style="padding: 8px 24px; border-bottom: 1px solid var(--border-subtle, #E7E5E4); font-size: 13px; display: flex; align-items: center; gap: 6px;">
            ${(() => {
            const { collapsed, visible } = getCollapsedBreadcrumbs(this._breadcrumbState);
            const allCrumbs = getBreadcrumbs(this._breadcrumbState);
            return html `
                ${visible.map((crumb, i) => {
                const realIndex = allCrumbs.findIndex(c => c.id === crumb.id);
                const isLast = i === visible.length - 1;
                return html `
                    ${i === 1 && collapsed.length > 0 ? html `<span style="color: var(--text-tertiary, #78716C);" title="${collapsed.map(c => c.label).join(' > ')}">...</span><span style="color: var(--text-tertiary, #78716C);">/</span>` : nothing}
                    ${i > 0 && !(i === 1 && collapsed.length > 0) ? html `<span style="color: var(--text-tertiary, #78716C);">/</span>` : nothing}
                    ${isLast
                    ? html `<span style="font-weight: 500;">${crumb.label}</span>`
                    : html `<button style="border: none; background: none; cursor: pointer; color: var(--primary-500, #3B82F6); font-size: 13px; padding: 0;" @click=${() => this._handleBreadcrumbClick(realIndex)}>${crumb.label}</button>`}
                  `;
            })}
              `;
        })()}
          </nav>
        ` : nothing}
        <div class="shell-content__inner">
          <slot name="${active}">
            <slot></slot>
          </slot>
        </div>
      </main>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzWorkspaceShell.prototype, "adapter", void 0);
__decorate([
    property({ type: String, reflect: true })
], PhzWorkspaceShell.prototype, "role", void 0);
__decorate([
    property({ type: String })
], PhzWorkspaceShell.prototype, "title", void 0);
__decorate([
    property({ attribute: false })
], PhzWorkspaceShell.prototype, "navItems", void 0);
__decorate([
    property({ type: String, attribute: 'save-status' })
], PhzWorkspaceShell.prototype, "saveStatus", void 0);
__decorate([
    property({ type: Boolean, attribute: 'can-undo' })
], PhzWorkspaceShell.prototype, "canUndo", void 0);
__decorate([
    property({ type: Boolean, attribute: 'can-redo' })
], PhzWorkspaceShell.prototype, "canRedo", void 0);
__decorate([
    state()
], PhzWorkspaceShell.prototype, "activePanel", void 0);
__decorate([
    state()
], PhzWorkspaceShell.prototype, "_mobileNavOpen", void 0);
__decorate([
    state()
], PhzWorkspaceShell.prototype, "_breadcrumbState", void 0);
PhzWorkspaceShell = __decorate([
    safeCustomElement('phz-workspace-shell')
], PhzWorkspaceShell);
export { PhzWorkspaceShell };
//# sourceMappingURL=phz-workspace-shell.js.map