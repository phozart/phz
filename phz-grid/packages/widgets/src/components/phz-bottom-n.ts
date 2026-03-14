/**
 * @phozart/widgets — Bottom-N
 *
 * Worst/best performers ranked list with status badges.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { KPIDefinition } from '@phozart/engine';
import { computeStatus, STATUS_COLORS } from '@phozart/engine';
import { resolveWidgetState } from '../widget-states.js';

@customElement('phz-bottom-n')
export class PhzBottomN extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }
      .bottom-n-list { display: flex; flex-direction: column; gap: 4px; }
      .bottom-n-item {
        display: grid;
        grid-template-columns: 24px 1fr auto;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      .bottom-n-item:hover { background: #FAFAF9; }
      .bottom-n-rank {
        font-size: 11px;
        font-weight: 600;
        color: #78716C;
        text-align: center;
      }
      .bottom-n-name { color: #1C1917; }
      .bottom-n-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    `,
  ];

  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: String }) metricField: string = '';
  @property({ type: String }) dimensionField: string = '';
  @property({ type: Number }) n: number = 5;
  @property({ type: String }) direction: 'bottom' | 'top' = 'bottom';
  @property({ type: Object }) kpiDefinition?: KPIDefinition;
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  private get rankedData() {
    const sorted = [...this.data].sort((a, b) => {
      const va = (a[this.metricField] as number) ?? 0;
      const vb = (b[this.metricField] as number) ?? 0;
      return this.direction === 'bottom' ? va - vb : vb - va;
    });
    return sorted.slice(0, this.n);
  }

  private handleItemClick(row: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('drill-through', {
      bubbles: true, composed: true,
      detail: { source: 'bottom-n', entity: row[this.dimensionField], value: row[this.metricField] },
    }));
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

    if (widgetState.state === 'empty') {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No data</p></div>`;
    }

    const items = this.rankedData;
    const title = this.direction === 'bottom' ? `Bottom ${this.n}` : `Top ${this.n}`;

    return html`
      <div class="phz-w-card" role="region" aria-label="${title}">
        <h3 class="phz-w-title">${title}</h3>
        <div class="bottom-n-list" role="list">
          ${items.map((row, idx) => {
            const val = row[this.metricField] as number;
            const status = this.kpiDefinition ? computeStatus(val, this.kpiDefinition) : null;

            return html`
              <div class="bottom-n-item phz-w-clickable" role="listitem" tabindex="0"
                   @click=${() => this.handleItemClick(row)}
                   @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleItemClick(row)}>
                <span class="bottom-n-rank">${idx + 1}</span>
                <span class="bottom-n-name">
                  ${status ? html`<span class="phz-w-dot" style="background-color: ${status.color}"></span>` : nothing}
                  ${row[this.dimensionField]}
                </span>
                <span class="bottom-n-value" style="color: ${status?.color ?? '#1C1917'}">
                  ${typeof val === 'number' ? val.toLocaleString() : val}
                </span>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-bottom-n': PhzBottomN;
  }
}
