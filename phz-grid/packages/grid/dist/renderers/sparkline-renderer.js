/**
 * @phozart/grid — Sparkline Cell Renderer
 *
 * SVG-based sparkline/mini-chart renderer for inline data visualization.
 * Supports line, bar, and area types. Zero external dependencies.
 */
import { html, svg } from 'lit';
const DEFAULTS = {
    type: 'line',
    width: 80,
    height: 24,
    color: '#3B82F6',
    fillColor: 'rgba(59, 130, 246, 0.15)',
    strokeWidth: 1.5,
    showDots: false,
    showMinMax: false,
};
function normalizeData(data) {
    if (Array.isArray(data)) {
        return data.filter(v => typeof v === 'number' && !isNaN(v));
    }
    if (typeof data === 'string') {
        return data.split(',').map(Number).filter(n => !isNaN(n));
    }
    return [];
}
export function renderSparkline(data, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const values = normalizeData(data);
    if (values.length === 0)
        return html ``;
    const { width, height, color, fillColor, strokeWidth, type, showDots, showMinMax } = opts;
    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const min = values.reduce((m, v) => v < m ? v : m, Infinity);
    const max = values.reduce((m, v) => v > m ? v : m, -Infinity);
    const range = max - min || 1;
    const points = values.map((v, i) => ({
        x: padding + (i / (values.length - 1 || 1)) * w,
        y: padding + h - ((v - min) / range) * h,
    }));
    if (type === 'bar') {
        const barWidth = Math.max(2, w / values.length - 1);
        return html `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="vertical-align: middle;">
        ${values.map((v, i) => {
            const barHeight = ((v - min) / range) * h;
            const x = padding + (i / values.length) * w;
            const y = padding + h - barHeight;
            const isMin = showMinMax && v === min;
            const isMax = showMinMax && v === max;
            return svg `
            <rect
              x="${x}" y="${y}"
              width="${barWidth}" height="${barHeight}"
              fill="${isMax ? '#22C55E' : isMin ? '#EF4444' : color}"
              rx="1"
            />
          `;
        })}
      </svg>
    `;
    }
    // Line/Area
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = type === 'area'
        ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padding + h).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding + h).toFixed(1)} Z`
        : '';
    const minIdx = values.indexOf(min);
    const maxIdx = values.indexOf(max);
    return html `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="vertical-align: middle;">
      ${type === 'area' ? svg `
        <path d="${areaD}" fill="${fillColor}" />
      ` : ''}
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      ${showDots ? points.map(p => svg `
        <circle cx="${p.x}" cy="${p.y}" r="1.5" fill="${color}" />
      `) : ''}
      ${showMinMax ? svg `
        <circle cx="${points[minIdx]?.x}" cy="${points[minIdx]?.y}" r="2" fill="#EF4444" />
        <circle cx="${points[maxIdx]?.x}" cy="${points[maxIdx]?.y}" r="2" fill="#22C55E" />
      ` : ''}
    </svg>
  `;
}
//# sourceMappingURL=sparkline-renderer.js.map