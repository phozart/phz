/**
 * @phozart/widgets — Status Table
 *
 * Entity list with status indicators per KPI metric.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { computeStatus } from '@phozart/engine';
import { resolveWidgetState } from '../widget-states.js';
let PhzStatusTable = class PhzStatusTable extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.entityField = '';
        this.kpiDefinitions = [];
        this.showAlertBadges = true;
        this.loading = false;
        this.error = null;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }
      .status-cell { text-align: center; }
      .alert-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        background: #DC2626;
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 0 6px;
        margin-left: 4px;
      }
    `,
    ]; }
    getAlertCount(row) {
        let count = 0;
        for (const kpi of this.kpiDefinitions) {
            const val = row[kpi.id];
            if (val !== undefined) {
                const status = computeStatus(val, kpi);
                if (status.level === 'crit')
                    count++;
            }
        }
        return count;
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    render() {
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: this.data.length > 0 ? this.data : null,
        });
        if (widgetState.state === 'loading') {
            return html `<div class="phz-w-card phz-w-state" aria-live="polite" aria-busy="true">
        <div class="phz-w-state__spinner"></div>
        <p class="phz-w-state__message">${widgetState.message}</p>
      </div>`;
        }
        if (widgetState.state === 'error') {
            return html `<div class="phz-w-card phz-w-state" role="alert">
        <p class="phz-w-state__error-message">${widgetState.message}</p>
        <button class="phz-w-state__retry-btn" @click=${this.handleRetry}>Retry</button>
      </div>`;
        }
        if (widgetState.state === 'empty') {
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
        }
        return html `
      <div class="phz-w-card" role="region" aria-label="Status Table">
        <table class="phz-w-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Entity</th>
              ${this.kpiDefinitions.map(kpi => html `<th scope="col">${kpi.name}</th>`)}
              ${this.showAlertBadges ? html `<th scope="col">Alerts</th>` : nothing}
            </tr>
          </thead>
          <tbody>
            ${this.data.map(row => {
            const alerts = this.getAlertCount(row);
            return html `
                <tr>
                  <td>${row[this.entityField]}</td>
                  ${this.kpiDefinitions.map(kpi => {
                const val = row[kpi.id];
                if (val === undefined)
                    return html `<td class="status-cell">\u2014</td>`;
                const status = computeStatus(val, kpi);
                return html `
                      <td class="status-cell">
                        <span class="phz-w-dot" style="background-color: ${status.color}"></span>
                        ${kpi.unit === 'percent' ? `${val.toFixed(1)}%` : val.toLocaleString()}
                      </td>
                    `;
            })}
                  ${this.showAlertBadges ? html `
                    <td class="status-cell">
                      ${alerts > 0 ? html `<span class="alert-badge">${alerts}</span>` : html `\u2014`}
                    </td>
                  ` : nothing}
                </tr>
              `;
        })}
          </tbody>
        </table>
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzStatusTable.prototype, "data", void 0);
__decorate([
    property({ type: String })
], PhzStatusTable.prototype, "entityField", void 0);
__decorate([
    property({ type: Array })
], PhzStatusTable.prototype, "kpiDefinitions", void 0);
__decorate([
    property({ type: Boolean })
], PhzStatusTable.prototype, "showAlertBadges", void 0);
__decorate([
    property({ type: Boolean })
], PhzStatusTable.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzStatusTable.prototype, "error", void 0);
PhzStatusTable = __decorate([
    customElement('phz-status-table')
], PhzStatusTable);
export { PhzStatusTable };
//# sourceMappingURL=phz-status-table.js.map