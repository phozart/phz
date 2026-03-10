/**
 * Convert a GridDefinition to a GridConfig for createGrid().
 */
function columnSpecToDefinition(spec) {
    return {
        field: spec.field,
        header: spec.header,
        type: spec.type,
        width: spec.width,
        minWidth: spec.minWidth,
        maxWidth: spec.maxWidth,
        sortable: spec.sortable,
        filterable: spec.filterable,
        editable: spec.editable,
        resizable: spec.resizable,
        frozen: spec.frozen,
        priority: spec.priority,
    };
}
export function definitionToGridConfig(def, options) {
    const columns = def.columns.map(columnSpecToDefinition);
    const config = {
        data: def.dataSource.type === 'local' ? def.dataSource.data : [],
        columns,
        userRole: options?.userRole,
    };
    if (def.defaults?.sort) {
        config.initialState = {
            ...config.initialState,
            sort: { columns: [{ field: def.defaults.sort.field, direction: def.defaults.sort.direction ?? 'asc' }] },
        };
    }
    if (def.behavior) {
        config.enableSelection = def.behavior.selectionMode !== 'none';
        config.enableEditing = def.behavior.editMode !== 'none';
        config.enableVirtualization = def.behavior.enableVirtualization;
    }
    return config;
}
//# sourceMappingURL=to-grid-config.js.map