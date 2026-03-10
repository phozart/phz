/**
 * @phozart/phz-engine/explorer — Explorer <-> Dashboard Integration
 *
 * Filter promotion: explore filters -> DashboardFilterDef
 * Drill-through pre-population: dimension values -> FilterValue[]
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
import type { ExploreFilterSlot } from './explore-types.js';
import type { DashboardFilterDef, FilterValue } from '@phozart/phz-shared/coordination';
export declare function promoteFilterToDashboard(filter: ExploreFilterSlot, dataSourceId: string, appliesTo?: string[]): DashboardFilterDef;
export declare function buildDrillThroughPrePopulation(dimensionValues: Record<string, unknown>): FilterValue[];
//# sourceMappingURL=explorer-dashboard-integration.d.ts.map