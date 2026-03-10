/**
 * @phozart/phz-workspace — Breach Count Utils (L.7)
 *
 * Computes per-artifact breach counts and sorts artifacts by breach severity.
 */
export function computeBreachCounts(_artifacts, breaches) {
    const counts = new Map();
    for (const breach of breaches) {
        if (breach.status !== 'active')
            continue;
        counts.set(breach.artifactId, (counts.get(breach.artifactId) ?? 0) + 1);
    }
    return counts;
}
export function sortByBreachCount(artifacts, counts) {
    return [...artifacts].sort((a, b) => {
        const ca = counts.get(a.id) ?? 0;
        const cb = counts.get(b.id) ?? 0;
        return cb - ca;
    });
}
//# sourceMappingURL=breach-count-utils.js.map