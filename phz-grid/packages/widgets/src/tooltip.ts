/**
 * @phozart/phz-widgets — Tooltip Utilities
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

function formatNumber(value: number, unit?: string): string {
  switch (unit) {
    case 'percent':
      return `${value}%`;
    case 'currency':
      return `$${value.toLocaleString()}`;
    default:
      return value.toLocaleString();
  }
}

export function formatTooltipContent(data: TooltipData): string {
  const formatted = formatNumber(data.value, data.unit);
  let result = `${data.label}: ${formatted}`;

  if (data.percentage !== undefined) {
    result += ` (${data.percentage}%)`;
  }

  if (data.secondaryLabel !== undefined && data.secondaryValue !== undefined) {
    const secondaryFormatted = formatNumber(data.secondaryValue, data.unit);
    result += `\n${data.secondaryLabel}: ${secondaryFormatted}`;
  }

  return result;
}

export function computeTooltipPosition(
  target: { x: number; y: number },
  options: TooltipPositionOptions,
): TooltipPosition {
  const { tooltipWidth, tooltipHeight, viewportWidth, viewportHeight, offset = 8 } = options;

  // Center horizontally on target
  let left = target.x - tooltipWidth / 2;

  // Default: position above target
  let top = target.y - tooltipHeight - offset;

  // Flip below if near top edge
  if (top < 0) {
    top = target.y + offset;
  }

  // Clamp horizontal to viewport
  if (left < 0) {
    left = 0;
  } else if (left + tooltipWidth > viewportWidth) {
    left = viewportWidth - tooltipWidth;
  }

  return { top, left };
}
