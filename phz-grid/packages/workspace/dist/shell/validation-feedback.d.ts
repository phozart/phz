/**
 * @phozart/workspace — Validation Feedback (L.14)
 *
 * Pure functions for inline field validation, panel status,
 * cross-reference validation, and config diffing.
 */
export interface ValidationRule {
    field: string;
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    message: string;
    severity?: 'error' | 'warning';
}
export interface FieldValidationResult {
    field: string;
    valid: boolean;
    message?: string;
    severity?: 'error' | 'warning';
}
export type PanelStatus = 'valid' | 'warning' | 'error';
export type FieldStatus = 'valid' | 'warning' | 'error';
export interface ConfigDiff {
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changeType: 'changed' | 'added' | 'removed';
}
export declare function validateFields(data: Record<string, unknown>, rules: ValidationRule[]): FieldValidationResult[];
export declare function getFieldStatus(result: FieldValidationResult): FieldStatus;
export declare function computePanelStatus(results: FieldValidationResult[]): PanelStatus;
export declare function diffConfigs(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): ConfigDiff[];
//# sourceMappingURL=validation-feedback.d.ts.map