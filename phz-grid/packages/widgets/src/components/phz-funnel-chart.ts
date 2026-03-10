/**
 * @phozart/phz-widgets — Funnel Chart
 *
 * SVG funnel visualization with stage labels, conversion rates,
 * percentages, tooltips, and SR accessibility.
 */

import { LitElement, html, svg, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import { formatTooltipContent, computeTooltipPosition } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

export interface FunnelDatum {
  stage: string;
  value: number;
  color?: string;
}

export interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
  conversionRate: number | null;
  widthPercent: number;
  color: string;
}

export const FUNNEL_PALETTE = [
  '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE',
  '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554',
];

export function computeFunnelStages(
  data: FunnelDatum[],
  palette: string[] = FUNNEL_PALETTE,
): FunnelStage[] {
  if (data.length === 0) return [];
  const maxValue = data[0].value || 1;

  return data.map((d, i) => ({
    stage: d.stage,
    value: d.value,
    percentage: Math.round((d.value / maxValue) * 10000) / 100,
    conversionRate: i === 0 ? null : data[i - 1].value > 0
      ? Math.round((d.value / data[i - 1].value) * 10000) / 100
      : 0,
    widthPercent: Math.max(5, (d.value / maxValue) * 100),
    color: d.color ?? palette[i % palette.length],
  }));
}

export function computeOverallConversion(data: FunnelDatum[]): number {
  if (data.length < 2 || data[0].value === 0) return 0;
  return Math.round((data[data.length - 1].value / data[0].value) * 10000) / 100;
}

export function buildFunnelAccessibleDescription(stages: FunnelStage[]): string {
  return stages.map((s, i) => {
    const conv = s.conversionRate !== null ? `, ${s.conversionRate}% from previous` : '';
    return `Stage ${i + 1} ${s.stage}: ${s.value.toLocaleString()} (${s.percentage}%)${conv}`;
  }).join('; ');
}

const CHART_DIMS = {
  width: 500,
  height: 40, // per stage
  padding: { left: 0, right: 160 }, // space for labels on right
};

