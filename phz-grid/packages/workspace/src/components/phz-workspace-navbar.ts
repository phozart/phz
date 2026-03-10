/**
 * <phz-workspace-navbar> — Horizontal sub-navigation bar
 *
 * Replaces the vertical icon rail with a horizontal bar below the header.
 * Contains navigation items, a create (+) button, and tool/drawer toggles.
 *
 * Events:
 *   nav-select  — { viewType, label, icon }
 *   drawer-toggle — { panel: DrawerPanel }
 *   create-new — (no detail) — opens a new blank artifact workspace
 */

import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { icon } from '../styles/icons.js';
import { getShellConfig, type WorkspaceRole } from '../shell/shell-roles.js';
import type { WorkspaceViewType, DrawerPanel } from '../shell/unified-workspace-state.js';
import {
  NAV_ITEMS,
  NAV_CREATE,
  NAV_TOOLS,
  VIEW_PANELS,
  type NavbarItem,
} from '../workspace-config.js';

@safeCustomElement('phz-workspace-navbar')
export class PhzWorkspaceNavbar extends LitElement {
  static readonly TAG = 'phz-workspace-navbar';

  static styles = css`
    :host {
      display: block;
      background: var(--bg-subtle, #FAF9F7);
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      flex-shrink: 0;
    }

    .navbar {
      display: flex;
      align-items: center;
      height: 40px;
      padding: 0 12px;
      gap: 2px;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .navbar__sep {
      width: 1px;
      height: 20px;
      background: var(--border-default, #E7E5E4);
      flex-shrink: 0;
      margin: 0 4px;
    }

    .navbar__spacer { flex: 1; }

    .navbar__btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #57534E);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .navbar__btn:hover {
      background: var(--bg-hover, rgba(0, 0, 0, 0.06));
      color: var(--text-primary, #1C1917);
    }

    .navbar__btn--active {
      background: var(--primary-100, #DBEAFE);
      color: var(--primary-700, #1D4ED8);
      font-weight: 600;
    }

    .navbar__btn:focus-visible {
      outline: 2px solid var(--primary-500, #3B82F6);
      outline-offset: -2px;
    }

    .navbar__btn svg { display: block; flex-shrink: 0; }

    .navbar__btn--create {
      background: var(--primary-500, #3B82F6);
      color: #FFFFFF;
    }

    .navbar__btn--create:hover {
      background: var(--primary-600, #2563EB);
      color: #FFFFFF;
    }

    /* ── Mobile: icon-only ── */
    @media (max-width: 768px) {
      .navbar__label { display: none; }
      .navbar__btn { padding: 6px; }
    }
  `;

  @property({ type: String }) activeViewType: WorkspaceViewType = 'catalog';
  @property({ type: String }) activeDrawer: DrawerPanel | null = null;
  @property({ type: String, attribute: 'workspace-role' }) workspaceRole: WorkspaceRole = 'admin';

  private _getVisibleTools(): NavbarItem[] {
    const config = getShellConfig(this.workspaceRole);
    const sections = new Set(config.sidebarSections);
    return NAV_TOOLS.filter(item => {
      if (item.section === 'GOVERN' && !sections.has('GOVERN')) return false;
      return true;
    });
  }

  private _handleNavClick(item: NavbarItem) {
    if (item.action === 'view' && item.viewType) {
      this.dispatchEvent(new CustomEvent('nav-select', {
        bubbles: true, composed: true,
        detail: {
          viewType: item.viewType,
          label: VIEW_PANELS[item.viewType]?.label ?? item.label,
          icon: item.icon,
        },
      }));
    } else if (item.action === 'drawer' && item.drawerPanel) {
      this.dispatchEvent(new CustomEvent('drawer-toggle', {
        bubbles: true, composed: true,
        detail: { panel: item.drawerPanel },
      }));
    }
  }

  private _handleCreateNew() {
    this.dispatchEvent(new CustomEvent('create-new', {
      bubbles: true, composed: true,
    }));
  }

  render() {
    const tools = this._getVisibleTools();

    return html`
      <nav class="navbar" aria-label="Workspace navigation">
        ${NAV_ITEMS.map(item => html`
          <button class="navbar__btn ${this.activeViewType === item.viewType ? 'navbar__btn--active' : ''}"
                  aria-label="${item.label}"
                  aria-current="${this.activeViewType === item.viewType ? 'page' : nothing}"
                  @click=${() => this._handleNavClick(item)}>
            ${unsafeHTML(icon(item.icon, 16, 'currentColor'))}
            <span class="navbar__label">${item.label}</span>
          </button>
        `)}

        <div class="navbar__sep"></div>

        <button class="navbar__btn navbar__btn--create"
                aria-label="${NAV_CREATE.label}"
                @click=${() => this._handleCreateNew()}>
          ${unsafeHTML(icon(NAV_CREATE.icon, 16, 'currentColor'))}
          <span class="navbar__label">${NAV_CREATE.label}</span>
        </button>

        <div class="navbar__spacer"></div>

        ${tools.map(item => html`
          <button class="navbar__btn ${this.activeDrawer === item.drawerPanel ? 'navbar__btn--active' : ''}"
                  aria-label="${item.label}"
                  aria-expanded="${this.activeDrawer === item.drawerPanel ? 'true' : 'false'}"
                  @click=${() => this._handleNavClick(item)}>
            ${unsafeHTML(icon(item.icon, 16, 'currentColor'))}
            <span class="navbar__label">${item.label}</span>
          </button>
        `)}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-workspace-navbar': PhzWorkspaceNavbar;
  }
}
