/**
 * @phozart/ai — Schema Analyzer
 *
 * Classifies data fields as measure/dimension/temporal/categorical/identifier
 * and suggests widgets and layout based on the analysis.
 */
import type { WidgetType } from '@phozart/engine';
export interface FieldInput {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    cardinality?: number;
}
export type FieldRole = 'measure' | 'dimension' | 'temporal' | 'categorical' | 'identifier';
export interface FieldAnalysis {
    name: string;
    type: string;
    role: FieldRole;
}
export interface SchemaAnalysis {
    measures: FieldAnalysis[];
    dimensions: FieldAnalysis[];
    temporal: FieldAnalysis[];
    categorical: FieldAnalysis[];
    identifiers: FieldAnalysis[];
}
export interface WidgetSuggestion {
    widgetType: WidgetType;
    title: string;
    fields: string[];
    priority: number;
}
export interface LayoutPlacement {
    widgetType: WidgetType;
    column: number;
    order: number;
    colSpan: number;
}
export interface LayoutSuggestion {
    columns: number;
    placements: LayoutPlacement[];
}
export declare function analyzeSchema(fields: FieldInput[]): SchemaAnalysis;
export declare function suggestWidgets(analysis: SchemaAnalysis): WidgetSuggestion[];
export declare function suggestLayout(widgets: WidgetSuggestion[]): LayoutSuggestion;
//# sourceMappingURL=schema-analyzer.d.ts.map