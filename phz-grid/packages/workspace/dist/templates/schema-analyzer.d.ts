/**
 * @phozart/phz-workspace — Schema Analyzer
 *
 * Analyzes a DataSourceSchema and produces a FieldProfile describing
 * the data's characteristics for template matching and auto-binding.
 */
import type { DataSourceSchema } from '../data-adapter.js';
export interface FieldProfile {
    numericFields: string[];
    categoricalFields: string[];
    dateFields: string[];
    identifierFields: string[];
    suggestedMeasures: string[];
    suggestedDimensions: string[];
    hasTimeSeries: boolean;
    hasCategorical: boolean;
    hasMultipleMeasures: boolean;
}
export declare function analyzeSchema(schema: DataSourceSchema): FieldProfile;
//# sourceMappingURL=schema-analyzer.d.ts.map