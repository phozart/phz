/**
 * @phozart/widgets — Micro-Widget Cell Renderers (7A-B)
 *
 * Pure functions that produce SVG/HTML strings for rendering micro-widgets
 * inside grid table cells. No DOM APIs, no Lit, no side effects.
 *
 * Each renderer must complete in under 2ms per call.
 */
import { ALERT_WIDGET_TOKENS } from '@phozart/shared/design-system';
// ========================================================================
// Column-width thresholds
// ========================================================================
/** Minimum column width for any micro-widget rendering. */
const MIN_WIDTH = 60;
/** Minimum width for sparkline display mode. */
const SPARKLINE_MIN_WIDTH = 80;
/** Minimum width for delta display mode. */
const DELTA_MIN_WIDTH = 100;
// ========================================================================
// Shared helpers
// ========================================================================
/**
 * Resolve status color from thresholds. Uses alert widget tokens.
 * - >= critical: red (#ef4444)
 * - >= warning: amber (#f59e0b)
 * - otherwise: green (#22c55e)
 */
function resolveStatusColor(value, thresholds) {
    if (!thresholds) {
        return ALERT_WIDGET_TOKENS['widget.alert.healthy.indicator'];
    }
    if (thresholds.critical !== undefined && value >= thresholds.critical) {
        return ALERT_WIDGET_TOKENS['widget.alert.critical.indicator'];
    }
    if (thresholds.warning !== undefined && value >= thresholds.warning) {
        return ALERT_WIDGET_TOKENS['widget.alert.warning.indicator'];
    }
    return ALERT_WIDGET_TOKENS['widget.alert.healthy.indicator'];
}
/**
 * Escape a string for safe embedding in SVG/HTML attribute values.
 */
function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * Format a number compactly for cell display.
 */
function formatCompact(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000)
        return (value / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000)
        return (value / 1_000).toFixed(1) + 'K';
    if (Number.isInteger(value))
        return String(value);
    return value.toFixed(1);
}
// ========================================================================
// value-only renderer
// ========================================================================
/**
 * Formatted number + colored status dot.
 * Uses alert tokens from the design system for dot color.
 */
export function createValueOnlyRenderer() {
    return {
        render(config, value, width, height) {
            const isNull = value === null || value === undefined;
            const num = isNull ? NaN : (typeof value === 'number' ? value : Number(value));
            const displayValue = isNull || isNaN(num) ? '—' : formatCompact(num);
            const dotColor = isNull || isNaN(num)
                ? '#A8A29E'
                : resolveStatusColor(num, config.thresholds);
            const dotRadius = Math.max(3, Math.min(5, height / 8));
            const fontSize = Math.max(11, Math.min(14, height * 0.5));
            const svgWidth = width;
            const svgHeight = height;
            const dotCx = dotRadius + 2;
            const dotCy = svgHeight / 2;
            const textX = dotCx + dotRadius + 4;
            const textY = svgHeight / 2;
            const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">` +
                `<circle cx="${dotCx}" cy="${dotCy}" r="${dotRadius}" fill="${dotColor}" />` +
                `<text x="${textX}" y="${textY}" dominant-baseline="central" font-size="${fontSize}" fill="#1C1917">${escapeAttr(displayValue)}</text>` +
                `</svg>`;
            return { html, width: svgWidth, height: svgHeight };
        },
        canRender(_config, columnWidth) {
            return columnWidth >= MIN_WIDTH;
        },
    };
}
// ========================================================================
// sparkline renderer
// ========================================================================
/**
 * SVG polyline from array data. No axes, no labels. Just the line.
 */
export function createSparklineRenderer() {
    return {
        render(config, value, width, height) {
            const data = normalizeSparklineData(value);
            if (data.length === 0) {
                return { html: '', width, height };
            }
            const maxPoints = 20;
            const points = data.length > maxPoints ? data.slice(-maxPoints) : data;
            const padding = 2;
            const chartW = width - padding * 2;
            const chartH = height - padding * 2;
            let minVal = points[0];
            let maxVal = points[0];
            for (let i = 1; i < points.length; i++) {
                if (points[i] < minVal)
                    minVal = points[i];
                if (points[i] > maxVal)
                    maxVal = points[i];
            }
            const range = maxVal - minVal || 1;
            const coords = [];
            for (let i = 0; i < points.length; i++) {
                const x = padding + (i / Math.max(points.length - 1, 1)) * chartW;
                const y = padding + chartH - ((points[i] - minVal) / range) * chartH;
                coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
            }
            // Determine line color from last value vs first value
            const trending = points[points.length - 1] >= points[0];
            const lineColor = trending ? '#3B82F6' : '#EF4444';
            const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
                `<polyline points="${coords.join(' ')}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />` +
                `</svg>`;
            return { html, width, height };
        },
        canRender(_config, columnWidth) {
            return columnWidth >= SPARKLINE_MIN_WIDTH;
        },
    };
}
/**
 * Normalize sparkline data to a number array.
 * Accepts: number[], string (JSON), or returns empty array.
 */
