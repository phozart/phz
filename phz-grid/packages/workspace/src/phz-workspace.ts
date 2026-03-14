/**
 * <phz-workspace> — Unified single-view workspace component
 *
 * Slim orchestrator shell. Owns the UnifiedWorkspaceState and delegates
 * rendering to vertical-slice sub-components:
 *
 * Layout (top → bottom):
 * ┌─ header (56px dark frame) ───────────────────────────────────────┐
 * ├─ phz-workspace-navbar (40px horizontal sub-nav) ─────────────────┤
 * ├─ phz-workspace-selector-bar (44px artifact + back) ──────────────┤
 * ├─ body ────────────────────────────────────────────────────────────┤
 * │  ┌─ data-panel ─┬─ content (scroll) ─┬─ drawer (optional) ─┐    │
 * │  │ Data/Filters/ │ View component     │ Hierarchies/etc.   │    │
 * │  │ Settings tabs │                    │                    │    │
 * │  └──────────────┴────────────────────┴────────────────────┘    │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import '@phozart/workspace/all';
 *   <phz-workspace .adapter=${adapter} workspace-role="admin"></phz-workspace>
 */

import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from './safe-custom-element.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { WorkspaceAdapter } from './workspace-adapter.js';
import type { DataAdapter } from './data-adapter.js';
import { icon } from './styles/icons.js';
import type { WorkspaceRole } from './shell/shell-roles.js';
import {
  getAdapterBindings,
  forwardAdaptersToElement,
} from './shell/adapter-forwarding.js';
import {
  initialUnifiedWorkspaceState,
  navigateToView,
  navigateBack,
  canNavigateBack,
  setWorkspaceViewDirty,
  toggleWorkspaceDataPanel,
  setWorkspaceDataPanelTab,
  getAvailableDataPanelTabs,
  getActiveWorkspaceView,
  isAuthoringView,
  shouldShowDataPanel,
  shouldShowSelectorBar,
  openWorkspaceDrawer,
  closeWorkspaceDrawer,
  type UnifiedWorkspaceState,
  type WorkspaceView,
  type WorkspaceViewType,
  type DrawerPanel,
  type DataPanelTab,
} from './shell/unified-workspace-state.js';
import {
  VIEW_PANELS,
  VIEW_TYPE_ICON,
  legacyPanelToViewType,
  type PanelDescriptor,
} from './workspace-config.js';

// Side-effect imports: register sub-components
import './components/phz-workspace-navbar.js';
import './components/phz-workspace-data-panel.js';
import './components/phz-workspace-drawer.js';
import './components/phz-workspace-selector-bar.js';

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

