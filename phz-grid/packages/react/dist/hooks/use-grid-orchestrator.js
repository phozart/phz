import { useState, useCallback, useRef } from 'react';
import { settingsToGridProps } from '../utils/settings-to-grid-props.js';
export function useGridOrchestrator(config = {}) {
    const gridRef = useRef(null);
    const [gridApi, setGridApi] = useState(null);
    const [filters, setFilters] = useState(config.initialFilters ?? {});
    const [presentation, setPresentation] = useState(config.initialPresentation ?? null);
    const handleGridReady = useCallback((gridInstance) => {
        gridRef.current = gridInstance;
        setGridApi(gridInstance);
    }, []);
    const applyFiltersToGrid = useCallback((ctx) => {
        const grid = gridRef.current;
        if (!grid)
            return;
        grid.clearFilters();
        for (const [field, value] of Object.entries(ctx)) {
            if (value == null || value === '')
                continue;
            if (Array.isArray(value)) {
                grid.addFilter(field, 'in', value);
            }
            else {
                grid.addFilter(field, 'equals', value);
            }
        }
    }, []);
    const handleCriteriaApply = useCallback((detail) => {
        setFilters(detail.context);
        applyFiltersToGrid(detail.context);
    }, [applyFiltersToGrid]);
    const handleCriteriaChange = useCallback((detail) => {
        setFilters(detail.context);
    }, []);
    const handleCriteriaReset = useCallback(() => {
        setFilters({});
        const grid = gridRef.current;
        if (grid)
            grid.clearFilters();
    }, []);
    const handleSettingsSave = useCallback((detail) => {
        setPresentation(detail.settings);
    }, []);
    const presentationProps = settingsToGridProps(presentation);
    return {
        gridRef,
        gridApi,
        filters,
        presentationProps,
        handleCriteriaApply,
        handleCriteriaChange,
        handleCriteriaReset,
        handleSettingsSave,
        handleGridReady,
    };
}
//# sourceMappingURL=use-grid-orchestrator.js.map