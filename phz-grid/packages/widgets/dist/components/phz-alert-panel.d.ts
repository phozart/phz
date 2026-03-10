/**
 * @phozart/phz-widgets -- KPI Alert Notification UI
 *
 * Alert panel and badge components for displaying KPI alert notifications.
 * Types align with engine's kpi-alerting.ts Alert/AlertSeverity/AlertRuleType.
 */
import { LitElement } from 'lit';
import type { AlertRuleType, AlertSeverity } from '@phozart/phz-engine';
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
export declare function severityRank(severity: AlertSeverity): number;
export declare function alertTypeIcon(type: AlertRuleType): string;
export declare function filterAlerts(alerts: AlertNotification[], filter: AlertFilter, now: Date): AlertNotification[];
export declare function computeBadgeCount(alerts: AlertNotification[], now: Date): number;
export interface AlertStore {
    add(alert: AlertNotification): void;
    remove(id: string): void;
    acknowledge(id: string): void;
    snooze(id: string, until: Date): void;
    getAll(): AlertNotification[];
}
export declare function createAlertStore(): AlertStore;
export declare class PhzAlertBadge extends LitElement {
    static styles: import("lit").CSSResult[];
    count: number;
    severity: AlertSeverity;
    render(): import("lit-html").TemplateResult<1>;
}
export declare class PhzAlertPanel extends LitElement {
    static styles: import("lit").CSSResult[];
    alerts: AlertNotification[];
    private severityFilter;
    private kpiFilter;
    private showAcknowledged;
    private get filteredAlerts();
    private get uniqueKpis();
    private handleAcknowledge;
    private handleSnooze;
    private handleView;
    private formatTimestamp;
    private renderAlertCard;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-alert-panel': PhzAlertPanel;
        'phz-alert-badge': PhzAlertBadge;
    }
}
//# sourceMappingURL=phz-alert-panel.d.ts.map