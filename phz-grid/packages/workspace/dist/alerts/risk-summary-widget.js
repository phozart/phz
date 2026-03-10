/**
 * @phozart/phz-workspace — Risk Summary Widget (N.3)
 *
 * Pure functions for computing risk summaries from breaches
 * and generating visual breach indicator CSS.
 */
const SEVERITY_ORDER = ['critical', 'warning', 'info'];
export function computeRiskSummary(breaches) {
    const active = breaches.filter(b => b.status === 'active');
    const bySeverity = { critical: 0, warning: 0, info: 0 };
    const artifactSet = new Set();
    for (const b of active) {
        bySeverity[b.severity]++;
        artifactSet.add(b.artifactId);
    }
    let highestSeverity;
    for (const sev of SEVERITY_ORDER) {
        if (bySeverity[sev] > 0) {
            highestSeverity = sev;
            break;
        }
    }
    return {
        totalActive: active.length,
        bySeverity,
        highestSeverity,
        affectedArtifacts: Array.from(artifactSet),
    };
}
// --- Breach visual indicators ---
export function withBreachIndicator(severity) {
    if (!severity)
        return { className: '' };
    return { className: `phz-breach-${severity}` };
}
const SEVERITY_COLORS = {
    critical: 'var(--phz-breach-critical, #dc2626)',
    warning: 'var(--phz-breach-warning, #f59e0b)',
    info: 'var(--phz-breach-info, #3b82f6)',
};
export function getBreachBorderCSS(severity) {
    if (!severity)
        return '';
    return `border: 2px solid ${SEVERITY_COLORS[severity]};`;
}
export function getBreachGlowCSS(severity) {
    if (!severity)
        return '';
    return `box-shadow: 0 0 8px 2px ${SEVERITY_COLORS[severity]};`;
}
//# sourceMappingURL=risk-summary-widget.js.map