/**
 * @phozart/phz-widgets — KPI Scorecard
 *
 * Matrix: KPIs (rows) x breakdowns (columns) with status cells.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { KPIDefinition, KPIScoreResponse, ClassifiedScore, ClassifiedBreakdown, StatusResult } from '@phozart/phz-engine';
import { classifyKPIScore, STATUS_COLORS } from '@phozart/phz-engine';
import { formatTooltipContent } from '../tooltip.js';
import { resolveWidgetState } from '../widget-states.js';

@customElement('phz-kpi-scorecard')
export class PhzKPIScorecard extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; container-type: inline-size; }

      .scorecard { overflow-x: auto; }

      .scorecard-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .scorecard-table th {
        text-align: center;
        padding: 8px 12px;
        font-weight: 600;
        color: #44403C;
        border-bottom: 2px solid #E7E5E4;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .scorecard-table th:first-child {
        text-align: left;
      }

      .scorecard-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #F5F5F4;
        text-align: center;
      }

      .scorecard-table td:first-child {
        text-align: left;
        font-weight: 500;
      }

      .scorecard-table tr:hover td {
        background: #FAFAF9;
      }

      .scorecard-cell {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .scorecard-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .scorecard-value {
        font-variant-numeric: tabular-nums;
      }

      .scorecard-kpi-name {
        cursor: pointer;
      }

      .scorecard-kpi-name:hover {
        color: #3B82F6;
      }

      .scorecard-summary {
        display: flex;
        gap: 12px;
        padding: 8px 12px;
        font-size: 12px;
        color: #78716C;
        border-top: 2px solid #E7E5E4;
      }

      .scorecard-expand {
        padding: 12px;
        border-top: 1px solid #E7E5E4;
        background: #FAFAF9;
      }

      .expand-icon {
        display: inline-block;
        width: 12px;
        transition: transform 0.15s ease;
        margin-right: 4px;
      }

      .expand-icon--open {
        transform: rotate(90deg);
      }

      @container (max-width: 575px) {
        .scorecard-table th,
        .scorecard-table td {
          padding: 6px 8px;
          font-size: 12px;
        }
      }
    `,
  ];

  @property({ type: Array }) kpiDefinitions: KPIDefinition[] = [];
  @property({ type: Array }) scores: KPIScoreResponse[] = [];
  @property({ type: Boolean }) expandable: boolean = false;
  @property({ type: Array }) expandedWidgets?: string[];
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  @state() private expandedKPIs: Set<string> = new Set();
  @state() private tooltipContent: string = '';
  @state() private tooltipVisible: boolean = false;
  @state() private tooltipStyle: string = '';

  private get classifiedScores(): Map<string, ClassifiedScore> {
    const map = new Map<string, ClassifiedScore>();
    for (const score of this.scores) {
      const kpi = this.kpiDefinitions.find(k => k.id === score.kpiId);
      if (kpi) {
        map.set(score.kpiId, classifyKPIScore(score, kpi));
      }
    }
    return map;
  }

  private get breakdownLabels(): string[] {
    // Collect all unique breakdown IDs across KPIs
    const labels: string[] = [];
    for (const kpi of this.kpiDefinitions) {
      if (kpi.breakdowns) {
        for (const b of kpi.breakdowns) {
          if (!labels.includes(b.label)) labels.push(b.label);
        }
      }
    }
    return labels;
  }

  private get statusSummary(): Record<string, number> {
    const counts = { ok: 0, warn: 0, crit: 0, unknown: 0 };
    for (const classified of this.classifiedScores.values()) {
      counts[classified.status.level as keyof typeof counts]++;
    }
    return counts;
  }

  private toggleExpand(kpiId: string) {
    const newSet = new Set(this.expandedKPIs);
    if (newSet.has(kpiId)) {
      newSet.delete(kpiId);
    } else {
      newSet.add(kpiId);
    }
    this.expandedKPIs = newSet;
  }

  private renderStatusCell(status: StatusResult, value: number, kpi: KPIDefinition) {
    const formatted = kpi.unit === 'percent' ? `${value.toFixed(1)}%` : value.toLocaleString();
    const tooltipText = formatTooltipContent({
      label: kpi.name,
      value,
      unit: kpi.unit as 'percent' | 'currency' | undefined,
    });
    return html`
      <span class="scorecard-cell"
            title="${tooltipText}"
            @mouseenter=${(e: MouseEvent) => {
              const cell = e.currentTarget as HTMLElement;
              const card = cell.closest('.phz-w-card') as HTMLElement;
              if (!card) return;
              const cardRect = card.getBoundingClientRect();
              const cellRect = cell.getBoundingClientRect();
              this.tooltipContent = tooltipText;
              this.tooltipStyle = `top:${cellRect.top - cardRect.top - 44}px;left:${cellRect.left - cardRect.left + cellRect.width / 2 - 75}px`;
              this.tooltipVisible = true;
            }}
            @mouseleave=${() => { this.tooltipVisible = false; }}>
        <span class="scorecard-dot" style="background-color: ${status.color}"></span>
        <span class="scorecard-value">${formatted}</span>
      </span>
    `;
  }

  private handleRetry() {
    this.dispatchEvent(new CustomEvent('widget-retry', { bubbles: true, composed: true }));
  }

  render() {
    const widgetState = resolveWidgetState({
      loading: this.loading,
      error: this.error,
      data: this.kpiDefinitions.length > 0 ? this.kpiDefinitions : null,
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

    if (widgetState.state === 'empty') {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No KPI data</p></div>`;
    }

    const classified = this.classifiedScores;
    const breakdowns = this.breakdownLabels;
    const summary = this.statusSummary;
    const tooltipId = 'scorecard-tooltip';

    return html`
      <div class="phz-w-card scorecard" role="region" aria-label="KPI Scorecard" style="position:relative;">
        <table class="scorecard-table" role="grid">
          <thead>
            <tr>
              <th scope="col">KPI</th>
              <th scope="col">Overall</th>
              ${breakdowns.map(b => html`<th scope="col">${b}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${this.kpiDefinitions.map(kpi => {
              const cs = classified.get(kpi.id);
              if (!cs) return nothing;

              return html`
                <tr>
                  <td>
                    <span class="scorecard-kpi-name ${this.expandable ? 'phz-w-clickable' : ''}"
                          @click=${this.expandable ? () => this.toggleExpand(kpi.id) : nothing}
                          role="${this.expandable ? 'button' : 'text'}"
                          tabindex="${this.expandable ? '0' : '-1'}">
                      ${this.expandable ? html`
                        <span class="expand-icon ${this.expandedKPIs.has(kpi.id) ? 'expand-icon--open' : ''}">&#9654;</span>
                      ` : nothing}
                      ${kpi.name}
                    </span>
                  </td>
                  <td>${this.renderStatusCell(cs.status, cs.value, kpi)}</td>
                  ${breakdowns.map(bLabel => {
                    const breakdown = cs.breakdowns?.find((b: ClassifiedBreakdown) => {
                      const kpiBreakdown = kpi.breakdowns?.find((kb: { id: string; label: string }) => kb.id === b.breakdownId);
                      return kpiBreakdown?.label === bLabel;
                    });
                    if (!breakdown) return html`<td>—</td>`;
                    return html`<td>${this.renderStatusCell(breakdown.status, breakdown.value, kpi)}</td>`;
                  })}
                </tr>
                ${this.expandable && this.expandedKPIs.has(kpi.id)
                  ? html`
                    <tr>
                      <td colspan="${2 + breakdowns.length}">
                        <div class="scorecard-expand">
                          <slot name="expand-${kpi.id}">
                            <p class="phz-w-label">Expanded view for ${kpi.name}</p>
                          </slot>
                        </div>
                      </td>
                    </tr>
                  `
                  : nothing}
              `;
            })}
          </tbody>
        </table>

        <div class="scorecard-summary">
          <span class="phz-w-status--ok">${summary.ok} on track</span>
          <span class="phz-w-status--warn">${summary.warn} at risk</span>
          <span class="phz-w-status--crit">${summary.crit} critical</span>
        </div>
        <div id="${tooltipId}"
             class="phz-w-tooltip ${this.tooltipVisible ? 'phz-w-tooltip--visible' : ''}"
             role="tooltip"
             style="${this.tooltipStyle}">${this.tooltipContent}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-kpi-scorecard': PhzKPIScorecard;
  }
}
