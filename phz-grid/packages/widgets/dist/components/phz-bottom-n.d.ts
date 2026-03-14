/**
 * @phozart/widgets — Bottom-N
 *
 * Worst/best performers ranked list with status badges.
 */
import { LitElement } from 'lit';
import type { KPIDefinition } from '@phozart/engine';
export declare class PhzBottomN extends LitElement {
    static styles: import("lit").CSSResult[];
    data: Record<string, unknown>[];
    metricField: string;
    dimensionField: string;
    n: number;
    direction: 'bottom' | 'top';
    kpiDefinition?: KPIDefinition;
    loading: boolean;
    error: string | null;
    private get rankedData();
    private handleItemClick;
    private handleRetry;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-bottom-n': PhzBottomN;
    }
}
//# sourceMappingURL=phz-bottom-n.d.ts.map