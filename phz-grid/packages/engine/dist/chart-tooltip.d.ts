/**
 * @phozart/engine — Chart Tooltip Configuration
 *
 * Types and pure functions for tooltip customization on chart widgets.
 * Supports auto-resolution from chart encoding channels and manual
 * custom field configuration with conditional visibility.
 */
import type { KPIDefinition } from './kpi.js';
/** Minimal encoding shape consumed by tooltip resolution (avoids circular dep on workspace). */
export interface ChartEncodingInput {
    category?: string;
    value: string[];
    color?: string;
    size?: string;
    detail?: string;
    tooltip?: string[];
}
export interface ChartTooltipConfig {
    mode: 'auto' | 'custom';
    autoConfig?: AutoTooltipConfig;
    customFields?: TooltipField[];
}
export interface AutoTooltipConfig {
    showCategory: boolean;
    showValue: boolean;
    showPercentage: boolean;
    showDelta: boolean;
    deltaMode?: 'absolute' | 'percentage' | 'both';
}
export interface TooltipField {
    field: string;
    label?: string;
    format?: string;
    showIf?: TooltipCondition;
    order: number;
}
export interface TooltipCondition {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    value: unknown;
}
export interface TooltipDeltaResult {
    absolute: number | null;
    percentage: number | null;
    formatted: string;
}
/**
 * Auto-assembles tooltip fields from chart encoding channels.
 * Display order: category → values → color → detail.
 * If a KPIDefinition with an active delta comparison is provided,
 * appends a synthetic `_delta` field.
 */
export declare function resolveAutoTooltip(encoding: ChartEncodingInput, kpiDef?: KPIDefinition): TooltipField[];
/**
 * Evaluates a conditional visibility rule against a data row.
 * Returns false when:
 *  - the field is missing from rowData
 *  - types are incompatible for ordered comparisons (gt/lt/gte/lte)
 */
export declare function evaluateTooltipCondition(condition: TooltipCondition, rowData: Record<string, unknown>): boolean;
/**
 * Computes the delta between a current and comparison value.
 * Handles division by zero: when comparisonValue is 0, percentage
 * is null and formatted shows 'N/A' for the percentage part.
 */
export declare function computeTooltipDelta(currentValue: number, comparisonValue: number, deltaMode: 'absolute' | 'percentage' | 'both'): TooltipDeltaResult;
//# sourceMappingURL=chart-tooltip.d.ts.map