/**
 * @phozart/phz-widgets — Waterfall Chart
 *
 * SVG waterfall chart showing increases, decreases, and totals with
 * connecting lines, running totals, tooltips, and SR accessibility.
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
export const WATERFALL_COLORS = {
    increase: '#10B981',
    decrease: '#EF4444',
    total: '#3B82F6',
};
export function computeWaterfallBars(data, colors = WATERFALL_COLORS) {
    let runningTotal = 0;
    return data.map(d => {
        let start;
        let end;
        if (d.type === 'total') {
            start = 0;
            end = runningTotal;
        }
        else if (d.type === 'increase') {
            start = runningTotal;
            end = runningTotal + d.value;
            runningTotal = end;
        }
        else {
            start = runningTotal;
            end = runningTotal - d.value;
            runningTotal = end;
        }
        return {
            label: d.label,
            value: d.value,
            type: d.type,
            start,
            end,
            color: colors[d.type] ?? WATERFALL_COLORS[d.type],
        };
    });
}
export function computeWaterfallBounds(bars) {
    if (bars.length === 0)
        return { min: 0, max: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const bar of bars) {
        const lo = Math.min(bar.start, bar.end);
        const hi = Math.max(bar.start, bar.end);
        if (lo < min)
            min = lo;
        if (hi > max)
            max = hi;
    }
    return { min, max };
}
export function buildWaterfallAccessibleDescription(bars) {
    return bars.map(b => {
        if (b.type === 'total') {
            return `${b.label}: total ${b.end.toLocaleString()}`;
        }
        const sign = b.type === 'increase' ? '+' : '-';
        return `${b.label}: ${sign}${b.value.toLocaleString()}, running total ${b.end.toLocaleString()}`;
    }).join('; ');
}
const CHART_DIMS = {
    width: 500,
    height: 300,
    padding: { top: 20, right: 20, bottom: 60, left: 55 },
};
let PhzWaterfallChart = class PhzWaterfallChart extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.colors = WATERFALL_COLORS;
        this.title = '';
        this.loading = false;
        this.error = null;
        this.tooltipContent = '';
        this.tooltipVisible = false;
        this.tooltipStyle = '';
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; }
      .waterfall-container { position: relative; }
      .waterfall-svg { width: 100%; }
      .axis-label { font-size: 10px; fill: #78716C; }
      .grid-line { stroke: #E7E5E4; stroke-width: 1; }
      .waterfall-bar {
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .waterfall-bar:hover { opacity: 0.8; }
      .waterfall-bar:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }
      .connector-line { stroke: #A8A29E; stroke-width: 1; stroke-dasharray: 3,2; }
      .bar-value-label { font-size: 10px; fill: #1C1917; font-weight: 600; font-variant-numeric: tabular-nums; }
      .x-label { font-size: 10px; fill: #44403C; }
    `,
    ]; }
    handleBarClick(bar, index) {
        this.dispatchEvent(new CustomEvent('bar-click', {
            bubbles: true,
            composed: true,
            detail: { label: bar.label, value: bar.value, type: bar.type, end: bar.end, index },
        }));
    }
    handleBarHover(e, bar) {
        const container = e.currentTarget.closest('.waterfall-container');
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        const sign = bar.type === 'increase' ? '+' : bar.type === 'decrease' ? '-' : '';
        this.tooltipContent = formatTooltipContent({
            label: bar.label,
            value: bar.type === 'total' ? bar.end : bar.value,
            secondaryLabel: bar.type !== 'total' ? `Running total: ${bar.end.toLocaleString()}` : undefined,
        });
        const pos = computeTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }, { tooltipWidth: 180, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height });
        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
        this.tooltipVisible = true;
    }
    handleBarLeave() {
        this.tooltipVisible = false;
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
        if (this.data.length === 0) {
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
        }
        const bars = computeWaterfallBars(this.data, this.colors);
        const bounds = computeWaterfallBounds(bars);
        const padding = 0.05 * (bounds.max - bounds.min || 1);
        const yMin = Math.min(0, bounds.min - padding);
        const yMax = bounds.max + padding;
        const yRange = yMax - yMin || 1;
        const plotW = CHART_DIMS.width - CHART_DIMS.padding.left - CHART_DIMS.padding.right;
        const plotH = CHART_DIMS.height - CHART_DIMS.padding.top - CHART_DIMS.padding.bottom;
        const barWidth = Math.min(60, plotW / bars.length * 0.7);
        const barGap = (plotW - barWidth * bars.length) / (bars.length + 1);
        const tooltipId = 'waterfall-chart-tooltip';
        const chartLabel = this.title || 'Waterfall Chart';
        const yToPixel = (v) => CHART_DIMS.padding.top + plotH - ((v - yMin) / yRange) * plotH;
        const zeroY = yToPixel(0);
        return html `
      <div class="phz-w-card" role="region" aria-label="${chartLabel}" style="position:relative;">
        ${this.title ? html `<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="waterfall-container" style="position:relative;">
          <svg class="waterfall-svg" viewBox="0 0 ${CHART_DIMS.width} ${CHART_DIMS.height}"
               preserveAspectRatio="xMidYMid meet"
               role="img" aria-label="${chartLabel}">
            <desc>${buildWaterfallAccessibleDescription(bars)}</desc>

            <!-- Zero line -->
            <line class="grid-line" x1="${CHART_DIMS.padding.left}" y1="${zeroY}"
                  x2="${CHART_DIMS.width - CHART_DIMS.padding.right}" y2="${zeroY}" />

            <!-- Y axis -->
            <line class="grid-line"
              x1="${CHART_DIMS.padding.left}" y1="${CHART_DIMS.padding.top}"
              x2="${CHART_DIMS.padding.left}" y2="${CHART_DIMS.height - CHART_DIMS.padding.bottom}" />

            ${bars.map((bar, i) => {
            const x = CHART_DIMS.padding.left + barGap + i * (barWidth + barGap);
            const topVal = Math.max(bar.start, bar.end);
            const botVal = Math.min(bar.start, bar.end);
            const topY = yToPixel(topVal);
            const botY = yToPixel(botVal);
            const barH = Math.max(1, botY - topY);
            const centerX = x + barWidth / 2;
            // Connector line from this bar's end to next bar's start
            const connector = i < bars.length - 1 ? (() => {
                const nextBar = bars[i + 1];
                const endY = yToPixel(bar.end);
                const nextX = CHART_DIMS.padding.left + barGap + (i + 1) * (barWidth + barGap);
                return svg `<line class="connector-line"
                  x1="${x + barWidth}" y1="${endY}"
                  x2="${nextX}" y2="${endY}" />`;
            })() : nothing;
            const displayValue = bar.type === 'total' ? bar.end : bar.value;
            const sign = bar.type === 'increase' ? '+' : bar.type === 'decrease' ? '-' : '';
            return svg `
                ${connector}
                <rect class="waterfall-bar phz-w-clickable"
                  x="${x}" y="${topY}" width="${barWidth}" height="${barH}"
                  fill="${bar.color}" rx="2"
                  tabindex="0"
                  role="button"
                  aria-label="${bar.label}: ${sign}${displayValue.toLocaleString()}, total ${bar.end.toLocaleString()}"
                  aria-describedby="${tooltipId}"
                  @click=${() => this.handleBarClick(bar, i)}
                  @mouseenter=${(e) => this.handleBarHover(e, bar)}
                  @mouseleave=${() => this.handleBarLeave()}
                  @focus=${(e) => {
                const el = e.currentTarget;
                const container = el.closest('.waterfall-container');
                if (!container)
                    return;
                const rect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                this.tooltipContent = formatTooltipContent({
                    label: bar.label,
                    value: bar.type === 'total' ? bar.end : bar.value,
                });
                const pos = computeTooltipPosition({ x: elRect.left - rect.left + elRect.width / 2, y: elRect.top - rect.top }, { tooltipWidth: 180, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height });
                this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                this.tooltipVisible = true;
            }}
                  @blur=${() => this.handleBarLeave()}>
                </rect>
                <text class="bar-value-label" x="${centerX}" y="${topY - 6}" text-anchor="middle">
                  ${sign}${displayValue.toLocaleString()}
                </text>
                <text class="x-label" x="${centerX}" y="${CHART_DIMS.height - CHART_DIMS.padding.bottom + 16}"
                      text-anchor="middle">${bar.label}</text>
              `;
        })}
          </svg>

          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>

        <table class="phz-w-sr-only">
          <caption>${chartLabel} Data</caption>
          <thead><tr><th>Label</th><th>Type</th><th>Value</th><th>Running Total</th></tr></thead>
          <tbody>
            ${bars.map(b => html `
              <tr>
                <td>${b.label}</td>
                <td>${b.type}</td>
                <td>${b.value.toLocaleString()}</td>
                <td>${b.end.toLocaleString()}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzWaterfallChart.prototype, "data", void 0);
__decorate([
    property({ attribute: false })
], PhzWaterfallChart.prototype, "colors", void 0);
__decorate([
    property({ type: String })
], PhzWaterfallChart.prototype, "title", void 0);
__decorate([
    property({ type: Boolean })
], PhzWaterfallChart.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzWaterfallChart.prototype, "error", void 0);
__decorate([
    state()
], PhzWaterfallChart.prototype, "tooltipContent", void 0);
__decorate([
    state()
], PhzWaterfallChart.prototype, "tooltipVisible", void 0);
__decorate([
    state()
], PhzWaterfallChart.prototype, "tooltipStyle", void 0);
PhzWaterfallChart = __decorate([
    customElement('phz-waterfall-chart')
], PhzWaterfallChart);
export { PhzWaterfallChart };
//# sourceMappingURL=phz-waterfall-chart.js.map