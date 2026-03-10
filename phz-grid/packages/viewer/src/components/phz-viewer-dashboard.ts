/**
 * @phozart/phz-viewer — <phz-viewer-dashboard> Custom Element
 *
 * Dashboard view screen. Renders a read-only dashboard with widgets,
 * cross-filtering, and expand/collapse. Delegates state to
 * the headless dashboard-state functions.
 */
import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { CrossFilterEntry } from '@phozart/phz-shared/coordination';
import {
  type DashboardViewState,
  type DashboardWidgetView,
  createDashboardViewState,
  loadDashboard,
  setWidgetLoading,
  setWidgetError,
  applyCrossFilter,
  clearCrossFilter,
  clearAllCrossFilters,
  toggleFullscreen,
  toggleWidgetExpanded,
  refreshDashboard,
} from '../screens/dashboard-state.js';

// ========================================================================
// <phz-viewer-dashboard>
// ========================================================================

@customElement('phz-viewer-dashboard')
export class PhzViewerDashboard extends LitElement {
  static override styles = css`
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
  `;

  // --- Public properties ---

  @property({ type: String })
  dashboardId: string = '';

  @property({ attribute: false })
  widgets: DashboardWidgetView[] = [];

  @property({ type: String })
  dashboardTitle: string = '';

  @property({ type: String })
  dashboardDescription: string = '';

  // --- Internal state ---

  @state()
  private _dashState: DashboardViewState = createDashboardViewState();

  // --- Lifecycle ---

  override willUpdate(changed: Map<string, unknown>): void {
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

  getDashboardState(): DashboardViewState {
    return this._dashState;
  }

  applyWidgetCrossFilter(entry: CrossFilterEntry): void {
    this._dashState = applyCrossFilter(this._dashState, entry);
    this.requestUpdate();
  }

  clearWidgetCrossFilter(widgetId: string): void {
    this._dashState = clearCrossFilter(this._dashState, widgetId);
    this.requestUpdate();
  }

  refresh(): void {
    this._dashState = refreshDashboard(this._dashState);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('dashboard-refresh', { bubbles: true, composed: true }));
  }

  // --- Rendering ---

  override render(): TemplateResult {
    const s = this._dashState;

    if (!s.dashboardId) {
      return html`<div class="dashboard-empty">
        <p>Select a dashboard from the catalog to view it here.</p>
      </div>`;
    }

    return html`
      <div class="dashboard-header">
        <div>
          <div class="dashboard-title">${s.title}</div>
          ${s.description ? html`<div class="dashboard-desc">${s.description}</div>` : nothing}
        </div>
        <div class="dashboard-actions">
          <button @click=${this._handleRefresh} aria-label="Refresh dashboard">Refresh</button>
          <button @click=${this._handleFullscreen} aria-label="Toggle fullscreen">
            ${s.fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      ${s.crossFilters.length > 0 ? html`
        <div class="cross-filter-bar">
          <span>Cross-filters:</span>
          ${s.crossFilters.map(cf => html`
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

  private _renderWidget(widget: DashboardWidgetView): TemplateResult {
    const expanded = this._dashState.expandedWidgetId === widget.id;

    return html`
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
            ? html`<div class="widget-loading">Loading...</div>`
            : widget.error
              ? html`<div class="widget-error">${widget.error}</div>`
              : html`<slot name="widget-${widget.id}"></slot>`}
        </div>
      </div>
    `;
  }

  // --- Event handlers ---

  private _handleRefresh(): void {
    this.refresh();
  }

  private _handleFullscreen(): void {
    this._dashState = toggleFullscreen(this._dashState);
    this.requestUpdate();
  }

  private _handleExpandWidget(widgetId: string): void {
    this._dashState = toggleWidgetExpanded(this._dashState, widgetId);
    this.requestUpdate();
  }

  private _handleClearCrossFilter(widgetId: string): void {
    this.clearWidgetCrossFilter(widgetId);
  }

  private _handleClearAllCrossFilters(): void {
    this._dashState = clearAllCrossFilters(this._dashState);
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-viewer-dashboard': PhzViewerDashboard;
  }
}
