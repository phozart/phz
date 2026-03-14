/**
 * @phozart/widgets — Query Builder
 *
 * Visual query construction widget for ad-hoc data exploration.
 * Select fields, add filters, choose aggregations, set sort order.
 *
 * Events:
 * - query-execute: { config: QueryConfig, results?: Record<string, unknown>[] }
 */
import { LitElement } from 'lit';
export interface QueryField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    label?: string;
}
export interface QueryFilter {
    field: string;
    operator: string;
    value: string;
}
export interface QueryAggregation {
    field: string;
    fn: 'count' | 'sum' | 'avg' | 'min' | 'max';
}
export interface QuerySort {
    field: string;
    direction: 'asc' | 'desc';
}
export interface QueryConfig {
    selectedFields: string[];
    filters: QueryFilter[];
    aggregations: QueryAggregation[];
    groupBy: string[];
    sorts: QuerySort[];
}
export declare function getOperatorsForType(type: QueryField['type']): string[];
export declare function validateFilter(filter: QueryFilter, fields: QueryField[]): string | null;
export declare function buildQuerySummary(config: QueryConfig, fields: QueryField[]): string;
export declare function applyQueryToData(data: Record<string, unknown>[], config: QueryConfig): Record<string, unknown>[];
export declare class PhzQueryBuilder extends LitElement {
    static styles: import("lit").CSSResult[];
    fields: QueryField[];
    data?: Record<string, unknown>[];
    private selectedFields;
    private filters;
    private aggregations;
    private groupBy;
    private sorts;
    private results;
    private get queryConfig();
    private toggleField;
    private addFilter;
    private updateFilter;
    private removeFilter;
    private addAggregation;
    private updateAggregation;
    private removeAggregation;
    private addSort;
    private updateSort;
    private removeSort;
    private toggleGroupBy;
    private handleExecute;
    private renderFieldPicker;
    private renderConfigPanel;
    private renderFilterRow;
    private renderPreviewPanel;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-query-builder': PhzQueryBuilder;
    }
}
//# sourceMappingURL=phz-query-builder.d.ts.map