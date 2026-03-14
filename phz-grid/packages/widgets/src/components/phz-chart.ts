/**
 * @phozart/widgets — Unified Chart Component
 *
 * `<phz-chart>` — A single component driven by a ChartSpec JSON object.
 * Supports bar, line, area, point chart types and mixed combinations.
 *
 * Architecture: spec → resolveChartData() → computeChartLayout() → SVG render
 * All data logic is in pure functions; the component is a thin reactive shell.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { resolveWidgetState } from '../widget-states.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import type { ChartSpec } from '@phozart/engine';
import { applyChartDefaults } from '@phozart/engine';
import { resolveChartData } from '../chart/chart-resolve.js';
import type { ResolvedChartData } from '../chart/chart-resolve.js';
import { computeChartLayout } from '../chart/chart-layout.js';
import type { ChartLayout, BarMark, PointMark } from '../chart/chart-layout.js';
import { renderSVGChart } from '../chart/svg-renderer.js';
import type { SVGEventHandlers } from '../chart/svg-renderer.js';
import type { RenderOptions } from '../chart/chart-renderer.js';
import { nextFocusedMark, buildMarkAnnouncement } from '../chart/chart-keyboard.js';
import type { FocusedMark } from '../chart/chart-keyboard.js';

@customElement('phz-chart')
export class PhzChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .phz-chart-wrapper {
        position: relative;
      }

      .phz-chart-svg-container {
        position: relative;
        width: 100%;
      }

      .phz-chart-svg-container svg {
        width: 100%;
        display: block;
      }

      /* Legend */
      .phz-chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--phz-w-surface, #F5F5F4);
      }

      .phz-chart-legend__item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--phz-w-text-secondary, #44403C);
        cursor: pointer;
        border: none;
        background: none;
        padding: 2px 4px;
        border-radius: 4px;
        transition: opacity 0.15s ease;
      }

      .phz-chart-legend__item:hover {
        background: var(--phz-w-surface, #FAFAF9);
      }

      .phz-chart-legend__item:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .phz-chart-legend__item--hidden {
        opacity: 0.35;
      }

      .phz-chart-legend__swatch {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .phz-chart-legend__swatch--line {
        height: 3px;
        border-radius: 1px;
      }

      /* ARIA live region */
      .phz-chart-live {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      }

      @container (max-width: 575px) {
        .phz-chart-legend {
          flex-direction: column;
          gap: 8px;
        }
      }
    `,
  ];

  /** The chart specification. Drives the entire rendering pipeline. */
  @property({ attribute: false }) spec?: ChartSpec;

  /** Loading state. */
  @property({ type: Boolean }) loading = false;

  /** Error message. */
  @property({ type: String }) error: string | null = null;

  // --- Internal State ---

  @state() private containerWidth = 0;
  @state() private containerHeight = 0;
  @state() private hiddenSeries = new Set<number>();
  @state() private tooltipContent = '';
  @state() private tooltipVisible = false;
  @state() private tooltipStyle = '';
  @state() private focusedMark: FocusedMark | null = null;
  @state() private liveAnnouncement = '';
  @state() private highContrastMode = false;

  private resizeObserver?: ResizeObserver;
  private contrastQuery?: MediaQueryList;

  // --- Lifecycle ---

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.containerWidth = entry.contentRect.width;
        this.containerHeight = entry.contentRect.height || this.resolvedHeight;
      }
    });

    // Detect high contrast mode
    this.contrastQuery = window.matchMedia('(prefers-contrast: more)');
    this.highContrastMode = this.contrastQuery.matches;
    this.contrastQuery.addEventListener('change', this.handleContrastChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.contrastQuery?.removeEventListener('change', this.handleContrastChange);
  }

  firstUpdated() {
    const container = this.renderRoot.querySelector('.phz-chart-svg-container');
    if (container) {
      this.resizeObserver?.observe(container);
    }
  }

  // --- Computed Properties ---

  private get resolvedHeight(): number {
    return this.spec?.appearance?.height ?? 300;
  }

  private get resolvedSpec(): ChartSpec | null {
    if (!this.spec) return null;
    return applyChartDefaults(this.spec);
  }

  private get resolvedData(): ResolvedChartData | null {
    const spec = this.resolvedSpec;
    if (!spec || !spec.data?.values?.length) return null;

    const width = this.containerWidth || 500;
    const height = this.containerHeight || this.resolvedHeight;
    const padding = spec.appearance?.padding;

    const plotWidth = width - (padding?.left ?? 55) - (padding?.right ?? 20);
    const plotHeight = height - (padding?.top ?? 20) - (padding?.bottom ?? 45);

    return resolveChartData(spec, Math.max(plotWidth, 50), Math.max(plotHeight, 50));
  }

  private get chartLayout(): ChartLayout | null {
    const spec = this.resolvedSpec;
    const resolved = this.resolvedData;
    if (!spec || !resolved) return null;

    const width = this.containerWidth || 500;
    const height = this.containerHeight || this.resolvedHeight;

    return computeChartLayout(resolved, spec, width, height);
  }

  // --- Event Handlers ---

  private handleContrastChange = (e: MediaQueryListEvent) => {
    this.highContrastMode = e.matches;
  };

  private handleMarkClick(mark: BarMark | PointMark) {
    this.dispatchEvent(new CustomEvent('chart:mark-click', {
      bubbles: true,
      composed: true,
      detail: {
        source: 'phz-chart',
        seriesIndex: mark.seriesIndex,
        dataIndex: mark.dataIndex,
        label: mark.label,
        value: mark.value,
        datum: mark.datum,
      },
    }));
  }

  private handleMarkHover(e: MouseEvent, mark: BarMark | PointMark) {
    const container = this.renderRoot.querySelector('.phz-chart-wrapper') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const seriesName = this.resolvedData?.series.find(s => s.index === mark.seriesIndex)?.name ?? '';

    this.tooltipContent = formatTooltipContent({
      label: seriesName,
      value: mark.value,
      secondaryLabel: mark.label,
    });

    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 180, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
    );

    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handleMarkFocus(e: FocusEvent, mark: BarMark | PointMark) {
    const container = this.renderRoot.querySelector('.phz-chart-wrapper') as HTMLElement;
    if (!container) return;

    const target = e.currentTarget as SVGElement;
    const rect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const series = this.resolvedData?.series.find(s => s.index === mark.seriesIndex);
    const seriesName = series?.name ?? '';

    this.tooltipContent = formatTooltipContent({
      label: seriesName,
      value: mark.value,
      secondaryLabel: mark.label,
    });

    const pos = computeTooltipPosition(
      { x: targetRect.left - rect.left + targetRect.width / 2, y: targetRect.top - rect.top },
      { tooltipWidth: 180, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
    );

    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;

    // Update focused mark for keyboard nav
    this.focusedMark = { seriesIndex: mark.seriesIndex, dataIndex: mark.dataIndex };

    // ARIA live announcement
    this.liveAnnouncement = buildMarkAnnouncement(
      seriesName,
      mark.label,
      mark.value,
      mark.dataIndex,
      series?.points.length ?? 0,
    );
  }

  private handleMarkLeave() {
    this.tooltipVisible = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const resolved = this.resolvedData;
    if (!resolved) return;

    const pointCounts = resolved.series.map(s => s.points.length);

    if (e.key === 'Enter' || e.key === ' ') {
      if (this.focusedMark) {
        e.preventDefault();
        const series = resolved.series.find(s => s.index === this.focusedMark!.seriesIndex);
        const point = series?.points[this.focusedMark!.dataIndex];
        if (point) {
          this.handleMarkClick({
            kind: 'point',
            cx: 0, cy: 0, r: 0,
            color: series?.color ?? '',
            filled: true,
            seriesIndex: this.focusedMark.seriesIndex,
            dataIndex: this.focusedMark.dataIndex,
            datum: point.datum,
            label: String(point.x),
            value: point.y,
          });
        }
      }
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(e.key)) {
      e.preventDefault();
      const next = nextFocusedMark(
        this.focusedMark,
        e.key,
        resolved.series.length,
        pointCounts,
        this.hiddenSeries,
      );

      this.focusedMark = next;

      if (next) {
        const series = resolved.series.find(s => s.index === next.seriesIndex);
        const point = series?.points[next.dataIndex];
        if (series && point) {
          this.liveAnnouncement = buildMarkAnnouncement(
            series.name,
            String(point.x),
            point.y,
            next.dataIndex,
            series.points.length,
          );
        }
      } else {
        this.tooltipVisible = false;
        this.liveAnnouncement = '';
      }
    }
  }

  private toggleSeries(index: number) {
    const next = new Set(this.hiddenSeries);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    this.hiddenSeries = next;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
  }

  // --- Render ---

  render() {
    const widgetState = resolveWidgetState({
      loading: this.loading,
      error: this.error,
      data: this.spec?.data?.values ?? null,
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

    const layout = this.chartLayout;
    if (!layout) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
    }

    const spec = this.resolvedSpec!;
    const showLegend = spec.legend?.show !== false && layout.legend.length > 1;
    const interactive = spec.legend?.interactive !== false;

    const renderOptions: RenderOptions = {
      hiddenSeries: this.hiddenSeries,
      focusedMark: this.focusedMark,
      patternsEnabled: this.highContrastMode || this.resolvedData?.series.some(s => s.patternId != null) || false,
      animated: spec.appearance?.animated !== false,
    };

    const handlers: SVGEventHandlers = {
      chartLabel: spec.title ?? 'Chart',
      chartDescription: this.buildAccessibleDescription(),
      onMarkClick: (mark) => this.handleMarkClick(mark),
      onMarkHover: (e, mark) => this.handleMarkHover(e, mark),
      onMarkLeave: () => this.handleMarkLeave(),
      onMarkFocus: (e, mark) => this.handleMarkFocus(e, mark),
      onKeyDown: (e) => this.handleKeyDown(e),
    };

    return html`
      <div class="phz-w-card" role="region" aria-label="${spec.title ?? 'Chart'}" style="position:relative;">
        ${spec.title ? html`<h3 class="phz-w-title">${spec.title}</h3>` : nothing}

        <div class="phz-chart-wrapper" style="position:relative;">
          <div class="phz-chart-svg-container" style="height:${this.resolvedHeight}px;">
            ${renderSVGChart(layout, renderOptions, handlers)}
          </div>

          <!-- Tooltip -->
          <div class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>

          <!-- ARIA live region for keyboard navigation -->
          <div class="phz-chart-live" aria-live="assertive" aria-atomic="true">
            ${this.liveAnnouncement}
          </div>
        </div>

        ${showLegend ? this.renderLegend(layout, interactive) : nothing}

        <!-- Screen reader data table fallback -->
        ${this.renderAccessibleTable()}
      </div>
    `;
  }

  private renderLegend(layout: ChartLayout, interactive: boolean) {
    return html`
      <div class="phz-chart-legend" role="list" aria-label="Chart legend">
        ${layout.legend.map(entry => {
          const hidden = this.hiddenSeries.has(entry.seriesIndex);
          const isLine = this.resolvedData?.series.find(s => s.index === entry.seriesIndex)?.type === 'line';

          return html`
            <button class="phz-chart-legend__item ${hidden ? 'phz-chart-legend__item--hidden' : ''}"
                    role="listitem"
                    aria-pressed="${!hidden}"
                    @click=${interactive ? () => this.toggleSeries(entry.seriesIndex) : nothing}>
              <span class="phz-chart-legend__swatch ${isLine ? 'phz-chart-legend__swatch--line' : ''}"
                    style="background:${entry.color};"></span>
              <span>${entry.name}</span>
            </button>
          `;
        })}
      </div>
    `;
  }

  private renderAccessibleTable() {
    const resolved = this.resolvedData;
    if (!resolved || resolved.series.length === 0) return nothing;

    return html`
      <table class="phz-w-sr-only">
        <caption>${this.resolvedSpec?.title ?? 'Chart Data'}</caption>
        <thead>
          <tr>
            <th>Category</th>
            ${resolved.series.map(s => html`<th>${s.name}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.buildTableRows(resolved)}
        </tbody>
      </table>
    `;
  }

  private buildTableRows(resolved: ResolvedChartData) {
    // Use the first series to determine x-axis categories
    const categories = resolved.series[0]?.points.map(p => String(p.x)) ?? [];

    return categories.map((cat, i) => html`
      <tr>
        <td>${cat}</td>
        ${resolved.series.map(s => {
          const point = s.points[i];
          return html`<td>${point?.y ?? ''}</td>`;
        })}
      </tr>
    `);
  }

  private buildAccessibleDescription(): string {
    const resolved = this.resolvedData;
    if (!resolved) return '';

    const seriesDesc = resolved.series.map(s =>
      `${s.name}: ${s.points.map(p => `${p.x}=${p.y}`).join(', ')}`
    ).join('. ');

    return `Chart with ${resolved.series.length} series. ${seriesDesc}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-chart': PhzChart;
  }
}
