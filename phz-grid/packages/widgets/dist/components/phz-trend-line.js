/**
 * @phozart/widgets — Trend Line
 *
 * SVG line chart with optional target reference line and status zones.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';
let PhzTrendLine = class PhzTrendLine extends LitElement {
    constructor() {
        super(...arguments);
        this.periods = 12;
        /** Line color. Falls back to default blue (#3B82F6). */
        this.lineColor = '';
        /** Target line color. Falls back to default gray (#78716C). */
        this.targetColor = '';
        this.loading = false;
        this.error = null;
        this.tooltipContent = '';
        this.tooltipVisible = false;
        this.tooltipStyle = '';
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; container-type: inline-size; }
      .trend-container { position: relative; }
      .trend-svg { width: 100%; height: 160px; }
      .trend-target-label {
        font-size: 10px;
        fill: #78716C;
      }
      .trend-x-label {
        font-size: 10px;
        fill: #78716C;
        text-anchor: middle;
      }
    `,
    ]; }
    get chartPoints() {
        if (!this.data)
            return [];
        const items = this.data.data.slice(-this.periods);
        if (items.length === 0)
            return [];
        const values = items.map((d) => d.y);
        const maxVal = values.reduce((m, v) => v > m ? v : m, this.target ?? 0);
        const minVal = values.reduce((m, v) => v < m ? v : m, this.target ?? Infinity);
        const range = maxVal - minVal || 1;
        const padding = { top: 20, right: 20, bottom: 30, left: 10 };
        const chartW = 400 - padding.left - padding.right;
        const chartH = 160 - padding.top - padding.bottom;
        return items.map((d, i) => ({
            x: padding.left + (i / Math.max(items.length - 1, 1)) * chartW,
            y: padding.top + chartH - ((d.y - minVal) / range) * chartH,
            label: String(d.label ?? d.x),
            value: d.y,
        }));
    }
    handlePointClick(point) {
        this.dispatchEvent(new CustomEvent('drill-through', {
            bubbles: true, composed: true,
            detail: { source: 'trend-line', xValue: point.label, value: point.value },
        }));
    }
    handlePointHover(e, point) {
        const container = e.currentTarget.closest('.trend-container');
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        this.tooltipContent = formatTooltipContent({
            label: point.label,
            value: point.value,
            unit: this.kpiDefinition?.unit,
        });
        const pos = computeTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }, { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height });
        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
        this.tooltipVisible = true;
    }
    handlePointLeave() {
        this.tooltipVisible = false;
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    render() {
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: this.data?.data ?? null,
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
        const points = this.chartPoints;
        if (points.length === 0) {
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No trend data</p></div>`;
        }
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const targetY = this.target !== undefined ? (() => {
            const values = this.data.data.slice(-this.periods).map((d) => d.y);
            const maxVal = values.reduce((m, v) => v > m ? v : m, this.target);
            const minVal = values.reduce((m, v) => v < m ? v : m, this.target);
            const range = maxVal - minVal || 1;
            return 20 + (160 - 20 - 30) - ((this.target - minVal) / range) * (160 - 20 - 30);
        })() : null;
        // Show every nth label to avoid overlap
        const labelStep = Math.max(1, Math.floor(points.length / 6));
        const tooltipId = 'trend-tooltip';
        return html `
      <div class="phz-w-card" role="region" aria-label="${this.data?.label ?? 'Trend'}" style="position:relative;">
        <h3 class="phz-w-title">${this.data?.label ?? 'Trend'}</h3>
        <div class="trend-container" style="position:relative;">
          <svg class="trend-svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet">
            <!-- Target line -->
            ${targetY !== null ? svg `
              <line x1="10" y1="${targetY}" x2="380" y2="${targetY}"
                    stroke="${this.targetColor || '#78716C'}" stroke-dasharray="4 3" stroke-width="1" />
              <text x="382" y="${targetY + 3}" class="trend-target-label">Target</text>
            ` : nothing}

            <!-- Line -->
            <path d="${pathD}" fill="none" stroke="${this.lineColor || '#3B82F6'}" stroke-width="2" />

            <!-- Points -->
            ${points.map(p => svg `
              <circle cx="${p.x}" cy="${p.y}" r="4"
                      fill="${this.lineColor || '#3B82F6'}" stroke="#fff" stroke-width="1.5"
                      class="phz-w-clickable"
                      @click=${() => this.handlePointClick(p)}
                      @mouseenter=${(e) => this.handlePointHover(e, p)}
                      @mouseleave=${() => this.handlePointLeave()}
                      @focus=${(e) => {
            const circle = e.currentTarget;
            const container = circle.closest('.trend-container');
            if (!container)
                return;
            const rect = container.getBoundingClientRect();
            this.tooltipContent = formatTooltipContent({
                label: p.label,
                value: p.value,
                unit: this.kpiDefinition?.unit,
            });
            const svgRect = circle.getBoundingClientRect();
            const pos = computeTooltipPosition({ x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top }, { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height });
            this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
            this.tooltipVisible = true;
        }}
                      @blur=${() => this.handlePointLeave()}
                      role="button" tabindex="0"
                      aria-label="${p.label}: ${p.value}"
                      aria-describedby="${tooltipId}">
              </circle>
            `)}

            <!-- X labels -->
            ${points.filter((_, i) => i % labelStep === 0).map(p => svg `
              <text x="${p.x}" y="155" class="trend-x-label">${p.label}</text>
            `)}
          </svg>
          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>
      </div>
    `;
    }
};
__decorate([
    property({ type: Object })
], PhzTrendLine.prototype, "data", void 0);
__decorate([
    property({ type: Number })
], PhzTrendLine.prototype, "target", void 0);
__decorate([
    property({ type: Number })
], PhzTrendLine.prototype, "periods", void 0);
__decorate([
    property({ type: Object })
], PhzTrendLine.prototype, "kpiDefinition", void 0);
__decorate([
    property({ type: String })
], PhzTrendLine.prototype, "lineColor", void 0);
__decorate([
    property({ type: String })
], PhzTrendLine.prototype, "targetColor", void 0);
__decorate([
    property({ type: Boolean })
], PhzTrendLine.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzTrendLine.prototype, "error", void 0);
__decorate([
    state()
], PhzTrendLine.prototype, "tooltipContent", void 0);
__decorate([
    state()
], PhzTrendLine.prototype, "tooltipVisible", void 0);
__decorate([
    state()
], PhzTrendLine.prototype, "tooltipStyle", void 0);
PhzTrendLine = __decorate([
    customElement('phz-trend-line')
], PhzTrendLine);
export { PhzTrendLine };
//# sourceMappingURL=phz-trend-line.js.map