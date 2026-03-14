var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-viewer-shell> Custom Element
 *
 * Top-level shell component for the read-only viewer. Renders
 * a navigation bar, screen content area, and attention dropdown.
 * Delegates all logic to the headless viewer-state functions.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createViewerShellState, navigateTo, navigateBack, navigateForward, canGoBack, canGoForward, setError, setEmpty, setLoading, setAttentionCount, } from '../viewer-state.js';
// ========================================================================
// <phz-viewer-shell>
// ========================================================================
let PhzViewerShell = class PhzViewerShell extends LitElement {
    constructor() {
        super(...arguments);
        this.theme = 'auto';
        this.mobile = false;
        // --- Internal state ---
        this._shellState = createViewerShellState();
    }
    static { this.styles = css `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      font-family: var(--phz-font-family, system-ui, sans-serif);
      color: var(--phz-text-primary, #1a1a2e);
      background: var(--phz-bg-surface, #ffffff);
    }

    :host([mobile]) .viewer-nav {
      flex-direction: column;
      gap: 4px;
    }

    .viewer-nav {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--phz-border-default, #e2e8f0);
      background: var(--phz-bg-header, #f8fafc);
      flex-shrink: 0;
    }

    .viewer-nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .viewer-nav-title {
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .viewer-nav-tabs {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .viewer-nav-tab {
      padding: 6px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 6px;
      font-size: 14px;
      color: var(--phz-text-secondary, #64748b);
      transition: background 0.15s, color 0.15s;
    }

    .viewer-nav-tab:hover {
      background: var(--phz-bg-hover, #f1f5f9);
    }

    .viewer-nav-tab[data-active] {
      background: var(--phz-bg-active, #e2e8f0);
      color: var(--phz-text-primary, #1a1a2e);
      font-weight: 600;
    }

    .viewer-nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: var(--phz-text-secondary, #64748b);
    }

    .viewer-nav-btn:hover:not(:disabled) {
      background: var(--phz-bg-hover, #f1f5f9);
    }

    .viewer-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .viewer-content {
      flex: 1;
      overflow: auto;
      position: relative;
    }

    .viewer-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 14px;
      color: var(--phz-text-secondary, #64748b);
    }

    .attention-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 600;
      background: var(--phz-color-danger, #ef4444);
      color: #ffffff;
      margin-left: -4px;
      margin-top: -8px;
    }
  `; }
    // --- Lifecycle ---
    connectedCallback() {
        super.connectedCallback();
        if (this.config) {
            this._shellState = createViewerShellState({
                currentScreen: this.config.initialScreen ?? 'catalog',
                activeArtifactId: this.config.initialArtifactId ?? null,
                activeArtifactType: this.config.initialArtifactType ?? null,
                viewerContext: this.config.viewerContext ?? null,
            });
        }
    }
    // --- Public API ---
    getShellState() {
        return this._shellState;
    }
    navigate(screen, artifactId, artifactType) {
        this._shellState = navigateTo(this._shellState, screen, artifactId, artifactType);
        this._dispatchNavigate(screen, artifactId, artifactType);
        this.requestUpdate();
    }
    goBack() {
        this._shellState = navigateBack(this._shellState);
        this.requestUpdate();
    }
    goForward() {
        this._shellState = navigateForward(this._shellState);
        this.requestUpdate();
    }
    setShellError(error) {
        this._shellState = setError(this._shellState, error);
        this.requestUpdate();
    }
    setShellEmpty(empty) {
        this._shellState = setEmpty(this._shellState, empty);
        this.requestUpdate();
    }
    setShellLoading(loading) {
        this._shellState = setLoading(this._shellState, loading);
        this.requestUpdate();
    }
    setShellAttentionCount(count) {
        this._shellState = setAttentionCount(this._shellState, count);
        this.requestUpdate();
    }
    // --- Rendering ---
    render() {
        const s = this._shellState;
        const showExplorer = this.config?.features?.explorer ?? true;
        const showAttention = this.config?.features?.attentionItems ?? true;
        const title = this.config?.branding?.title ?? 'Viewer';
        return html `
      <nav class="viewer-nav" role="navigation" aria-label="Viewer navigation">
        <span class="viewer-nav-title">${title}</span>

        <div class="viewer-nav-actions">
          <button
            class="viewer-nav-btn"
            aria-label="Go back"
            ?disabled=${!canGoBack(s)}
            @click=${this._handleBack}
          >&larr;</button>
          <button
            class="viewer-nav-btn"
            aria-label="Go forward"
            ?disabled=${!canGoForward(s)}
            @click=${this._handleForward}
          >&rarr;</button>
        </div>

        <div class="viewer-nav-tabs" role="tablist">
          <button
            class="viewer-nav-tab"
            role="tab"
            ?data-active=${s.currentScreen === 'catalog'}
            aria-selected=${s.currentScreen === 'catalog' ? 'true' : 'false'}
            @click=${() => this.navigate('catalog')}
          >Catalog</button>
          <button
            class="viewer-nav-tab"
            role="tab"
            ?data-active=${s.currentScreen === 'dashboard'}
            aria-selected=${s.currentScreen === 'dashboard' ? 'true' : 'false'}
            @click=${() => this.navigate('dashboard')}
          >Dashboard</button>
          <button
            class="viewer-nav-tab"
            role="tab"
            ?data-active=${s.currentScreen === 'report'}
            aria-selected=${s.currentScreen === 'report' ? 'true' : 'false'}
            @click=${() => this.navigate('report')}
          >Report</button>
          ${showExplorer ? html `
            <button
              class="viewer-nav-tab"
              role="tab"
              ?data-active=${s.currentScreen === 'explorer'}
              aria-selected=${s.currentScreen === 'explorer' ? 'true' : 'false'}
              @click=${() => this.navigate('explorer')}
            >Explorer</button>
          ` : nothing}
        </div>

        ${showAttention ? html `
          <button
            class="viewer-nav-btn"
            aria-label="Attention items (${s.attentionCount} unread)"
            @click=${this._handleAttentionClick}
          >
            &#x1F514;
            ${s.attentionCount > 0 ? html `
              <span class="attention-badge">${s.attentionCount}</span>
            ` : nothing}
          </button>
        ` : nothing}
      </nav>

      <main class="viewer-content" role="main">
        ${s.loading ? html `<div class="viewer-loading">Loading...</div>` : nothing}
        <slot name=${s.currentScreen}></slot>
        <slot></slot>
      </main>
    `;
    }
    // --- Private methods ---
    _handleBack() {
        this.goBack();
    }
    _handleForward() {
        this.goForward();
    }
    _handleAttentionClick() {
        this.dispatchEvent(new CustomEvent('attention-toggle', { bubbles: true, composed: true }));
    }
    _dispatchNavigate(screen, artifactId, artifactType) {
        this.dispatchEvent(new CustomEvent('viewer-navigate', {
            bubbles: true,
            composed: true,
            detail: { screen, artifactId, artifactType },
        }));
    }
};
__decorate([
    property({ attribute: false })
], PhzViewerShell.prototype, "config", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerShell.prototype, "viewerContext", void 0);
__decorate([
    property({ type: String, reflect: true })
], PhzViewerShell.prototype, "theme", void 0);
__decorate([
    property({ type: Boolean, reflect: true })
], PhzViewerShell.prototype, "mobile", void 0);
__decorate([
    state()
], PhzViewerShell.prototype, "_shellState", void 0);
PhzViewerShell = __decorate([
    customElement('phz-viewer-shell')
], PhzViewerShell);
export { PhzViewerShell };
//# sourceMappingURL=phz-viewer-shell.js.map