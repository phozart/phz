/**
 * @phozart/workspace — Breach Highlight (L.8)
 *
 * CSS class helpers and breach bar data for dashboard breach visualization.
 */
const SEVERITY_CSS = {
    info: 'phz-breach-info',
    warning: 'phz-breach-warning',
    critical: 'phz-breach-critical',
};
export function getBreachSeverityCSS(severity) {
    return SEVERITY_CSS[severity];
}
export function computeBreachBarData(breaches) {
    const data = { critical: 0, warning: 0, info: 0, total: 0 };
    for (const b of breaches) {
        data[b.severity]++;
        data.total++;
    }
    return data;
}
export function shouldPulse(severity) {
    return severity === 'critical';
}
//# sourceMappingURL=breach-highlight.js.map