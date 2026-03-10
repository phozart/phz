/**
 * @phozart/phz-grid — Micro-Widget Cell Resolver (7A-B)
 *
 * State machine for resolving micro-widget cell rendering.
 * Checks column width, registry availability, and falls back
 * to plain text when rendering is not possible.
 *
 * Pure functions only — no DOM, no Lit, no side effects.
 */
// ========================================================================
// Column-width thresholds (mirrors widget renderers)
// ========================================================================
/** Minimum column width for any micro-widget rendering. */
const MIN_COLUMN_WIDTH = 60;
// ========================================================================
// resolveCellRenderer
// ========================================================================
/**
 * Attempt to resolve and invoke a micro-widget renderer for a cell.
 *
 * Returns the render result if:
 * 1. The registry has a renderer for the config's displayMode
 * 2. The renderer's canRender() returns true for the column width
 *
 * Returns null otherwise (caller should fall back to text).
 *
 * @param config - The micro-widget cell configuration.
 * @param value - The cell's current value.
 * @param columnWidth - The column width in pixels.
 * @param rowHeight - The row height in pixels.
 * @param registry - The cell renderer registry.
 * @returns The render result, or null if rendering is not possible.
 */
export function resolveCellRenderer(config, value, columnWidth, rowHeight, registry) {
    // Quick exit: column too narrow for any micro-widget
    if (columnWidth < MIN_COLUMN_WIDTH) {
        return null;
    }
    const renderer = registry.get(config.displayMode);
    if (!renderer) {
        return null;
    }
    if (!renderer.canRender(config, columnWidth)) {
        return null;
    }
    return renderer.render(config, value, columnWidth, rowHeight);
}
// ========================================================================
// getMicroWidgetFallbackText
// ========================================================================
/**
 * Produce a plain-text fallback when the micro-widget renderer is
 * unavailable or the column is too narrow.
 *
 * @param config - The micro-widget cell configuration.
 * @param value - The cell's current value.
 * @returns A plain string representation of the value.
 */
export function getMicroWidgetFallbackText(config, value) {
    if (value === null || value === undefined) {
        return '';
    }
    // For delta mode, try to extract the current value
    if (config.displayMode === 'delta') {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const obj = value;
            if (typeof obj.current === 'number') {
                return formatFallbackNumber(obj.current);
            }
        }
        if (Array.isArray(value) && value.length >= 1) {
            const first = Number(value[0]);
            if (!isNaN(first)) {
                return formatFallbackNumber(first);
            }
        }
    }
    // For sparkline mode, show last value
    if (config.displayMode === 'sparkline') {
        if (Array.isArray(value) && value.length > 0) {
            const last = Number(value[value.length - 1]);
            if (!isNaN(last)) {
                return formatFallbackNumber(last);
            }
        }
    }
    // Default: format as number or string
    if (typeof value === 'number') {
        return formatFallbackNumber(value);
    }
    return String(value);
}
/**
 * Format a number for fallback text display.
 */
function formatFallbackNumber(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000)
        return (value / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000)
        return (value / 1_000).toFixed(1) + 'K';
    if (Number.isInteger(value))
        return String(value);
    return value.toFixed(2);
}
//# sourceMappingURL=micro-widget-cell.js.map