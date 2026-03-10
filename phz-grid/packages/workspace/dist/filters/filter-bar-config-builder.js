/**
 * @phozart/phz-workspace — Filter Bar Config Builder (L.9)
 *
 * Builds a DashboardFilterBarConfig from FieldMetadata[] using heuristics
 * to auto-select appropriate filter UI types.
 */
function inferFilterType(field) {
    switch (field.dataType) {
        case 'string':
            switch (field.cardinality) {
                case 'low': return 'chip-select';
                case 'high': return 'search';
                case 'medium':
                default: return 'multi-select';
            }
        case 'number': return 'numeric-range';
        case 'date': return 'date-range';
        case 'boolean': return 'boolean-toggle';
        default: return 'multi-select';
    }
}
export function buildFilterBarConfig(fields, options) {
    const filters = fields.map(field => ({
        id: `filter-${field.name}`,
        field: field.name,
        dataSourceId: '',
        label: field.name,
        filterType: inferFilterType(field),
        required: false,
        appliesTo: [],
    }));
    return {
        filters,
        position: options?.position ?? 'top',
        collapsible: options?.collapsible ?? true,
        defaultCollapsed: options?.defaultCollapsed ?? false,
        showActiveFilterCount: options?.showActiveFilterCount ?? true,
        showPresetPicker: options?.showPresetPicker ?? false,
        dependencies: [],
    };
}
//# sourceMappingURL=filter-bar-config-builder.js.map