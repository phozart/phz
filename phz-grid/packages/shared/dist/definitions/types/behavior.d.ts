/**
 * Definition Behavior — features, density, edit mode, accessibility settings.
 */
export interface DefinitionBehavior {
    density?: 'compact' | 'comfortable' | 'spacious';
    editMode?: 'none' | 'click' | 'dblclick' | 'manual';
    selectionMode?: 'none' | 'single' | 'multi' | 'range';
    enableVirtualization?: boolean;
    enableGrouping?: boolean;
    enableColumnResize?: boolean;
    enableColumnReorder?: boolean;
    showToolbar?: boolean;
    showPagination?: boolean;
    pageSize?: number;
}
//# sourceMappingURL=behavior.d.ts.map