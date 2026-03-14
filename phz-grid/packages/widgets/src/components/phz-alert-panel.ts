/**
 * @phozart/widgets -- KPI Alert Notification UI
 *
 * Alert panel and badge components for displaying KPI alert notifications.
 * Types align with engine's kpi-alerting.ts Alert/AlertSeverity/AlertRuleType.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { AlertRuleType, AlertSeverity } from '@phozart/engine';

// -- Types --

export interface AlertNotification {
  id: string;
  ruleId: string;
  kpiId: string;
  type: AlertRuleType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  currentValue: number;
  acknowledged: boolean;
  snoozedUntil?: Date;
}

export interface AlertFilter {
  severity?: AlertSeverity;
  kpiId?: string;
  showAcknowledged?: boolean;
}

// -- Pure logic (testable without DOM) --

export function severityRank(severity: AlertSeverity): number {
  return severity === 'critical' ? 2 : 1;
}

export function alertTypeIcon(type: AlertRuleType): string {
  const icons: Record<AlertRuleType, string> = {
    threshold_breach: 'threshold',
    anomaly_detected: 'anomaly',
    trend_reversal: 'trend',
    consecutive_decline: 'decline',
  };
  return icons[type];
}

export function filterAlerts(
  alerts: AlertNotification[],
  filter: AlertFilter,
  now: Date,
): AlertNotification[] {
  return alerts.filter(alert => {
    if (filter.severity && alert.severity !== filter.severity) return false;
    if (filter.kpiId && alert.kpiId !== filter.kpiId) return false;
    if (filter.showAcknowledged === false && alert.acknowledged) return false;
    if (alert.snoozedUntil && alert.snoozedUntil > now) return false;
    return true;
  });
}

export function computeBadgeCount(alerts: AlertNotification[], now: Date): number {
  return alerts.filter(a => !a.acknowledged && (!a.snoozedUntil || a.snoozedUntil <= now)).length;
}

export interface AlertStore {
  add(alert: AlertNotification): void;
  remove(id: string): void;
  acknowledge(id: string): void;
  snooze(id: string, until: Date): void;
  getAll(): AlertNotification[];
}

export function createAlertStore(): AlertStore {
  const alerts = new Map<string, AlertNotification>();

  return {
    add(alert: AlertNotification): void {
      alerts.set(alert.id, alert);
    },

    remove(id: string): void {
      alerts.delete(id);
    },

    acknowledge(id: string): void {
      const alert = alerts.get(id);
      if (alert) {
        alerts.set(id, { ...alert, acknowledged: true });
      }
    },

    snooze(id: string, until: Date): void {
      const alert = alerts.get(id);
      if (alert) {
        alerts.set(id, { ...alert, snoozedUntil: until });
      }
    },

    getAll(): AlertNotification[] {
      return Array.from(alerts.values());
    },
  };
}

// -- Components --

@customElement('phz-alert-badge')
export class PhzAlertBadge extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: inline-flex; }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
        color: #FFFFFF;
      }

      .badge--warning { background: #D97706; }
      .badge--critical { background: #DC2626; }
      .badge--zero { background: #A8A29E; }

      @media (forced-colors: active) {
        .badge {
          border: 2px solid ButtonText;
          forced-color-adjust: none;
        }
      }
    `,
  ];

  @property({ type: Number }) count: number = 0;
  @property({ type: String }) severity: AlertSeverity = 'warning';

  render() {
    const cls = this.count === 0 ? 'badge--zero' : `badge--${this.severity}`;
    const label = this.count === 0
      ? 'No active alerts'
      : `${this.count} ${this.severity} alert${this.count !== 1 ? 's' : ''}`;

    return html`
      <span class="badge ${cls}" role="status" aria-label="${label}">
        ${this.count}
      </span>
    `;
  }
}

@customElement('phz-alert-panel')
export class PhzAlertPanel extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host { display: block; }

      .panel { max-height: 400px; overflow-y: auto; }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .filter-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .filter-bar select, .filter-bar button {
        padding: 4px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 6px;
        font-size: 12px;
        background: white;
        cursor: pointer;
      }

      .filter-bar select:focus-visible, .filter-bar button:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .filter-bar button[aria-pressed="true"] {
        background: #F5F5F4;
        border-color: #A8A29E;
      }

      .alert-card {
        display: flex;
        gap: 12px;
        padding: 12px;
        border: 1px solid #E7E5E4;
        border-radius: 8px;
        margin-bottom: 8px;
        align-items: flex-start;
      }

      .alert-card--critical { border-left: 3px solid #DC2626; }
      .alert-card--warning { border-left: 3px solid #D97706; }
      .alert-card--acknowledged { opacity: 0.6; }

      .alert-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .alert-body { flex: 1; min-width: 0; }
      .alert-kpi { font-size: 11px; color: #78716C; text-transform: uppercase; letter-spacing: 0.05em; }
      .alert-message { font-size: 13px; margin: 4px 0; color: #1C1917; }
      .alert-time { font-size: 11px; color: #A8A29E; }

      .alert-actions {
        display: flex;
        gap: 4px;
        margin-top: 6px;
      }

      .alert-actions button {
        padding: 2px 8px;
        border: 1px solid #D6D3D1;
        border-radius: 4px;
        font-size: 11px;
        background: white;
        cursor: pointer;
      }

      .alert-actions button:hover { background: #FAFAF9; }

      .alert-actions button:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      .empty-state {
        text-align: center;
        padding: 24px;
        color: #78716C;
        font-size: 13px;
      }

      @media (forced-colors: active) {
        .alert-card {
          border: 2px solid ButtonText;
          forced-color-adjust: none;
        }
      }
    `,
  ];

  @property({ type: Array }) alerts: AlertNotification[] = [];
  @state() private severityFilter: AlertSeverity | '' = '';
  @state() private kpiFilter: string = '';
  @state() private showAcknowledged: boolean = true;

  private get filteredAlerts(): AlertNotification[] {
    const filter: AlertFilter = {};
    if (this.severityFilter) filter.severity = this.severityFilter;
    if (this.kpiFilter) filter.kpiId = this.kpiFilter;
    filter.showAcknowledged = this.showAcknowledged;
    return filterAlerts(this.alerts, filter, new Date())
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  }

  private get uniqueKpis(): string[] {
    return [...new Set(this.alerts.map(a => a.kpiId))];
  }

  private handleAcknowledge(alertId: string) {
    this.dispatchEvent(new CustomEvent('alert-acknowledge', { detail: { alertId }, bubbles: true, composed: true }));
  }

  private handleSnooze(alertId: string) {
    this.dispatchEvent(new CustomEvent('alert-snooze', { detail: { alertId }, bubbles: true, composed: true }));
  }

  private handleView(alertId: string, kpiId: string) {
    this.dispatchEvent(new CustomEvent('alert-view', { detail: { alertId, kpiId }, bubbles: true, composed: true }));
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleString();
  }

  private renderAlertCard(alert: AlertNotification) {
    const ackClass = alert.acknowledged ? 'alert-card--acknowledged' : '';
    return html`
      <div class="alert-card alert-card--${alert.severity} ${ackClass}"
           role="article"
           aria-label="${alert.message}">
        <div class="alert-icon" aria-hidden="true">${alertTypeIcon(alert.type)}</div>
        <div class="alert-body">
          <div class="alert-kpi">${alert.kpiId}</div>
          <div class="alert-message">${alert.message}</div>
          <div class="alert-time">${this.formatTimestamp(alert.timestamp)}</div>
          <div class="alert-actions">
            ${!alert.acknowledged ? html`
              <button @click=${() => this.handleAcknowledge(alert.id)}
                      aria-label="Acknowledge alert: ${alert.message}">Acknowledge</button>
            ` : nothing}
            <button @click=${() => this.handleSnooze(alert.id)}
                    aria-label="Snooze alert: ${alert.message}">Snooze</button>
            <button @click=${() => this.handleView(alert.id, alert.kpiId)}
                    aria-label="View KPI: ${alert.kpiId}">View KPI</button>
          </div>
        </div>
        <span class="phz-w-badge phz-w-badge--${alert.severity === 'critical' ? 'crit' : 'warn'}">
          ${alert.severity}
        </span>
      </div>
    `;
  }

  render() {
    const filtered = this.filteredAlerts;
    const badgeCount = computeBadgeCount(this.alerts, new Date());

    return html`
      <div class="phz-w-card" role="region" aria-label="KPI Alerts" aria-live="polite">
        <div class="panel-header">
          <h3 class="phz-w-title">Alerts</h3>
          <phz-alert-badge
            .count=${badgeCount}
            .severity=${this.alerts.some(a => a.severity === 'critical' && !a.acknowledged) ? 'critical' : 'warning'}>
          </phz-alert-badge>
        </div>

        <div class="filter-bar" role="toolbar" aria-label="Alert filters">
          <select aria-label="Filter by severity"
                  @change=${(e: Event) => { this.severityFilter = (e.target as HTMLSelectElement).value as AlertSeverity | ''; }}>
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>

          <select aria-label="Filter by KPI"
                  @change=${(e: Event) => { this.kpiFilter = (e.target as HTMLSelectElement).value; }}>
            <option value="">All KPIs</option>
            ${this.uniqueKpis.map(k => html`<option value="${k}">${k}</option>`)}
          </select>

          <button aria-pressed="${this.showAcknowledged}"
                  @click=${() => { this.showAcknowledged = !this.showAcknowledged; }}>
            ${this.showAcknowledged ? 'Hide' : 'Show'} acknowledged
          </button>
        </div>

        <div class="panel">
          ${filtered.length === 0
            ? html`<div class="empty-state">No alerts match the current filters</div>`
            : filtered.map(a => this.renderAlertCard(a))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-alert-panel': PhzAlertPanel;
    'phz-alert-badge': PhzAlertBadge;
  }
}
