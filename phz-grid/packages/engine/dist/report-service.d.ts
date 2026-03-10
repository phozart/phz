/**
 * @phozart/phz-engine — Report Service
 *
 * Per-route runtime orchestrator that connects a report's filter definitions
 * to the criteria engine, manages filter state, and produces grid-ready
 * filter parameters. This is the "glue" layer that wires everything together
 * at runtime.
 *
 * Usage:
 *   const service = createReportService(engine, reportId);
 *   service.subscribe((result) => { ... update grid ... });
 *   service.setValue('region', ['EMEA']);
 */
import type { SelectionContext, SelectionFieldDef, ArtefactId, ArtefactCriteria } from '@phozart/phz-core';
import type { ReportId, DashboardId } from './types.js';
import type { BIEngine } from './engine.js';
import type { DivergenceInfo } from './criteria/resolve-criteria.js';
export interface GridFilterParams {
    /** Filter fields resolved for the current artefact */
    fields: SelectionFieldDef[];
    /** Current filter values */
    values: SelectionContext;
    /** Structured criteria output for API/SQL generation */
    criteria: ArtefactCriteria | null;
    /** Whether all required fields have values */
    isComplete: boolean;
    /** How filters were resolved */
    source: 'registry' | 'hydrated' | 'none';
    /** Divergence info if both inline and registry exist */
    divergence?: DivergenceInfo;
}
export type FilterChangeListener = (params: GridFilterParams) => void;
export interface ReportService {
    /** The resolved ArtefactId for this report */
    readonly artefactId: ArtefactId;
    /** Get the current resolved fields */
    getFields(): SelectionFieldDef[];
    /** Get the current filter values */
    getValues(): SelectionContext;
    /** Set a single filter value */
    setValue(fieldId: string, value: string | string[] | null): void;
    /** Set multiple filter values at once */
    setValues(values: SelectionContext): void;
    /** Reset all filters to defaults */
    reset(): void;
    /** Build current GridFilterParams snapshot */
    getFilterParams(): GridFilterParams;
    /** Subscribe to filter changes */
    subscribe(listener: FilterChangeListener): () => void;
    /** Destroy the service and clean up subscriptions */
    destroy(): void;
}
export interface DashboardService {
    readonly artefactId: ArtefactId;
    getFields(): SelectionFieldDef[];
    getValues(): SelectionContext;
    setValue(fieldId: string, value: string | string[] | null): void;
    setValues(values: SelectionContext): void;
    reset(): void;
    getFilterParams(): GridFilterParams;
    subscribe(listener: FilterChangeListener): () => void;
    destroy(): void;
}
export declare function createReportService(engine: BIEngine, reportId: ReportId): ReportService;
export declare function createDashboardService(engine: BIEngine, dashboardId: DashboardId): DashboardService;
//# sourceMappingURL=report-service.d.ts.map