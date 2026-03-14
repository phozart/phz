/**
 * @phozart/workspace — Widget Palette State
 *
 * Pure state machine for the tabbed Fields/Widgets panel in the dashboard editor.
 * Manages tab selection, search filtering, and category expansion.
 */
export function initialWidgetPaletteState() {
    return {
        activeTab: 'fields',
        widgetSearchQuery: '',
        expandedCategories: new Set(),
    };
}
export function setPaletteTab(state, tab) {
    if (state.activeTab === tab)
        return state;
    return { ...state, activeTab: tab };
}
export function setWidgetSearch(state, query) {
    if (state.widgetSearchQuery === query)
        return state;
    return { ...state, widgetSearchQuery: query };
}
export function toggleWidgetCategory(state, category) {
    const next = new Set(state.expandedCategories);
    if (next.has(category)) {
        next.delete(category);
    }
    else {
        next.add(category);
    }
    return { ...state, expandedCategories: next };
}
/**
 * Filter and group manifests by category, matching search query against
 * type, name, and description (case-insensitive).
 */
export function getFilteredWidgets(manifests, searchQuery) {
    const q = searchQuery.toLowerCase();
    const groups = new Map();
    for (const m of manifests) {
        if (q) {
            const haystack = `${m.type} ${m.name} ${m.description}`.toLowerCase();
            if (!haystack.includes(q))
                continue;
        }
        let list = groups.get(m.category);
        if (!list) {
            list = [];
            groups.set(m.category, list);
        }
        list.push(m);
    }
    return groups;
}
//# sourceMappingURL=widget-palette-state.js.map