@safeCustomElement('phz-workspace')
export class PhzWorkspace extends LitElement {
  static readonly TAG = 'phz-workspace';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 480px;
      min-width: 640px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-primary, #1C1917);
    }

    /* ── Header (light compact banner) ── */
    .ws-header {
      height: 36px;
      background: var(--bg-subtle, #FAF9F7);
      color: var(--text-secondary, #57534E);
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--border-default, #E7E5E4);
      flex-shrink: 0;
      gap: 8px;
    }

    .ws-header__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .ws-header__spacer { flex: 1; }

    .ws-header__user {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-muted, #78716C);
    }

    /* ── Body (data panel + content + drawer) ── */
    .ws-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      background: var(--bg-subtle, #FAF9F7);
      padding: 8px;
      gap: 8px;
    }

    /* ── Shared panel card style ── */
    phz-workspace-data-panel,
    phz-workspace-drawer {
      border-radius: var(--radius-lg, 12px);
      box-shadow:
        0 1px 3px rgba(28, 25, 23, 0.06),
        0 4px 12px rgba(28, 25, 23, 0.04);
    }

    phz-workspace-data-panel {
      width: 280px;
    }

    /* ── Content Area ── */
    .ws-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .ws-content {
      flex: 1;
      overflow: auto;
      background: var(--bg-base, #FEFDFB);
      border-radius: var(--radius-lg, 12px);
      box-shadow:
        0 1px 3px rgba(28, 25, 23, 0.06),
        0 4px 12px rgba(28, 25, 23, 0.04);
    }

    .ws-content__inner {
      max-width: 1440px;
      padding: 24px;
    }

    .ws-content--authoring {
      overflow: hidden;
      border-radius: 0;
    }

    phz-workspace-drawer {
      width: 360px;
    }

    /* ── Empty State ── */
    .ws-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
    }

    .ws-empty__icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted, #F5F5F4);
      border-radius: 16px;
      margin-bottom: 16px;
    }

    .ws-empty__icon svg { display: block; }

    .ws-empty__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary, #1C1917);
      margin: 0 0 8px;
    }

    .ws-empty__desc {
      font-size: 13px;
      color: var(--text-muted, #78716C);
      max-width: 320px;
      margin: 0;
    }

    /* ── Hamburger (mobile) ── */
    .ws-hamburger {
      display: none;
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      color: var(--text-secondary, #57534E);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .ws-hamburger:hover { background: var(--bg-muted, #F5F5F4); }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      :host { min-width: 320px; }
      .ws-hamburger { display: flex; }
      .ws-body { padding: 6px; gap: 6px; }
      phz-workspace-data-panel { display: none; }
      phz-workspace-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 300px;
        border-radius: 0;
      }
      .ws-content__inner { padding: 12px 8px; }
    }

    @media (max-width: 576px) {
      .ws-header { padding: 0 10px; }
      .ws-body { padding: 4px; gap: 4px; }
      .ws-content,
      phz-workspace-data-panel,
      phz-workspace-drawer { border-radius: var(--radius-md, 8px); }
      .ws-content__inner { padding: 8px; }
    }
  `;

  // ── Properties ────────────────────────────────────────────────────

  @property({ attribute: false }) adapter?: WorkspaceAdapter;
  @property({ attribute: false }) dataAdapter?: DataAdapter;
  @property({ type: String, reflect: true, attribute: 'workspace-role' }) workspaceRole: WorkspaceRole = 'admin';
  @property({ type: String }) title: string = 'Report Administration Tool';

  /** @deprecated Use navigateTo() instead. Kept for backward compat. */
  @property({ type: String, reflect: true, attribute: 'active-panel' }) activePanel: string = '';

  @state() private _ws: UnifiedWorkspaceState = initialUnifiedWorkspaceState();
  @state() private _mobileNavOpen = false;

  private _panelCache = new Map<string, HTMLElement>();

  // ── Lifecycle ─────────────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    if (this.activePanel && this.activePanel !== 'catalog') {
      this._openFromLegacyPanel(this.activePanel);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._panelCache.clear();
  }

  // ── State Transitions ────────────────────────────────────────────

  private _openFromLegacyPanel(panelId: string) {
    const viewType = legacyPanelToViewType(panelId);
    if (viewType) {
      this._ws = navigateToView(this._ws, {
        type: viewType,
        label: VIEW_PANELS[viewType]?.label ?? panelId,
        icon: VIEW_TYPE_ICON[viewType] ?? 'catalog',
      });
    }
  }

  private _handleNavSelect(e: CustomEvent<{ viewType: WorkspaceViewType; label: string; icon: string }>) {
    this._ws = navigateToView(this._ws, {
      type: e.detail.viewType,
      label: e.detail.label,
      icon: e.detail.icon,
    });
    this._emitViewChange();
  }

  private _handleDrawerToggle(e: CustomEvent<{ panel: DrawerPanel }>) {
    this._ws = openWorkspaceDrawer(this._ws, e.detail.panel);
  }

  private _handleDrawerClose() {
    this._ws = closeWorkspaceDrawer(this._ws);
  }

  private _handleCreateNew() {
    this._ws = navigateToView(this._ws, {
      type: 'report',
      label: 'Untitled',
      icon: 'report',
    });
    this._ws = setWorkspaceViewDirty(this._ws, true);
    this._emitViewChange();
  }

  private _handleBack() {
    this._ws = navigateBack(this._ws);
    this._emitViewChange();
  }

  private _handleRecentSelect(e: CustomEvent<{ id: string; type: string; name: string }>) {
    const { id, type, name } = e.detail;
    this._ws = navigateToView(this._ws, {
      type: type as WorkspaceViewType,
      label: name,
      icon: VIEW_TYPE_ICON[type as WorkspaceViewType] ?? 'catalog',
      artifactId: id,
    });
    this._emitViewChange();
  }

  private _handleToggleDataPanel() {
    this._ws = toggleWorkspaceDataPanel(this._ws);
  }

  private _handleDataPanelTabChange(e: CustomEvent<{ tab: DataPanelTab }>) {
    this._ws = setWorkspaceDataPanelTab(this._ws, e.detail.tab);
  }

  private _emitViewChange() {
    const view = getActiveWorkspaceView(this._ws);
    this.activePanel = view.type;
    this.dispatchEvent(new CustomEvent('view-change', {
      bubbles: true, composed: true,
      detail: { viewType: view.type, label: view.label, artifactId: view.artifactId },
    }));
  }

  // ── Public API ───────────────────────────────────────────────────

  /** Navigate to an artifact view. */
  navigateTo(type: WorkspaceViewType, label: string, artifactId?: string) {
    this._ws = navigateToView(this._ws, {
      type,
      label,
      icon: VIEW_TYPE_ICON[type] ?? 'catalog',
      artifactId,
    });
    this._emitViewChange();
  }

  /** Mark the current view as having unsaved changes. */
  setDirty(dirty: boolean) {
    this._ws = setWorkspaceViewDirty(this._ws, dirty);
  }

  // ── View Content ─────────────────────────────────────────────────

  private _renderViewContent() {
    const view = this._ws.activeView;
    const panel = VIEW_PANELS[view.type];
    if (!panel) {
      return html`
        <div class="ws-empty">
          <div class="ws-empty__icon">${unsafeHTML(icon('info', 32, '#78716C'))}</div>
          <h2 class="ws-empty__title">${view.label}</h2>
          <p class="ws-empty__desc">Unknown view type: ${view.type}</p>
        </div>
      `;
    }

    const isRegistered = typeof customElements !== 'undefined' && customElements.get(panel.tag);
    if (!isRegistered) {
      return html`
        <div class="ws-empty">
          <div class="ws-empty__icon">${unsafeHTML(icon(panel.emptyIcon, 32, '#78716C'))}</div>
          <h2 class="ws-empty__title">${panel.label}</h2>
          <p class="ws-empty__desc">${panel.emptyMessage}</p>
        </div>
      `;
    }

    return this._renderViewElement(view, panel);
  }

  private _renderViewElement(view: WorkspaceView, panel: PanelDescriptor): unknown {
    const cacheKey = view.artifactId ? `${view.type}:${view.artifactId}` : view.type;
    let el = this._panelCache.get(cacheKey);
    if (!el) {
      el = document.createElement(panel.tag);
      this._panelCache.set(cacheKey, el);
    }

    const bindings = getAdapterBindings(
      view.type === 'report' ? 'authoring-report'
        : view.type === 'dashboard' ? 'authoring-dashboard'
        : view.type,
      { dataAdapter: this.dataAdapter, workspaceAdapter: this.adapter },
    );
    forwardAdaptersToElement(el, bindings);

    if ('role' in el) {
      (el as unknown as Record<string, unknown>).role = this.workspaceRole;
    }
    if (view.artifactId && 'artifactId' in el) {
      (el as unknown as Record<string, unknown>).artifactId = view.artifactId;
    }

    return el;
  }

  // ── Render ───────────────────────────────────────────────────────

  render() {
    const view = this._ws.activeView;
    const authoring = isAuthoringView(this._ws);
    const showDataPanel = shouldShowDataPanel(this._ws);
    const showSelectorBar = shouldShowSelectorBar(this._ws);
    const availableTabs = getAvailableDataPanelTabs(this._ws);

    return html`
      <!-- Header -->
      <header class="ws-header">
        <button class="ws-hamburger"
                @click=${() => { this._mobileNavOpen = !this._mobileNavOpen; }}
                aria-label="Toggle navigation">
          ${unsafeHTML(icon(this._mobileNavOpen ? 'close' : 'menu', 16, 'currentColor'))}
        </button>
        <div class="ws-header__logo">
          <span>${this.title}</span>
        </div>
        <div class="ws-header__spacer"></div>
        <slot name="header-actions"></slot>
      </header>

      <!-- Horizontal Sub-Navbar -->
      <phz-workspace-navbar
        .activeViewType=${view.type}
        .activeDrawer=${this._ws.activeDrawer}
        workspace-role=${this.workspaceRole}
        @nav-select=${this._handleNavSelect}
        @drawer-toggle=${this._handleDrawerToggle}
        @create-new=${this._handleCreateNew}
      ></phz-workspace-navbar>

      <!-- Body: Data Panel + Content + Drawer -->
      <div class="ws-body">
        ${showDataPanel ? html`
          <phz-workspace-data-panel
            ?collapsed=${!this._ws.dataPanelOpen}
            .activeTab=${this._ws.dataPanelTab}
            .availableTabs=${availableTabs}
            .view=${view}
            .adapter=${this.adapter}
            .dataAdapter=${this.dataAdapter}
            @toggle=${this._handleToggleDataPanel}
            @tab-change=${this._handleDataPanelTabChange}
          ></phz-workspace-data-panel>
        ` : nothing}

        <div class="ws-main">
          ${showSelectorBar ? html`
            <phz-workspace-selector-bar
              .view=${view}
              .canGoBack=${canNavigateBack(this._ws)}
              .isDirty=${this._ws.isDirty}
              .dataPanelCollapsed=${!this._ws.dataPanelOpen}
              .recentArtifacts=${this._ws.recentArtifacts}
              @back=${this._handleBack}
              @recent-select=${this._handleRecentSelect}
              @toggle-data-panel=${this._handleToggleDataPanel}
            ></phz-workspace-selector-bar>
          ` : nothing}

          <main class="ws-content ${authoring ? 'ws-content--authoring' : ''}">
            ${authoring
              ? this._renderViewContent()
              : html`<div class="ws-content__inner">${this._renderViewContent()}</div>`}
          </main>
        </div>

        <phz-workspace-drawer
          .panel=${this._ws.activeDrawer}
          .width=${this._ws.drawerWidth}
          .adapter=${this.adapter}
          .dataAdapter=${this.dataAdapter}
          ?hidden=${!this._ws.activeDrawer}
          @close=${this._handleDrawerClose}
        ></phz-workspace-drawer>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-workspace': PhzWorkspace;
  }
}
