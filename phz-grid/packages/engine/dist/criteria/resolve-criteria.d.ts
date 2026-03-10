/**
 * @phozart/phz-engine — Criteria Resolution for Reports & Dashboards
 *
 * Auto-hydrates inline CriteriaConfig into the registry when no bindings
 * exist, then resolves filter fields. Implements divergence detection
 * when both inline config and registry bindings coexist.
 */
import type { SelectionFieldDef, ArtefactId, CriteriaConfig } from '@phozart/phz-core';
import type { ReportId, DashboardId } from '../types.js';
import type { CriteriaEngine } from './criteria-engine.js';
import type { FilterRegistry } from './filter-registry.js';
import type { FilterBindingStore } from './filter-bindings.js';
import type { ReportConfigStore } from '../report.js';
import type { DashboardConfigStore } from '../dashboard.js';
export interface DivergenceInfo {
    artefactId: ArtefactId;
    artefactType: 'report' | 'dashboard';
    artefactName: string;
    /** Fields in inline config but not in registry bindings */
    inlineOnly: string[];
    /** Fields in registry bindings but not in inline config */
    registryOnly: string[];
    /** Fields in both but with differing definitions */
    diverged: string[];
}
export type DivergenceCallback = (info: DivergenceInfo) => void;
export interface CriteriaResolutionResult {
    fields: SelectionFieldDef[];
    artefactId: ArtefactId;
    /** How the fields were resolved */
    source: 'registry' | 'hydrated' | 'none';
    /** If divergence was detected, details are here */
    divergence?: DivergenceInfo;
}
/**
 * Hydrate a CriteriaConfig into a filter registry and binding store.
 * Idempotent: skips definitions/bindings that already exist.
 */
export declare function hydrateCriteriaConfig(registry: FilterRegistry, bindings: FilterBindingStore, config: CriteriaConfig, artId: ArtefactId): void;
/**
 * Resolve filter fields for a report.
 */
export declare function resolveReportCriteria(reportId: ReportId, engine: CriteriaEngine, reports: ReportConfigStore, onDivergence?: DivergenceCallback): CriteriaResolutionResult;
/**
 * Resolve filter fields for a dashboard.
 */
export declare function resolveDashboardCriteria(dashboardId: DashboardId, engine: CriteriaEngine, dashboards: DashboardConfigStore, onDivergence?: DivergenceCallback): CriteriaResolutionResult;
//# sourceMappingURL=resolve-criteria.d.ts.map