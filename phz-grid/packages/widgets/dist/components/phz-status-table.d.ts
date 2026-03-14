/**
 * @phozart/widgets — Status Table
 *
 * Entity list with status indicators per KPI metric.
 */
import { LitElement } from 'lit';
import type { KPIDefinition } from '@phozart/engine';
export declare class PhzStatusTable extends LitElement {
    static styles: import("lit").CSSResult[];
    data: Record<string, unknown>[];
    entityField: string;
    kpiDefinitions: KPIDefinition[];
    showAlertBadges: boolean;
    loading: boolean;
    error: string | null;
    private getAlertCount;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-status-table': PhzStatusTable;
    }
}
//# sourceMappingURL=phz-status-table.d.ts.map