/**
 * Catalog Breach Count (L.7)
 *
 * Pure utility functions for computing and displaying breach counts
 * per artifact in the catalog browser.
 */
const SEVERITY_ORDER = {
    info: 0,
    warning: 1,
    critical: 2,
};
export function countBreachesByArtifact(breaches) {
    const result = new Map();
    for (const b of breaches) {
        let entry = result.get(b.artifactId);
        if (!entry) {
            entry = { total: 0, highestSeverity: 'info', bySeverity: { info: 0, warning: 0, critical: 0 } };
            result.set(b.artifactId, entry);
        }
        entry.total++;
        entry.bySeverity[b.severity]++;
        if (SEVERITY_ORDER[b.severity] > SEVERITY_ORDER[entry.highestSeverity]) {
            entry.highestSeverity = b.severity;
        }
    }
    return result;
}
export function sortByBreachCount(artifactIds, counts) {
    return [...artifactIds].sort((a, b) => {
        const ca = counts.get(a)?.total ?? 0;
        const cb = counts.get(b)?.total ?? 0;
        return cb - ca;
    });
}
export function getBreachBadge(counts, artifactId) {
    const entry = counts.get(artifactId);
    if (!entry)
        return null;
    return {
        count: entry.total,
        severity: entry.highestSeverity,
        label: `${entry.total} breach${entry.total === 1 ? '' : 'es'}`,
    };
}
//# sourceMappingURL=breach-count.js.map