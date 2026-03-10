/**
 * <phz-dashboard-view> — Standalone dashboard rendering surface.
 * Renders a dashboard layout with widgets, without requiring the viewer shell.
 *
 * Consumers inject widget content via named slots (e.g., slot="widget-w1").
 * Supports auto-grid and fixed grid layouts with configurable column count.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DataAdapter, ViewerContext } from '@phozart/phz-shared/adapters';

// ========================================================================
// Configuration types
// ========================================================================

export interface DashboardViewConfig {
  id: string;
  title: string;
  widgets: DashboardViewWidget[];
  layout?: 'auto-grid' | 'fixed';
  columns?: number;
}

export interface DashboardViewWidget {
  id: string;
  type: string;
  title?: string;
  sourceId: string;
  config?: Record<string, unknown>;
  position?: { row: number; col: number; rowSpan?: number; colSpan?: number };
}

// ========================================================================
// <phz-dashboard-view>
// ========================================================================

@customElement('phz-dashboard-view')
export class PhzDashboardView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host([hidden]) { display: none; }
    .dashboard-header {
      padding: 16px 24px;
      font-family: var(--phz-font-family, system-ui, sans-serif);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--phz-text-primary, #1f2937);
      border-bottom: 1px solid var(--phz-border, #e5e7eb);
    }
    .dashboard-grid {
      display: grid;
      gap: 16px;
      padding: 16px;
      grid-template-columns: repeat(var(--_cols, 2), 1fr);
    }
    .widget-slot {
      background: var(--phz-surface, #fff);
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 16px;
      min-height: 200px;
    }
    .widget-title {
      font-family: var(--phz-font-family, system-ui, sans-serif);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--phz-text-secondary, #6b7280);
      margin-bottom: 12px;
    }
    .dashboard-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--phz-text-secondary, #6b7280);
      font-family: var(--phz-font-family, system-ui, sans-serif);
    }
    .dashboard-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--phz-text-secondary, #6b7280);
    }
    .dashboard-error {
      padding: 16px;
      color: var(--phz-error-text, #dc2626);
      background: var(--phz-error-bg, #fef2f2);
      border-radius: 8px;
      margin: 16px;
    }
  `;

  /** Data adapter for fetching widget data. */
  @property({ attribute: false }) dataAdapter?: DataAdapter;

  /** Dashboard configuration. */
  @property({ attribute: false }) config?: DashboardViewConfig;

  /** Viewer context for RLS. */
  @property({ attribute: false }) viewerContext?: ViewerContext;

  @state() private _loading = false;
  @state() private _error: string | null = null;

  protected override render() {
    if (this._error) {
      return html`<div class="dashboard-error">${this._error}</div>`;
    }

    if (!this.config) {
      return html`<div class="dashboard-empty">No dashboard configuration provided.</div>`;
    }

    if (this._loading) {
      return html`<div class="dashboard-loading">Loading dashboard...</div>`;
    }

    const cols = this.config.columns ?? 2;

    return html`
      <div class="dashboard-header">${this.config.title}</div>
      <div class="dashboard-grid" style="--_cols: ${cols}">
        ${this.config.widgets.map(widget => html`
          <div class="widget-slot"
               style=${widget.position
                 ? `grid-row: ${widget.position.row} / span ${widget.position.rowSpan ?? 1}; grid-column: ${widget.position.col} / span ${widget.position.colSpan ?? 1}`
                 : ''}>
            <div class="widget-title">${widget.title ?? widget.type}</div>
            <slot name=${`widget-${widget.id}`}>
              <!-- Consumers can inject custom widget renderers via slots -->
            </slot>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-dashboard-view': PhzDashboardView;
  }
}
