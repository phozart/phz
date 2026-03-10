/**
 * @phozart/phz-workspace — Config Schemas
 *
 * Plain TypeScript validation functions for widget config types.
 * No Zod dependency — uses simple runtime checks.
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare const ChartConfigDefaults: {
    readonly showLegend: true;
    readonly showDataLabels: false;
    readonly stacked: false;
    readonly horizontal: false;
    readonly colorPalette: string[];
};
export declare function validateChartConfig(config: Record<string, unknown>): ValidationResult;
export declare const KPIConfigDefaults: {
    readonly showTrend: true;
    readonly showComparison: false;
    readonly format: string;
};
export declare function validateKPIConfig(config: Record<string, unknown>): ValidationResult;
export declare const TableConfigDefaults: {
    readonly sortable: true;
    readonly filterable: false;
    readonly pageSize: 50;
    readonly showRowNumbers: false;
};
export declare function validateTableConfig(config: Record<string, unknown>): ValidationResult;
//# sourceMappingURL=config-schemas.d.ts.map