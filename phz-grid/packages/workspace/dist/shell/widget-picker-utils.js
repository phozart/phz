/**
 * @phozart/phz-workspace — Widget Picker Utils (L.5)
 *
 * Pure utility functions for filtering, grouping, and searching widget manifests.
 */
export function filterManifestsByCapabilities(manifests, capabilities) {
    if (!capabilities)
        return manifests;
    return manifests.filter(m => capabilities.widgetTypes.includes(m.type));
}
export function groupManifestsByCategory(manifests) {
    const grouped = new Map();
    for (const m of manifests) {
        let list = grouped.get(m.category);
        if (!list) {
            list = [];
            grouped.set(m.category, list);
        }
        list.push(m);
    }
    return grouped;
}
export function searchManifests(manifests, query) {
    if (!query)
        return manifests;
    const q = query.toLowerCase();
    return manifests.filter(m => m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q));
}
//# sourceMappingURL=widget-picker-utils.js.map