function normalizeSparklineData(value) {
    if (Array.isArray(value)) {
        return value
            .map((v) => (typeof v === 'number' ? v : Number(v)))
            .filter((v) => !isNaN(v));
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((v) => (typeof v === 'number' ? v : Number(v)))
                    .filter((v) => !isNaN(v));
            }
        }
        catch {
            // not JSON — ignore
        }
    }
    return [];
}
// ========================================================================
// delta renderer
// ========================================================================
/**
 * Value + arrow (up/down) + percentage, colored by positive/negative.
 */
export function createDeltaRenderer() {
    return {
        render(config, value, width, height) {
            // value is expected to be { current: number, previous: number } or a plain number
            const parsed = parseDeltaValue(value);
            if (parsed === null) {
                return { html: '', width, height };
            }
            const { current, previous } = parsed;
            const diff = current - previous;
            const pctChange = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0;
            const isPositive = diff >= 0;
            const arrow = isPositive ? '\u25B2' : '\u25BC'; // ▲ or ▼
            const color = isPositive ? '#22c55e' : '#ef4444';
            const pctText = `${isPositive ? '+' : ''}${pctChange.toFixed(1)}%`;
            const valueText = formatCompact(current);
            const fontSize = Math.max(10, Math.min(13, height * 0.45));
            const smallFontSize = Math.max(9, Math.min(11, height * 0.35));
            const svgWidth = width;
            const svgHeight = height;
            const midY = svgHeight / 2;
            const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">` +
                `<text x="2" y="${midY}" dominant-baseline="central" font-size="${fontSize}" fill="#1C1917">${escapeAttr(valueText)}</text>` +
                `<text x="${Math.min(svgWidth * 0.5, 50)}" y="${midY}" dominant-baseline="central" font-size="${smallFontSize}" fill="${color}">${arrow} ${escapeAttr(pctText)}</text>` +
                `</svg>`;
            return { html, width: svgWidth, height: svgHeight };
        },
        canRender(_config, columnWidth) {
            return columnWidth >= DELTA_MIN_WIDTH;
        },
    };
}
/**
 * Parse delta value from various input shapes.
 */
function parseDeltaValue(value) {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value;
        const current = typeof obj.current === 'number' ? obj.current : Number(obj.current);
        const previous = typeof obj.previous === 'number' ? obj.previous : Number(obj.previous);
        if (!isNaN(current) && !isNaN(previous)) {
            return { current, previous };
        }
    }
    // Array [current, previous]
    if (Array.isArray(value) && value.length >= 2) {
        const current = Number(value[0]);
        const previous = Number(value[1]);
        if (!isNaN(current) && !isNaN(previous)) {
            return { current, previous };
        }
    }
    return null;
}
// ========================================================================
// gauge-arc renderer
// ========================================================================
/**
 * SVG semi-circle arc with fill percentage.
 */
export function createGaugeArcRenderer() {
    return {
        render(config, value, width, height) {
            const num = typeof value === 'number' ? value : Number(value);
            if (isNaN(num)) {
                return { html: '', width, height };
            }
            // Gauge runs from 0 to 100 by default; thresholds color the arc
            const min = 0;
            const max = 100;
            const clamped = Math.max(min, Math.min(max, num));
            const ratio = (clamped - min) / (max - min || 1);
            const fillColor = resolveStatusColor(num, config.thresholds);
            const trackColor = '#E7E5E4';
            // Arc geometry — semi-circle (180 degrees)
            const cx = width / 2;
            const cy = height * 0.8;
            const radius = Math.min(width / 2 - 2, height * 0.7);
            const trackWidth = Math.max(2, Math.min(4, radius / 6));
            // Start at -180 degrees (left), end at 0 degrees (right)
            const startAngle = -180;
            const endAngle = 0;
            const fillAngle = startAngle + ratio * (endAngle - startAngle);
            const trackPath = arcPath(cx, cy, radius, startAngle, endAngle);
            const fillPath = arcPath(cx, cy, radius, startAngle, fillAngle);
            const fontSize = Math.max(8, Math.min(11, height * 0.3));
            const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
                `<path d="${trackPath}" fill="none" stroke="${trackColor}" stroke-width="${trackWidth}" stroke-linecap="round" />` +
                (ratio > 0
                    ? `<path d="${fillPath}" fill="none" stroke="${fillColor}" stroke-width="${trackWidth}" stroke-linecap="round" />`
                    : '') +
                `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="#1C1917">${escapeAttr(formatCompact(num))}</text>` +
                `</svg>`;
            return { html, width, height };
        },
        canRender(_config, columnWidth) {
            return columnWidth >= MIN_WIDTH;
        },
    };
}
/**
 * Compute an SVG arc path from start angle to end angle (degrees).
 */
function arcPath(cx, cy, radius, startDeg, endDeg) {
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
// ========================================================================
// registerAllMicroWidgetRenderers
// ========================================================================
/**
 * Register all four micro-widget renderers with the given registry.
 * This is the standard way shells populate the registry at mount time.
 */
export function registerAllMicroWidgetRenderers(registry) {
    registry.register('value-only', createValueOnlyRenderer());
    registry.register('sparkline', createSparklineRenderer());
    registry.register('delta', createDeltaRenderer());
    registry.register('gauge-arc', createGaugeArcRenderer());
}
//# sourceMappingURL=micro-widget-renderers.js.map