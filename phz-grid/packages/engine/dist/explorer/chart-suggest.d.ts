/**
 * @phozart/engine/explorer — Chart Type Suggestion
 *
 * Pure function: given an ExploreQuery, suggests the best chart type
 * based on dimension/measure count and field name heuristics.
 *
 * Moved from @phozart/workspace in v15 (A-2.01).
 */
import type { ExploreQuery } from './explore-types.js';
export interface ChartSuggestOptions {
    /** Override field type detection with explicit field->dataType mapping. */
    fieldTypes?: Record<string, string>;
}
export declare function suggestChartType(explore: ExploreQuery, options?: ChartSuggestOptions): string;
//# sourceMappingURL=chart-suggest.d.ts.map