/**
 * @phozart/phz-widgets — Status Table
 *
 * Entity list with status indicators per KPI metric.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { KPIDefinition } from '@phozart/phz-engine';
import { computeStatus } from '@phozart/phz-engine';
import { resolveWidgetState } from '../widget-states.js';

@customElement('phz-status-table')
export class PhzStatusTable extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }
      .status-cell { text-align: center; }
      .alert-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        border-radius: 10px;
        background: #DC2626;
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 0 6px;
        margin-left: 4px;
      }
    `,
  ];

  @property({ type: Array }) data: Record<string, unknown>[] = [];
  @property({ type: String }) entityField: string = '';
  @property({ type: Array }) kpiDefinitions: KPIDefinition[] = [];
  @property({ type: Boolean }) showAlertBadges: boolean = true;
  @property({ type: Boolean }) loading: boolean = false;
  @property({ type: String }) error: string | null = null;

  private getAlertCount(row: Record<string, unknown>): number {
    let count = 0;
    for (const kpi of this.kpiDefinitions) {
      const val = row[kpi.id] as number | undefined;
      if (val !== undefined) {
        const status = computeStatus(val, kpi);
        if (status.level === 'crit') count++;
      }
    }
    return count;
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

    return html`
      <div class="phz-w-card" role="region" aria-label="Status Table">
        <table class="phz-w-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Entity</th>
              ${this.kpiDefinitions.map(kpi => html`<th scope="col">${kpi.name}</th>`)}
              ${this.showAlertBadges ? html`<th scope="col">Alerts</th>` : nothing}
            </tr>
          </thead>
          <tbody>
            ${this.data.map(row => {
              const alerts = this.getAlertCount(row);
              return html`
                <tr>
                  <td>${row[this.entityField]}</td>
                  ${this.kpiDefinitions.map(kpi => {
                    const val = row[kpi.id] as number | undefined;
                    if (val === undefined) return html`<td class="status-cell">\u2014</td>`;
                    const status = computeStatus(val, kpi);
                    return html`
                      <td class="status-cell">
                        <span class="phz-w-dot" style="background-color: ${status.color}"></span>
                        ${kpi.unit === 'percent' ? `${val.toFixed(1)}%` : val.toLocaleString()}
                      </td>
                    `;
                  })}
                  ${this.showAlertBadges ? html`
                    <td class="status-cell">
                      ${alerts > 0 ? html`<span class="alert-badge">${alerts}</span>` : html`\u2014`}
                    </td>
                  ` : nothing}
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-status-table': PhzStatusTable;
  }
}
