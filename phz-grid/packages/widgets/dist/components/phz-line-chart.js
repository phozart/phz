/**
 * @phozart/phz-widgets — Line Chart
 *
 * SVG-based multi-series line chart with axes, gridlines, legend, and tooltips.
 * Supports time, linear, and category x-axis types.
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
const LINE_PALETTE = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];
const CHART_DIMS = {
    width: 500,
    height: 260,
    padding: { top: 20, right: 20, bottom: 45, left: 55 },
};
function computeNiceScale(min, max, targetTicks = 5) {
    if (min === max) {
        const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
        return computeNiceScale(min - padding, max + padding, targetTicks);
    }
    const range = max - min;
    const roughStep = range / (targetTicks - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;
    let niceStep;
    if (residual <= 1.5)
        niceStep = magnitude;
    else if (residual <= 3.5)
        niceStep = 2 * magnitude;
    else if (residual <= 7.5)
        niceStep = 5 * magnitude;
    else
        niceStep = 10 * magnitude;
    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;
    const ticks = [];
    for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
        ticks.push(Math.round(v * 1e10) / 1e10);
    }
    return { min: niceMin, max: niceMax, ticks };
}
function computePointPositions(points, yScale) {
    const chartW = CHART_DIMS.width - CHART_DIMS.padding.left - CHART_DIMS.padding.right;
    const chartH = CHART_DIMS.height - CHART_DIMS.padding.top - CHART_DIMS.padding.bottom;
    const yRange = yScale.max - yScale.min || 1;
    return points.map((p, i) => ({
        px: CHART_DIMS.padding.left + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2),
        py: CHART_DIMS.padding.top + chartH - ((p.y - yScale.min) / yRange) * chartH,
        x: p.x,
        y: p.y,
    }));
}
function formatTimeLabel(value) {
    if (typeof value === 'string')
        return value;
    const d = new Date(value);
    if (isNaN(d.getTime()))
        return String(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function generateXLabels(points, maxLabels = 6, xAxisType = 'category') {
    if (points.length === 0)
        return [];
    const chartW = CHART_DIMS.width - CHART_DIMS.padding.left - CHART_DIMS.padding.right;
    const step = Math.max(1, Math.floor(points.length / maxLabels));
    const labels = [];
    for (let i = 0; i < points.length; i += step) {
        const raw = points[i].x;
        const label = xAxisType === 'time' ? formatTimeLabel(raw) : String(raw);
        const px = CHART_DIMS.padding.left + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2);
        labels.push({ index: i, label, px });
    }
    const lastIdx = points.length - 1;
    if (labels[labels.length - 1]?.index !== lastIdx) {
        const raw = points[lastIdx].x;
        const label = xAxisType === 'time' ? formatTimeLabel(raw) : String(raw);
        const px = CHART_DIMS.padding.left + chartW;
        labels.push({ index: lastIdx, label, px });
    }
    return labels;
}
let PhzLineChart = class PhzLineChart extends LitElement {
    constructor() {
        super(...arguments);
        this.data = [];
        this.showGrid = true;
        this.showAxis = true;
        this.showLegend = true;
        this.xAxisType = 'category';
        this.title = '';
        this.loading = false;
        this.error = null;
        this.tooltipContent = '';
        this.tooltipVisible = false;
        this.tooltipStyle = '';
        this.hiddenSeries = new Set();
    }
    static { this.styles = [
        widgetBaseStyles,
        css `
      :host { display: block; container-type: inline-size; }

      .line-chart-container { position: relative; }

      .line-chart-svg { width: 100%; }

      .axis-label {
        font-size: 10px;
        fill: #78716C;
      }

      .grid-line {
        stroke: #E7E5E4;
        stroke-width: 1;
      }

      .data-line {
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .data-point {
        cursor: pointer;
        transition: r 0.15s ease;
      }
      .data-point:hover { r: 6; }
      .data-point:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
        font-size: 12px;
      }

      .legend__item {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        opacity: 1;
        transition: opacity 0.15s ease;
      }

      .legend__item--hidden { opacity: 0.35; }

      .legend__swatch {
        width: 12px;
        height: 3px;
        border-radius: 1px;
        flex-shrink: 0;
      }

      .legend__label { color: #44403C; }

      @container (max-width: 575px) {
        .legend {
          flex-direction: column;
          gap: 8px;
        }
      }
    `,
    ]; }
    get visibleSeries() {
        return this.data.filter(s => !this.hiddenSeries.has(s.label));
    }
    get yScale() {
        const allY = this.visibleSeries.flatMap(s => s.points.map(p => p.y));
        if (allY.length === 0)
            return { min: 0, max: 1, ticks: [0, 1] };
        return computeNiceScale(allY.reduce((m, v) => v < m ? v : m, Infinity), allY.reduce((m, v) => v > m ? v : m, -Infinity));
    }
    seriesColor(index) {
        return this.data[index]?.color ?? LINE_PALETTE[index % LINE_PALETTE.length];
    }
    toggleSeries(label) {
        const next = new Set(this.hiddenSeries);
        if (next.has(label))
            next.delete(label);
        else
            next.add(label);
        this.hiddenSeries = next;
    }
    handlePointClick(seriesLabel, point, index) {
        this.dispatchEvent(new CustomEvent('point-click', {
            bubbles: true,
            composed: true,
            detail: { series: seriesLabel, x: point.x, y: point.y, index },
        }));
    }
    handlePointHover(e, seriesLabel, point) {
        const container = e.currentTarget.closest('.line-chart-container');
        if (!container)
            return;
        const rect = container.getBoundingClientRect();
        this.tooltipContent = formatTooltipContent({
            label: seriesLabel,
            value: point.y,
            secondaryLabel: String(point.x),
        });
        const pos = computeTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }, { tooltipWidth: 160, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height });
        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
        this.tooltipVisible = true;
    }
    handlePointLeave() {
        this.tooltipVisible = false;
    }
    handleRetry() {
        this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
    }
    buildAccessibleTable() {
        return this.data.map(s => `${s.label}: ${s.points.map(p => `${p.x}=${p.y}`).join(', ')}`).join('. ');
    }
    render() {
        const allPoints = this.data.flatMap(s => s.points);
        const widgetState = resolveWidgetState({
            loading: this.loading,
            error: this.error,
            data: allPoints.length > 0 ? allPoints : null,
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
        if (allPoints.length === 0) {
            return html `<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
        }
        const yScale = this.yScale;
        const chartH = CHART_DIMS.height - CHART_DIMS.padding.top - CHART_DIMS.padding.bottom;
        const yRange = yScale.max - yScale.min || 1;
        // Use the first series (or longest) for x-axis labels
        const refSeries = this.data.reduce((a, b) => a.points.length >= b.points.length ? a : b);
        const xLabels = generateXLabels(refSeries.points, 6, this.xAxisType);
        const tooltipId = 'line-chart-tooltip';
        return html `
      <div class="phz-w-card" role="region" aria-label="${this.title || 'Line Chart'}" style="position:relative;">
        ${this.title ? html `<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="line-chart-container" style="position:relative;">
          <svg class="line-chart-svg" viewBox="0 0 ${CHART_DIMS.width} ${CHART_DIMS.height}"
               preserveAspectRatio="xMidYMid meet"
               role="img" aria-label="${this.title || 'Line Chart'}">

            <!-- Accessible description -->
            <desc>${this.buildAccessibleTable()}</desc>

            ${this.showGrid ? svg `
              <!-- Y gridlines -->
              ${yScale.ticks.map(tick => {
            const y = CHART_DIMS.padding.top + chartH - ((tick - yScale.min) / yRange) * chartH;
            return svg `<line class="grid-line"
                  x1="${CHART_DIMS.padding.left}" y1="${y}"
                  x2="${CHART_DIMS.width - CHART_DIMS.padding.right}" y2="${y}" />`;
        })}
            ` : nothing}

            ${this.showAxis ? svg `
              <!-- Y axis labels -->
              ${yScale.ticks.map(tick => {
            const y = CHART_DIMS.padding.top + chartH - ((tick - yScale.min) / yRange) * chartH;
            return svg `<text class="axis-label" x="${CHART_DIMS.padding.left - 8}" y="${y + 4}"
                  text-anchor="end">${tick.toLocaleString()}</text>`;
        })}

              <!-- X axis labels -->
              ${xLabels.map(l => svg `
                <text class="axis-label" x="${l.px}" y="${CHART_DIMS.height - 8}"
                  text-anchor="middle">${l.label}</text>
              `)}

              <!-- Axis lines -->
              <line class="grid-line"
                x1="${CHART_DIMS.padding.left}" y1="${CHART_DIMS.height - CHART_DIMS.padding.bottom}"
                x2="${CHART_DIMS.width - CHART_DIMS.padding.right}" y2="${CHART_DIMS.height - CHART_DIMS.padding.bottom}" />
              <line class="grid-line"
                x1="${CHART_DIMS.padding.left}" y1="${CHART_DIMS.padding.top}"
                x2="${CHART_DIMS.padding.left}" y2="${CHART_DIMS.height - CHART_DIMS.padding.bottom}" />
            ` : nothing}

            <!-- Data lines and points -->
            ${this.visibleSeries.map((series, sIdx) => {
            const origIdx = this.data.indexOf(series);
            const color = this.seriesColor(origIdx);
            const positioned = computePointPositions(series.points, yScale);
            const pathD = positioned.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');
            return svg `
                <path class="data-line" d="${pathD}" stroke="${color}" />
                ${positioned.map((p, pIdx) => svg `
                  <circle class="data-point phz-w-clickable"
                    cx="${p.px}" cy="${p.py}" r="4"
                    fill="${color}" stroke="#fff" stroke-width="1.5"
                    tabindex="0"
                    role="button"
                    aria-label="${series.label}: ${p.x} = ${p.y}"
                    aria-describedby="${tooltipId}"
                    @click=${() => this.handlePointClick(series.label, p, pIdx)}
                    @mouseenter=${(e) => this.handlePointHover(e, series.label, p)}
                    @mouseleave=${() => this.handlePointLeave()}
                    @focus=${(e) => {
                const circle = e.currentTarget;
                const container = circle.closest('.line-chart-container');
                if (!container)
                    return;
                const rect = container.getBoundingClientRect();
                const svgRect = circle.getBoundingClientRect();
                this.tooltipContent = formatTooltipContent({
                    label: series.label,
                    value: p.y,
                    secondaryLabel: String(p.x),
                });
                const pos = computeTooltipPosition({ x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top }, { tooltipWidth: 160, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height });
                this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                this.tooltipVisible = true;
            }}
                    @blur=${() => this.handlePointLeave()}>
                  </circle>
                `)}
              `;
        })}
          </svg>

          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>

        ${this.showLegend && this.data.length > 1 ? html `
          <div class="legend" role="list" aria-label="Series legend">
            ${this.data.map((series, i) => {
            const color = this.seriesColor(i);
            const hidden = this.hiddenSeries.has(series.label);
            return html `
                <button class="legend__item ${hidden ? 'legend__item--hidden' : ''}"
                        role="listitem"
                        aria-pressed="${!hidden}"
                        @click=${() => this.toggleSeries(series.label)}>
                  <span class="legend__swatch" style="background:${color}"></span>
                  <span class="legend__label">${series.label}</span>
                </button>
              `;
        })}
          </div>
        ` : nothing}

        <!-- Screen reader data table fallback -->
        <table class="phz-w-sr-only">
          <caption>${this.title || 'Line Chart Data'}</caption>
          ${this.data.map(series => html `
            <tr>
              <th scope="row">${series.label}</th>
              ${series.points.map(p => html `<td>${p.x}: ${p.y}</td>`)}
            </tr>
          `)}
        </table>
      </div>
    `;
    }
};
__decorate([
    property({ attribute: false })
], PhzLineChart.prototype, "data", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-grid' })
], PhzLineChart.prototype, "showGrid", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-axis' })
], PhzLineChart.prototype, "showAxis", void 0);
__decorate([
    property({ type: Boolean, attribute: 'show-legend' })
], PhzLineChart.prototype, "showLegend", void 0);
__decorate([
    property({ type: String, attribute: 'x-axis-type' })
], PhzLineChart.prototype, "xAxisType", void 0);
__decorate([
    property({ type: String })
], PhzLineChart.prototype, "title", void 0);
__decorate([
    property({ type: Boolean })
], PhzLineChart.prototype, "loading", void 0);
__decorate([
    property({ type: String })
], PhzLineChart.prototype, "error", void 0);
__decorate([
    state()
], PhzLineChart.prototype, "tooltipContent", void 0);
__decorate([
    state()
], PhzLineChart.prototype, "tooltipVisible", void 0);
__decorate([
    state()
], PhzLineChart.prototype, "tooltipStyle", void 0);
__decorate([
    state()
], PhzLineChart.prototype, "hiddenSeries", void 0);
PhzLineChart = __decorate([
    customElement('phz-line-chart')
], PhzLineChart);
export { PhzLineChart };
//# sourceMappingURL=phz-line-chart.js.map