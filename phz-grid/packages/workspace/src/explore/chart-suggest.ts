/**
 * @phozart/workspace — Chart Type Suggestion (P.3 sub-task)
 *
 * Pure function: given an ExploreQuery, suggests the best chart type
 * based on dimension/measure count and field name heuristics.
 */

import type { ExploreQuery } from '../explore-types.js';

// Date-like field name patterns
const DATE_PATTERNS = /(?:date|_at$|_on$|timestamp|_time$|month|year|quarter|week|day)/i;

export interface ChartSuggestOptions {
  /** Override field type detection with explicit field→dataType mapping. */
  fieldTypes?: Record<string, string>;
}

function isDateField(fieldName: string, options?: ChartSuggestOptions): boolean {
  if (options?.fieldTypes?.[fieldName] === 'date') return true;
  return DATE_PATTERNS.test(fieldName);
}

export function suggestChartType(
  explore: ExploreQuery,
  options?: ChartSuggestOptions,
): string {
  const dimCount = explore.dimensions.length;
  const measureCount = explore.measures.length;

  // No measures → table
  if (measureCount === 0) return 'table';

  // 0 dims + measures → KPI
  if (dimCount === 0) return 'kpi';

  // 3+ dims → table (too complex for charts)
  if (dimCount >= 3) return 'table';

  const hasDateDim = explore.dimensions.some(d => isDateField(d.field, options));

  if (dimCount === 1) {
    if (measureCount === 1) {
      return hasDateDim ? 'line' : 'bar';
    }
    // 1 dim + 2+ measures
    return hasDateDim ? 'multi-line' : 'grouped-bar';
  }

  // dimCount === 2
  if (measureCount >= 1) {
    return 'stacked-bar';
  }

  return 'table';
}
