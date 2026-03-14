/**
 * @phozart/widgets — Bar Chart
 *
 * Horizontal ranked bars with value labels and optional volume indicator.
 * Supports simple (single-series), stacked, and grouped modes.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { ChartDataSeries } from '@phozart/engine';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

export interface MultiSeriesDataPoint {
  label: string;
  values: Record<string, number>;
}

export interface StackedSegment {
  series: string;
  value: number;
  offset: number;
  color: string;
}

export interface GroupedBar {
  series: string;
  value: number;
  index: number;
  color: string;
}

export interface LegendItem {
  series: string;
  color: string;
}

const DEFAULT_SERIES_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

export function computeStackedSegments(
  point: MultiSeriesDataPoint,
  seriesNames: string[],
  colors: string[],
): StackedSegment[] {
  let offset = 0;
  return seriesNames.map((name, i) => {
    const value = point.values[name] ?? 0;
    const segment: StackedSegment = {
      series: name,
      value,
      offset,
      color: colors[i % colors.length],
    };
    offset += value;
    return segment;
  });
}

export function computeGroupedBars(
  point: MultiSeriesDataPoint,
  seriesNames: string[],
  colors: string[],
): GroupedBar[] {
  return seriesNames.map((name, i) => ({
    series: name,
    value: point.values[name] ?? 0,
    index: i,
    color: colors[i % colors.length],
  }));
}

export function computeStackedTotal(point: MultiSeriesDataPoint): number {
  return Object.values(point.values).reduce((sum, v) => sum + v, 0);
}

export function generateLegendItems(
  seriesNames: string[],
  colors: string[],
): LegendItem[] {
  return seriesNames.map((name, i) => ({
    series: name,
    color: colors[i % colors.length],
  }));
}

@customElement('phz-bar-chart')
export class PhzBarChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }

      .bar-chart { display: flex; flex-direction: column; gap: 6px; }

      .bar-row {
        display: grid;
        grid-template-columns: 120px 1fr 60px;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        min-height: 44px;
      }

      .bar-row:hover .bar-fill,
      .bar-row:hover .bar-segment { opacity: 0.85; }
      .bar-row:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; border-radius: 4px; }

      .bar-label {
        font-size: 13px;
        color: var(--phz-w-text-secondary, #44403C);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar-track {
        height: 24px;
        background: var(--phz-w-surface, #F5F5F4);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
        display: flex;
      }

      .bar-fill {
        height: 100%;
        background: #3B82F6;
        border-radius: 4px;
        transition: width 0.3s ease;
        min-width: 2px;
      }

      .bar-segment {
        height: 100%;
        transition: width 0.3s ease;
        min-width: 1px;
      }

      .bar-segment:first-child {
        border-radius: 4px 0 0 4px;
      }

      .bar-segment:last-child {
        border-radius: 0 4px 4px 0;
      }

      .bar-segment:only-child {
        border-radius: 4px;
      }

      /* Grouped mode: side-by-side within track */
      .bar-track--grouped {
        gap: 1px;
        align-items: flex-end;
      }

      .bar-grouped-fill {
        height: 100%;
        transition: width 0.3s ease;
        min-width: 1px;
        border-radius: 2px;
      }

      .bar-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--phz-w-text, #1C1917);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* Legend */
      .bar-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--phz-w-surface, #F5F5F4);
      }

      .bar-legend__item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--phz-w-text-secondary, #44403C);
      }

      .bar-legend__swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      @container (max-width: 575px) {
        .bar-row {
          grid-template-columns: 80px 1fr 50px;
          gap: 4px;
        }
        .bar-legend {
          flex-direction: column;
          gap: 8px;
        }
      }
    `,
  ];

  /** Single-series data (simple mode). */
  @property({ type: Object }) data?: ChartDataSeries;

  /** Multi-series data for stacked/grouped modes. */
  @property({ attribute: false }) multiSeriesData?: MultiSeriesDataPoint[];

  /** Bar chart mode. */
  @property({ type: String }) mode: 'simple' | 'stacked' | 'grouped' = 'simple';

  /** Series names for multi-series modes. Inferred from first data point if not set. */
  @property({ attribute: false }) seriesNames?: string[];

  /** Chart title override for multi-series mode. */
  @property({ type: String }) chartTitle?: string;

  @property({ type: String }) rankOrder: 'asc' | 'desc' = 'desc';
  @property({ type: Boolean }) showVolume: boolean = false;
  @property({ type: Number }) maxBars: number = 10;
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  /** Custom bar/series colors. Falls back to DEFAULT_SERIES_COLORS in multi-series mode. */
  @property({ attribute: false }) colors: string[] = [];

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private get effectiveColors(): string[] {
    return this.colors.length > 0 ? this.colors : DEFAULT_SERIES_COLORS;
  }

  private get effectiveSeriesNames(): string[] {
    if (this.seriesNames) return this.seriesNames;
    if (this.multiSeriesData && this.multiSeriesData.length > 0) {
      return Object.keys(this.multiSeriesData[0].values);
    }
    return [];
  }

  private get isMultiSeries(): boolean {
    return this.mode !== 'simple' && !!this.multiSeriesData && this.multiSeriesData.length > 0;
  }

  private get sortedData() {
    if (!this.data) return [];
    const sorted = [...this.data.data].sort((a, b) =>
      this.rankOrder === 'desc' ? b.y - a.y : a.y - b.y,
    );
    return sorted.slice(0, this.maxBars);
  }

  private get sortedMultiData(): MultiSeriesDataPoint[] {
    if (!this.multiSeriesData) return [];
    const series = this.effectiveSeriesNames;
    const sorted = [...this.multiSeriesData].sort((a, b) => {
      const totalA = computeStackedTotal(a);
      const totalB = computeStackedTotal(b);
      return this.rankOrder === 'desc' ? totalB - totalA : totalA - totalB;
    });
    return sorted.slice(0, this.maxBars);
  }

  private handleBarClick(point: { x: string | number; y: number }) {
    this.dispatchEvent(new CustomEvent('bar-click', {
      bubbles: true,
      composed: true,
      detail: { source: 'bar-chart', xValue: point.x, value: point.y },
    }));
    this.dispatchEvent(new CustomEvent('drill-through', {
      bubbles: true,
      composed: true,
      detail: { source: 'bar-chart', xValue: point.x, value: point.y },
    }));
  }

  private handleSegmentClick(label: string, series: string, value: number, total: number) {
    this.dispatchEvent(new CustomEvent('bar-click', {
      bubbles: true,
      composed: true,
      detail: { source: 'bar-chart', xValue: label, series, value, total },
    }));
  }

  private handleBarHover(e: MouseEvent, point: { x: string | number; y: number; label?: string }, maxVal: number) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percentage = maxVal > 0 ? (point.y / maxVal) * 100 : 0;
    this.tooltipContent = formatTooltipContent({
      label: String(point.label ?? point.x),
      value: point.y,
      percentage: Math.round(percentage * 10) / 10,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
    );
    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handleMultiBarHover(
    e: MouseEvent,
    label: string,
    series: string,
    value: number,
    total?: number,
  ) {
    const row = (e.currentTarget as HTMLElement).closest('.bar-row') as HTMLElement;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const content = total !== undefined
      ? `${label} - ${series}: ${value.toLocaleString()} (Total: ${total.toLocaleString()})`
      : `${label} - ${series}: ${value.toLocaleString()}`;
    this.tooltipContent = content;
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 200, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
    );
    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handleBarLeave() {
    this.tooltipVisible = false;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
  }

  render() {
    if (this.isMultiSeries) {
      return this.renderMultiSeries();
    }
    return this.renderSimple();
  }

  private renderSimple() {
    const widgetState = resolveWidgetState({
      loading: this.loading,
      error: this.error,
      data: this.data?.data ?? null,
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

    const items = this.sortedData;
    if (items.length === 0) return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;

    const maxVal = items.reduce((m, d) => d.y > m ? d.y : m, 1);

    const tooltipId = 'bar-chart-tooltip';

    return html`
      <div class="phz-w-card" role="region" aria-label="${this.data?.label ?? 'Bar Chart'}" style="position:relative;">
        <h3 class="phz-w-title">${this.data?.label ?? 'Bar Chart'}</h3>
        <div class="bar-chart" role="list">
          ${items.map((point, idx) => {
            const barColor = this.colors.length > 0
              ? this.colors[idx % this.colors.length]
              : '';
            return html`
            <div class="bar-row phz-w-clickable"
                 role="listitem"
                 tabindex="0"
                 aria-describedby="${tooltipId}"
                 @click=${() => this.handleBarClick(point)}
                 @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleBarClick(point)}
                 @mouseenter=${(e: MouseEvent) => this.handleBarHover(e, point, maxVal)}
                 @mouseleave=${() => this.handleBarLeave()}
                 @focus=${(e: FocusEvent) => {
                   const target = e.currentTarget as HTMLElement;
                   const rect = target.getBoundingClientRect();
                   const parentRect = target.closest('.phz-w-card')!.getBoundingClientRect();
                   const percentage = maxVal > 0 ? (point.y / maxVal) * 100 : 0;
                   this.tooltipContent = formatTooltipContent({
                     label: String(point.label ?? point.x),
                     value: point.y,
                     percentage: Math.round(percentage * 10) / 10,
                   });
                   const pos = computeTooltipPosition(
                     { x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top },
                     { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: parentRect.width, viewportHeight: parentRect.height },
                   );
                   this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                   this.tooltipVisible = true;
                 }}
                 @blur=${() => this.handleBarLeave()}>
              <span class="bar-label">${point.label ?? point.x}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${(point.y / maxVal) * 100}%${barColor ? `;background:${barColor}` : ''}"></div>
              </div>
              <span class="bar-value">${point.y.toLocaleString()}</span>
            </div>
          `})}
        </div>
        <div id="${tooltipId}"
             class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
             role="tooltip"
             style="${this.tooltipStyle}">${this.tooltipContent}</div>
      </div>
    `;
  }

  private renderMultiSeries() {
    const widgetState = resolveWidgetState({
      loading: this.loading,
      error: this.error,
      data: this.multiSeriesData ?? null,
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

    const items = this.sortedMultiData;
    if (items.length === 0) return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;

    const series = this.effectiveSeriesNames;
    const colors = this.effectiveColors;
    const title = this.chartTitle ?? 'Bar Chart';
    const tooltipId = 'bar-chart-tooltip';

    if (this.mode === 'stacked') {
      return this.renderStacked(items, series, colors, title, tooltipId);
    }
    return this.renderGrouped(items, series, colors, title, tooltipId);
  }

  private renderStacked(
    items: MultiSeriesDataPoint[],
    series: string[],
    colors: string[],
    title: string,
    tooltipId: string,
  ) {
    const maxTotal = items.reduce((m, p) => { const t = computeStackedTotal(p); return t > m ? t : m; }, 1);
    const legend = generateLegendItems(series, colors);

    return html`
      <div class="phz-w-card" role="region" aria-label="${title}" style="position:relative;">
        <h3 class="phz-w-title">${title}</h3>
        <div class="bar-chart" role="list">
          ${items.map(point => {
            const segments = computeStackedSegments(point, series, colors);
            const total = computeStackedTotal(point);
            const totalWidth = (total / maxTotal) * 100;
            return html`
            <div class="bar-row"
                 role="listitem"
                 tabindex="0"
                 aria-label="${point.label}: total ${total.toLocaleString()}"
                 aria-describedby="${tooltipId}"
                 @blur=${() => this.handleBarLeave()}>
              <span class="bar-label">${point.label}</span>
              <div class="bar-track" style="width:100%;">
                ${segments.filter(s => s.value > 0).map(seg => html`
                  <div class="bar-segment phz-w-clickable"
                       style="width:${(seg.value / maxTotal) * 100}%;background:${seg.color};"
                       role="button"
                       tabindex="-1"
                       aria-label="${point.label} ${seg.series}: ${seg.value.toLocaleString()}"
                       @click=${() => this.handleSegmentClick(point.label, seg.series, seg.value, total)}
                       @mouseenter=${(e: MouseEvent) => this.handleMultiBarHover(e, point.label, seg.series, seg.value, total)}
                       @mouseleave=${() => this.handleBarLeave()}>
                  </div>
                `)}
              </div>
              <span class="bar-value">${total.toLocaleString()}</span>
            </div>
          `})}
        </div>
        ${this.renderLegend(legend)}
        <div id="${tooltipId}"
             class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
             role="tooltip"
             style="${this.tooltipStyle}">${this.tooltipContent}</div>
      </div>
    `;
  }

  private renderGrouped(
    items: MultiSeriesDataPoint[],
    series: string[],
    colors: string[],
    title: string,
    tooltipId: string,
  ) {
    const maxVal = items.flatMap(p => series.map(s => p.values[s] ?? 0)).reduce((m, v) => v > m ? v : m, 1);
    const legend = generateLegendItems(series, colors);

    return html`
      <div class="phz-w-card" role="region" aria-label="${title}" style="position:relative;">
        <h3 class="phz-w-title">${title}</h3>
        <div class="bar-chart" role="list">
          ${items.map(point => {
            const bars = computeGroupedBars(point, series, colors);
            return html`
            <div class="bar-row"
                 role="listitem"
                 tabindex="0"
                 aria-label="${point.label}"
                 aria-describedby="${tooltipId}"
                 @blur=${() => this.handleBarLeave()}>
              <span class="bar-label">${point.label}</span>
              <div class="bar-track bar-track--grouped">
                ${bars.map(bar => html`
                  <div class="bar-grouped-fill phz-w-clickable"
                       style="width:${(bar.value / maxVal) * 100}%;background:${bar.color};flex:1;"
                       role="button"
                       tabindex="-1"
                       aria-label="${point.label} ${bar.series}: ${bar.value.toLocaleString()}"
                       @click=${() => this.handleSegmentClick(point.label, bar.series, bar.value, computeStackedTotal(point))}
                       @mouseenter=${(e: MouseEvent) => this.handleMultiBarHover(e, point.label, bar.series, bar.value)}
                       @mouseleave=${() => this.handleBarLeave()}>
                  </div>
                `)}
              </div>
              <span class="bar-value">${computeStackedTotal(point).toLocaleString()}</span>
            </div>
          `})}
        </div>
        ${this.renderLegend(legend)}
        <div id="${tooltipId}"
             class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
             role="tooltip"
             style="${this.tooltipStyle}">${this.tooltipContent}</div>
      </div>
    `;
  }

  private renderLegend(items: LegendItem[]) {
    return html`
      <div class="bar-legend" role="list" aria-label="Chart legend">
        ${items.map(item => html`
          <span class="bar-legend__item" role="listitem">
            <span class="bar-legend__swatch" style="background:${item.color};"></span>
            ${item.series}
          </span>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-bar-chart': PhzBarChart;
  }
}
