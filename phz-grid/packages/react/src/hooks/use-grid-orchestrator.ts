import { useState, useCallback, useRef, type RefObject } from 'react';
import type { GridApi, SelectionContext, FilterOperator } from '@phozart/phz-core';
import type { ReportPresentation } from '@phozart/phz-engine';
import { settingsToGridProps } from '../utils/settings-to-grid-props.js';
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
  handleCriteriaApply: (detail: { context: SelectionContext }) => void;
  handleCriteriaChange: (detail: { context: SelectionContext }) => void;
  handleCriteriaReset: () => void;
  handleSettingsSave: (detail: { settings: ReportPresentation }) => void;
  handleGridReady: (gridInstance: GridApi) => void;
}

export function useGridOrchestrator(config: OrchestratorConfig = {}): OrchestratorResult {
  const gridRef = useRef<GridApi | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [filters, setFilters] = useState<SelectionContext>(config.initialFilters ?? {});
  const [presentation, setPresentation] = useState<ReportPresentation | null>(
    config.initialPresentation ?? null
  );

  const handleGridReady = useCallback((gridInstance: GridApi) => {
    gridRef.current = gridInstance;
    setGridApi(gridInstance);
  }, []);

  const applyFiltersToGrid = useCallback((ctx: SelectionContext) => {
    const grid = gridRef.current;
    if (!grid) return;

    grid.clearFilters();
    for (const [field, value] of Object.entries(ctx)) {
      if (value == null || value === '') continue;
      if (Array.isArray(value)) {
        grid.addFilter(field, 'in' as FilterOperator, value);
      } else {
        grid.addFilter(field, 'equals' as FilterOperator, value);
      }
    }
  }, []);

  const handleCriteriaApply = useCallback((detail: { context: SelectionContext }) => {
    setFilters(detail.context);
    applyFiltersToGrid(detail.context);
  }, [applyFiltersToGrid]);

  const handleCriteriaChange = useCallback((detail: { context: SelectionContext }) => {
    setFilters(detail.context);
  }, []);

  const handleCriteriaReset = useCallback(() => {
    setFilters({});
    const grid = gridRef.current;
    if (grid) grid.clearFilters();
  }, []);

  const handleSettingsSave = useCallback((detail: { settings: ReportPresentation }) => {
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
