/**
 * @phozart/phz-engine/explorer — Field Palette Logic
 *
 * Headless logic for field palette: type icons, cardinality badges,
 * search/filter, group by type, and auto-placement.
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
// ========================================================================
// createFieldPalette
// ========================================================================
export function createFieldPalette(fields) {
    return {
        fields: fields.map(f => ({
            name: f.name,
            dataType: f.dataType,
            typeIcon: f.dataType,
            cardinalityBadge: f.cardinality,
            semanticHint: f.semanticHint,
            draggable: true,
        })),
    };
}
// ========================================================================
// groupFieldsByType
// ========================================================================
export function groupFieldsByType(fields) {
    const groups = new Map();
    for (const field of fields) {
        let group = groups.get(field.dataType);
        if (!group) {
            group = [];
            groups.set(field.dataType, group);
        }
        group.push(field);
    }
    return groups;
}
// ========================================================================
// searchFields
// ========================================================================
export function searchFields(fields, query) {
    if (!query)
        return fields;
    const lower = query.toLowerCase();
    return fields.filter(f => f.name.toLowerCase().includes(lower));
}
// ========================================================================
// autoPlaceField — double-click auto-placement
// ========================================================================
export function autoPlaceField(field) {
    switch (field.dataType) {
        case 'number':
            return 'values';
        case 'date':
            return 'columns';
        case 'boolean':
            return 'filters';
        case 'string':
        default:
            return 'rows';
    }
}
//# sourceMappingURL=phz-field-palette.js.map