@customElement('phz-funnel-chart')
export class PhzFunnelChart extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }
      .funnel-container { position: relative; }
      .funnel-svg { width: 100%; }
      .funnel-stage {
        cursor: pointer;
        transition: opacity 0.15s ease;
      }
      .funnel-stage:hover { opacity: 0.8; }
      .funnel-stage:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }
      .funnel-label { font-size: 12px; fill: #1C1917; font-weight: 500; }
      .funnel-value { font-size: 11px; fill: #78716C; font-variant-numeric: tabular-nums; }
      .funnel-conversion { font-size: 10px; fill: #A8A29E; }
      .funnel-overall {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #F5F5F4;
        font-size: 13px;
        color: #44403C;
      }
      .funnel-overall__rate {
        font-weight: 600;
        color: #3B82F6;
      }
    `,
  ];

  @property({ attribute: false }) data: FunnelDatum[] = [];
  @property({ type: Boolean, attribute: 'show-labels' }) showLabels: boolean = true;
  @property({ type: Boolean, attribute: 'show-percentage' }) showPercentage: boolean = true;
  @property({ type: String }) title: string = '';
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private handleStageClick(stage: FunnelStage, index: number) {
    this.dispatchEvent(new CustomEvent('stage-click', {
      bubbles: true,
      composed: true,
      detail: { stage: stage.stage, value: stage.value, percentage: stage.percentage, index },
    }));
  }

  private handleStageHover(e: MouseEvent, stage: FunnelStage) {
    const container = (e.currentTarget as SVGElement).closest('.funnel-container') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipContent = formatTooltipContent({
      label: stage.stage,
      value: stage.value,
      percentage: stage.percentage,
    });
    const pos = computeTooltipPosition(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      { tooltipWidth: 170, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
    );
    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
    this.tooltipVisible = true;
  }

  private handleStageLeave() {
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

    const stages = computeFunnelStages(this.data);
    const overallConversion = computeOverallConversion(this.data);
    const stageHeight = CHART_DIMS.height;
    const stageGap = 4;
    const totalHeight = stages.length * stageHeight + (stages.length - 1) * stageGap;
    const funnelWidth = CHART_DIMS.width - CHART_DIMS.padding.right;
    const tooltipId = 'funnel-chart-tooltip';
    const chartLabel = this.title || 'Funnel Chart';

    return html`
      <div class="phz-w-card" role="region" aria-label="${chartLabel}" style="position:relative;">
        ${this.title ? html`<h3 class="phz-w-title">${this.title}</h3>` : nothing}
        <div class="funnel-container" style="position:relative;">
          <svg class="funnel-svg" viewBox="0 0 ${CHART_DIMS.width} ${totalHeight}"
               preserveAspectRatio="xMidYMid meet"
               role="img" aria-label="${chartLabel}">
            <desc>${buildFunnelAccessibleDescription(stages)}</desc>

            ${stages.map((stage, i) => {
              const y = i * (stageHeight + stageGap);
              const width = (stage.widthPercent / 100) * funnelWidth;
              const x = (funnelWidth - width) / 2;
              const nextStage = stages[i + 1];

              // Trapezoid: current bar bottom to next bar top
              const trapezoid = nextStage && i < stages.length - 1 ? (() => {
                const nextWidth = (nextStage.widthPercent / 100) * funnelWidth;
                const nextX = (funnelWidth - nextWidth) / 2;
                const nextY = (i + 1) * (stageHeight + stageGap);
                return svg`
                  <polygon points="${x},${y + stageHeight} ${x + width},${y + stageHeight} ${nextX + nextWidth},${nextY} ${nextX},${nextY}"
                           fill="${stage.color}" opacity="0.3" />
                `;
              })() : nothing;

              const labelX = funnelWidth + 8;
              const labelY = y + stageHeight / 2;

              return svg`
                ${trapezoid}
                <rect class="funnel-stage phz-w-clickable"
                  x="${x}" y="${y}" width="${width}" height="${stageHeight}"
                  fill="${stage.color}" rx="4"
                  tabindex="0"
                  role="button"
                  aria-label="${stage.stage}: ${stage.value.toLocaleString()} (${stage.percentage}%)${stage.conversionRate !== null ? `, ${stage.conversionRate}% conversion from previous` : ''}"
                  aria-describedby="${tooltipId}"
                  @click=${() => this.handleStageClick(stage, i)}
                  @mouseenter=${(e: MouseEvent) => this.handleStageHover(e, stage)}
                  @mouseleave=${() => this.handleStageLeave()}
                  @focus=${(e: FocusEvent) => {
                    const el = e.currentTarget as SVGElement;
                    const container = el.closest('.funnel-container') as HTMLElement;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    this.tooltipContent = formatTooltipContent({
                      label: stage.stage,
                      value: stage.value,
                      percentage: stage.percentage,
                    });
                    const pos = computeTooltipPosition(
                      { x: elRect.left - rect.left + elRect.width / 2, y: elRect.top - rect.top },
                      { tooltipWidth: 170, tooltipHeight: 48, viewportWidth: rect.width, viewportHeight: rect.height },
                    );
                    this.tooltipStyle = `top:${pos.top}px;left:${pos.left}px`;
                    this.tooltipVisible = true;
                  }}
                  @blur=${() => this.handleStageLeave()}>
                </rect>
                ${this.showLabels ? svg`
                  <text class="funnel-label" x="${labelX}" y="${labelY - 2}" dominant-baseline="auto">
                    ${stage.stage}
                  </text>
                  <text class="funnel-value" x="${labelX}" y="${labelY + 12}" dominant-baseline="auto">
                    ${stage.value.toLocaleString()}${this.showPercentage ? ` (${stage.percentage}%)` : ''}
                  </text>
                  ${stage.conversionRate !== null ? svg`
                    <text class="funnel-conversion" x="${labelX}" y="${labelY + 24}" dominant-baseline="auto">
                      ${stage.conversionRate}% conv.
                    </text>
                  ` : nothing}
                ` : nothing}
              `;
            })}
          </svg>

          <div id="${tooltipId}"
               class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
               role="tooltip"
               style="${this.tooltipStyle}">${this.tooltipContent}</div>
        </div>

        ${this.data.length >= 2 ? html`
          <div class="funnel-overall">
            <span>Overall conversion:</span>
            <span class="funnel-overall__rate">${overallConversion}%</span>
          </div>
        ` : nothing}

        <table class="phz-w-sr-only">
          <caption>${chartLabel} Data</caption>
          <thead><tr><th>Stage</th><th>Value</th><th>% of Total</th><th>Conversion</th></tr></thead>
          <tbody>
            ${stages.map(s => html`
              <tr>
                <td>${s.stage}</td>
                <td>${s.value.toLocaleString()}</td>
                <td>${s.percentage}%</td>
                <td>${s.conversionRate !== null ? `${s.conversionRate}%` : 'N/A'}</td>
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
    'phz-funnel-chart': PhzFunnelChart;
  }
}
