/**
 * @phozart/phz-engine/explorer — Explorer <-> Dashboard Integration
 *
 * Filter promotion: explore filters -> DashboardFilterDef
 * Drill-through pre-population: dimension values -> FilterValue[]
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */

import type { ExploreFilterSlot } from './explore-types.js';
import type { DashboardFilterDef, FilterUIType, FilterValue } from '@phozart/phz-shared/coordination';

// ========================================================================
// ID generation
// ========================================================================

let counter = 0;
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++counter}`;
}

// ========================================================================
// Operator -> FilterUIType mapping
// ========================================================================

const NUMERIC_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte', 'between']);

function inferFilterType(operator: string): FilterUIType {
  if (operator === 'in' || operator === 'not_in') return 'multi-select';
  if (NUMERIC_OPERATORS.has(operator)) return 'numeric-range';
  return 'select';
}

// ========================================================================
// promoteFilterToDashboard
// ========================================================================

export function promoteFilterToDashboard(
  filter: ExploreFilterSlot,
  dataSourceId: string,
  appliesTo: string[] = [],
): DashboardFilterDef {
  return {
    id: generateId('promoted'),
    field: filter.field,
    dataSourceId,
    label: filter.field,
    filterType: inferFilterType(filter.operator),
    defaultValue: filter.value,
    required: false,
    appliesTo,
  };
}

// ========================================================================
// buildDrillThroughPrePopulation
// ========================================================================

export function buildDrillThroughPrePopulation(
  dimensionValues: Record<string, unknown>,
): FilterValue[] {
  const filters: FilterValue[] = [];

  for (const [field, value] of Object.entries(dimensionValues)) {
    if (value === null || value === undefined) {
      filters.push({
        filterId: `drill_${field}`,
        field,
        operator: 'isNull',
        value: null,
        label: `Drill: ${field} is null`,
      });
    } else {
      filters.push({
        filterId: `drill_${field}`,
        field,
        operator: 'equals',
        value,
        label: `Drill: ${field} = ${value}`,
      });
    }
  }

  return filters;
}
