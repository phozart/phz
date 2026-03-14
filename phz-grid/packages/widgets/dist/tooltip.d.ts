/**
 * @phozart/widgets — Tooltip Utilities
 *
 * Pure functions for tooltip content formatting and position calculation.
 * Used by chart widgets to render accessible, positioned tooltips.
 */
export interface TooltipData {
    label: string;
    value: number;
    percentage?: number;
    unit?: 'percent' | 'currency' | 'count' | 'duration';
    secondaryLabel?: string;
    secondaryValue?: number;
}
export interface TooltipPosition {
    top: number;
    left: number;
}
export interface TooltipPositionOptions {
    tooltipWidth: number;
    tooltipHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    offset?: number;
}
export declare function formatTooltipContent(data: TooltipData): string;
export declare function computeTooltipPosition(target: {
    x: number;
    y: number;
}, options: TooltipPositionOptions): TooltipPosition;
//# sourceMappingURL=tooltip.d.ts.map