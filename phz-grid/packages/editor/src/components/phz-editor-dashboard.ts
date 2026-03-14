/**
 * @phozart/editor — <phz-editor-dashboard> (B-2.05 / B-2.06)
 *
 * Dashboard component that supports both view and edit modes.
 * In view mode, renders the dashboard read-only with action buttons.
 * In edit mode, enables drag-drop widget placement and config panel.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { DashboardWidget } from '@phozart/shared/types';
import type { DashboardEditState } from '../screens/dashboard-edit-state.js';
import {
  createDashboardEditState,
  selectWidget,
  deselectWidget,
} from '../screens/dashboard-edit-state.js';

@customElement('phz-editor-dashboard')
export class PhzEditorDashboard extends LitElement {
  static override styles = css`
    :host { display: block; }
    .dashboard-grid {
      display: grid;
      gap: var(--_gap, 16px);
      min-height: 400px;
    }
    .widget-slot {
      border: 1px solid var(--phz-border, #e5e7eb);
      border-radius: 8px;
      padding: 12px;
      position: relative;
    }
    .widget-slot[data-selected] {
      outline: 2px solid var(--phz-primary, #3b82f6);
    }
    .widget-header {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .edit-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.02);
      cursor: move;
    }
  `;

  @property({ type: String }) dashboardId = '';
  @property({ type: Boolean }) editMode = false;
  @property({ type: Array }) widgets: DashboardWidget[] = [];
  @property({ type: Number }) columns = 12;
  @property({ type: Number }) rows = 8;
  @property({ type: Number }) gap = 16;

  @state() private _state: DashboardEditState = createDashboardEditState('');

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('dashboardId') || changed.has('widgets')) {
      this._state = createDashboardEditState(this.dashboardId, {
        widgets: this.widgets,
        gridLayout: { columns: this.columns, rows: this.rows, gap: this.gap },
      });
    }
  }

  /** Get the current edit state. */
  getState(): DashboardEditState {
    return this._state;
  }

  private _onWidgetClick(widgetId: string): void {
    if (!this.editMode) return;
    this._state = selectWidget(this._state, widgetId);
    this.dispatchEvent(new CustomEvent('widget-select', {
      detail: { widgetId },
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const gridStyle = `
      grid-template-columns: repeat(${this.columns}, 1fr);
      --_gap: ${this.gap}px;
    `;

    return html`
      <div
        class="dashboard-grid"
        style=${gridStyle}
        role="region"
        aria-label="Dashboard"
      >
        ${this._state.widgets.map(widget => html`
          <div
            class="widget-slot"
            style="grid-column: ${widget.position.col + 1} / span ${widget.position.colSpan};
                   grid-row: ${widget.position.row + 1} / span ${widget.position.rowSpan};"
            ?data-selected=${this._state.selectedWidgetId === widget.id}
            @click=${() => this._onWidgetClick(widget.id)}
            role="article"
            aria-label=${widget.title ?? widget.widgetType}
          >
            <div class="widget-header">${widget.title ?? widget.widgetType}</div>
            <slot name=${`widget-${widget.id}`}></slot>
            ${this.editMode
              ? html`<div class="edit-overlay" aria-hidden="true"></div>`
              : nothing}
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-editor-dashboard': PhzEditorDashboard;
  }
}
