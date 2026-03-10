/**
 * Pure utility functions for CatalogBrowser — grouping and filtering.
 */
export function groupArtifactsByType(artifacts) {
    const grouped = new Map();
    for (const a of artifacts) {
        const list = grouped.get(a.type);
        if (list) {
            list.push(a);
        }
        else {
            grouped.set(a.type, [a]);
        }
    }
    return grouped;
}
export function filterArtifactsBySearch(artifacts, query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return artifacts;
    return artifacts.filter(a => a.name.toLowerCase().includes(q));
}
// --- Template search (L.2) ---
export function filterTemplatesBySearch(templates, query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return templates;
    return templates.filter(t => t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)));
}
export function unifiedSearch(artifacts, templates, query) {
    const filteredArtifacts = filterArtifactsBySearch(artifacts, query);
    const filteredTemplates = filterTemplatesBySearch(templates, query);
    return {
        artifacts: filteredArtifacts,
        templates: filteredTemplates,
        totalCount: filteredArtifacts.length + filteredTemplates.length,
    };
}
//# sourceMappingURL=catalog-utils.js.map