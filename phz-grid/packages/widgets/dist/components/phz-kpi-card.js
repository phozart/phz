/**
 * @phozart/phz-widgets — KPI Card
 *
 * Single KPI display with value, status badge, delta, and optional sparkline.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { computeStatus, computeDelta } from '@phozart/phz-engine';
import { resolveWidgetState } from '../widget-states.js';
let PhzKPICard = class PhzKPICard extends LitElement {
    constructor() {
        super(...arguments);
        this.value = 0;
        this.cardStyle = 'compact';
        this.loading = false;
        this.error = null;
        this.tooltipContent = '';
        this.tooltipVisible = false;
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host {
        display: block;
        container-type: inline-size;
      }

      .kpi-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .kpi-card--expanded {
        gap: 12px;
      }

      .kpi-card--minimal {
        flex-direction: row;
        align-items: center;
        gap: 12px;
      }

      .kpi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .kpi-unit {
        font-size: 14px;
        color: var(--phz-w-text-muted, #78716C);
        font-weight: 500;
      }

      .kpi-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .kpi-target {
        font-size: 12px;
        color: var(--phz-w-text-muted, #78716C);
      }

      .kpi-sparkline {
        display: flex;
        align-items: flex-end;
        gap: 1px;
        height: 32px;
        margin-top: 4px;
      }

      .kpi-sparkline--expanded {
        height: 48px;
      }

      .kpi-sparkline__bar {
        flex: 1;
        min-width: 3px;
        border-radius: 1px 1px 0 0;
        transition: height 0.2s ease;
      }

      .status-icon {
        width: 8px;
        height: 8px;
        display: inline-block;
        margin-right: 4px;
      }

      .status-icon--circle { border-radius: 50%; }
      .status-icon--diamond { transform: rotate(45deg); border-radius: 1px; }
      .status-icon--triangle {
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid currentColor;
        background: none !important;
      }

      .delta-arrow::before {
        content: '';
        display: inline-block;
        width: 0;
        height: 0;
        margin-right: 2px;
      }

      .delta-arrow--up::before {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 6px solid currentColor;
      }

      .delta-arrow--down::before {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid currentColor;
      }

      .phz-w-card {
        min-height: 44px;
      }

      @container (max-width: 200px) {
        .kpi-card--minimal {
          flex-direction: column;
          align-items: flex-start;
        }
        .kpi-value-row {
          flex-direction: column;
        }
      }
    `,
    ]; }
    get status() {
        if (!this.kpiDefinition)
            return null;
        return computeStatus(this.value, this.kpiDefinition);
    }
    get delta() {
        if (!this.kpiDefinition || this.previousValue === undefined)
            return null;
        return computeDelta(this.value, this.previousValue, this.kpiDefinition);
    }
    formatValue(val) {
        const kpi = this.kpiDefinition;
        if (!kpi)
            return String(val);
        switch (kpi.unit) {
            case 'percent': return `${val.toFixed(1)}%`;
            case 'currency': return `$${val.toLocaleString()}`;
            case 'duration': return `${val}h`;
            case 'count': return val.toLocaleString();
            default: return kpi.unitLabel ? `${val} ${kpi.unitLabel}` : String(val);
        }
    }
    renderStatusBadge(status) {
        return html `
      <span class="phz-w-badge phz-w-badge--${status.level}">
        <span class="status-icon status-icon--${status.icon}"
              style="background-color: ${status.color}"></span>
        ${status.label}
      </span>
    `;
    }
    renderDelta(delta) {
        const arrowClass = delta.value >= 0 ? 'delta-arrow--up' : 'delta-arrow--down';
        return html `
      <span class="phz-w-delta phz-w-delta--${delta.direction}">
        <span class="delta-arrow ${arrowClass}"></span>
        ${delta.value > 0 ? '+' : ''}${delta.value.toFixed(1)} ${delta.unit}
      </span>
    `;
    }
    renderSparkline() {
        if (!this.trendData || this.trendData.length === 0)
            return nothing;
        const max = this.trendData.reduce((m, v) => v > m ? v : m, -Infinity);
        const min = this.trendData.reduce((m, v) => v < m ? v : m, Infinity);
        const range = max - min || 1;
        const status = this.status;
        return html `
      <div class="kpi-sparkline ${this.cardStyle === 'expanded' ? 'kpi-sparkline--expanded' : ''}"
           role="img"
           aria-label="Trend: ${this.trendData.length} periods">
        ${this.trendData.map(v => html `
            <div class="kpi-sparkline__bar"
                 style="height: ${Math.max(10, ((v - min) / range) * 100)}%;
                        background-color: ${status?.color ?? '#D6D3D1'}">
            </div>
          `)}
      </div>
    `;
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    get valueTooltip() {
        const parts = [`${this.kpiDefinition?.name ?? 'KPI'}: ${this.formatValue(this.value)}`];
        if (this.kpiDefinition?.target !== undefined) {
            parts.push(`Target: ${this.formatValue(this.kpiDefinition.target)}`);
        }
        if (this.delta) {
            parts.push(`Change: ${this.delta.value > 0 ? '+' : ''}${this.delta.value.toFixed(1)} ${this.delta.unit}`);
        }
        return parts.join('\n');
    }
    render() {
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: this.kpiDefinition ? [this.kpiDefinition] : null,
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
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No KPI data</p></div>`;
        }
        const status = this.status;
        const delta = this.delta;
        const sizeClass = this.cardStyle === 'compact' ? 'phz-w-value--compact' : this.cardStyle === 'minimal' ? 'phz-w-value--minimal' : '';
        const tooltipId = 'kpi-card-tooltip';
        return html `
      <div class="phz-w-card kpi-card kpi-card--${this.cardStyle}"
           role="region"
           aria-label="${this.kpiDefinition?.name ?? 'KPI'}: ${this.formatValue(this.value)}"
           style="position:relative;"
           @mouseenter=${() => { this.tooltipContent = this.valueTooltip; this.tooltipVisible = true; }}
           @mouseleave=${() => { this.tooltipVisible = false; }}
           @focus=${() => { this.tooltipContent = this.valueTooltip; this.tooltipVisible = true; }}
           @blur=${() => { this.tooltipVisible = false; }}
           tabindex="0"
           aria-describedby="${tooltipId}">
        <div class="kpi-header">
          <h3 class="phz-w-title">${this.kpiDefinition?.name ?? 'KPI'}</h3>
          ${status ? this.renderStatusBadge(status) : nothing}
        </div>

        <div class="kpi-value-row">
          <p class="phz-w-value ${sizeClass}" style="color: ${status?.color ?? 'var(--phz-w-text, #1C1917)'}">
            ${this.formatValue(this.value)}
          </p>
          ${this.kpiDefinition?.unit === 'custom' && this.kpiDefinition.unitLabel
            ? html `<span class="kpi-unit">${this.kpiDefinition.unitLabel}</span>`
            : nothing}
        </div>

        <div class="kpi-meta">
          ${delta ? this.renderDelta(delta) : nothing}
          ${this.kpiDefinition?.target !== undefined
            ? html `<span class="kpi-target">Target: ${this.formatValue(this.kpiDefinition.target)}</span>`
            : nothing}
        </div>

        ${this.renderSparkline()}
        <div id="${tooltipId}"
             class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
             role="tooltip">${this.tooltipContent}</div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzKPICard.prototype, "kpiDefinition", void 0);
__decorate([
    property({ type: Number })
], PhzKPICard.prototype, "value", void 0);
__decorate([
    property({ type: Number })
], PhzKPICard.prototype, "previousValue", void 0);
__decorate([
    property({ type: Array })
], PhzKPICard.prototype, "trendData", void 0);
__decorate([
    property({ type: String })
], PhzKPICard.prototype, "cardStyle", void 0);
__decorate([
    property({ type: Object })
], PhzKPICard.prototype, "selectionContext", void 0);
__decorate([
    property({ type: Boolean })
], PhzKPICard.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzKPICard.prototype, "error", void 0);
__decorate([
    state()
], PhzKPICard.prototype, "tooltipContent", void 0);
__decorate([
    state()
], PhzKPICard.prototype, "tooltipVisible", void 0);
__decorate([
    property({ attribute: false })
], PhzKPICard.prototype, "kpiAppearance", void 0);
PhzKPICard = __decorate([
    customElement('phz-kpi-card')
], PhzKPICard);
export { PhzKPICard };
//# sourceMappingURL=phz-kpi-card.js.map