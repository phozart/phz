/**
 * @phozart/engine/explorer — Widget Suggestion for Dashboard Field Drops
 *
 * Pure function: given a dropped field, existing widgets, and available fields,
 * suggests the best widget type and encoding for a new dashboard widget.
 * Internally delegates to suggestChartType() for chart-type selection.
 */
import type { FieldMetadata } from '@phozart/shared';
/** Minimal widget info needed for context-aware suggestion. */
export interface ExistingWidgetInfo {
    type: string;
    dimensions: ReadonlyArray<{
        field: string;
    }>;
    measures: ReadonlyArray<{
        field: string;
    }>;
}
/** Partial chart encoding hint returned alongside the suggestion. */
export interface ChartEncoding {
    dimensionField?: string;
    measureField?: string;
    aggregation?: string;
}
/** Result of suggestWidgetForFieldDrop. */
export interface WidgetSuggestion {
    widgetType: string;
    encoding: ChartEncoding;
    confidence: number;
}
/**
 * Suggest the best widget type when a field is dropped onto the dashboard canvas.
 *
 * Logic:
 * 1. Single measure with no existing charts → kpi-card (confidence 1.0)
 * 2. Date/time field → trend-line (confidence 0.8)
 * 3. Categorical dimension with measures available → bar-chart via suggestChartType (confidence 0.7)
 * 4. Dimension dropped alongside existing measure widgets → bar-chart (confidence 0.6)
 * 5. Measure dropped alongside existing dimension chart → bar-chart (confidence 0.7)
 * 6. Boolean or unknown → data-table fallback (confidence 0.3)
 */
export declare function suggestWidgetForFieldDrop(field: FieldMetadata, existingWidgets: ReadonlyArray<ExistingWidgetInfo>, availableFields: ReadonlyArray<FieldMetadata>): WidgetSuggestion;
//# sourceMappingURL=widget-suggestion.d.ts.map