/**
 * @phozart/phz-widgets — Area Chart
 *
 * SVG area chart with optional stacking, gridlines, axes, and multi-series support.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

export interface AreaDataPoint {
  x: string | number;
  y: number;
}

export interface AreaSeries {
  name: string;
  data: AreaDataPoint[];
  color?: string;
}

export interface ScaledPoint {
  sx: number;
  sy: number;
  x: string | number;
  y: number;
}

export interface AreaChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_AREA_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

const SVG_WIDTH = 400;
const SVG_HEIGHT = 200;
const DEFAULT_PADDING: AreaChartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

export function scalePoints(
  data: AreaDataPoint[],
  minY: number,
  maxY: number,
  width: number,
  height: number,
  padding: AreaChartPadding,
): ScaledPoint[] {
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const range = maxY - minY || 1;

  return data.map((d, i) => ({
    sx: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    sy: padding.top + chartH - ((d.y - minY) / range) * chartH,
    x: d.x,
    y: d.y,
  }));
}

export function buildLinePath(points: ScaledPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx},${p.sy}`).join(' ');
}

export function buildAreaPath(points: ScaledPoint[], baselineY: number): string {
  if (points.length === 0) return '';
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx},${p.sy}`).join(' ');
  const lastX = points[points.length - 1].sx;
  const firstX = points[0].sx;
  return `${line} L${lastX},${baselineY} L${firstX},${baselineY} Z`;
}

export function computeStackedData(allSeries: AreaSeries[]): AreaSeries[] {
  if (allSeries.length === 0) return [];
  const len = allSeries[0].data.length;
  const result: AreaSeries[] = [];
  const cumulative = new Array(len).fill(0);

  for (const series of allSeries) {
    const stackedData = series.data.map((d, i) => {
      cumulative[i] += d.y;
      return { x: d.x, y: cumulative[i] };
    });
    result.push({ ...series, data: stackedData });
  }

  return result;
}

export function computeYBounds(allSeries: AreaSeries[]): { min: number; max: number } {
  const allValues = allSeries.flatMap(s => s.data.map(d => d.y));
  return {
    min: allValues.reduce((m, v) => v < m ? v : m, 0),
    max: allValues.reduce((m, v) => v > m ? v : m, 1),
  };
}

@customElement('phz-area-chart')
export class PhzAreaChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }
      .area-container { position: relative; }
      .area-svg { width: 100%; height: 200px; }
      .area-x-label { font-size: 10px; fill: #78716C; text-anchor: middle; }
      .area-y-label { font-size: 10px; fill: #78716C; text-anchor: end; }
      .area-grid-line { stroke: #E7E5E4; stroke-width: 0.5; }
      .area-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #F5F5F4;
      }
      .area-legend__item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #44403C;
      }
      .area-legend__swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
      }
    `,
  ];

  @property({ attribute: false }) data: AreaSeries[] = [];
  @property({ type: Boolean }) stacked: boolean = false;
  @property({ type: Boolean }) showGrid: boolean = true;
  @property({ type: Boolean }) showAxis: boolean = true;
  @property({ type: Number }) opacity: number = 0.3;
  @property({ type: String }) chartTitle: string = 'Area Chart';
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;
  @property({ attribute: false }) colors: string[] = [];

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private get effectiveColors(): string[] {
    return this.colors.length > 0 ? this.colors : DEFAULT_AREA_COLORS;
  }

  private handlePointHover(e: MouseEvent, seriesName: string, point: ScaledPoint) {
    const container = (e.currentTarget as SVGElement).closest('.area-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipContent = formatTooltipContent({
      label: `${seriesName} - ${point.x}`,
      value: point.y,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 160, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
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

    if (this.data.length === 0 || this.data[0].data.length === 0) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
    }

    const padding = DEFAULT_PADDING;
    const displaySeries = this.stacked ? computeStackedData(this.data) : this.data;
    const bounds = computeYBounds(displaySeries);
    const colors = this.effectiveColors;
    const baselineY = padding.top + (SVG_HEIGHT - padding.top - padding.bottom);

    // Scale each series
    const scaledSeries = displaySeries.map((s, i) => ({
      name: s.name,
      color: s.color || colors[i % colors.length],
      points: scalePoints(s.data, bounds.min, bounds.max, SVG_WIDTH, SVG_HEIGHT, padding),
      data: s.data,
    }));

    // For stacked, render in reverse order (bottom series first)
    const renderOrder = this.stacked ? [...scaledSeries].reverse() : scaledSeries;

    const tooltipId = 'area-chart-tooltip';
    const labelStep = Math.max(1, Math.floor((scaledSeries[0]?.points.length ?? 0) / 6));

    // Y axis ticks
    const yTicks = 5;
    const yTickValues = Array.from({ length: yTicks }, (_, i) =>
      bounds.min + (i / (yTicks - 1)) * (bounds.max - bounds.min),
    );

    return html`
      <div class="phz-w-card" role="region" aria-label="${this.chartTitle}" style="position:relative;">
        <h3 class="phz-w-title">${this.chartTitle}</h3>

        <!-- Accessible data table fallback -->
        <table class="phz-w-sr-only">
          <caption>${this.chartTitle}</caption>
          <thead>
            <tr>
              <th>X</th>
              ${this.data.map(s => html`<th>${s.name}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${this.data[0].data.map((_, i) => html`
              <tr>
                <td>${this.data[0].data[i].x}</td>
                ${this.data.map(s => html`<td>${s.data[i]?.y ?? ''}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>

        <div class="area-container" style="position:relative;" aria-hidden="true">
          <svg class="area-svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines -->
            ${this.showGrid ? yTickValues.map(v => {
              const y = padding.top + (SVG_HEIGHT - padding.top - padding.bottom) -
                ((v - bounds.min) / (bounds.max - bounds.min || 1)) * (SVG_HEIGHT - padding.top - padding.bottom);
              return svg`<line x1="${padding.left}" y1="${y}" x2="${SVG_WIDTH - padding.right}" y2="${y}" class="area-grid-line" />`;
            }) : nothing}

            <!-- Y axis labels -->
            ${this.showAxis ? yTickValues.map(v => {
              const y = padding.top + (SVG_HEIGHT - padding.top - padding.bottom) -
                ((v - bounds.min) / (bounds.max - bounds.min || 1)) * (SVG_HEIGHT - padding.top - padding.bottom);
              return svg`<text x="${padding.left - 4}" y="${y + 3}" class="area-y-label">${Math.round(v)}</text>`;
            }) : nothing}

            <!-- Area fills (rendered bottom-up for stacking) -->
            ${renderOrder.map(s => {
              const lowerBaseline = this.stacked
                ? baselineY
                : baselineY;
              const areaPath = buildAreaPath(s.points, baselineY);
              return svg`
                <path d="${areaPath}" fill="${s.color}" opacity="${this.opacity}" />
                <path d="${buildLinePath(s.points)}" fill="none" stroke="${s.color}" stroke-width="2" />
              `;
            })}

            <!-- Data points (all series) -->
            ${scaledSeries.map(s => s.points.map(p => svg`
              <circle cx="${p.sx}" cy="${p.sy}" r="3"
                      fill="${s.color}" stroke="#fff" stroke-width="1.5"
                      class="phz-w-clickable"
                      @mouseenter=${(e: MouseEvent) => this.handlePointHover(e, s.name, p)}
                      @mouseleave=${() => this.handlePointLeave()}
                      @focus=${(e: FocusEvent) => {
                        const circle = e.currentTarget as SVGElement;
                        const container = circle.closest('.area-container') as HTMLElement;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        this.tooltipContent = formatTooltipContent({
                          label: `${s.name} - ${p.x}`,
                          value: p.y,
                        });
                        const svgRect = circle.getBoundingClientRect();
                        const pos = computeTooltipPosition(
                          { x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top },
                          { tooltipWidth: 160, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
                        );
                        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                        this.tooltipVisible = true;
                      }}
                      @blur=${() => this.handlePointLeave()}
                      role="button" tabindex="0"
                      aria-label="${s.name} ${p.x}: ${p.y}"
                      aria-describedby="${tooltipId}">
              </circle>
            `))}

            <!-- X labels -->
            ${scaledSeries[0]?.points.filter((_, i) => i % labelStep === 0).map(p => svg`
              <text x="${p.sx}" y="${SVG_HEIGHT - 5}" class="area-x-label">${p.x}</text>
            `)}
          </svg>

          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>

        <!-- Legend -->
        ${this.data.length > 1 ? html`
          <div class="area-legend" role="list" aria-label="Chart legend">
            ${this.data.map((s, i) => html`
              <span class="area-legend__item" role="listitem">
                <span class="area-legend__swatch" style="background:${s.color || colors[i % colors.length]};"></span>
                ${s.name}
              </span>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-area-chart': PhzAreaChart;
  }
}
