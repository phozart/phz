/**
 * @phozart/phz-editor — <phz-editor-dashboard> (B-2.05 / B-2.06)
 *
 * Dashboard component that supports both view and edit modes.
 * In view mode, renders the dashboard read-only with action buttons.
 * In edit mode, enables drag-drop widget placement and config panel.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createDashboardEditState, selectWidget, } from '../screens/dashboard-edit-state.js';
let PhzEditorDashboard = class PhzEditorDashboard extends LitElement {
    constructor() {
        super(...arguments);
        this.dashboardId = '';
        this.editMode = false;
        this.widgets = [];
        this.columns = 12;
        this.rows = 8;
        this.gap = 16;
        this._state = createDashboardEditState('');
    }
    static { this.styles = css `
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
  `; }
    willUpdate(changed) {
        if (changed.has('dashboardId') || changed.has('widgets')) {
            this._state = createDashboardEditState(this.dashboardId, {
                widgets: this.widgets,
                gridLayout: { columns: this.columns, rows: this.rows, gap: this.gap },
            });
        }
    }
    /** Get the current edit state. */
    getState() {
        return this._state;
    }
    _onWidgetClick(widgetId) {
        if (!this.editMode)
            return;
        this._state = selectWidget(this._state, widgetId);
        this.dispatchEvent(new CustomEvent('widget-select', {
            detail: { widgetId },
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const gridStyle = `
      grid-template-columns: repeat(${this.columns}, 1fr);
      --_gap: ${this.gap}px;
    `;
        return html `
      <div
        class="dashboard-grid"
        style=${gridStyle}
        role="region"
        aria-label="Dashboard"
      >
        ${this._state.widgets.map(widget => html `
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
            ? html `<div class="edit-overlay" aria-hidden="true"></div>`
            : nothing}
          </div>
        `)}
      </div>
    `;
    }
};
__decorate([
    property({ type: String })
], PhzEditorDashboard.prototype, "dashboardId", void 0);
__decorate([
    property({ type: Boolean })
], PhzEditorDashboard.prototype, "editMode", void 0);
__decorate([
    property({ type: Array })
], PhzEditorDashboard.prototype, "widgets", void 0);
__decorate([
    property({ type: Number })
], PhzEditorDashboard.prototype, "columns", void 0);
__decorate([
    property({ type: Number })
], PhzEditorDashboard.prototype, "rows", void 0);
__decorate([
    property({ type: Number })
], PhzEditorDashboard.prototype, "gap", void 0);
__decorate([
    state()
], PhzEditorDashboard.prototype, "_state", void 0);
PhzEditorDashboard = __decorate([
    customElement('phz-editor-dashboard')
], PhzEditorDashboard);
export { PhzEditorDashboard };
//# sourceMappingURL=phz-editor-dashboard.js.map