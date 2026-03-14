/**
 * @phozart/workspace — Explorer ↔ Dashboard Integration (P.6)
 *
 * Filter promotion: explore filters → DashboardFilterDef
 * Drill-through pre-population: dimension values → FilterValue[]
 */
import type { ExploreFilterSlot } from '../explore-types.js';
import type { DashboardFilterDef, FilterValue } from '../types.js';
export declare function promoteFilterToDashboard(filter: ExploreFilterSlot, dataSourceId: string, appliesTo?: string[]): DashboardFilterDef;
export declare function buildDrillThroughPrePopulation(dimensionValues: Record<string, unknown>): FilterValue[];
//# sourceMappingURL=explorer-dashboard-integration.d.ts.map