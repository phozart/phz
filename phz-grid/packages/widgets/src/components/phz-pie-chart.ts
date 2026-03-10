/**
 * @phozart/phz-widgets — Pie / Donut Chart
 *
 * SVG-based pie and donut chart with legend, tooltips, and keyboard navigation.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

export interface PieChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface ComputedSlice {
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

const DEFAULT_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  // Handle full circle — SVG arc can't draw a complete 360
  if (endAngle - startAngle >= 359.99) {
    const mid = startAngle + 180;
    const s1 = polarToCartesian(cx, cy, r, startAngle);
    const m = polarToCartesian(cx, cy, r, mid);
    return [
      `M ${cx} ${cy}`,
      `L ${s1.x} ${s1.y}`,
      `A ${r} ${r} 0 1 1 ${m.x} ${m.y}`,
      `A ${r} ${r} 0 1 1 ${s1.x} ${s1.y}`,
      'Z',
    ].join(' ');
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function describeDonutArc(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
): string {
  // Handle full circle
  if (endAngle - startAngle >= 359.99) {
    const s1o = polarToCartesian(cx, cy, outerR, startAngle);
    const mo = polarToCartesian(cx, cy, outerR, startAngle + 180);
    const s1i = polarToCartesian(cx, cy, innerR, startAngle);
    const mi = polarToCartesian(cx, cy, innerR, startAngle + 180);
    return [
      `M ${s1o.x} ${s1o.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${mo.x} ${mo.y}`,
      `A ${outerR} ${outerR} 0 1 1 ${s1o.x} ${s1o.y}`,
      `L ${s1i.x} ${s1i.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${mi.x} ${mi.y}`,
      `A ${innerR} ${innerR} 0 1 0 ${s1i.x} ${s1i.y}`,
      'Z',
    ].join(' ');
  }
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

@customElement('phz-pie-chart')
export class PhzPieChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }

      .pie-container { position: relative; display: flex; align-items: flex-start; gap: 16px; }

      .pie-svg { flex-shrink: 0; }

      .pie-slice {
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .pie-slice:hover { opacity: 0.8; }
      .pie-slice:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

      .pie-legend {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
      }

      .pie-legend__item {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
      .pie-legend__item:hover { opacity: 0.8; }

      .pie-legend__swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .pie-legend__label {
        color: var(--phz-w-text-secondary, #44403C);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pie-legend__value {
        color: var(--phz-w-text-muted, #78716C);
        margin-left: auto;
        font-variant-numeric: tabular-nums;
      }

      .pie-svg {
        width: 100%;
        height: auto;
      }

      @container (max-width: 400px) {
        .pie-container {
          flex-direction: column;
          align-items: center;
        }
        .pie-legend {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
        }
      }
    `,
  ];

  @property({ attribute: false }) data: PieChartDatum[] = [];
  @property({ type: Boolean }) donut: boolean = false;
  @property({ type: Boolean, attribute: 'show-legend' }) showLegend: boolean = true;
  @property({ type: Boolean, attribute: 'show-labels' }) showLabels: boolean = false;
  @property({ type: String }) title: string = '';
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';
  @state() private focusedIndex: number = -1;

  private get computedSlices(): ComputedSlice[] {
    const total = this.data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return [];
    let currentAngle = 0;
    return this.data.map((d, i) => {
      const percentage = Math.round((d.value / total) * 10000) / 100;
      const sliceAngle = (d.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      return {
        label: d.label,
        value: d.value,
        percentage,
        startAngle,
        endAngle,
        color: d.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      };
    });
  }

  private handleSliceClick(slice: ComputedSlice) {
    this.dispatchEvent(new CustomEvent('slice-click', {
      bubbles: true,
      composed: true,
      detail: { label: slice.label, value: slice.value, percentage: slice.percentage },
    }));
  }

  private handleSliceHover(e: MouseEvent, slice: ComputedSlice) {
    const container = (e.currentTarget as SVGElement).closest('.pie-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipContent = formatTooltipContent({
      label: slice.label,
      value: slice.value,
      percentage: slice.percentage,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
    );
    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handleSliceLeave() {
    this.tooltipVisible = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const slices = this.computedSlices;
    if (slices.length === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % slices.length;
      this.focusSlice();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + slices.length) % slices.length;
      this.focusSlice();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < slices.length) {
        this.handleSliceClick(slices[this.focusedIndex]);
      }
    }
  }

  private focusSlice() {
    const paths = this.shadowRoot?.querySelectorAll('.pie-slice');
    if (paths && this.focusedIndex >= 0) {
      (paths[this.focusedIndex] as HTMLElement)?.focus();
    }
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

    const slices = this.computedSlices;
    if (slices.length === 0) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
    }

    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 80;
    const innerR = this.donut ? 50 : 0;
    const tooltipId = 'pie-chart-tooltip';

    return html`
      <div class="phz-w-card" role="region" aria-label="${this.title || 'Pie Chart'}" style="position:relative;">
        ${this.title ? html`<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="pie-container" style="position:relative;">
          <svg class="pie-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
               role="img" aria-label="${this.title || 'Pie Chart'}: ${slices.map(s => `${s.label} ${s.percentage}%`).join(', ')}">
            ${slices.map((slice, i) => {
              const path = this.donut
                ? describeDonutArc(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle)
                : describeArc(cx, cy, outerR, slice.startAngle, slice.endAngle);

              // Label position at midpoint of arc, outside the slice
              const midAngle = (slice.startAngle + slice.endAngle) / 2;
              const labelR = outerR + 16;
              const labelPos = polarToCartesian(cx, cy, labelR, midAngle);

              return svg`
                <path class="pie-slice phz-w-clickable"
                      d="${path}"
                      fill="${slice.color}"
                      tabindex="0"
                      role="button"
                      aria-label="${slice.label}: ${slice.value.toLocaleString()} (${slice.percentage}%)"
                      aria-describedby="${tooltipId}"
                      @click=${() => this.handleSliceClick(slice)}
                      @mouseenter=${(e: MouseEvent) => this.handleSliceHover(e, slice)}
                      @mouseleave=${() => this.handleSliceLeave()}
                      @focus=${(e: FocusEvent) => {
                        this.focusedIndex = i;
                        const el = e.currentTarget as SVGElement;
                        const container = el.closest('.pie-container') as HTMLElement;
                        if (!container) return;
                        const rect = container.getBoundingClientRect();
                        const svgRect = el.getBoundingClientRect();
                        this.tooltipContent = formatTooltipContent({
                          label: slice.label,
                          value: slice.value,
                          percentage: slice.percentage,
                        });
                        const pos = computeTooltipPosition(
                          { x: svgRect.left - rect.left + svgRect.width / 2, y: svgRect.top - rect.top },
                          { tooltipWidth: 150, tooltipHeight: 40, viewportWidth: rect.width, viewportHeight: rect.height },
                        );
                        this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                        this.tooltipVisible = true;
                      }}
                      @blur=${() => this.handleSliceLeave()}
                      @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e)}>
                </path>
                ${this.showLabels && slice.percentage >= 5 ? svg`
                  <text x="${labelPos.x}" y="${labelPos.y}"
                        text-anchor="middle" dominant-baseline="central"
                        font-size="11" fill="currentColor"
                        pointer-events="none">
                    ${slice.percentage}%
                  </text>
                ` : nothing}
              `;
            })}
          </svg>

          ${this.showLegend ? html`
            <ul class="pie-legend" role="list" aria-label="Chart legend">
              ${slices.map(slice => html`
                <li class="pie-legend__item" role="listitem"
                    @click=${() => this.handleSliceClick(slice)}>
                  <span class="pie-legend__swatch" style="background:${slice.color}"></span>
                  <span class="pie-legend__label">${slice.label}</span>
                  <span class="pie-legend__value">${slice.percentage}%</span>
                </li>
              `)}
            </ul>
          ` : nothing}

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
    'phz-pie-chart': PhzPieChart;
  }
}
