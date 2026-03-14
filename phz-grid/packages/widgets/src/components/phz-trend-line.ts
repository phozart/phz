/**
 * @phozart/widgets — Trend Line
 *
 * SVG line chart with optional target reference line and status zones.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { ChartDataSeries, KPIDefinition } from '@phozart/engine';
import { STATUS_COLORS } from '@phozart/engine';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

@customElement('phz-trend-line')
export class PhzTrendLine extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
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
  ];

  @property({ type: Object }) data?: ChartDataSeries;
  @property({ type: Number }) target?: number;
  @property({ type: Number }) periods: number = 12;
  @property({ type: Object }) kpiDefinition?: KPIDefinition;

  /** Line color. Falls back to default blue (#3B82F6). */
  @property({ type: String }) lineColor: string = '';

  /** Target line color. Falls back to default gray (#78716C). */
  @property({ type: String }) targetColor: string = '';

  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private get chartPoints(): { x: number; y: number; label: string; value: number }[] {
    if (!this.data) return [];
    const items = this.data.data.slice(-this.periods);
    if (items.length === 0) return [];

    const values = items.map((d: { x: string | number; y: number; label?: string }) => d.y);
    const maxVal = values.reduce((m, v) => v > m ? v : m, this.target ?? 0);
    const minVal = values.reduce((m, v) => v < m ? v : m, this.target ?? Infinity);
    const range = maxVal - minVal || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 10 };
    const chartW = 400 - padding.left - padding.right;
    const chartH = 160 - padding.top - padding.bottom;

    return items.map((d: { x: string | number; y: number; label?: string }, i: number) => ({
      x: padding.left + (i / Math.max(items.length - 1, 1)) * chartW,
      y: padding.top + chartH - ((d.y - minVal) / range) * chartH,
      label: String(d.label ?? d.x),
      value: d.y,
    }));
  }

  private handlePointClick(point: { label: string; value: number }) {
    this.dispatchEvent(new CustomEvent('drill-through', {
      bubbles: true, composed: true,
      detail: { source: 'trend-line', xValue: point.label, value: point.value },
    }));
  }

  private handlePointHover(e: MouseEvent, point: { label: string; value: number }) {
    const container = (e.currentTarget as SVGElement).closest('.trend-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipContent = formatTooltipContent({
      label: point.label,
      value: point.value,
      unit: this.kpiDefinition?.unit as 'percent' | 'currency' | undefined,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
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

    const points = this.chartPoints;
    if (points.length === 0) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No trend data</p></div>`;
    }

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const targetY = this.target !== undefined ? (() => {
      const values = this.data!.data.slice(-this.periods).map((d: { x: string | number; y: number; label?: string }) => d.y);
      const maxVal = values.reduce((m, v) => v > m ? v : m, this.target!);
      const minVal = values.reduce((m, v) => v < m ? v : m, this.target!);
      const range = maxVal - minVal || 1;
      return 20 + (160 - 20 - 30) - ((this.target! - minVal) / range) * (160 - 20 - 30);
    })() : null;

    // Show every nth label to avoid overlap
    const labelStep = Math.max(1, Math.floor(points.length / 6));

    const tooltipId = 'trend-tooltip';

    return html`
      <div class="phz-w-card" role="region" aria-label="${this.data?.label ?? 'Trend'}" style="position:relative;">
        <h3 class="phz-w-title">${this.data?.label ?? 'Trend'}</h3>
        <div class="trend-container" style="position:relative;">
          <svg class="trend-svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet">
            <!-- Target line -->
            ${targetY !== null ? svg`
              <line x1="10" y1="${targetY}" x2="380" y2="${targetY}"
                    stroke="${this.targetColor || '#78716C'}" stroke-dasharray="4 3" stroke-width="1" />
              <text x="382" y="${targetY + 3}" class="trend-target-label">Target</text>
            ` : nothing}

            <!-- Line -->
            <path d="${pathD}" fill="none" stroke="${this.lineColor || '#3B82F6'}" stroke-width="2" />

            <!-- Points -->
            ${points.map(p => svg`
              <circle cx="${p.x}" cy="${p.y}" r="4"
                      fill="${this.lineColor || '#3B82F6'}" stroke="#fff" stroke-width="1.5"
                      class="phz-w-clickable"
                      @click=${() => this.handlePointClick(p)}
                      @mouseenter=${(e: MouseEvent) => this.handlePointHover(e, p)}
                      @mouseleave=${() => this.handlePointLeave()}
                      @focus=${(e: FocusEvent) => {
                        const circle = e.currentTarget as SVGElement;
                        const container = circle.closest('.trend-container') as HTMLElement;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        this.tooltipContent = formatTooltipContent({
                          label: p.label,
                          value: p.value,
                          unit: this.kpiDefinition?.unit as 'percent' | 'currency' | undefined,
                        });
                        const svgRect = circle.getBoundingClientRect();
                        const pos = computeTooltipPosition(
                          { x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top },
                          { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
                        );
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
            ${points.filter((_, i) => i % labelStep === 0).map(p => svg`
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
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-trend-line': PhzTrendLine;
  }
}
