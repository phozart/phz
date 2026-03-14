/**
 * @phozart/widgets — Scatter / Bubble Chart
 *
 * SVG-based scatter plot with optional bubble mode (size mapped to third dimension).
 * Supports grid, axes, tooltips, keyboard navigation, and SR data table fallback.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

export interface ScatterDataPoint {
  x: number;
  y: number;
  size?: number;
  color?: string;
  label?: string;
}

interface ScaleResult {
  min: number;
  max: number;
  ticks: number[];
}

const DEFAULT_COLOR = '#3B82F6';

const CHART_DIMS = {
  width: 500,
  height: 320,
  padding: { top: 20, right: 20, bottom: 45, left: 55 },
};

export function computeNiceScale(min: number, max: number, targetTicks: number = 5): ScaleResult {
  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
    return computeNiceScale(min - padding, max + padding, targetTicks);
  }
  const range = max - min;
  const roughStep = range / (targetTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * 1e10) / 1e10);
  }
  return { min: niceMin, max: niceMax, ticks };
}

export function scalePoint(
  point: ScatterDataPoint,
  xScale: ScaleResult,
  yScale: ScaleResult,
): { px: number; py: number } {
  const plotW = CHART_DIMS.width - CHART_DIMS.padding.left - CHART_DIMS.padding.right;
  const plotH = CHART_DIMS.height - CHART_DIMS.padding.top - CHART_DIMS.padding.bottom;
  const xRange = xScale.max - xScale.min || 1;
  const yRange = yScale.max - yScale.min || 1;
  return {
    px: CHART_DIMS.padding.left + ((point.x - xScale.min) / xRange) * plotW,
    py: CHART_DIMS.padding.top + plotH - ((point.y - yScale.min) / yRange) * plotH,
  };
}

export function computeBubbleRadius(
  size: number | undefined,
  allSizes: number[],
  minR: number = 4,
  maxR: number = 24,
): number {
  if (size === undefined || allSizes.length === 0) return minR;
  const sMin = allSizes.reduce((m, v) => v < m ? v : m, Infinity);
  const sMax = allSizes.reduce((m, v) => v > m ? v : m, -Infinity);
  if (sMin === sMax) return (minR + maxR) / 2;
  const normalized = (size - sMin) / (sMax - sMin);
  return minR + normalized * (maxR - minR);
}

export function buildAccessibleDescription(data: ScatterDataPoint[]): string {
  return data.map((p, i) => {
    const label = p.label ?? `Point ${i + 1}`;
    const sizeStr = p.size !== undefined ? `, size ${p.size}` : '';
    return `${label}: x=${p.x}, y=${p.y}${sizeStr}`;
  }).join('; ');
}

@customElement('phz-scatter-chart')
export class PhzScatterChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }
      .scatter-container { position: relative; }
      .scatter-svg { width: 100%; }
      .axis-label { font-size: 10px; fill: #78716C; }
      .grid-line { stroke: #E7E5E4; stroke-width: 1; }
      .data-point {
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .data-point:hover { opacity: 0.75; }
      .data-point:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }
    `,
  ];

  @property({ attribute: false }) data: ScatterDataPoint[] = [];
  @property({ type: Boolean, attribute: 'show-grid' }) showGrid: boolean = true;
  @property({ type: Boolean, attribute: 'show-axis' }) showAxis: boolean = true;
  @property({ type: String }) title: string = '';
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private get xScale(): ScaleResult {
    const xs = this.data.map(d => d.x);
    if (xs.length === 0) return { min: 0, max: 1, ticks: [0, 1] };
    return computeNiceScale(xs.reduce((m, v) => v < m ? v : m, Infinity), xs.reduce((m, v) => v > m ? v : m, -Infinity));
  }

  private get yScale(): ScaleResult {
    const ys = this.data.map(d => d.y);
    if (ys.length === 0) return { min: 0, max: 1, ticks: [0, 1] };
    return computeNiceScale(ys.reduce((m, v) => v < m ? v : m, Infinity), ys.reduce((m, v) => v > m ? v : m, -Infinity));
  }

  private get allSizes(): number[] {
    return this.data.filter(d => d.size !== undefined).map(d => d.size!);
  }

  private get isBubble(): boolean {
    return this.allSizes.length > 0;
  }

  private handlePointClick(point: ScatterDataPoint, index: number) {
    this.dispatchEvent(new CustomEvent('point-click', {
      bubbles: true,
      composed: true,
      detail: { x: point.x, y: point.y, size: point.size, label: point.label, index },
    }));
  }

  private handlePointHover(e: MouseEvent, point: ScatterDataPoint) {
    const container = (e.currentTarget as SVGElement).closest('.scatter-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const label = point.label ?? `(${point.x}, ${point.y})`;
    this.tooltipContent = formatTooltipContent({
      label,
      value: point.y,
      secondaryLabel: `x: ${point.x}`,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 160, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
    );
    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handlePointLeave() {
    this.tooltipVisible = false;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
  }

  render() {
    const widgetState = resolveWidgetState({
      loading: this.loading,
      error: this.error,
      data: this.data.length > 0 ? this.data : null,
    });

    if (widgetState.state === 'loading') {
      return html`<div class="phz-w-card phz-w-state" aria-live="polite" aria-busy="true">
        <div class="phz-w-state__spinner"></div>
        <p class="phz-w-state__message">${widgetState.message}</p>
      </div>`;
    }

    if (widgetState.state === 'error') {
      return html`<div class="phz-w-card phz-w-state" role="alert">
        <p class="phz-w-state__error-message">${widgetState.message}</p>
        <button class="phz-w-state__retry-btn" @click=${this.handleRetry}>Retry</button>
      </div>`;
    }

    if (this.data.length === 0) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
    }

    const xScale = this.xScale;
    const yScale = this.yScale;
    const plotH = CHART_DIMS.height - CHART_DIMS.padding.top - CHART_DIMS.padding.bottom;
    const yRange = yScale.max - yScale.min || 1;
    const tooltipId = 'scatter-chart-tooltip';
    const chartLabel = this.title || (this.isBubble ? 'Bubble Chart' : 'Scatter Chart');

    return html`
      <div class="phz-w-card" role="region" aria-label="${chartLabel}" style="position:relative;">
        ${this.title ? html`<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="scatter-container" style="position:relative;">
          <svg class="scatter-svg" viewBox="0 0 ${CHART_DIMS.width} ${CHART_DIMS.height}"
               preserveAspectRatio="xMidYMid meet"
               role="img" aria-label="${chartLabel}">
            <desc>${buildAccessibleDescription(this.data)}</desc>

            ${this.showGrid ? svg`
              ${yScale.ticks.map(tick => {
                const y = CHART_DIMS.padding.top + plotH - ((tick - yScale.min) / yRange) * plotH;
                return svg`<line class="grid-line"
                  x1="${CHART_DIMS.padding.left}" y1="${y}"
                  x2="${CHART_DIMS.width - CHART_DIMS.padding.right}" y2="${y}" />`;
              })}
            ` : nothing}

            ${this.showAxis ? svg`
              ${yScale.ticks.map(tick => {
                const y = CHART_DIMS.padding.top + plotH - ((tick - yScale.min) / yRange) * plotH;
                return svg`<text class="axis-label" x="${CHART_DIMS.padding.left - 8}" y="${y + 4}"
                  text-anchor="end">${tick.toLocaleString()}</text>`;
              })}
              ${xScale.ticks.map(tick => {
                const plotW = CHART_DIMS.width - CHART_DIMS.padding.left - CHART_DIMS.padding.right;
                const xRange = xScale.max - xScale.min || 1;
                const x = CHART_DIMS.padding.left + ((tick - xScale.min) / xRange) * plotW;
                return svg`<text class="axis-label" x="${x}" y="${CHART_DIMS.height - 8}"
                  text-anchor="middle">${tick.toLocaleString()}</text>`;
              })}
              <line class="grid-line"
                x1="${CHART_DIMS.padding.left}" y1="${CHART_DIMS.height - CHART_DIMS.padding.bottom}"
                x2="${CHART_DIMS.width - CHART_DIMS.padding.right}" y2="${CHART_DIMS.height - CHART_DIMS.padding.bottom}" />
              <line class="grid-line"
                x1="${CHART_DIMS.padding.left}" y1="${CHART_DIMS.padding.top}"
                x2="${CHART_DIMS.padding.left}" y2="${CHART_DIMS.height - CHART_DIMS.padding.bottom}" />
            ` : nothing}

            ${this.data.map((point, i) => {
              const { px, py } = scalePoint(point, xScale, yScale);
              const r = computeBubbleRadius(point.size, this.allSizes);
              const color = point.color ?? DEFAULT_COLOR;
              const label = point.label ?? `Point ${i + 1}`;
              return svg`
                <circle class="data-point phz-w-clickable"
                  cx="${px}" cy="${py}" r="${r}"
                  fill="${color}" fill-opacity="0.7"
                  stroke="${color}" stroke-width="1.5"
                  tabindex="0"
                  role="button"
                  aria-label="${label}: x=${point.x}, y=${point.y}${point.size !== undefined ? `, size ${point.size}` : ''}"
                  aria-describedby="${tooltipId}"
                  @click=${() => this.handlePointClick(point, i)}
                  @mouseenter=${(e: MouseEvent) => this.handlePointHover(e, point)}
                  @mouseleave=${() => this.handlePointLeave()}
                  @focus=${(e: FocusEvent) => {
                    const circle = e.currentTarget as SVGElement;
                    const container = circle.closest('.scatter-container') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const svgRect = circle.getBoundingClientRect();
                    this.tooltipContent = formatTooltipContent({
                      label,
                      value: point.y,
                      secondaryLabel: `x: ${point.x}`,
                    });
                    const pos = computeTooltipPosition(
                      { x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top },
                      { tooltipWidth: 160, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
                    );
                    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                    this.tooltipVisible = true;
                  }}
                  @blur=${() => this.handlePointLeave()}>
                </circle>
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
          <thead><tr><th>Label</th><th>X</th><th>Y</th>${this.isBubble ? html`<th>Size</th>` : nothing}</tr></thead>
          <tbody>
            ${this.data.map((p, i) => html`
              <tr>
                <td>${p.label ?? `Point ${i + 1}`}</td>
                <td>${p.x}</td>
                <td>${p.y}</td>
                ${this.isBubble ? html`<td>${p.size ?? ''}</td>` : nothing}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-scatter-chart': PhzScatterChart;
  }
}
