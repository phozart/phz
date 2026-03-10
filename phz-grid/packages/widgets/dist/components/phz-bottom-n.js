/**
 * @phozart/phz-widgets — Bottom-N
 *
 * Worst/best performers ranked list with status badges.
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
import { computeStatus } from '@phozart/phz-engine';
import { resolveWidgetState } from '../widget-states.js';
let PhzBottomN = class PhzBottomN extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.metricField = '';
        this.dimensionField = '';
        this.n = 5;
        this.direction = 'bottom';
        this.loading = false;
        this.error = null;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }
      .bottom-n-list { display: flex; flex-direction: column; gap: 4px; }
      .bottom-n-item {
        display: grid;
        grid-template-columns: 24px 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      .bottom-n-item:hover { background: #FAFAF9; }
      .bottom-n-rank {
        font-size: 11px;
        font-weight: 600;
        color: #78716C;
        text-align: center;
      }
      .bottom-n-name { color: #1C1917; }
      .bottom-n-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    `,
    ]; }
    get rankedData() {
        const sorted = [...this.data].sort((a, b) => {
            const va = a[this.metricField] ?? 0;
            const vb = b[this.metricField] ?? 0;
            return this.direction === 'bottom' ? va - vb : vb - va;
        });
        return sorted.slice(0, this.n);
    }
    handleItemClick(row) {
        this.dispatchEvent(new CustomEvent('drill-through', {
            bubbles: true, composed: true,
            detail: { source: 'bottom-n', entity: row[this.dimensionField], value: row[this.metricField] },
        }));
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
        const items = this.rankedData;
        const title = this.direction === 'bottom' ? `Bottom ${this.n}` : `Top ${this.n}`;
        return html `
      <div class="phz-w-card" role="region" aria-label="${title}">
        <h3 class="phz-w-title">${title}</h3>
        <div class="bottom-n-list" role="list">
          ${items.map((row, idx) => {
            const val = row[this.metricField];
            const status = this.kpiDefinition ? computeStatus(val, this.kpiDefinition) : null;
            return html `
              <div class="bottom-n-item phz-w-clickable" role="listitem" tabindex="0"
                   @click=${() => this.handleItemClick(row)}
                   @keydown=${(e) => e.key === 'Enter' && this.handleItemClick(row)}>
                <span class="bottom-n-rank">${idx + 1}</span>
                <span class="bottom-n-name">
                  ${status ? html `<span class="phz-w-dot" style="background-color: ${status.color}"></span>` : nothing}
                  ${row[this.dimensionField]}
                </span>
                <span class="bottom-n-value" style="color: ${status?.color ?? '#1C1917'}">
                  ${typeof val === 'number' ? val.toLocaleString() : val}
                </span>
              </div>
            `;
        })}
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Array })
], PhzBottomN.prototype, "data", void 0);
__decorate([
    property({ type: String })
], PhzBottomN.prototype, "metricField", void 0);
__decorate([
    property({ type: String })
], PhzBottomN.prototype, "dimensionField", void 0);
__decorate([
    property({ type: Number })
], PhzBottomN.prototype, "n", void 0);
__decorate([
    property({ type: String })
], PhzBottomN.prototype, "direction", void 0);
__decorate([
    property({ type: Object })
], PhzBottomN.prototype, "kpiDefinition", void 0);
__decorate([
    property({ type: Boolean })
], PhzBottomN.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzBottomN.prototype, "error", void 0);
PhzBottomN = __decorate([
    customElement('phz-bottom-n')
], PhzBottomN);
export { PhzBottomN };
//# sourceMappingURL=phz-bottom-n.js.map