/**
 * @phozart/phz-grid — Conditional Formatting Engine
 *
 * Evaluates ConditionalFormattingRule against cell values and returns
 * computed styles. Supports color scales, data bars, icon sets, and
 * threshold-based highlighting for targets/anomalies.
 */
import type { ConditionalFormattingRule, CellStyleConfig, FilterOperator, RowData, ColumnDefinition } from '@phozart/phz-core';
export interface ComputedCellStyle {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    icon?: string;
    borderLeft?: string;
}
export interface ConditionalFormattingEngine {
    addRule(rule: ConditionalFormattingRule): void;
    removeRule(id: string): void;
    getRules(): ConditionalFormattingRule[];
    clearRules(): void;
    evaluate(value: unknown, field: string, row: RowData): ComputedCellStyle | null;
    evaluateRow(row: RowData, columns: ColumnDefinition[]): Map<string, ComputedCellStyle>;
}
export declare function createConditionalFormattingEngine(): ConditionalFormattingEngine;
export declare function createColorScaleRule(id: string, field: string, minColor: string, maxColor: string, minVal: number, maxVal: number, priority?: number): ConditionalFormattingRule;
export declare function createThresholdRule(id: string, field: string, operator: FilterOperator, value: unknown, style: CellStyleConfig, priority?: number): ConditionalFormattingRule;
export declare function createHighlightAboveTarget(field: string, target: number, color?: string, bgColor?: string): ConditionalFormattingRule;
export declare function createHighlightBelowTarget(field: string, target: number, color?: string, bgColor?: string): ConditionalFormattingRule;
//# sourceMappingURL=conditional-formatting.d.ts.map