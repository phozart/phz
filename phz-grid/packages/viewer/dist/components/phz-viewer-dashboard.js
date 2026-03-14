var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/viewer — <phz-viewer-dashboard> Custom Element
 *
 * Dashboard view screen. Renders a read-only dashboard with widgets,
 * cross-filtering, and expand/collapse. Delegates state to
 * the headless dashboard-state functions.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createDashboardViewState, loadDashboard, applyCrossFilter, clearCrossFilter, clearAllCrossFilters, toggleFullscreen, toggleWidgetExpanded, refreshDashboard, } from '../screens/dashboard-state.js';
// ========================================================================
// <phz-viewer-dashboard>
// ========================================================================
let PhzViewerDashboard = class PhzViewerDashboard extends LitElement {
    constructor() {
        super(...arguments);
        // --- Public properties ---
        this.dashboardId = '';
        this.widgets = [];
        this.dashboardTitle = '';
        this.dashboardDescription = '';
        // --- Internal state ---
        this._dashState = createDashboardViewState();
    }
    static { this.styles = css `
    :host {
      display: block;
      padding: 16px;
      height: 100%;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .dashboard-title {
      font-size: 20px;
      font-weight: 600;
    }

    .dashboard-desc {
      font-size: 13px;
      color: var(--phz-text-secondary, #64748b);
      margin-top: 4px;
    }

    .dashboard-actions {
      display: flex;
      gap: 8px;
    }

    .dashboard-actions button {
      padding: 6px 12px;
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 6px;
      background: var(--phz-bg-surface, #ffffff);
      cursor: pointer;
      font-size: 13px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .widget-card {
      border: 1px solid var(--phz-border-default, #e2e8f0);
      border-radius: 8px;
      overflow: hidden;
      background: var(--phz-bg-surface, #ffffff);
    }

    .widget-card[data-expanded] {
      grid-column: 1 / -1;
    }

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid var(--phz-border-default, #e2e8f0);
      font-size: 13px;
      font-weight: 600;
    }

    .widget-content {
      padding: 12px;
      min-height: 120px;
      position: relative;
    }

    .widget-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 120px;
      color: var(--phz-text-secondary, #64748b);
      font-size: 13px;
    }

    .widget-error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 120px;
      color: var(--phz-color-danger, #ef4444);
      font-size: 13px;
    }

    .cross-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      font-size: 13px;
      color: var(--phz-text-secondary, #64748b);
    }

    .cross-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--phz-bg-chip, #e2e8f0);
      font-size: 12px;
    }

    .dashboard-empty {
      text-align: center;
      padding: 48px;
      color: var(--phz-text-secondary, #64748b);
    }
  `; }
    // --- Lifecycle ---
    willUpdate(changed) {
        if (changed.has('dashboardId') || changed.has('widgets') || changed.has('dashboardTitle')) {
            if (this.dashboardId) {
                this._dashState = loadDashboard(this._dashState, {
                    id: this.dashboardId,
                    title: this.dashboardTitle,
                    description: this.dashboardDescription,
                    widgets: this.widgets,
                });
            }
        }
    }
    // --- Public API ---
    getDashboardState() {
        return this._dashState;
    }
    applyWidgetCrossFilter(entry) {
        this._dashState = applyCrossFilter(this._dashState, entry);
        this.requestUpdate();
    }
    clearWidgetCrossFilter(widgetId) {
        this._dashState = clearCrossFilter(this._dashState, widgetId);
        this.requestUpdate();
    }
    refresh() {
        this._dashState = refreshDashboard(this._dashState);
        this.requestUpdate();
        this.dispatchEvent(new CustomEvent('dashboard-refresh', { bubbles: true, composed: true }));
    }
    // --- Rendering ---
    render() {
        const s = this._dashState;
        if (!s.dashboardId) {
            return html `<div class="dashboard-empty">
        <p>Select a dashboard from the catalog to view it here.</p>
      </div>`;
        }
        return html `
      <div class="dashboard-header">
        <div>
          <div class="dashboard-title">${s.title}</div>
          ${s.description ? html `<div class="dashboard-desc">${s.description}</div>` : nothing}
        </div>
        <div class="dashboard-actions">
          <button @click=${this._handleRefresh} aria-label="Refresh dashboard">Refresh</button>
          <button @click=${this._handleFullscreen} aria-label="Toggle fullscreen">
            ${s.fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      ${s.crossFilters.length > 0 ? html `
        <div class="cross-filter-bar">
          <span>Cross-filters:</span>
          ${s.crossFilters.map(cf => html `
            <span class="cross-filter-chip">
              ${cf.field}: ${String(cf.value)}
              <button
                @click=${() => this._handleClearCrossFilter(cf.sourceWidgetId)}
                aria-label="Clear cross-filter ${cf.field}"
              >&times;</button>
            </span>
          `)}
          <button @click=${this._handleClearAllCrossFilters}>Clear All</button>
        </div>
      ` : nothing}

      <div class="dashboard-grid">
        ${s.widgets.map(w => this._renderWidget(w))}
      </div>
    `;
    }
    _renderWidget(widget) {
        const expanded = this._dashState.expandedWidgetId === widget.id;
        return html `
      <div
        class="widget-card"
        ?data-expanded=${expanded}
        data-widget-id=${widget.id}
      >
        <div class="widget-header">
          <span>${widget.title}</span>
          <button
            @click=${() => this._handleExpandWidget(widget.id)}
            aria-label="${expanded ? 'Collapse' : 'Expand'} ${widget.title}"
          >${expanded ? 'Collapse' : 'Expand'}</button>
        </div>
        <div class="widget-content">
          ${widget.loading
            ? html `<div class="widget-loading">Loading...</div>`
            : widget.error
                ? html `<div class="widget-error">${widget.error}</div>`
                : html `<slot name="widget-${widget.id}"></slot>`}
        </div>
      </div>
    `;
    }
    // --- Event handlers ---
    _handleRefresh() {
        this.refresh();
    }
    _handleFullscreen() {
        this._dashState = toggleFullscreen(this._dashState);
        this.requestUpdate();
    }
    _handleExpandWidget(widgetId) {
        this._dashState = toggleWidgetExpanded(this._dashState, widgetId);
        this.requestUpdate();
    }
    _handleClearCrossFilter(widgetId) {
        this.clearWidgetCrossFilter(widgetId);
    }
    _handleClearAllCrossFilters() {
        this._dashState = clearAllCrossFilters(this._dashState);
        this.requestUpdate();
    }
};
__decorate([
    property({ type: String })
], PhzViewerDashboard.prototype, "dashboardId", void 0);
__decorate([
    property({ attribute: false })
], PhzViewerDashboard.prototype, "widgets", void 0);
__decorate([
    property({ type: String })
], PhzViewerDashboard.prototype, "dashboardTitle", void 0);
__decorate([
    property({ type: String })
], PhzViewerDashboard.prototype, "dashboardDescription", void 0);
__decorate([
    state()
], PhzViewerDashboard.prototype, "_dashState", void 0);
PhzViewerDashboard = __decorate([
    customElement('phz-viewer-dashboard')
], PhzViewerDashboard);
export { PhzViewerDashboard };
//# sourceMappingURL=phz-viewer-dashboard.js.map