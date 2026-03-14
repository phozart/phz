import { type RefObject } from 'react';
import type { GridApi, SelectionContext } from '@phozart/core';
import type { ReportPresentation } from '@phozart/engine';
import type { PhzGridProps } from '../phz-grid.js';
export interface OrchestratorConfig {
    initialFilters?: SelectionContext;
    initialPresentation?: ReportPresentation;
}
export interface OrchestratorResult {
    gridRef: RefObject<GridApi | null>;
    gridApi: GridApi | null;
    filters: SelectionContext;
    presentationProps: Partial<PhzGridProps>;
    handleCriteriaApply: (detail: {
        context: SelectionContext;
    }) => void;
    handleCriteriaChange: (detail: {
        context: SelectionContext;
    }) => void;
    handleCriteriaReset: () => void;
    handleSettingsSave: (detail: {
        settings: ReportPresentation;
    }) => void;
    handleGridReady: (gridInstance: GridApi) => void;
}
export declare function useGridOrchestrator(config?: OrchestratorConfig): OrchestratorResult;
//# sourceMappingURL=use-grid-orchestrator.d.ts.map